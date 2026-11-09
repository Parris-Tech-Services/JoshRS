package au.com.parristech.joshrs.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.net.InetAddress
import java.net.ServerSocket

class PrivateNetwork377Test {
    @Test fun acceptsOnlyExplicitPrivateNumericAddresses() {
        listOf(
            "127.0.0.1", "10.0.2.2", "10.255.1.8",
            "172.16.0.1", "172.31.255.254",
            "192.168.1.20", "100.64.0.1", "100.127.255.254"
        ).forEach { ip ->
            assertEquals(ip, PrivateNetwork377.permittedIpv4(ip))
        }
    }

    @Test fun refusesPublicHostsAndAmbiguousInputBeforeNetworkAccess() {
        listOf(
            "", "localhost", "JParrisDesktop", "8.8.8.8", "1.1.1.1",
            "172.15.0.1", "172.32.0.1", "100.128.1.1",
            "169.254.169.254", "192.168.1.4.attacker.example",
            "192.168.01.3", "192.168.1.256", "192.168.1.3:52402",
            "::1", "2001:4860:4860::8888", "127.0.0.2", "-1.1.1.1"
        ).forEach { ip ->
            assertNull("Unsafe endpoint unexpectedly allowed: $ip",
                PrivateNetwork377.permittedIpv4(ip))
            val attempt = Negotiation377.probe(port = 52402, host = ip)
            assertFalse(attempt.negotiated)
            assertTrue(attempt.message.contains("private IPv4"))
        }
    }

    @Test fun supportsRealPrivateHostOptionWithNormal377ChallengeOnly() {
        ServerSocket(0, 1, InetAddress.getByName("127.0.0.1")).use { server ->
            val worker = Thread {
                server.accept().use { peer ->
                    peer.soTimeout = 2000
                    val request = ByteArray(2)
                    var count = 0
                    while (count < request.size) {
                        val n = peer.getInputStream().read(request, count, request.size - count)
                        if (n < 0) error("Incomplete 377 request")
                        count += n
                    }
                    check(request.contentEquals(byteArrayOf(14, 0)))
                    peer.getOutputStream().write(ByteArray(17))
                }
            }
            worker.start()
            val reply = Negotiation377.probe(server.localPort, "127.0.0.1")
            worker.join(3000)
            assertTrue("Genuine TCP handshake failed: ${reply.message}", reply.negotiated)
        }
    }
}
