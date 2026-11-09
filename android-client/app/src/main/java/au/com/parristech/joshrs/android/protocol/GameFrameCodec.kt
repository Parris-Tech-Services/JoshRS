package au.com.parristech.joshrs.android.protocol

/**
 * Revision-377 game-frame framing, matching `LostCityRS/Engine-TS`
 * `src/engine/entity/NetworkPlayer.ts` (MIT License, Copyright (c) 2023-2026 Lost City).
 *
 * Frame layout: `opcode [length-prefix] payload`, where
 *  - the opcode byte is offset by the next ISAAC value in whichever direction
 *    the cipher belongs to (server decryptor for client-bound, server encryptor
 *    for server-bound);
 *  - `-1` packets carry a 1-byte payload length after the opcode;
 *  - `-2` packets carry a 2-byte big-endian payload length (rejected above 1600).
 *
 * Critical invariant: the ISAAC stream must advance **once per opcode**, never
 * for a frame that is still incomplete. Touching the cipher on a partial read
 * desynchronises the whole session, so [FrameAccumulator] peeks with a cloned
 * cipher and only commits once the entire frame has arrived.
 */
object GameFrameCodec {

    const val MAX_VAR_SHORT_LENGTH: Int = 1600

    fun decodeOpcode(rawOpcode: Int, cipher: IsaacCipher?): Int =
        if (cipher != null) (rawOpcode - cipher.nextInt()) and 0xff else rawOpcode and 0xff

    fun encodeOpcode(id: Int, cipher: IsaacCipher?): Int =
        if (cipher != null) (id + cipher.nextInt()) and 0xff else id and 0xff

    /** Total frame size for [prot] given the payload length [payloadLength]. */
    fun frameSize(prot: Prot, payloadLength: Int): Int = when (prot.length) {
        -1 -> 2 + payloadLength
        -2 -> 3 + payloadLength
        else -> 1 + payloadLength
    }

    /** Validates that [payloadLength] is legal for [prot]. */
    fun checkPayloadLength(prot: Prot, payloadLength: Int) {
        when (prot.length) {
            -1 -> require(payloadLength in 0..0xff) {
                "${prot.id} declares a 1-byte length prefix; $payloadLength bytes does not fit"
            }
            -2 -> require(payloadLength in 0..MAX_VAR_SHORT_LENGTH) {
                "${prot.id} declares a 2-byte length prefix; $payloadLength bytes exceeds $MAX_VAR_SHORT_LENGTH"
            }
            else -> require(payloadLength == prot.length) {
                "${prot.id} is fixed at ${prot.length} bytes but payload is $payloadLength"
            }
        }
    }
}

/** A fully decoded inbound frame. */
class DecodedFrame(val prot: Prot, val payload: ByteArray)

/**
 * Builds outbound frames: obfuscated opcode, optional length prefix, payload.
 *
 * The encoder advances the cipher exactly once per [encode] call, matching the
 * server's `writeInner` so the two streams stay in lockstep.
 */
class FrameEncoder(
    private val capacity: Int = 8192
) {
    var cipher: IsaacCipher? = null

    private val buf = PacketBuffer(ByteArray(capacity))

    fun encode(prot: Prot, write: (PacketBuffer) -> Unit): ByteArray {
        buf.pos = 0
        buf.p1(GameFrameCodec.encodeOpcode(prot.id, cipher))

        if (prot.length == -1 || prot.length == -2) {
            buf.pos += if (prot.length == -1) 1 else 2
        }

        val start = buf.pos
        write(buf)
        val payloadLength = buf.pos - start
        GameFrameCodec.checkPayloadLength(prot, payloadLength)

        when (prot.length) {
            -1 -> buf.psize1(payloadLength)
            -2 -> buf.psize2(payloadLength)
        }

        return buf.data.copyOf(buf.pos)
    }
}

/**
 * Assembles complete frames from arbitrarily-chunked socket data.
 *
 * Feed raw bytes in whatever sized pieces the network delivers; complete frames
 * are handed back in order. Incomplete trailers stay buffered without advancing
 * the cipher.
 */
class FrameAccumulator(
    private val lookup: (Int) -> Prot?,
    private val maxBufferBytes: Int = 64 * 1024
) {
    private var buf = ByteArray(4096)
    private var length = 0

    var cipher: IsaacCipher? = null

    fun feed(chunk: ByteArray, offset: Int = 0, count: Int = chunk.size - offset): List<DecodedFrame> {
        append(chunk, offset, count)
        val frames = ArrayList<DecodedFrame>(4)
        while (true) {
            val frame = nextFrame() ?: break
            frames.add(frame)
        }
        return frames
    }

    private fun append(chunk: ByteArray, offset: Int, count: Int) {
        require(length + count <= maxBufferBytes) {
            "inbound frame buffer would exceed $maxBufferBytes bytes"
        }
        if (length + count > buf.size) {
            var next = buf.size
            while (next < length + count) next *= 2
            buf = buf.copyOf(minOf(next, maxBufferBytes))
        }
        System.arraycopy(chunk, offset, buf, length, count)
        length += count
    }

    private fun nextFrame(): DecodedFrame? {
        if (length < 1) return null

        // Peek the opcode with a throwaway cipher so an incomplete frame cannot
        // consume real ISAAC output.
        val cipherNow = cipher
        val opcode = GameFrameCodec.decodeOpcode(
            buf[0].toInt() and 0xff,
            cipherNow?.copy()
        )

        val prot = lookup(opcode) ?: run {
            // Unknown opcode is fatal in the real client; never guess a length.
            throw ProtocolViolation("unknown inbound opcode 0x${opcode.toString(16)}")
        }

        val (payloadLength, headerSize) = when (prot.length) {
            -1 -> {
                if (length < 2) return null
                (buf[1].toInt() and 0xff) to 2
            }
            -2 -> {
                if (length < 3) return null
                val n = ((buf[1].toInt() and 0xff) shl 8) or (buf[2].toInt() and 0xff)
                if (n > GameFrameCodec.MAX_VAR_SHORT_LENGTH) {
                    throw ProtocolViolation("2-byte frame length $n exceeds ${GameFrameCodec.MAX_VAR_SHORT_LENGTH}")
                }
                n to 3
            }
            else -> prot.length to 1
        }

        if (length < headerSize + payloadLength) return null

        // Commit: consume real ISAAC output exactly once for this opcode.
        cipher?.nextInt()

        val payload = buf.copyOfRange(headerSize, headerSize + payloadLength)
        val consumed = headerSize + payloadLength
        System.arraycopy(buf, consumed, buf, 0, length - consumed)
        length -= consumed

        return DecodedFrame(prot, payload)
    }

    fun buffered(): Int = length
}

/** Thrown when the peer sends something a revision-377 client must treat as fatal. */
class ProtocolViolation(message: String) : RuntimeException(message)
