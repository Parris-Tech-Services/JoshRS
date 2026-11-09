package au.com.parristech.joshrs.android

/**
 * Accepts numeric, non-public IPv4 literals only. No DNS names or redirects:
 * a diagnostic typed into the UI must never resolve to an Internet endpoint.
 *
 * Loopback: the phone's own Termux server (or adb reverse in CI).
 * RFC1918: a personally controlled server on the same private network.
 * 100.64/10: optional private mesh/tailnet addressing.
 *
 * This is an outbound, credential-free diagnostic. It does not configure
 * firewall rules, router port forwarding, or the server's listen address.
 */
object PrivateNetwork377 {
    fun permittedIpv4(input: String): String? {
        val host = input.trim()
        val parts = host.split('.')
        if (parts.size != 4) return null
        if (parts.any { it.isEmpty() || it.length > 3 ||
                (it.length > 1 && it.startsWith("0")) ||
                it.any { ch -> ch !in '0'..'9' } }) return null

        val bytes = parts.map { it.toIntOrNull() ?: return null }
        if (bytes.any { it !in 0..255 }) return null
        val a = bytes[0]
        val b = bytes[1]
        val safe =
            (a == 127 && b == 0 && bytes[2] == 0 && bytes[3] == 1) ||
            a == 10 ||
            (a == 172 && b in 16..31) ||
            (a == 192 && b == 168) ||
            (a == 100 && b in 64..127)
        return if (safe) host else null
    }
}
