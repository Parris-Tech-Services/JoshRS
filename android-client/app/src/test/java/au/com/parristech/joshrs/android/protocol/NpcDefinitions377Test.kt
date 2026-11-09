package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The critical case is `opcode 106 is a multivarbit block, not a single u16`.
 *
 * On real data, treating 106 as one `u16` parses 226 NPCs perfectly and then desynchronises —
 * so a test suite that only exercised early, simple definitions would happily pass a broken
 * parser. That failure mode is why this file exists.
 */
class NpcDefinitions377Test {

    private class Enc {
        val out = java.io.ByteArrayOutputStream()
        fun u1(v: Int) = apply { out.write(v and 0xff) }
        fun u2(v: Int) = apply { out.write((v ushr 8) and 0xff); out.write(v and 0xff) }
        fun i4(v: Int) = apply {
            out.write((v ushr 24) and 0xff); out.write((v ushr 16) and 0xff)
            out.write((v ushr 8) and 0xff); out.write(v and 0xff)
        }
        fun str(s: String) = apply { for (c in s) out.write(c.code); out.write(0x0a) }
        fun end() = apply { out.write(0) }
        fun bytes() = out.toByteArray()
    }

    private fun archive(body: ByteArray, count: Int = 1): ByteArray {
        val o = java.io.ByteArrayOutputStream()
        o.write((count ushr 8) and 0xff); o.write(count and 0xff); o.write(body)
        return o.toByteArray()
    }

    @Test
    fun `decodes name, size, combat level, members and options`() {
        val body = Enc()
            .u1(1).u1(2).u2(100).u2(101)      // 2 models
            .u1(2).str("Hans")
            .u1(3).str("A servant.")
            .u1(12).u1(1)                     // size
            .u1(95).u2(3)                     // combat level
            .u1(211)                          // members flag
            .u1(30).str("Talk-to")
            .end().bytes()

        val n = NpcDefinitions377.decodeAll(archive(body))[0]
        assertEquals("Hans", n.name)
        assertEquals("A servant.", n.description)
        assertEquals(1, n.size)
        assertEquals(3, n.combatLevel)
        assertTrue(n.members)
        assertEquals("Talk-to", n.options[0])
        assertEquals(2, n.modelCount)
    }

    @Test
    fun `opcode 106 is a multivarbit block, not a single u16`() {
        // multivarbit 0x0806, multivar 0xffff (-1), 1 entry => 2 ids.
        // Two definitions: the second must start exactly after the 106 block.
        val two = Enc()
            .u1(2).str("Morris")
            .u1(106).u2(0x0806).u2(0xffff).u1(1).u2(100).u2(101)
            .end()
            .u1(2).str("Second")
            .end().bytes()

        val defs = NpcDefinitions377.decodeAll(archive(two, 2))
        assertEquals("Morris", defs[0].name)
        assertEquals("Second", defs[1].name)
    }

    @Test
    fun `a trailing byte that is not a valid terminator fails loudly`() {
        // Declares 1 npc but leaves an extra definition after it: the "fully consumed" guard
        // must catch an under-read rather than silently returning partial results.
        val body = Enc().u1(2).str("Hans").end().u1(2).str("Extra").end().bytes()
        val error = try {
            NpcDefinitions377.decodeAll(archive(body, 1)); null
        } catch (e: IllegalArgumentException) {
            e
        }
        assertTrue("must reject unconsumed trailing data", error != null)
        assertTrue(error!!.message!!.contains("not fully consumed"))
    }

    @Test
    fun `an unknown opcode identifies the npc and offset`() {
        val body = Enc().u1(2).str("Odd").u1(240).end().bytes()
        val error = try {
            NpcDefinitions377.decodeAll(archive(body)); null
        } catch (e: IllegalArgumentException) {
            e
        }
        assertTrue(error != null)
        assertTrue(error!!.message!!.contains("240"))
        assertTrue(error.message!!.contains("npc 0"))
    }

    @Test
    fun `empty definition yields defaults`() {
        val n = NpcDefinitions377.decodeAll(archive(Enc().end().bytes()))[0]
        assertNull(n.name)
        assertEquals(1, n.size)
        assertEquals(0, n.combatLevel)
        assertEquals(false, n.members)
    }
}
