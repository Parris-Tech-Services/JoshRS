package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class GameFrameCodecTest {

    private fun encoder(seed: IntArray?): FrameEncoder = FrameEncoder().apply {
        cipher = seed?.let { IsaacCipher(it) }
    }

    private fun accumulator(seed: IntArray?): FrameAccumulator =
        FrameAccumulator({ ServerProt.byId(it) }).apply {
            cipher = seed?.let { IsaacCipher(it) }
        }

    @Test
    fun `plaintext fixed frame is opcode then payload`() {
        val bytes = encoder(null).encode(ServerProt.UPDATE_STAT) { it.p2(3); it.p4(1500) }
        assertEquals(ServerProt.UPDATE_STAT.id, bytes[0].toInt() and 0xff)
        assertEquals(7, bytes.size) // 1 opcode + 6 payload
    }

    @Test
    fun `one byte length prefix carries the payload size`() {
        val bytes = encoder(null).encode(ServerProt.MESSAGE_GAME) {
            it.pjstr("Welcome to JoshRS")
        }
        assertEquals(ServerProt.MESSAGE_GAME.id, bytes[0].toInt() and 0xff)
        assertEquals(bytes.size - 2, bytes[1].toInt() and 0xff)
    }

    @Test
    fun `two byte length prefix carries the payload size`() {
        val text = "x".repeat(300)
        val bytes = encoder(null).encode(ServerProt.IF_SETTEXT) { it.pjstr(text) }
        val declared = ((bytes[1].toInt() and 0xff) shl 8) or (bytes[2].toInt() and 0xff)
        assertEquals(bytes.size - 3, declared)
    }

    @Test
    fun `opcode is obfuscated by the cipher`() {
        val bytes = encoder(intArrayOf(1, 2, 3, 4)).encode(ServerProt.UPDATE_STAT) { it.p2(0); it.p4(0) }
        assertTrue("opcode should not travel in the clear", (bytes[0].toInt() and 0xff) != ServerProt.UPDATE_STAT.id)
    }

    @Test
    fun `round trips fixed, one byte and two byte length frames`() {
        val seed = intArrayOf(11, 22, 33, 44)
        val enc = encoder(seed)
        val acc = accumulator(seed)

        val a = enc.encode(ServerProt.UPDATE_STAT) { it.p2(3); it.p4(1500) }
        val b = enc.encode(ServerProt.MESSAGE_GAME) { it.pjstr("hello") }
        val c = enc.encode(ServerProt.IF_SETTEXT) { it.pjstr("y".repeat(400)) }

        val frames = acc.feed(a + b + c)
        assertEquals(3, frames.size)
        assertEquals(ServerProt.UPDATE_STAT, frames[0].prot)
        assertEquals(6, frames[0].payload.size)
        assertEquals(ServerProt.MESSAGE_GAME, frames[1].prot)
        assertEquals("hello", PacketBuffer(frames[1].payload).gjstr(terminator = 0))
        assertEquals(ServerProt.IF_SETTEXT, frames[2].prot)
        assertEquals("y".repeat(400), PacketBuffer(frames[2].payload).gjstr(terminator = 0))
    }

    @Test
    fun `byte at a time delivery does not desynchronise the cipher`() {
        val seed = intArrayOf(9, 8, 7, 6)
        val enc = encoder(seed)
        val acc = accumulator(seed)

        val stream = enc.encode(ServerProt.UPDATE_STAT) { it.p2(1); it.p4(2) } +
            enc.encode(ServerProt.MESSAGE_GAME) { it.pjstr("chunked") } +
            enc.encode(ServerProt.LOGOUT) {}

        val frames = ArrayList<DecodedFrame>()
        for (byte in stream) {
            frames.addAll(acc.feed(byteArrayOf(byte)))
        }

        assertEquals(3, frames.size)
        assertEquals(ServerProt.UPDATE_STAT, frames[0].prot)
        assertEquals(ServerProt.MESSAGE_GAME, frames[1].prot)
        assertEquals(ServerProt.LOGOUT, frames[2].prot)
        assertEquals(0, acc.buffered())
    }

    @Test
    fun `incomplete frame stays buffered without consuming the cipher`() {
        val seed = intArrayOf(5, 5, 5, 5)
        val enc = encoder(seed)
        val acc = accumulator(seed)

        val frame = enc.encode(ServerProt.UPDATE_STAT) { it.p2(1); it.p4(2) }
        assertTrue(acc.feed(frame.copyOfRange(0, 3)).isEmpty())

        // The cipher must still be positioned for this frame's opcode.
        val frames = acc.feed(frame.copyOfRange(3, frame.size))
        assertEquals(1, frames.size)
        assertEquals(ServerProt.UPDATE_STAT, frames[0].prot)
        assertEquals(3, PacketBuffer(frames[0].payload).g2())
    }

    @Test
    fun `unknown opcode is a fatal protocol violation`() {
        // 0x3f (63) is a real server opcode; 0x3e is not in the 377 table.
        val acc = accumulator(null)
        assertThrows(ProtocolViolation::class.java) {
            acc.feed(byteArrayOf(0x3e.toByte()))
        }
    }

    @Test
    fun `oversized two byte length is rejected`() {
        val frame = byteArrayOf(
            ServerProt.IF_SETTEXT.id.toByte(),
            0x0a.toByte(), 0x00.toByte() // 2560 > 1600
        )
        val acc = accumulator(null)
        assertThrows(ProtocolViolation::class.java) {
            acc.feed(frame)
        }
    }

    @Test
    fun `encoder rejects a payload that does not match a fixed length`() {
        assertThrows(IllegalArgumentException::class.java) {
            encoder(null).encode(ServerProt.UPDATE_STAT) { it.p2(1) } // needs 6
        }
    }

    @Test
    fun `every generated opcode has a unique id`() {
        assertEquals(ClientProt.entries.size, ClientProt.entries.map { it.id }.toSet().size)
        assertEquals(ServerProt.entries.size, ServerProt.entries.map { it.id }.toSet().size)
        assertNotNull(ServerProt.byId(ServerProt.UPDATE_STAT.id))
        assertNotNull(ClientProt.byId(ClientProt.MOVE_GAMECLICK.id))
    }

    @Test
    fun `frame size helper agrees with the emitted bytes`() {
        val enc = encoder(null)
        for (prot in listOf(ServerProt.UPDATE_STAT, ServerProt.MESSAGE_GAME, ServerProt.IF_SETTEXT)) {
            val bytes = enc.encode(prot) { if (prot.length < 0) it.pjstr("ab") else repeat(prot.length) { _ -> it.p1(0) } }
            val payloadLength = when (prot.length) {
                -1 -> bytes[1].toInt() and 0xff
                -2 -> ((bytes[1].toInt() and 0xff) shl 8) or (bytes[2].toInt() and 0xff)
                else -> prot.length
            }
            assertEquals(GameFrameCodec.frameSize(prot, payloadLength), bytes.size)
        }
    }
}
