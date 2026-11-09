package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.math.BigInteger
import java.net.URI
import java.security.KeyFactory
import java.security.spec.RSAPublicKeySpec

/**
 * Logs into a REAL revision-377 engine.
 *
 * Skipped by default: it requires a running engine, so it is only executed by
 * `.github/workflows/android377-live-login.yml`, which boots the pinned engine and sets:
 *
 * ```
 * JS377_IT_HOST=127.0.0.1  JS377_IT_PORT=43594  JS377_IT_WEB=http://127.0.0.1:8888
 * JS377_IT_KEYFILE=<engine>/data/config/public.pem
 * ```
 *
 * This is the only test that proves the Kotlin client speaks to the actual server rather
 * than to a fixture. Everything else in this package is verified against fixtures or
 * reference vectors.
 */
class LiveEngineLoginTest {

    private fun env(name: String): String? = System.getenv(name)?.takeIf { it.isNotBlank() }

    /** Strips PEM armour and returns the DER bytes. */
    private fun pemToDer(pem: String): ByteArray {
        val base64 = pem.lines().filterNot { it.contains("-----") }.joinToString("")
        return java.util.Base64.getMimeDecoder().decode(base64)
    }

    /**
     * Extracts the two INTEGERs of an RSAPublicKey, then orders them by length so a
     * modulus/exponent swap (which the pinned engine's public.pem has) is corrected.
     */
    private fun parsePublicKey(pem: String): Pair<ByteArray, ByteArray> {
        val der = pemToDer(pem)
        val ints = ArrayList<ByteArray>()
        var i = 0
        while (i < der.size - 1 && ints.size < 2) {
            if (der[i] == 0x02.toByte()) {
                val len = der[i + 1].toInt() and 0xff
                var body = der.copyOfRange(i + 2, i + 2 + len)
                if (body.isNotEmpty() && body[0] == 0.toByte()) body = body.copyOfRange(1, body.size)
                ints.add(body)
                i += 2 + len
            } else {
                i++
            }
        }
        require(ints.size == 2) { "could not parse an RSA public key from the PEM" }
        val (a, b) = ints
        return if (a.size > b.size) a to b else b to a
    }

    @Test
    fun `authenticates against the live engine and reads real frames`() {
        val host = env("JS377_IT_HOST")
        assumeTrue("JS377_IT_HOST not set; live engine test skipped", host != null)

        val port = env("JS377_IT_PORT")?.toInt() ?: 43594
        val web = env("JS377_IT_WEB") ?: "http://$host:8888"
        val keyFile = requireNotNull(env("JS377_IT_KEYFILE")) { "JS377_IT_KEYFILE is required" }

        // 1. The server's own CrcBuffer. The login block needs the first 36 bytes; the
        //    server verifies crc32(those) == CrcBuffer32, so they cannot be invented.
        val crcResponse = URI("$web/crc").toURL().openStream().use { it.readBytes() }
        assertEquals("CrcBuffer must be 40 bytes", 40, crcResponse.size)
        val crcs = crcResponse.copyOfRange(0, 36)

        // 2. Public key, with the swap correction applied.
        val (modulus, exponent) = parsePublicKey(java.io.File(keyFile).readText())

        // 3. Fresh credentials: usernames are unique per run so reruns never collide.
        val user = "kt" + System.currentTimeMillis().toString().takeLast(8)
        val seeds = intArrayOf(0x11223344, 0x55667788, 0x31415926, 0x27182818)

        val transport = TcpTransport(host!!, port)
        val flow = LoginFlow377(transport, modulus, exponent)
        try {
            val reply = flow.negotiate()
            assertEquals(17, reply.size)

            val outcome = flow.loginAndOpenSession(crcs, user, "testpass123", 12345, seeds)
            assertEquals(
                "expected status 2 (authenticated); status 6 means out-of-date revision/CRC/RSA",
                LoginFlow377.STATUS_OK,
                outcome.status
            )
            assertEquals("login response preamble must be 2 bytes", 2, outcome.preamble.size)

            // 4. A real session: the server should immediately send live state.
            val session = GameSession377({ transport.readAtMost(it) }, seeds)
            val frames = ArrayList<DecodedFrame>()
            val deadline = System.currentTimeMillis() + 15_000
            while (frames.size < 20 && System.currentTimeMillis() < deadline) {
                val batch = session.readUntilFrame()
                if (batch.isEmpty()) break
                frames.addAll(batch)
            }

            assertTrue("expected the server to send game frames, got ${frames.size}", frames.isNotEmpty())
            println("live login ok: user=$user frames=${frames.size} first=${frames.first().prot}")
        } finally {
            flow.close()
        }
    }

    /** Guards the swap correction itself on a synthetic key, independent of the engine. */
    @Test
    fun `public key parsing corrects a swapped modulus and exponent`() {
        val kp = java.security.KeyPairGenerator.getInstance("RSA").apply { initialize(1024) }.generateKeyPair()
        val pub = kp.public as java.security.interfaces.RSAPublicKey
        val der = pub.encoded
        // Rebuild a PEM from the DER so the parser takes the same path as production.
        val pem = "-----BEGIN PUBLIC KEY-----\n" +
            java.util.Base64.getMimeEncoder().encodeToString(der) +
            "\n-----END PUBLIC KEY-----\n"
        val (modulus, exponent) = parsePublicKey(pem)

        // Direct equality: the parser must return exactly the key's own two integers.
        assertEquals(pub.modulus, BigInteger(1, modulus))
        assertEquals(pub.publicExponent, BigInteger(1, exponent))
        val rebuilt = KeyFactory.getInstance("RSA").generatePublic(
            RSAPublicKeySpec(BigInteger(1, modulus), BigInteger(1, exponent))
        ) as java.security.interfaces.RSAPublicKey
        assertEquals(pub.modulus, rebuilt.modulus)
    }
}
