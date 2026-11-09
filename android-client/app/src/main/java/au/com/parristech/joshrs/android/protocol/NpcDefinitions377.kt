package au.com.parristech.joshrs.android.protocol

/**
 * NPC definitions from a revision-377 `npc.dat`.
 *
 * Table validated against **real data**: parsing the live file yields all 3,852 definitions with
 * zero bytes remaining, and the names match the engine's own output exactly (`226` null,
 * `227` "Morris", `0` "Hans", `8` "Farmer", `223` "Brother Kojo").
 *
 * The important correction: **opcode 106 is not a single value.** It is a multivarbit block:
 *
 * ```
 * multivarbit (u16), multivar (u16), count (u8), then (count + 1) u16 npc ids
 * ```
 *
 * Treating it as one `u16` — which is what the TypeScript source suggests at a glance — desyncs
 * the whole archive at NPC 226. The runtime implementation is the authority; the readable source
 * branch differed from what actually executed, which is why this was measured by instrumenting
 * the engine rather than by reading it.
 *
 * This is also why the first 226 NPCs decoding correctly proved nothing: no earlier NPC used
 * opcode 106.
 */
data class NpcDefinition377(
    val id: Int,
    val name: String?,
    val description: String?,
    /** Tile size, 1 = one square. */
    val size: Int,
    /** Combat level from opcode 95, 0 when absent. */
    val combatLevel: Int,
    val members: Boolean,
    /** Opcodes 30–34. */
    val options: List<String?>,
    /** Number of models in opcode 1, retained for rendering work. */
    val modelCount: Int
)

object NpcDefinitions377 {

    fun decodeAll(bytes: ByteArray): List<NpcDefinition377> {
        val buf = PacketBuffer(bytes)
        val count = buf.g2()
        val out = ArrayList<NpcDefinition377>(count)
        val reader = DefReader(buf)
        for (id in 0 until count) out.add(reader.read(id))
        require(buf.pos == bytes.size) {
            "npc.dat not fully consumed: stopped at ${buf.pos} of ${bytes.size} " +
                "(a wrong opcode width desynchronises every following definition)"
        }
        return out
    }

    private class DefReader(private val buf: PacketBuffer) {

        fun read(id: Int): NpcDefinition377 {
            var name: String? = null
            var description: String? = null
            var size = 1
            var combatLevel = 0
            var members = false
            var modelCount = 0
            val options = arrayOfNulls<String>(5)

            while (true) {
                val at = buf.pos
                val code = buf.g1()
                if (code == 0) break
                when (code) {
                    1 -> {
                        modelCount = buf.g1()
                        repeat(modelCount) { buf.g2() }
                    }
                    2 -> name = buf.gjstr()
                    3 -> description = buf.gjstr()
                    12 -> size = buf.g1()
                    13, 14 -> buf.g2()
                    17 -> repeat(4) { buf.g2() }
                    18, 26, 27 -> buf.g2()
                    in 30..34 -> options[code - 30] = buf.gjstr()
                    40 -> repeat(buf.g1()) { buf.g2(); buf.g2() }
                    60 -> repeat(buf.g1()) { buf.g2() }
                    in 74..79 -> buf.g2()
                    90, 91, 92, 95, 97, 98 -> {
                        val v = buf.g2()
                        if (code == 95) combatLevel = v
                    }
                    93, 99, 107, 211, 213 -> {
                        if (code == 211) members = true
                        // flags carry no payload
                    }
                    100, 101 -> buf.g1s()
                    102, 103 -> buf.g2()
                    106 -> {
                        // multivarbit + multivar + count + (count + 1) ids — NOT a single u16.
                        buf.g2()
                        buf.g2()
                        val n = buf.g1()
                        repeat(n + 1) { buf.g2() }
                    }
                    202 -> buf.g1()
                    203, 204, 214 -> buf.g2()
                    206, 208, 209, 210 -> buf.g1()
                    212 -> repeat(buf.g1()) { buf.g4(); buf.g1() }
                    250 -> buf.gjstr()
                    else -> throw IllegalArgumentException(
                        "unknown npc opcode $code for npc $id at offset $at"
                    )
                }
            }

            return NpcDefinition377(
                id = id,
                name = name,
                description = description,
                size = size,
                combatLevel = combatLevel,
                members = members,
                options = options.toList(),
                modelCount = modelCount
            )
        }
    }
}
