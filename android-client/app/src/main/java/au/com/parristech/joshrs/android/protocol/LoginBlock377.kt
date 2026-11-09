package au.com.parristech.joshrs.android.protocol

import java.math.BigInteger

/**
 * Revision-377 credentialed login: the RSA block and the opcode-16 login frame.
 *
 * Derived from `LostCityRS/Engine-TS@377-wip` `src/engine/World.ts` (login loop) and
 * `src/io/Packet.ts` `rsadec` (MIT License, Copyright (c) 2023-2026 Lost City).
 *
 * Four facts here were established by experiment against a live engine, not by reading:
 *
 *  1. Revision 377 does not fit in a byte. The server reads one byte and, only if it is
 *     `0xFF`, a further 16-bit revision. Sending `377 and 0xff` yields status 6.
 *  2. The 36 CRC bytes must be the first 36 of the server's own `CrcBuffer`; the server
 *     verifies `crc32(those) == CrcBuffer32`, so `/crc` is required, not the cache.
 *  3. The plaintext must begin with the marker byte 10. The server reads it first and
 *     answers status 6 if it is anything else.
 *  4. The four ISAAC seeds travel *inside* the RSA block, and the client's decryption
 *     stream is `Isaac(seed + 50)` — the same seeds, each incremented by 50.
 *
 * There is no padding scheme: RSA here is raw `m^e mod n`, so encryption is deterministic
 * and byte-comparable against a reference implementation.
 */
object LoginBlock377 {

    /** Marker the server requires as the first plaintext byte. */
    const val MARKER: Int = 10

    /** Each seed the client sends is incremented by this to build the decrypt cipher. */
    const val SEED_DELTA: Int = 50

    const val LOGIN_OPCODE: Int = 16
    const val RECONNECT_OPCODE: Int = 18
    const val NEGOTIATION_OPCODE: Int = 14

    /** Sent as a 1-byte revision, then a 16-bit revision when the byte is 0xFF. */
    const val REVISION_ESCAPE: Int = 0xFF

    /**
     * Plaintext RSA block:
     * `[10][seed0..seed3 as 4-byte ints][uid][username 0x0A][password 0x0A]`.
     *
     * Username and password are terminated with `0x0A`, not `0x00`: the server reads them
     * with `gjstr()` whose default terminator is 10.
     */
    fun buildPlaintext(
        seeds: IntArray,
        uid: Int,
        username: String,
        password: String
    ): ByteArray {
        require(seeds.size == 4) { "the login block carries exactly four ISAAC seeds" }
        require(username.isNotEmpty() && password.isNotEmpty()) { "username and password must be non-empty" }
        require(username.all { it.code in 1..0xff } && password.all { it.code in 1..0xff }) {
            "credentials must be single-byte characters"
        }

        val out = PacketBuffer(ByteArray(1 + 16 + 4 + username.length + 1 + password.length + 1))
        out.p1(MARKER)
        for (seed in seeds) out.p4(seed)
        out.p4(uid)
        out.pjstrAs(username, 0x0a)
        out.pjstrAs(password, 0x0a)
        return out.data.copyOf(out.pos)
    }

    /**
     * Raw RSA encryption, `m^e mod n`, left-padded to the modulus length.
     *
     * The block has no padding, matching the original client. [modulus] and [exponent] are
     * big-endian unsigned values.
     */
    fun rsaEncrypt(plaintext: ByteArray, modulus: ByteArray, exponent: ByteArray): ByteArray {
        val n = BigInteger(1, modulus)
        val e = BigInteger(1, exponent)
        val m = BigInteger(1, plaintext)
        require(m < n) { "login block ${plaintext.size} bytes does not fit a ${modulus.size}-byte modulus" }
        return fixedLength(m.modPow(e, n).toByteArray(), modulus.size)
    }

    /** The client's decrypt stream is seeded with each seed incremented by [SEED_DELTA]. */
    fun decryptCipher(seeds: IntArray): IsaacCipher =
        IsaacCipher(IntArray(seeds.size) { seeds[it] + SEED_DELTA })

    /**
     * Complete opcode-16 frame: `[opcode][blockLen][rev..][info][36 CRCs][encLen][RSA]`.
     *
     * [crcs] must be exactly 36 bytes taken from the server's CrcBuffer.
     */
    fun buildLoginFrame(
        crcs: ByteArray,
        rsaBlock: ByteArray,
        revision: Int = 377,
        info: Int = 0,
        opcode: Int = LOGIN_OPCODE
    ): ByteArray {
        require(crcs.size == 36) { "expected 36 CRC bytes, got ${crcs.size}" }
        require(rsaBlock.size <= 0xff) { "RSA block too large for a 1-byte length prefix" }
        require(revision in 0..0xffff) { "revision must fit 16 bits" }

        val body = PacketBuffer(ByteArray(3 + 1 + 36 + 1 + rsaBlock.size))
        // Revision: 0xFF escape then 16-bit big-endian, because 377 > 0xFF.
        if (revision > 0xff) {
            body.p1(REVISION_ESCAPE)
            body.p2(revision)
        } else {
            body.p1(revision)
        }
        body.p1(info)
        body.pdata(crcs, 0, 36)
        body.p1(rsaBlock.size)
        body.pdata(rsaBlock, 0, rsaBlock.size)

        val frame = PacketBuffer(ByteArray(2 + body.pos))
        frame.p1(opcode)
        frame.p1(body.pos)
        frame.pdata(body.data, 0, body.pos)
        return frame.data.copyOf(frame.pos)
    }

    /** Minimal structure the client needs after a status-2 response. */
    data class LoginResponse(
        val status: Int,
        /** Two bytes between the status and the first ISAAC frame; start-of-frame offset 3. */
        val preamble: ByteArray,
        val frames: ByteArray
    )

    /**
     * Splits the login response into `[status][2 unencrypted bytes][ISAAC frames]`.
     *
     * Starting the packet loop at offset 1 desynchronises after two frames; offset 3
     * parses the whole stream. That was found empirically by probing offsets 1..6.
     */
    fun splitResponse(response: ByteArray): LoginResponse {
        require(response.size >= 3) { "login response too short: ${response.size} bytes" }
        return LoginResponse(
            status = response[0].toInt() and 0xff,
            preamble = response.copyOfRange(1, 3),
            frames = response.copyOfRange(3, response.size)
        )
    }

    private fun fixedLength(value: ByteArray, length: Int): ByteArray {
        val trimmed = if (value.size > 1 && value[0] == 0.toByte()) value.copyOfRange(1, value.size) else value
        require(trimmed.size <= length) { "RSA output ${trimmed.size} exceeds modulus length $length" }
        if (trimmed.size == length) return trimmed
        val out = ByteArray(length)
        System.arraycopy(trimmed, 0, out, length - trimmed.size, trimmed.size)
        return out
    }
}
