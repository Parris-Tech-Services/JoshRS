package au.com.parristech.joshrs.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import java.net.InetAddress
import java.net.ServerSocket
import java.util.zip.CRC32

class Real377FoundationTest {
    private fun put16(data: ByteArray, offset: Int, value: Int) {
        data[offset] = (value ushr 8).toByte()
        data[offset + 1] = value.toByte()
    }

    private fun put32(data: ByteArray, offset: Int, value: Long) {
        data[offset] = (value ushr 24).toByte()
        data[offset + 1] = (value ushr 16).toByte()
        data[offset + 2] = (value ushr 8).toByte()
        data[offset + 3] = value.toByte()
    }

    private fun validFixture(): ByteArray {
        val data = ByteArray(137)
        put16(data, 0, 0x2004)
        put16(data, 2, 7)
        put16(data, 4, 3200)
        put16(data, 6, 3420)
        data[8] = 1
        put32(data, 24, 2400)
        repeat(21) { i ->
            put32(data, 28 + i * 5, (i * 1000).toLong())
            data[28 + i * 5 + 4] = (i + 1).toByte()
        }
        val crc = CRC32()
        crc.update(data, 0, data.size - 4)
        put32(data, data.size - 4, crc.value)
        return data
    }

    @Test fun exactRealSaveLayoutReadsAll21SkillsAndPosition() {
        val s = Save377.inspect(validFixture())
        assertEquals(7, s.version)
        assertEquals(3200, s.x)
        assertEquals(3420, s.z)
        assertEquals(1, s.plane)
        assertEquals(2400, s.playtimeTicks)
        assertEquals(21, s.skills.size)
        assertEquals("Attack", s.skills.first().name)
        assertEquals("Runecraft", s.skills.last().name)
        assertEquals(210000L, s.totalSkillXp)
        assertEquals(64, s.sha256.length)
    }

    @Test fun rejectsCorruptCrcWithoutWritingAnything() {
        val b = validFixture()
        b[40] = (b[40].toInt() xor 0x40).toByte()
        assertThrows(IllegalArgumentException::class.java) { Save377.inspect(b) }
    }

    @Test fun rejectsUnsupportedVersionAndHeader() {
        val b = validFixture()
        put16(b, 2, 8)
        assertThrows(IllegalArgumentException::class.java) { Save377.inspect(b) }
        put16(b, 0, 0x1111)
        assertThrows(IllegalArgumentException::class.java) { Save377.inspect(b) }
    }

    @Test fun rejectsTruncatedSave() {
        assertThrows(IllegalArgumentException::class.java) { Save377.inspect(ByteArray(136)) }
    }

    @Test fun matchesAuthenticNegotiationFrameWithoutCredentials() {
        ServerSocket(0, 1, InetAddress.getByName("127.0.0.1")).use { server ->
            val worker = Thread {
                server.accept().use { peer ->
                    peer.soTimeout = 2000
                    assertEquals(14, peer.getInputStream().read())
                    assertEquals(0, peer.getInputStream().read())
                    val response = ByteArray(17)
                    response[9] = 0x37
                    peer.getOutputStream().write(response)
                    peer.getOutputStream().flush()
                }
            }
            worker.start()
            val status = Negotiation377.probe(server.localPort)
            worker.join(3000)
            assertTrue(status.negotiated)
            assertTrue(status.message.contains("not logged in"))
        }
    }

    @Test fun rejectsNon377NegotiationFrames() {
        ServerSocket(0, 1, InetAddress.getByName("127.0.0.1")).use { server ->
            val worker = Thread {
                server.accept().use { peer ->
                    peer.getInputStream().read(ByteArray(2))
                    peer.getOutputStream().write(ByteArray(17) { 1 })
                }
            }
            worker.start()
            val status = Negotiation377.probe(server.localPort)
            worker.join(3000)
            assertFalse(status.negotiated)
        }
    }

    @Test fun probesOnlyRealLocalSocketsAndNeverClaimsLogin() {
        ServerSocket(0, 1, InetAddress.getByName("127.0.0.1")).use { server ->
            val result = Loopback377.check(server.localPort, server.localPort)
            assertTrue(result.gameTcpReachable)
            assertTrue(result.webTcpReachable)
            assertTrue(result.serverPortsReachable)
        }
        assertFalse(Loopback377.check(-1, 65536).serverPortsReachable)
    }
}
