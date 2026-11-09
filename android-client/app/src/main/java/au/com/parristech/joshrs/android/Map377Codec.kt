package au.com.parristech.joshrs.android

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream
import kotlin.math.PI
import kotlin.math.cos
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream

/**
 * Original independently written revision-377 data decoder, based on observable
 * layout of LostCityRS/Client-Java 377 Jagfile, OnDemand and World.method31.
 * Reads only private user-supplied cache. No third-party client source, map,
 * textures, models, accounts or copyright assets are packaged in the APK.
 */
object Compression377 {
    private const val MAX_UNPACKED = 8 * 1024 * 1024

    private fun limited(stream: java.io.InputStream, expected: Int? = null): ByteArray {
        stream.use {
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            while (true) {
                val count = it.read(buffer)
                if (count < 0) break
                if (count == 0) continue
                require(output.size() + count <= MAX_UNPACKED) { "377 cache archive exceeds safety limit" }
                output.write(buffer, 0, count)
            }
            if (expected != null) require(output.size() == expected) {
                "377 archive decompression length mismatch"
            }
            return output.toByteArray()
        }
    }

    /** 377 idx4 ondemand files use GZIP, with the cache's version suffix ignored by GZIP. */
    fun gunzip(bytes: ByteArray): ByteArray {
        require(bytes.size >= 4 && bytes[0] == 31.toByte() && bytes[1] == (-117).toByte()) {
            "377 landscape is not GZIP-compressed"
        }
        return limited(GZIPInputStream(ByteArrayInputStream(bytes)))
    }

    /** Old Jagfile BZip2 blocks omit the four-byte BZh1 header. */
    fun bzip2(bytes: ByteArray, expected: Int): ByteArray {
        require(expected in 0..MAX_UNPACKED) { "Invalid 377 archive uncompressed size" }
        require(bytes.isNotEmpty()) { "Empty compressed 377 archive" }
        val framed = if (bytes.size >= 4 && bytes[0] == 'B'.code.toByte() &&
            bytes[1] == 'Z'.code.toByte() && bytes[2] == 'h'.code.toByte()
        ) bytes else byteArrayOf(66, 90, 104, 49) + bytes // BZh1
        return limited(BZip2CompressorInputStream(ByteArrayInputStream(framed)), expected)
    }
}

private class Reader377(private val bytes: ByteArray, start: Int = 0) {
    var pos = start
        private set

    fun one(): Int {
        require(pos < bytes.size) { "Truncated rev377 map data" }
        return bytes[pos++].toInt() and 255
    }
    fun two(): Int = (one() shl 8) or one()
    fun three(): Int = (one() shl 16) or (one() shl 8) or one()
    fun four(): Int = (two() shl 16) or two()
    fun smart(): Int = if (peek() < 128) one() else two() - 32768
    private fun peek(): Int {
        require(pos < bytes.size) { "Truncated rev377 smart value" }
        return bytes[pos].toInt() and 255
    }
}

/** A 377 master Jagfile (idx0 file #5 is "versionlist" after a complete login). */
object Jagfile377 {
    fun readFile(jag: ByteArray, entryName: String): ByteArray {
        require(jag.size in 8..(8 * 1024 * 1024)) { "Invalid versionlist archive" }
        val header = Reader377(jag)
        val unpackedSize = header.three()
        val compressedSize = header.three()
        require(compressedSize in 1..jag.size - 6) { "Invalid Jagfile compression length" }
        val globallyCompressed = unpackedSize != compressedSize
        val payload = if (globallyCompressed) {
            Compression377.bzip2(jag.copyOfRange(6, 6 + compressedSize), unpackedSize)
        } else {
            // Keep the 6-byte master header: the original 377 reader uses
            // offset 6 for an archive whose unpacked and stored lengths match.
            jag
        }
        val reader = Reader377(payload, if (globallyCompressed) 0 else 6)
        val files = reader.two()
        require(files in 1..2048) { "Invalid Jagfile directory size" }
        val directoryEnd = reader.pos + files * 10
        require(directoryEnd <= payload.size) { "Truncated Jagfile directory" }
        var offset = directoryEnd
        var wanted: Pair<Int, Int>? = null
        val hash = entryName.uppercase().fold(0) { h, char -> h * 61 + char.code - 32 }
        repeat(files) {
            val storedHash = reader.four()
            val unpacked = reader.three()
            val packed = reader.three()
            require(unpacked in 0..(8 * 1024 * 1024) && packed in 0..(8 * 1024 * 1024) &&
                offset.toLong() + packed <= payload.size) { "Jagfile entry outside archive" }
            if (storedHash == hash) {
                require(wanted == null) { "Duplicate Jagfile entry" }
                wanted = offset to (if (globallyCompressed) -unpacked else unpacked)
            }
            offset += packed
        }
        require(offset == payload.size) { "Jagfile extra or missing data" }
        val (start, sizeFlag) = wanted ?: error("377 versionlist does not contain $entryName")
        if (sizeFlag < 0) {
            val size = -sizeFlag
            require(start.toLong() + size <= payload.size)
            return payload.copyOfRange(start, start + size)
        }
        // For individually compressed entries, find their packed length using
        // the directory metadata rather than reading beyond the next entry.
        val packedReader = Reader377(payload, if (globallyCompressed) 0 else 6)
        val count = packedReader.two()
        var at = directoryEnd
        repeat(count) {
            val entryHash = packedReader.four()
            val expected = packedReader.three()
            val compressed = packedReader.three()
            if (entryHash == hash) {
                require(at == start && expected == sizeFlag) { "Jagfile directory changed" }
                return Compression377.bzip2(payload.copyOfRange(at, at + compressed), expected)
            }
            at += compressed
        }
        error("Map index not found")
    }
}

