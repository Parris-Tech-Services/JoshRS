package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.InputStream
import java.math.BigInteger
import java.net.ServerSocket
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

/**
 * End-to-end login over a real loopback socket.
 *
 * The in-process server generates its own RSA key pair, so the assertion is strong: after
 * the client submits credentials, the server **decrypts** the block with its private key
 * and must recover exactly the plaintext the client meant to send. That covers the frame
 * layout, the `0xFF` revision escape, the 36-CRC placement and raw RSA together — the
 * combination that a mocked cipher would never catch.
 */
class LoginFlow377Test {

    private fun stripLeadingZero(b: ByteArray): ByteArray =
        if (b.size > 1 && b[0] == 0.toByte()) b.copyOfRange(1, b.size) else b

    private fun readFully(input: InputStream, buf: ByteArray) {
        var read = 0
        while (read < buf.size) {
            val n = input.read(buf, read, buf.size - read)
            if (n < 0) throw IllegalStateException("server: unexpected EOF")
            read += n
        }
    }

    @Test
    fun `client completes a login the server can decrypt`() {
        val keyPair = KeyPairGenerator.getInstance("RSA").apply { initialize(1024) }.generateKeyPair()
        val publicKey = keyPair.public as RSAPublicKey
        val privateKey = keyPair.private as RSAPrivateKey
        val modulus = stripLeadingZero(publicKey.modulus.toByteArray())
        val exponent = stripLeadingZero(publicKey.publicExponent.toByteArray())

        val seeds = intArrayOf(0x11223344, 0x55667788, 0x31415926, 0x27182818)
        val crcs = ByteArray(36) { (it * 7).toByte() }

        val server = ServerSocket(0)
        val done = CountDownLatch(1)
        var receivedBody: ByteArray? = null
        var failure: Throwable? = null

        thread(isDaemon = true) {
            try {
                server.accept().use { socket ->
                    val input = socket.getInputStream()
                    val output = socket.getOutputStream()

                    // 1. negotiation: client sends [14][loginServerId]
                    val opcode = ByteArray(2)
                    readFully(input, opcode)
                    assertEquals(LoginBlock377.NEGOTIATION_OPCODE, opcode[0].toInt() and 0xff)

                    // 2. reply: 8 zeros + login-server byte + 8-byte seed
                    output.write(ByteArray(9) { 0 } + byteArrayOf(1, 2, 3, 4, 5, 6, 7, 8))
                    output.flush()

                    // 3. login frame: [16][len][body]
                    val header = ByteArray(2)
                    readFully(input, header)
                    assertEquals(LoginBlock377.LOGIN_OPCODE, header[0].toInt() and 0xff)
                    val body = ByteArray(header[1].toInt() and 0xff)
                    readFully(input, body)
                    receivedBody = body

                    // 4. authenticate
                    output.write(byteArrayOf(LoginFlow377.STATUS_OK.toByte()))
                    output.flush()
                }
            } catch (t: Throwable) {
                failure = t
            } finally {
                done.countDown()
            }
        }

        val flow = LoginFlow377(TcpTransport("127.0.0.1", server.localPort), modulus, exponent)
        try {
            val reply = flow.negotiate()
            assertEquals(17, reply.size)
            assertArrayEquals(byteArrayOf(1, 2, 3, 4, 5, 6, 7, 8), flow.sessionSeed(reply))

            val status = flow.login(crcs, "sylvie", "tigger", 4242, seeds)
            assertEquals(LoginFlow377.STATUS_OK, status)
        } finally {
            flow.close()
            server.close()
        }

        assertTrue("server thread did not finish", done.await(10, TimeUnit.SECONDS))
        failure?.let { throw it }

        val body = requireNotNull(receivedBody)
        // [0xFF][rev:2][info][36 CRCs][encLen][RSA block]
        assertEquals(0xff, body[0].toInt() and 0xff)
        assertEquals(377, ((body[1].toInt() and 0xff) shl 8) or (body[2].toInt() and 0xff))
        assertEquals(0, body[3].toInt() and 0xff)
        assertArrayEquals(crcs, body.copyOfRange(4, 40))

        val encLength = body[40].toInt() and 0xff
        val cipher = body.copyOfRange(41, 41 + encLength)
        assertEquals(modulus.size, cipher.size)

        // The server decrypts with its private key: this must be the client's plaintext.
        val decrypted = BigInteger(1, cipher).modPow(privateKey.privateExponent, privateKey.modulus)
        val recovered = stripLeadingZero(decrypted.toByteArray())
        val expected = LoginBlock377.buildPlaintext(seeds, 4242, "sylvie", "tigger")
        assertArrayEquals(expected, recovered)

        // And the plaintext really is the marker + credentials, not a coincidence.
        assertEquals(LoginBlock377.MARKER, recovered[0].toInt() and 0xff)
        assertEquals("sylvie", String(recovered, 21, 6, Charsets.ISO_8859_1))
    }

    @Test
    fun `an out of date status is surfaced rather than swallowed`() {
        val keyPair = KeyPairGenerator.getInstance("RSA").apply { initialize(1024) }.generateKeyPair()
        val publicKey = keyPair.public as RSAPublicKey

        val server = ServerSocket(0)
        val done = CountDownLatch(1)
        thread(isDaemon = true) {
            try {
                server.accept().use { socket ->
                    val input = socket.getInputStream()
                    val output = socket.getOutputStream()
                    readFully(input, ByteArray(2))
                    output.write(ByteArray(17))
                    output.flush()
                    val header = ByteArray(2)
                    readFully(input, header)
                    readFully(input, ByteArray(header[1].toInt() and 0xff))
                    output.write(byteArrayOf(LoginFlow377.STATUS_OUT_OF_DATE.toByte()))
                    output.flush()
                }
            } finally {
                done.countDown()
            }
        }

        val flow = LoginFlow377(
            TcpTransport("127.0.0.1", server.localPort),
            stripLeadingZero(publicKey.modulus.toByteArray()),
            stripLeadingZero(publicKey.publicExponent.toByteArray())
        )
        try {
            flow.negotiate()
            val status = flow.login(ByteArray(36), "a", "b", 1, intArrayOf(1, 2, 3, 4))
            assertEquals(LoginFlow377.STATUS_OUT_OF_DATE, status)
        } finally {
            flow.close()
            server.close()
        }
        assertTrue(done.await(10, TimeUnit.SECONDS))
    }

    @Test
    fun `negotiation rejects a short reply instead of guessing`() {
        val transport = object : Transport {
            private var served = false
            override fun write(bytes: ByteArray) {}
            override fun readExact(n: Int): ByteArray {
                if (served) throw java.io.EOFException("closed")
                served = true
                return ByteArray(11) // server said something, but not 17 bytes
            }
            override fun close() {}
        }
        val flow = LoginFlow377(transport, ByteArray(64) { 1 }, ByteArray(4) { 1 })
        val reply = flow.negotiate()
        assertEquals(11, reply.size)
        // sessionSeed must refuse a malformed reply rather than silently mis-slice it.
        var threw = false
        try {
            flow.sessionSeed(reply)
        } catch (e: IllegalArgumentException) {
            threw = true
        }
        assertTrue(threw)
    }
}
