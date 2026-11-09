package au.com.parristech.joshrs.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPOutputStream

class Model377CodecTest {
    private fun put2(out: ByteArrayOutputStream, n: Int) {
        out.write((n ushr 8) and 255)
        out.write(n and 255)
    }

    /** Original fixture, not borrowed Jagex model bytes. */
    private fun triangleFixture(): ByteArray {
        val b = ByteArrayOutputStream()
        // Vertices: 0,0,0; 64,0,0; 0,64,0
        b.write(byteArrayOf(0, 1, 3))
        b.write(1) // one face using index strip opcode 1
        b.write(byteArrayOf(64, 65, 65)) // signed-smarts 0, 1, 1
        put2(b, 300) // packed face HSL
        b.write(byteArrayOf(0xC0.toByte(), 0x40, 0)) // x delta +64, -64
        b.write(byteArrayOf(0xC0.toByte(), 0x40)) // y delta +64
        put2(b, 3) // 3 vertices
        put2(b, 1) // 1 face
        b.write(0) // textured triangles
        repeat(5) { b.write(0) } // no optional arrays
        put2(b, 3) // x stream bytes
        put2(b, 2) // y stream bytes
        put2(b, 0) // z stream bytes
        put2(b, 3) // face index delta stream bytes
        return b.toByteArray()
    }

    @Test fun actuallyDecodesClassic377DeltaVerticesAndTriangleFaces() {
        val model = Model377Codec.decodeRaw(triangleFixture())
        assertEquals(3, model.vertices.size)
        assertEquals(1, model.triangles.size)
        assertEquals(Vertex377(0, 0, 0), model.vertices[0])
        assertEquals(Vertex377(64, 0, 0), model.vertices[1])
        assertEquals(Vertex377(0, 64, 0), model.vertices[2])
        assertEquals(Triangle377(0, 1, 2, 300), model.triangles[0])
        assertEquals(0, model.texturedTriangleCount)
    }

    @Test fun decodesGenuineGzipWrapperRatherThanPretendingRawCacheIsModel() {
        val encoded = ByteArrayOutputStream()
        GZIPOutputStream(encoded).use { it.write(triangleFixture()) }
        val model = Model377Codec.decodeCached(encoded.toByteArray())
        assertEquals(1, model.triangles.size)
        assertThrows(IllegalArgumentException::class.java) {
            Model377Codec.decodeCached(triangleFixture())
        }
    }

    @Test fun detectsMalformedFooterAndFaceIndices() {
        val bytes = triangleFixture()
        bytes[4] = 0 // face index delta 0 instead of 0?
        bytes[6] = 90 // face vertex index > 3
        assertThrows(IllegalArgumentException::class.java) {
            Model377Codec.decodeRaw(bytes)
        }
        val corrupt = triangleFixture().copyOfRange(0, 20)
        assertThrows(IllegalArgumentException::class.java) {
            Model377Codec.decodeRaw(corrupt)
        }
    }

    @Test fun rejectsContradictoryIndexLengths() {
        val bytes = triangleFixture()
        val footer = bytes.size - 18
        bytes[footer + 17] = 4
        assertThrows(IllegalArgumentException::class.java) {
            Model377Codec.decodeRaw(bytes)
        }
    }
}