data class MapFile377(val landId: Int, val locId: Int)

/** Versionlist map_index: 2-byte region, land id, loc id, 1-byte members flag. */
object MapIndex377 {
    fun region(data: ByteArray, x: Int, z: Int): MapFile377 {
        require(x in 0..255 && z in 0..255) { "Region outside 377 coordinate grid" }
        require(data.isNotEmpty() && data.size % 7 == 0 && data.size <= 65536) {
            "Invalid revision-377 map_index"
        }
        val reader = Reader377(data)
        val target = (x shl 8) or z
        var match: MapFile377? = null
        repeat(data.size / 7) {
            val index = reader.two()
            val land = reader.two()
            val loc = reader.two()
            reader.one() // member flag
            if (index == target) {
                require(match == null) { "Duplicate 377 region map index" }
                match = MapFile377(land, loc)
            }
        }
        return match ?: error("Revision-377 map_index is missing region $x,$z")
    }
}

data class Tile377(
    val height: Int,
    val overlayId: Int,
    val overlayShape: Int,
    val rotation: Int,
    val flag: Int,
    val underlayId: Int
)
data class LocPlacement377(val id: Int, val x: Int, val z: Int, val level: Int, val type: Int, val orientation: Int)
data class Region377(
    val x: Int, val z: Int, val landFile: Int, val locFile: Int,
    val tiles: List<Tile377>, val locs: List<LocPlacement377>,
    val floors: List<Floor377> = emptyList()
) {
    fun tile(level: Int, x: Int, z: Int): Tile377 {
        require(level in 0..3 && x in 0..63 && z in 0..63)
        return tiles[(level * 64 + x) * 64 + z]
    }
}

object Map377Codec {
    private const val TILES = 4 * 64 * 64

    // Noise implementation matches the 377 terrain recipe: default code 0
    // is NOT a flat surface. Use integer arithmetic/overflow like Java.
    private fun noise(x: Int, z: Int): Int {
        val n = x + z * 57
        val v = n xor (n shl 13)
        return (((v * v * 15731 + 789221) * v + 1376312589) and Int.MAX_VALUE) shr 19 and 255
    }
    private fun smooth(x: Int, z: Int): Int {
        val corner = noise(x - 1, z - 1) + noise(x + 1, z - 1) +
            noise(x - 1, z + 1) + noise(x + 1, z + 1)
        val sides = noise(x - 1, z) + noise(x + 1, z) +
            noise(x, z - 1) + noise(x, z + 1)
        return noise(x, z) / 4 + corner / 16 + sides / 8
    }
    private fun interpolate(a: Int, b: Int, offset: Int, scale: Int): Int {
        val angle = offset * 1024 / scale
        val c = (cos(angle * PI / 1024.0) * 65536.0).toInt()
        val f = (65536 - c) shr 1
        return ((65536 - f) * a shr 16) + (b * f shr 16)
    }
    private fun layeredNoise(x: Int, z: Int, scale: Int): Int {
        val xx = x / scale
        val zz = z / scale
        val dx = x and (scale - 1)
        val dz = z and (scale - 1)
        val a = interpolate(smooth(xx, zz), smooth(xx + 1, zz), dx, scale)
        val b = interpolate(smooth(xx, zz + 1), smooth(xx + 1, zz + 1), dx, scale)
        return interpolate(a, b, dz, scale)
    }
    private fun defaultHeight(x: Int, z: Int): Int {
        val xx = x + 932731
        val zz = z + 556238
        val n = layeredNoise(xx + 45365, zz + 91923, 4) - 128 +
            ((layeredNoise(xx + 10294, zz + 37821, 2) - 128) shr 1) +
            ((layeredNoise(xx, zz, 1) - 128) shr 2)
        return -( (n * 0.3).toInt() + 35).coerceIn(10, 60) * 8
    }

