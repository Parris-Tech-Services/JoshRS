package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test

class PacketBufferTest {

    private fun bytes(vararg values: Int): ByteArray = ByteArray(values.size) { values[it].toByte() }

    @Test
    fun `multi byte integers are big endian`() {
        val buf = PacketBuffer(ByteArray(8))
        buf.p2(0x1234)
        buf.p4(0x89abcdef.toInt())

        assertArrayEquals(bytes(0x12, 0x34, 0x89, 0xab, 0xcd, 0xef, 0x00, 0x00), buf.data)

        buf.pos = 0
        assertEquals(0x1234, buf.g2())
        assertEquals(0x89abcdef.toInt(), buf.g4())
    }

    @Test
    fun `signed accessors reinterpret the same bits`() {
        val buf = PacketBuffer(bytes(0xff, 0xff, 0xff, 0xff))
        assertEquals(-1, buf.g4())
        buf.pos = 0
        assertEquals(0xffffffffL, buf.g4().toLong() and 0xffffffffL)
    }

    @Test
    fun `g2s sign extends past 0x7fff`() {
        val buf = PacketBuffer(bytes(0x80, 0x00))
        assertEquals(-32768, buf.g2s())
    }

    @Test
    fun `gjstr stops at the terminator and consumes it`() {
        val buf = PacketBuffer(bytes('h'.code, 'i'.code, 0x0a, 'x'.code))
        assertEquals("hi", buf.gjstr())
        assertEquals(3, buf.pos)
        assertEquals('x'.code, buf.g1())
    }

    @Test
    fun `pjstr writes a NUL terminator`() {
        val buf = PacketBuffer(ByteArray(6))
        buf.pjstr("bob")
        assertArrayEquals(bytes('b'.code, 'o'.code, 'b'.code, 0x00, 0x00, 0x00), buf.data)
        buf.pos = 0
        assertEquals("bob", buf.gjstr(terminator = 0))
    }

    @Test
    fun `size prefixes are written before the payload`() {
        val buf = PacketBuffer(ByteArray(8))
        buf.p1(0xaa)
        buf.pos += 2
        val start = buf.pos
        buf.p1(1)
        buf.p1(2)
        buf.p1(3)
        buf.psize2(buf.pos - start)

        buf.pos = 0
        assertEquals(0xaa, buf.g1())
        assertEquals(3, buf.g2())
        assertEquals(1, buf.g1())
    }

    @Test
    fun `crc32 matches the standard check value`() {
        // Standard CRC-32 check vector: "123456789" -> 0xCBF43926
        val data = "123456789".toByteArray(Charsets.US_ASCII)
        assertEquals(0xCBF43926.toInt(), PacketBuffer.crc32(data))
        assertEquals(0, PacketBuffer.crc32(ByteArray(0)))
    }

    @Test
    fun `crc32 treats length as an exclusive end offset`() {
        // Mirrors the engine's getcrc(src, offset, length) loop bound.
        val data = bytes(1, 2, 3, 4)
        assertEquals(PacketBuffer.crc32(bytes(1, 2)), PacketBuffer.crc32(data, 0, 2))
        assertEquals(PacketBuffer.crc32(bytes(3, 4)), PacketBuffer.crc32(data, 2, 4))
    }
}
