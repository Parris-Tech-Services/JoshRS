package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The layout asserted here was validated against a real 377 cache before the Kotlin was written:
 * decoding the live `obj.dat` produced `Dwarf remains`, `Tool kit`, `Cannonball`, `Nulodion's
 * notes`, `Ammo mould`, `Instruction manual`, `Cannon base` for ids 1–7.
 *
 * The most important case is `no offset table` — an implementation that expects one still "works"
 * on hand-written fixtures but produces non-monotonic garbage on real data.
 */
class ObjDefinitions377Test {

    private class Encoder {
        val out = java.io.ByteArrayOutputStream()

        fun u1(v: Int) = apply { out.write(v and 0xff) }
        fun u2(v: Int) = apply { out.write((v ushr 8) and 0xff); out.write(v and 0xff) }
        fun i4(v: Int) = apply {
            out.write((v ushr 24) and 0xff); out.write((v ushr 16) and 0xff)
            out.write((v ushr 8) and 0xff); out.write(v and 0xff)
        }
        fun str(s: String) = apply {
            for (c in s) out.write(c.code)
            out.write(0x0a)
        }
        fun end() = apply { out.write(0) }
        fun bytes(): ByteArray = out.toByteArray()
    }

    private fun archive(count: Int, body: ByteArray): ByteArray {
        val out = java.io.ByteArrayOutputStream()
        out.write((count ushr 8) and 0xff); out.write(count and 0xff)
        out.write(body)
        return out.toByteArray()
    }

    @Test
    fun `decodes names, cost, stackable and flags`() {
        val body = Encoder()
            .u1(1).u2(1234)          // model
            .u1(2).str("Cannonball") // name
            .u1(3).str("Ammunition.") // desc
            .u1(11)                  // stackable
            .u1(12).i4(5)            // cost
            .u1(16)                  // members
            .end()
            .bytes()

        val defs = ObjDefinitions377.decodeAll(archive(1, body))
        assertEquals(1, defs.size)
        val d = defs[0]
        assertEquals(0, d.id)
        assertEquals("Cannonball", d.name)
        assertEquals("Ammunition.", d.description)
        assertEquals(1234, d.model)
        assertEquals(5, d.cost)
        assertTrue(d.stackable)
        assertTrue(d.members)
        assertTrue("tradeable defaults to true", d.tradeable)
    }

    @Test
    fun `tradeable is false only when opcode 15 appears`() {
        val body = Encoder().u1(2).str("Quest item").u1(15).end().bytes()
        val d = ObjDefinitions377.decodeAll(archive(1, body))[0]
        assertEquals(false, d.tradeable)
    }

    @Test
    fun `several definitions are read back to back with no offset table`() {
        // This is the shape that real obj.dat has: 2-byte count then definitions in sequence.
        val body = Encoder()
            .u1(2).str("Dwarf remains").end()
            .u1(2).str("Tool kit").end()
            .u1(2).str("Cannonball").end()
            .bytes()

        val defs = ObjDefinitions377.decodeAll(archive(3, body))
        assertEquals(listOf("Dwarf remains", "Tool kit", "Cannonball"), defs.map { it.name })
        assertEquals(listOf(0, 1, 2), defs.map { it.id })
    }

    @Test
    fun `note linkage is decoded from opcodes 97 and 98`() {
        val body = Encoder().u1(2).str("Cannonball").u1(97).u2(41).u1(98).u2(40).end().bytes()
        val d = ObjDefinitions377.decodeAll(archive(1, body))[0]
        assertEquals(41, d.notedId)
        assertEquals(40, d.noteTemplateId)
    }

    @Test
    fun `options and inventory options are placed by opcode`() {
        val body = Encoder()
            .u1(2).str("Shield")
            .u1(30).str("Wear")
            .u1(35).str("Wield")
            .u1(36).str("Check")
            .end()
            .bytes()
        val d = ObjDefinitions377.decodeAll(archive(1, body))[0]
        assertEquals("Wear", d.options[0])
        assertEquals("Wield", d.inventoryOptions[0])
        assertEquals("Check", d.inventoryOptions[1])
        assertNull(d.inventoryOptions[2])
    }

    @Test
    fun `a name with spaces survives 0x0A termination`() {
        val body = Encoder().u1(2).str("Nulodion's notes").end().bytes()
        assertEquals("Nulodion's notes", ObjDefinitions377.decodeAll(archive(1, body))[0].name)
    }

    @Test
    fun `an unknown opcode fails loudly instead of desynchronising`() {
        // 199 is not a valid obj opcode. Silently skipping it would corrupt every later item.
        val body = Encoder().u1(2).str("Item").u1(199).end().bytes()
        val error = try {
            ObjDefinitions377.decodeAll(archive(1, body)); null
        } catch (e: IllegalArgumentException) {
            e
        }
        assertTrue("must throw", error != null)
        assertTrue("message must identify item and opcode", error!!.message!!.contains("199"))
        assertTrue(error.message!!.contains("item 0"))
    }

    @Test
    fun `weight is a signed value in grams`() {
        val body = Encoder().u1(2).str("Heavy").u1(75).u2(65535).end().bytes()
        assertEquals(-1, ObjDefinitions377.decodeAll(archive(1, body))[0].weightGrams)
    }
}
