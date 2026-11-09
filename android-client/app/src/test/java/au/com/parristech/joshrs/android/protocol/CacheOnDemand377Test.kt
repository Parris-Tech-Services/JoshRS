package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The URL rules here were established by probing a live engine, and each one fails by looking
 * like a server fault rather than a malformed request. Encoding them as tests is the point.
 */
class CacheOnDemand377Test {

    /** Builds a 40-byte /crc buffer from nine unsigned CRC values. */
    private fun crcBuffer(vararg words: Long): ByteArray {
        val out = ByteArray(40)
        for (i in 0 until 9) {
            val v = if (i < words.size) words[i] else 0L
            out[i * 4] = (v ushr 24).toByte()
            out[i * 4 + 1] = (v ushr 16).toByte()
            out[i * 4 + 2] = (v ushr 8).toByte()
            out[i * 4 + 3] = v.toByte()
        }
        return out
    }

    @Test
    fun `crc route is appended with no separator and in decimal`() {
        // Real value from a live 377 cache: versionlist CRC word is 0x2ae9b164 = 719958372.
        val url = CacheOnDemand377.urlFor(Jagfile377.VERSIONLIST, 0x2ae9b164)
        assertEquals("/versionlist719958372", url)
        assertTrue("must not contain a separator", !url.contains(":"))
        assertTrue("must be decimal, not hex", !url.contains("b164"))
    }

    @Test
    fun `CRC above 0x7fffffff is rendered unsigned`() {
        // 0x9509ece5 is the title CRC word; as a signed Int it is negative.
        val signed = 0x9509ece5.toInt()
        assertTrue(signed < 0)
        assertEquals("/title2500455653", CacheOnDemand377.urlFor(Jagfile377.TITLE, signed))
    }

    @Test
    fun `absolute url joins base without doubling slashes`() {
        val signed = 0x12cafec1.toInt()
        assertEquals(
            "http://127.0.0.1:8888/config315293377",
            CacheOnDemand377.absoluteUrl("http://127.0.0.1:8888", Jagfile377.CONFIG, signed)
        )
        assertEquals(
            "http://127.0.0.1:8888/config315293377",
            CacheOnDemand377.absoluteUrl("http://127.0.0.1:8888/", Jagfile377.CONFIG, signed)
        )
    }

    @Test
    fun `crc buffer is 40 bytes and yields nine words`() {
        val cache = CacheOnDemand377("http://x") { crcBuffer(0, 0x9509ece5, 0x12cafec1) }
        val words = cache.crcWords()
        assertEquals(9, words.size)
        assertEquals(0x9509ece5.toInt(), words[1])
        assertEquals(0x12cafec1.toInt(), words[2])
    }

    @Test
    fun `login crc bytes are the first 36, not all 40`() {
        val cache = CacheOnDemand377("http://x") { crcBuffer(1, 2, 3) }
        val bytes = cache.loginCrcBytes()
        assertEquals(36, bytes.size)
    }

    @Test
    fun `a short crc buffer is rejected rather than silently truncated`() {
        val cache = CacheOnDemand377("http://x") { ByteArray(36) }
        var threw = false
        try {
            cache.crcWords()
        } catch (e: IllegalArgumentException) {
            threw = true
        }
        assertTrue("36-byte /crc must be rejected: only 36 would silently drop the hash", threw)
    }

    @Test
    fun `absent jagfiles are omitted rather than reported as empty`() {
        // Mirrors the live 377 cache: these four exist, the other four return 404.
        val bodies = mapOf(
            "/crc" to crcBuffer(0, 0x9509ece5, 0x12cafec1, 0x5574bc2e, 0xbd868286, 0x2ae9b164, 0x982e83fb, 0x84fff872, 0x42fd7584),
            "/config" to ByteArray(533_716),
            "/interface" to ByteArray(185_731),
            "/versionlist" to ByteArray(87_951),
            "/sounds" to ByteArray(223_704)
        )
        val cache = CacheOnDemand377("http://host") { url ->
            val path = url.removePrefix("http://host")
            bodies[path.filterNot { it.isDigit() }]
        }
        val all = cache.downloadAll()
        assertEquals(
            setOf(Jagfile377.CONFIG, Jagfile377.INTERFACE, Jagfile377.VERSIONLIST, Jagfile377.SOUNDS),
            all.keys
        )
    }

    @Test
    fun `jagfile returns null when the server does not expose that file`() {
        val cache = CacheOnDemand377("http://host") { url ->
            when {
                url.endsWith("/crc") -> crcBuffer(0, 1, 2, 3)
                url.contains("/config") -> ByteArray(3)
                else -> null
            }
        }
        assertEquals(3, cache.jagfile(Jagfile377.CONFIG)?.size)
        assertNull(cache.jagfile(Jagfile377.TEXTURES))
    }

    @Test
    fun `known absent routes are recorded so a probe is not mistaken for breakage`() {
        assertEquals(
            setOf(Jagfile377.TITLE, Jagfile377.MEDIA, Jagfile377.TEXTURES, Jagfile377.WORDENC),
            Jagfile377.KNOWN_ABSENT
        )
    }
}
