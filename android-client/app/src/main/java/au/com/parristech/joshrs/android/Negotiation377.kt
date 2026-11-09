package au.com.parristech.joshrs.android

import java.net.InetSocketAddress
import java.net.Socket
import java.net.SocketTimeoutException

/**
 * A credential-free rev-377 login NEGOTIATION probe, not an account login.
 *
 * Verified directly from pinned Engine-TS World.onClientData: a 14 opcode and
 * one zero server-index byte produce eight zero bytes, a status-zero byte and
 * eight bytes of server nonce. No RSA keys or user credentials are involved.
 */
object Negotiation377 {
    const val PORT = 52402
    const val REPLY_LENGTH = 17
    private const val TIMEOUT_MS = 2500

    data class Result(val negotiated: Boolean, val message: String)

    fun probe(port: Int = PORT, host: String = "127.0.0.1"): Result {
        if (port !in 1..65535) return Result(false, "Invalid port")
        val approvedHost = PrivateNetwork377.permittedIpv4(host)
            ?: return Result(false, "Enter a numeric private IPv4 address (LAN, tailnet or 127.0.0.1)")
        return try {
            Socket().use { socket ->
                socket.soTimeout = TIMEOUT_MS
                socket.connect(InetSocketAddress(approvedHost, port), TIMEOUT_MS)
                socket.getOutputStream().write(byteArrayOf(14, 0))
                socket.getOutputStream().flush()
                val reply = ByteArray(REPLY_LENGTH)
                var offset = 0
                while (offset < REPLY_LENGTH) {
                    val read = socket.getInputStream().read(reply, offset, REPLY_LENGTH - offset)
                    if (read == -1) return Result(false, "Server closed during 377 negotiation")
                    offset += read
                }
                // Never display, log or persist the server's 8-byte nonce.
                val headerOk = reply.take(9).all { it == 0.toByte() }
                if (headerOk) Result(true, "377 negotiation accepted (not logged in)")
                else Result(false, "Unexpected negotiation reply: may not be the 377 engine")
            }
        } catch (_: SocketTimeoutException) {
            Result(false, "377 negotiation timed out")
        } catch (_: Exception) {
            Result(false, "377 negotiation unavailable at this private address")
        }
    }
}
