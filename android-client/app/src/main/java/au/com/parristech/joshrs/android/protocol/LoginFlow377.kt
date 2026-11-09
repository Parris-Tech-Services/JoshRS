package au.com.parristech.joshrs.android.protocol

import java.io.EOFException
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Byte transport for the game connection.
 *
 * Abstracted so the login and framing logic can be tested against an in-process server
 * without a real network, and so a future WebSocket or TLS transport can be dropped in.
 */
interface Transport {
    fun write(bytes: ByteArray)

    /** Reads exactly [n] bytes or throws [EOFException]. */
    fun readExact(n: Int): ByteArray

    fun close()
}

/** Plain TCP transport for a revision-377 game port. */
class TcpTransport(
    host: String,
    port: Int,
    connectTimeoutMs: Int = 10_000,
    readTimeoutMs: Int = 30_000
) : Transport {

    private val socket = Socket().apply {
        connect(InetSocketAddress(host, port), connectTimeoutMs)
        soTimeout = readTimeoutMs
        tcpNoDelay = true
    }

    private val input: InputStream = socket.getInputStream()
    private val output: OutputStream = socket.getOutputStream()

    override fun write(bytes: ByteArray) {
        output.write(bytes)
        output.flush()
    }

    override fun readExact(n: Int): ByteArray {
        val out = ByteArray(n)
        var read = 0
        while (read < n) {
            val got = input.read(out, read, n - read)
            if (got < 0) throw EOFException("connection closed after $read of $n bytes")
            read += got
        }
        return out
    }

    override fun close() {
        runCatching { socket.close() }
    }
}

/**
 * Revision-377 login handshake and credential submission.
 *
 * Sequence, matching `LostCityRS/Engine-TS@377-wip` `World.ts`:
 *
 *  1. client sends `[14][loginServerId]`;
 *  2. server replies 8 zero bytes, a login-server byte, then an 8-byte seed (17 total);
 *  3. client sends `[16][len][0xFF][rev:2][info][36 CRCs][encLen][RSA block]`;
 *  4. server replies `[status][2 bytes][ISAAC frames]`, where a session cipher is
 *     `Isaac(seed + 50)` for the seeds the client chose.
 *
 * Status 2 means authenticated. Status 6 means "out of date" and is what a wrong
 * revision, a wrong CRC bundle or a malformed RSA block all produce — which is why every
 * one of those has a dedicated test rather than a shared "login failed".
 */
class LoginFlow377(
    private val transport: Transport,
    private val modulus: ByteArray,
    private val exponent: ByteArray
) {

    /** Sends opcode 14 and returns the 17-byte reply. */
    fun negotiate(loginServerId: Int = 0): ByteArray {
        transport.write(byteArrayOf(LoginBlock377.NEGOTIATION_OPCODE.toByte(), loginServerId.toByte()))
        return transport.readExact(17)
    }

    /** The 8-byte session seed inside the negotiation reply. */
    fun sessionSeed(reply: ByteArray): ByteArray {
        require(reply.size == 17) { "negotiation reply must be 17 bytes, got ${reply.size}" }
        return reply.copyOfRange(9, 17)
    }

    /**
     * Builds and sends the credential block, then returns the login status byte.
     * The stream is left positioned at the two-byte preamble.
     */
    fun login(
        crcs: ByteArray,
        username: String,
        password: String,
        uid: Int,
        seeds: IntArray,
        revision: Int = 377,
        opcode: Int = LoginBlock377.LOGIN_OPCODE
    ): Int {
        val plaintext = LoginBlock377.buildPlaintext(seeds, uid, username, password)
        val rsaBlock = LoginBlock377.rsaEncrypt(plaintext, modulus, exponent)
        val frame = LoginBlock377.buildLoginFrame(
            crcs = crcs,
            rsaBlock = rsaBlock,
            revision = revision,
            info = 0,
            opcode = opcode
        )
        transport.write(frame)
        return transport.readExact(1)[0].toInt() and 0xff
    }

    fun close() = transport.close()

    companion object {
        /** Status code the engine returns for a successful authenticated login. */
        const val STATUS_OK: Int = 2

        /** "Out of date": revision mismatch, bad CRC bundle, or an undecryptable block. */
        const val STATUS_OUT_OF_DATE: Int = 6
    }
}
