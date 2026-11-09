package au.com.parristech.joshrs.android

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream

/**
 * Standalone, original decoder for classic 377 RS2 triangle meshes stored in
 * a user-owned legacy cache. Binary format: 18-byte footer, delta-encoded
 * signed-smart vertex positions and triangle-index strip opcodes 1..4.
 *
 * No Jagex cache, game art or third-party client source is embedded.
 * Face materials/texture mapping and vertex animation are NOT implemented.
 */
data class Vertex377(val x: Int, val y: Int, val z: Int)
data class Triangle377(val a: Int, val b: Int, val c: Int, val packedHsl: Int)
data class Geometry377(
    val vertices: List<Vertex377>,
    val triangles: List<Triangle377>,
    val texturedTriangleCount: Int
)

object Model377Codec {
    private const val FOOTER = 18
    private const val MAX_UNCOMPRESSED = 8 * 1024 * 1024
    private const val MAX_VERTICES = 10000
    private const val MAX_TRIANGLES = 20000

    private class Cursor(private val data: ByteArray, var pos: Int, private val end: Int) {
        fun byte(): Int {
            require(pos >= 0 && pos < end) { "Truncated 377 model data" }
            return data[pos++].toInt() and 255
        }
        fun short(): Int = (byte() shl 8) or byte()

        // 377 signed smart, matching the legacy cache's documented byte widths.
        fun smart(): Int {
            require(pos < end) { "Truncated signed smart" }
            return if ((data[pos].toInt() and 255) < 128) byte() - 64
            else short() - 49152
        }
    }

    /** Legacy idx1 models are GZIP-compressed on disk before mesh decoding. */
    fun decodeCached(raw: ByteArray): Geometry377 {
        require(raw.size >= 2 && raw[0] == 0x1f.toByte() &&
            raw[1] == 0x8b.toByte()) { "Cache model is not a GZIP archive" }
        val out = ByteArrayOutputStream()
        GZIPInputStream(ByteArrayInputStream(raw)).use { stream ->
            val block = ByteArray(8192)
            while (true) {
                val n = stream.read(block)
                if (n < 0) break
                if (n == 0) continue
                require(out.size() + n <= MAX_UNCOMPRESSED) { "Model exceeds decompression safety limit" }
                out.write(block, 0, n)
            }
        }
        return decodeRaw(out.toByteArray())
    }

    /** Use for unit fixtures or already-authenticated decompressed model bytes. */
    fun decodeRaw(bytes: ByteArray): Geometry377 {
        require(bytes.size >= FOOTER && bytes.size <= MAX_UNCOMPRESSED) {
            "Invalid classic model length"
        }
        val end = bytes.size - FOOTER
        val footer = Cursor(bytes, end, bytes.size)
        val vertexCount = footer.short()
        val faceCount = footer.short()
        val texturedCount = footer.byte()
        val flagFaceTypes = footer.byte()
        val flagPriorities = footer.byte()
        val flagFaceSkins = footer.byte()
        val flagAlpha = footer.byte()
        val flagVertexSkins = footer.byte()
        val lenX = footer.short()
        val lenY = footer.short()
        val lenZ = footer.short()
        val lenFaceIndices = footer.short()

        require(vertexCount in 1..MAX_VERTICES && faceCount in 1..MAX_TRIANGLES) {
            "Invalid model vertex or triangle counts"
        }
        require(flagFaceTypes in 0..1 && flagFaceSkins in 0..1 &&
            flagAlpha in 0..1 && flagVertexSkins in 0..1) {
            "Unknown classic model header flags"
        }
        // Signed priority values 0..254 (single constant) or 255 (per face).
        require(flagPriorities in 0..255)

        var offset = 0
        val vertexFlags = offset
        offset += vertexCount
        val triangleOpcodes = offset
        offset += faceCount
        if (flagPriorities == 255) offset += faceCount
        if (flagAlpha == 1) offset += faceCount
        if (flagFaceTypes == 1) offset += faceCount
        if (flagVertexSkins == 1) offset += vertexCount
        if (flagFaceSkins == 1) offset += faceCount
        val faceIndexDeltas = offset
        offset += lenFaceIndices
        val faceColours = offset
        offset += faceCount * 2
        offset += texturedCount * 6
        val xDeltas = offset
        offset += lenX
        val yDeltas = offset
        offset += lenY
        val zDeltas = offset
        offset += lenZ
        require(offset == end) { "Model footer offsets do not match data length" }

        val flags = Cursor(bytes, vertexFlags, end)
        val xs = Cursor(bytes, xDeltas, yDeltas)
        val ys = Cursor(bytes, yDeltas, zDeltas)
        val zs = Cursor(bytes, zDeltas, end)
        val vertices = ArrayList<Vertex377>(vertexCount)
        var x = 0
        var y = 0
        var z = 0
        repeat(vertexCount) {
            val mask = flags.byte()
            require(mask and 0xf8 == 0) { "Unknown vertex coordinate mask" }
            if ((mask and 1) != 0) x += xs.smart()
            if ((mask and 2) != 0) y += ys.smart()
            if ((mask and 4) != 0) z += zs.smart()
            require(x in -1000000..1000000 && y in -1000000..1000000 &&
                z in -1000000..1000000) { "Invalid model coordinate delta" }
            vertices += Vertex377(x, y, z)
        }
        require(xs.pos == yDeltas && ys.pos == zDeltas && zs.pos == end) {
            "Unconsumed model coordinate stream"
        }

        val opcodes = Cursor(bytes, triangleOpcodes, end)
        val indices = Cursor(bytes, faceIndexDeltas, faceColours)
        val colours = Cursor(bytes, faceColours, faceColours + faceCount * 2)
        val faces = ArrayList<Triangle377>(faceCount)
        var a = 0
        var b = 0
        var c = 0
        var last = 0
        repeat(faceCount) {
            when (opcodes.byte()) {
                1 -> {
                    a = last + indices.smart()
                    b = a + indices.smart()
                    c = b + indices.smart()
                }
                2 -> { b = c; c = last + indices.smart() }
                3 -> { a = c; c = last + indices.smart() }
                4 -> {
                    val oldA = a
                    a = b
                    b = oldA
                    c = last + indices.smart()
                }
                else -> throw IllegalArgumentException("Unknown triangle index opcode")
            }
            last = c
            require(a in vertices.indices && b in vertices.indices && c in vertices.indices) {
                "Triangle references nonexistent model vertex"
            }
            faces += Triangle377(a, b, c, colours.short())
        }
        require(indices.pos == faceColours) { "Unconsumed triangle index stream" }
        return Geometry377(vertices, faces, texturedCount)
    }
}
