package au.com.parristech.joshrs.android

/**
 * Reader for the legacy RuneScape-2 377 on-disk store (main_file_cache.dat and
 * main_file_cache.idx0..idx4), operating only on bytes explicitly provided by
 * the user. No game data or Jagex cache is bundled in the APK.
 *
 * The index has 6-byte entries (24-bit size and first sector); .dat has 520-byte
 * sectors with 8-byte headers and 512-byte payloads for 16-bit file IDs.
 * Returns compressed RAW archive bytes; models/maps/textures are not decoded
 * by this class. Fully validates chain ordering and store/file identity.
 */
class LegacyStore377(
    private val data: ByteArray,
    private val index: ByteArray,
    /** 0..4 for main_file_cache.idx0..idx4; sector header stores index+1. */
    private val indexNumber: Int
) {
    init { require(indexNumber in 0..4) { "Unsupported legacy cache index" } }

    companion object {
        const val SECTOR_SIZE = 520
        const val PAYLOAD_SIZE = 512
        const val MAX_FILE_BYTES = 16 * 1024 * 1024
    }

    private fun u16(b: ByteArray, p: Int) =
        ((b[p].toInt() and 255) shl 8) or (b[p + 1].toInt() and 255)
    private fun u24(b: ByteArray, p: Int) =
        ((b[p].toInt() and 255) shl 16) or ((b[p + 1].toInt() and 255) shl 8) or
            (b[p + 2].toInt() and 255)

    fun read(fileId: Int): ByteArray? {
        if (fileId !in 0..65535) return null
        val record = fileId * 6
        if (record + 6 > index.size) return null
        val length = u24(index, record)
        var sector = u24(index, record + 3)
        if (length == 0 && sector == 0) return null
        require(length in 1..MAX_FILE_BYTES) { "Bad legacy cache file size" }
        require(sector > 0) { "Missing first cache sector" }

        val result = ByteArray(length)
        val visited = HashSet<Int>()
        var read = 0
        var chunk = 0
        while (read < length) {
            require(visited.add(sector)) { "Cache sector cycle" }
            val off = sector.toLong() * SECTOR_SIZE
            require(off > 0 && off + 8 <= data.size) { "Cache sector out of bounds" }
            val start = off.toInt()
            require(u16(data, start) == fileId) { "Cache file ID mismatch" }
            require(u16(data, start + 2) == chunk) { "Cache chunk order mismatch" }
            val next = u24(data, start + 4)
            require((data[start + 7].toInt() and 255) == indexNumber + 1) {
                "Cache index mismatch"
            }
            val count = minOf(PAYLOAD_SIZE, length - read)
            require(start + 8 + count <= data.size) { "Truncated cache sector" }
            data.copyInto(result, read, start + 8, start + 8 + count)
            read += count
            if (read < length) require(next > 0) { "Cache chain ended early" }
            sector = next
            chunk++
        }
        return result
    }
}
