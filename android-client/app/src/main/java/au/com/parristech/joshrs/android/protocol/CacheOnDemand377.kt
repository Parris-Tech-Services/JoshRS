package au.com.parristech.joshrs.android.protocol

/**
 * On-demand cache bootstrap for a revision-377 server.
 *
 * A native client does **not** need the player to supply `main_file_cache.*` for the files the
 * server exposes over HTTP. `Engine-TS@377-wip` serves them from routes in `src/web.ts`:
 *
 * ```
 * /crc            -> 40 bytes: nine big-endian CRC-32 words + a 4-byte hash
 * /<name><crc>    -> the jagfile, CRC appended with NO separator, in DECIMAL
 * ```
 *
 * Three details here were established by experiment against a live engine, and each one fails
 * in a way that looks like a broken server rather than a wrong request:
 *
 *  1. The CRC is appended directly — `/versionlist719958372`, not `/versionlist:719958372`.
 *  2. The CRC is decimal. A hex value parses to -1 server-side and returns 404, which reads as
 *     "this cache has no versionlist" when the file is right there.
 *  3. `/crc` is 40 bytes, not 36. Only the first 36 belong in the login block; the trailing
 *     4 are a hash the client never needs.
 *
 * Verified live: config 533,716 B, interface 185,731 B, versionlist 87,951 B, sounds 223,704 B.
 * title, media, textures and wordenc return 404 in that cache.
 */
class CacheOnDemand377(
    private val baseUrl: String,
    private val fetch: (String) -> ByteArray? = ::httpGetOrNull
) {

    /** The nine CRC words, in index order, from `/crc`. */
    fun crcWords(): IntArray {
        val raw = fetch("$baseUrl/crc") ?: throw IllegalStateException("server did not serve /crc")
        require(raw.size == CRC_BUFFER_SIZE) {
            "/crc must be $CRC_BUFFER_SIZE bytes (9 CRCs + 4-byte hash); got ${raw.size}"
        }
        return IntArray(9) { i ->
            ((raw[i * 4].toInt() and 0xff) shl 24) or
                ((raw[i * 4 + 1].toInt() and 0xff) shl 16) or
                ((raw[i * 4 + 2].toInt() and 0xff) shl 8) or
                (raw[i * 4 + 3].toInt() and 0xff)
        }
    }

    /** The first 36 bytes of `/crc` — what the login block needs. */
    fun loginCrcBytes(): ByteArray {
        val raw = fetch("$baseUrl/crc") ?: throw IllegalStateException("server did not serve /crc")
        require(raw.size == CRC_BUFFER_SIZE) { "/crc must be $CRC_BUFFER_SIZE bytes; got ${raw.size}" }
        return raw.copyOfRange(0, 36)
    }

    /** Fetches one jagfile, or null when this cache does not expose it. */
    fun jagfile(type: Jagfile377): ByteArray? {
        val crc = crcWords()[type.routeIndex]
        return fetch(absoluteUrl(baseUrl, type, crc))
    }

    /** Fetches everything available; absent files are simply omitted. */
    fun downloadAll(): Map<Jagfile377, ByteArray> {
        val crcs = crcWords()
        val out = LinkedHashMap<Jagfile377, ByteArray>()
        for (type in Jagfile377.entries) {
            val body = fetch(absoluteUrl(baseUrl, type, crcs[type.routeIndex])) ?: continue
            out[type] = body
        }
        return out
    }

    companion object {
        const val CRC_BUFFER_SIZE: Int = 40

        /**
         * Builds the cache route URL.
         *
         * The CRC is rendered as an **unsigned** decimal value: the engine parses it with a
         * decimal parser, so a signed representation of a CRC above 0x7FFFFFFF would not match.
         */
        fun urlFor(type: Jagfile377, crc: Int): String {
            val unsigned = crc.toLong() and 0xffffffffL
            return "/${type.routeName}$unsigned"
        }

        /**
         * Real HTTP GET. Returns null on 404 so an absent jagfile is distinguishable from a
         * transport failure, which throws.
         */
        internal fun httpGetOrNull(url: String): ByteArray? {
            val connection = (java.net.URL(url).openConnection() as java.net.HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 10_000
                readTimeout = 30_000
            }
            return try {
                if (connection.responseCode == java.net.HttpURLConnection.HTTP_NOT_FOUND) {
                    null
                } else {
                    connection.inputStream.use { it.readBytes() }
                }
            } finally {
                connection.disconnect()
            }
        }

        /**
         * Convenience for a real deployment: joins the base URL and a route, applying the
         * decimal/unsigned rule used by [urlFor].
         */
        fun absoluteUrl(baseUrl: String, type: Jagfile377, crc: Int): String =
            baseUrl.trimEnd('/') + urlFor(type, crc)
    }
}

/**
 * The jagfiles a revision-377 server exposes on demand, with the CRC index each uses.
 *
 * Index 0 is not a route. The order matches `makeCrcs()` in the engine's `CrcTable.ts`.
 */
enum class Jagfile377(val routeIndex: Int, val routeName: String) {
    TITLE(1, "title"),
    CONFIG(2, "config"),
    INTERFACE(3, "interface"),
    MEDIA(4, "media"),
    VERSIONLIST(5, "versionlist"),
    TEXTURES(6, "textures"),
    WORDENC(7, "wordenc"),
    SOUNDS(8, "sounds");

    companion object {
        /** Routes known to return 404 on a stock 377 cache, kept for reporting rather than probing. */
        val KNOWN_ABSENT: Set<Jagfile377> = setOf(TITLE, MEDIA, TEXTURES, WORDENC)
    }
}
