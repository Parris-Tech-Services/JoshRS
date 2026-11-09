package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The post-login stream: server-side ISAAC obfuscation must be undone by the client using
 * `Isaac(seed + 50)`, and partial frames must not consume cipher output.
 *
 * The frames here are produced with [FrameEncoder] configured with the *server's* cipher
 * (same seeds, +50), which is exactly how the engine writes them.
 */
class GameSession377Test {

    private val seeds = intArrayOf(0x11223344, 0x55667788, 0x31415926, 0x27182818)

    /** Server-side encoder: the engine seeds its encryptor with seed + 50. */
    private fun serverEncoder(): FrameEncoder = FrameEncoder().apply {
        cipher = IsaacCipher(IntArray(seeds.size) { seeds[it] + LoginBlock377.SEED_DELTA })
    }

    @Test
    fun `decodes a batch of server frames`() {
        val encoder = serverEncoder()
        val stream =
            encoder.encode(ServerProt.UPDATE_STAT) { it.p2(3); it.p4(1500) } +
                encoder.encode(ServerProt.MESSAGE_GAME) { it.pjstr("hi") } +
                encoder.encode(ServerProt.LOGOUT) {}

        val session = GameSession377.ofBytes(stream, seeds)
        val frames = ArrayList<DecodedFrame>()
        while (true) {
            val batch = session.readBatch()
            if (batch.isEmpty()) break
            frames.addAll(batch)
        }

        assertEquals(3, frames.size)
        assertEquals(ServerProt.UPDATE_STAT, frames[0].prot)
        assertEquals(3, PacketBuffer(frames[0].payload).g2())
        assertEquals("hi", PacketBuffer(frames[1].payload).gjstr(terminator = 0))
        assertEquals(ServerProt.LOGOUT, frames[2].prot)
    }

    @Test
    fun `byte at a time delivery keeps the cipher in step`() {
        val encoder = serverEncoder()
        val stream =
            encoder.encode(ServerProt.UPDATE_STAT) { it.p2(1); it.p4(2) } +
                encoder.encode(ServerProt.MESSAGE_GAME) { it.pjstr("chunked") } +
                encoder.encode(ServerProt.RESET_ANIMS) {}

        val session = GameSession377.ofBytes(stream, seeds)
        val frames = ArrayList<DecodedFrame>()
        // Read a single byte per call, forcing a partial frame every time.
        repeat(stream.size) { frames.addAll(session.readBatch(maxBytes = 1)) }

        assertEquals(3, frames.size)
        assertEquals(ServerProt.UPDATE_STAT, frames[0].prot)
        assertEquals(ServerProt.MESSAGE_GAME, frames[1].prot)
        assertEquals(ServerProt.RESET_ANIMS, frames[2].prot)
        assertEquals(0, session.buffered)
    }

    @Test
    fun `a partial frame reports no frames and buffers the bytes`() {
        val encoder = serverEncoder()
        val frame = encoder.encode(ServerProt.UPDATE_STAT) { it.p2(1); it.p4(2) }

        val session = GameSession377.ofBytes(frame.copyOfRange(0, 3), seeds)
        assertTrue(session.readBatch().isEmpty())
        assertEquals(3, session.buffered)
    }

    @Test
    fun `wrong seed delta desynchronises, which is why the constant is centralised`() {
        val encoder = serverEncoder()
        val stream = encoder.encode(ServerProt.UPDATE_STAT) { it.p2(1); it.p4(2) }

        // Deliberately tamper with the seed to emulate the classic off-by-delta bug.
        val wrong = GameSession377.ofBytes(stream, intArrayOf(seeds[0] + 49, seeds[1], seeds[2], seeds[3]))
        assertThrows(ProtocolViolation::class.java) { wrong.readBatch() }
    }

    @Test
    fun `reading past the end returns empty rather than spinning`() {
        val session = GameSession377.ofBytes(ByteArray(0), seeds)
        assertTrue(session.readBatch().isEmpty())
        assertTrue(session.readUntilFrame().isEmpty())
    }
}