    /** Decode all 4 × 64 × 64 planes in original x/z iteration order. */
    fun terrain(bytes: ByteArray, regionX: Int, regionZ: Int): List<Tile377> {
        require(regionX in 0..255 && regionZ in 0..255)
        require(bytes.size in TILES..(4 * 1024 * 1024)) { "Invalid 377 terrain payload size" }
        val reader = Reader377(bytes)
        val result = ArrayList<Tile377>(TILES)
        for (level in 0..3) for (x in 0..63) for (z in 0..63) {
            var underlay = 0; var overlay = 0; var shape = 0
            var rotation = 0; var flag = 0; var height = 0
            var done = false
            var operations = 0
            while (!done) {
                require(++operations <= 64) { "Runaway terrain tile opcode stream" }
                when (val code = reader.one()) {
                    0 -> {
                        height = if (level == 0) defaultHeight(regionX * 64 + x, regionZ * 64 + z)
                            else result[((level - 1) * 64 + x) * 64 + z].height - 240
                        done = true
                    }
                    1 -> {
                        var amount = reader.one()
                        if (amount == 1) amount = 0
                        height = if (level == 0) -amount * 8
                            else result[((level - 1) * 64 + x) * 64 + z].height - amount * 8
                        done = true
                    }
                    in 2..49 -> {
                        overlay = reader.one().toByte().toInt() // original signed overlay byte
                        shape = (code - 2) / 4
                        rotation = (code - 2) and 3
                    }
                    in 50..81 -> flag = code - 49
                    in 82..255 -> underlay = code - 81
                }
            }
            result += Tile377(height, overlay, shape, rotation, flag, underlay)
        }
        require(reader.pos == bytes.size) { "Terrain bytes contain trailing or unexpected data" }
        return result
    }

    /** Loc ids and packed position delta streams are separate from land. */
    fun locations(bytes: ByteArray, regionX: Int, regionZ: Int): List<LocPlacement377> {
        require(bytes.size in 1..(4 * 1024 * 1024)) { "Invalid 377 location payload size" }
        val reader = Reader377(bytes)
        val placements = ArrayList<LocPlacement377>()
        var id = -1
        var outer = 0
        while (true) {
            require(++outer <= 65536) { "Runaway location ID stream" }
            val idDelta = reader.smart()
            if (idDelta == 0) break
            id += idDelta
            require(id in 0..65535) { "Invalid 377 location ID" }
            var packed = 0
            var inner = 0
            while (true) {
                require(++inner <= 65536) { "Runaway location position stream" }
                val delta = reader.smart()
                if (delta == 0) break
                packed += delta - 1
                val z = packed and 63
                val x = (packed shr 6) and 63
                val level = packed shr 12
                require(level in 0..3) { "Invalid 377 location plane" }
                val attributes = reader.one()
                placements += LocPlacement377(
                    id, regionX * 64 + x, regionZ * 64 + z,
                    level, attributes shr 2, attributes and 3
                )
                require(placements.size <= 65536) { "Too many scene locations" }
            }
        }
        require(reader.pos == bytes.size) { "Trailing 377 location data" }
        return placements
    }

    /** Both IDs are read from actual user-provided versionlist map_index. */
    fun lumbridge(
        versionlist: ByteArray, landCompressed: ByteArray, locCompressed: ByteArray,
        configJagfile: ByteArray? = null
    ): Region377 {
        val index = Jagfile377.readFile(versionlist, "map_index")
        val mapped = MapIndex377.region(index, 50, 50)
        return Region377(
            50, 50, mapped.landId, mapped.locId,
            terrain(Compression377.gunzip(landCompressed), 50, 50),
            locations(Compression377.gunzip(locCompressed), 50, 50),
            configJagfile?.let { Floor377Codec.decode(Jagfile377.readFile(it, "flo.dat")) }
                ?: emptyList()
        )
    }
}
