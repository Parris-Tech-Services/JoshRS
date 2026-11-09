package au.com.parristech.joshrs.android.protocol

/**
 * Item definitions from a revision-377 `obj.dat`.
 *
 * Format validated against a **real** cache, not just documented: decompressing `obj.dat` out of
 * the live `config` jagfile and decoding it produced, in order, `Dwarf remains`, `Tool kit`,
 * `Cannonball`, `Nulodion's notes`, `Ammo mould`, `Instruction manual`, `Cannon base` — the
 * correct 377 item ids 1–7.
 *
 * Two structural facts that are easy to get wrong:
 *
 *  1. **There is no offset table.** The archive is a 2-byte count followed by definitions back
 *     to back. An implementation that expects `count` × 2-byte offsets produces non-monotonic
 *     garbage, which is exactly what happened before this was checked against real data.
 *  2. Strings are `0x0A`-terminated, not NUL-terminated.
 *
 * Opcode widths are taken from `Engine-TS` `src/cache/config/ObjType.ts` (MIT).
 */
data class ObjDefinition377(
    val id: Int,
    val name: String?,
    val description: String?,
    val model: Int,
    val cost: Int,
    val stackable: Boolean,
    val members: Boolean,
    val tradeable: Boolean,
    /** Item id this becomes when noted, or -1. */
    val notedId: Int,
    /** Item id this is a note of, or -1. */
    val noteTemplateId: Int,
    val weightGrams: Int,
    val options: List<String?>,
    val inventoryOptions: List<String?>
)

object ObjDefinitions377 {

    /**
     * Decodes every definition in [bytes].
     *
     * Unknown opcodes throw with the item id and offset rather than silently desynchronising the
     * stream — a mis-sized opcode would otherwise corrupt every following item and produce
     * plausible-looking nonsense.
     */
    fun decodeAll(bytes: ByteArray): List<ObjDefinition377> {
        val buf = PacketBuffer(bytes)
        val count = buf.g2()
        val out = ArrayList<ObjDefinition377>(count)
        val reader = DefReader(buf)
        for (id in 0 until count) {
            out.add(reader.read(id))
        }
        return out
    }

    private class DefReader(private val buf: PacketBuffer) {

        fun read(id: Int): ObjDefinition377 {
            var name: String? = null
            var description: String? = null
            var model = 0
            var cost = 0
            var stackable = false
            var members = false
            var tradeable = true
            var notedId = -1
            var noteTemplateId = -1
            var weight = 0
            val options = arrayOfNulls<String>(5)
            val iops = arrayOfNulls<String>(5)

            while (true) {
                val start = buf.pos
                val code = buf.g1()
                if (code == 0) break
                when (code) {
                    1 -> model = buf.g2()
                    2 -> name = buf.gjstr()
                    3 -> description = buf.gjstr()
                    4, 5, 6 -> buf.g2()                       // 2d zoom / rotation
                    7, 8 -> buf.g2s()                         // 2d offsets
                    10 -> buf.g2()                            // colour
                    11 -> stackable = true
                    12 -> cost = buf.g4()
                    13, 14, 27 -> buf.g1()
                    15 -> tradeable = false
                    16 -> members = true
                    23 -> { buf.g2(); buf.g1s() }             // manwear + offset
                    24 -> buf.g2()
                    25 -> { buf.g2(); buf.g1s() }             // womanwear + offset
                    26 -> buf.g2()
                    in 30..34 -> options[code - 30] = buf.gjstr()
                    in 35..39 -> iops[code - 35] = buf.gjstr()
                    40 -> {
                        val n = buf.g1()
                        repeat(n) { buf.g2(); buf.g2() }      // recolour pairs
                    }
                    75 -> weight = buf.g2s()
                    78, 79, 90, 91, 92, 93, 94, 95 -> buf.g2()
                    96 -> buf.g1()
                    97 -> notedId = buf.g2()
                    98 -> noteTemplateId = buf.g2()
                    in 100..109 -> { buf.g2(); buf.g2() }     // stack count/co
                    110, 111, 112 -> buf.g2()
                    113, 114 -> buf.g1s()
                    115 -> buf.g1()
                    201 -> buf.g2()
                    250 -> buf.gjstr()                        // debug name
                    else -> throw IllegalArgumentException(
                        "unknown obj opcode $code for item $id at offset ${start - 1}"
                    )
                }
            }

            return ObjDefinition377(
                id = id,
                name = name,
                description = description,
                model = model,
                cost = cost,
                stackable = stackable,
                members = members,
                tradeable = tradeable,
                notedId = notedId,
                noteTemplateId = noteTemplateId,
                weightGrams = weight,
                options = options.toList(),
                inventoryOptions = iops.toList()
            )
        }
    }
}
