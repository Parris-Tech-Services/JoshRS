package au.com.parristech.joshrs.android

import java.net.InetSocketAddress
import java.net.Socket

/** Real network socket reachability checks. No login packets or credentials sent. */
object Loopback377 {
    const val GAME_PORT = 52402
    const val WEB_PORT = 8888
    const val TIMEOUT_MS = 700

    data class Status(val gameTcpReachable: Boolean, val webTcpReachable: Boolean) {
        val serverPortsReachable get() = gameTcpReachable && webTcpReachable
    }

    // Never accept a user-provided public IP: the phone-local server must be
    // private. A successful socket connect is NOT a game login or protocol proof.
    fun check(gamePort: Int = GAME_PORT, webPort: Int = WEB_PORT): Status =
        Status(portOpen(gamePort), portOpen(webPort))

    private fun portOpen(port: Int): Boolean {
        if (port !in 1..65535) return false
        return try {
            Socket().use { socket ->
                socket.connect(InetSocketAddress("127.0.0.1", port), TIMEOUT_MS)
                true
            }
        } catch (_: Exception) {
            false
        }
    }
}
