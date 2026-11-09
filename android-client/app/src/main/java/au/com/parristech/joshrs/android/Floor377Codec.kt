package au.com.parristech.joshrs.android

/**
 * Source-grounded rev377 flo.dat reader: config Jagfile #2, entry "flo.dat".
 * Original FloType format uses opcodes 1(RGB), 2(texture), 3(flag), 5, 6(name),
 * 7(secondary RGB) and zero terminator. Unlike the client it does not generate
 * random HSL dithering. No cache entries/assets are included with this code.
 */
data class Floor377(val rgb: Int?, val textureId: Int?, val hasSecondaryColour: Boolean)

object Floor377Codec {
    fun decode(raw: ByteArray): List<Floor377> {
        require(raw.size in 2..(2 * 1024 * 1024)) { "Invalid 377 flo.dat size" }
        var pos = 0
        fun one(): Int {
            require(pos < raw.size) { "Truncated 377 floor definition" }
            return raw[pos++].toInt() and 255
        }
        fun two(): Int = (one() shl 8) or one()
        fun three(): Int = (one() shl 16) or (one() shl 8) or one()
        val count = two()
        require(count in 1..2048) { "Invalid 377 floor count" }
        val floors = ArrayList<Floor377>(count)
        repeat(count) {
            var rgb: Int? = null
            var texture: Int? = null
            var secondary = false
            var ops = 0
            while (true) {
                require(++ops < 1024) { "Invalid floor opcode sequence" }
                when (val opcode = one()) {
                    0 -> break
                    1 -> rgb = three()
                    2 -> texture = one()
                    3 -> Unit
                    5 -> Unit
                    6 -> {
                        var bytes = 0
                        // The 377 Packet.gjstr uses newline (byte 10).
                        while (one() != 10) {
                            require(++bytes < 256) { "Invalid floor name string" }
                        }
                    }
                    7 -> { three(); secondary = true }
                    else -> throw IllegalArgumentException("Unknown 377 floor opcode $opcode")
                }
            }
            if (rgb == 0xff00ff) rgb = null // original transparent colour sentinel
            floors += Floor377(rgb, texture, secondary)
        }
        require(pos == raw.size) { "Extra data in 377 floor definitions" }
        return floors
    }
}
