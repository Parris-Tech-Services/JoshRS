package au.com.parristech.joshrs.android.protocol

/**
 * Post-login read loop.
 *
 * Once a login is accepted the server stops sending raw bytes and every frame's opcode is
 * offset by the session ISAAC stream, seeded from the seeds the **client** chose, each
 * incremented by [LoginBlock377.SEED_DELTA]. Getting that increment wrong desynchronises
 * on the very first frame and never recovers, so it is applied in exactly one place here.
 *
 * Chunked delivery is expected: the network may hand over half a frame, and the ISAAC
 * stream must not advance until a frame is complete. That invariant lives in
 * [FrameAccumulator]; this class only feeds it.
 */
class GameSession377(
    private val source: ByteSource,
    seeds: IntArray,
    lookup: (Int) -> Prot? = { ServerProt.byId(it) }
) {

    /** Supplies whatever bytes are available, up to [max]. Returns empty at end of stream. */
    fun interface ByteSource {
        fun readAtMost(max: Int): ByteArray
    }

    private val decryptor = LoginBlock377.decryptCipher(seeds)

    private val accumulator = FrameAccumulator(lookup).apply {
        cipher = decryptor
    }

    /** Bytes buffered but not yet part of a complete frame. */
    val buffered: Int get() = accumulator.buffered()

    /**
     * Reads one chunk and returns every frame that became complete.
     * Returns an empty list when the peer closed the connection.
     */
    fun readBatch(maxBytes: Int = 4096): List<DecodedFrame> {
        val chunk = source.readAtMost(maxBytes)
        if (chunk.isEmpty()) return emptyList()
        return accumulator.feed(chunk)
    }

    /**
     * Reads until at least one frame is available or the source closes.
     * Bounded by [maxReads] so a peer that dribbles bytes cannot spin forever.
     */
    fun readUntilFrame(maxBytes: Int = 4096, maxReads: Int = 64): List<DecodedFrame> {
        repeat(maxReads) {
            val chunk = source.readAtMost(maxBytes)
            if (chunk.isEmpty()) return emptyList() // peer closed
            val frames = accumulator.feed(chunk)
            if (frames.isNotEmpty()) return frames
        }
        return emptyList()
    }

    /** Convenience: build a session reading from an existing byte array. */
    companion object {
        fun ofBytes(bytes: ByteArray, seeds: IntArray): GameSession377 {
            var position = 0
            return GameSession377(
                source = { max ->
                    if (position >= bytes.size) {
                        ByteArray(0)
                    } else {
                        val end = minOf(position + max, bytes.size)
                        bytes.copyOfRange(position, end).also { position = end }
                    }
                },
                seeds = seeds
            )
        }
    }
}
