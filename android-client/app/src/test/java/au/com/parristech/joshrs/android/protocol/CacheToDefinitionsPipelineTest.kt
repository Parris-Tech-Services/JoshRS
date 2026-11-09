package au.com.parristech.joshrs.android.protocol

import au.com.parristech.joshrs.android.Jagfile377
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorOutputStream
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayOutputStream

/**
 * End-to-end: a jagfile built to the real container layout, through [Jagfile377], into
 * [ObjDefinitions377] and [NpcDefinitions377].
 *
 * Each piece is tested separately, but the pieces are only useful if they compose — the jag
 * reader hands back an entry and the definition decoders must accept exactly those bytes.
 *
 * The jag is built **uncompressed at the container level** (unpacked == packed), which is the
 * case the live `config` archive uses. In that form each entry is individually bzip2-compressed,
 * so this test exercises the entry-decompression path rather than the whole-archive one.
 */
class CacheToDefinitionsPipelineTest {

    private fun x61(name: String): Int {
        var h = 0
        for (c in name.uppercase()) h = h * 61 + c.code - 32
        return h
    }

    private fun u3(out: ByteArrayOutputStream, v: Int) {
        out.write((v ushr 16) and 0xff); out.write((v ushr 8) and 0xff); out.write(v and 0xff)
    }

    private fun bzip2(data: ByteArray): ByteArray {
        val out = ByteArrayOutputStream()
        BZip2CompressorOutputStream(out).use { it.write(data) }
        return out.toByteArray()
    }

    /** Builds a jagfile whose container is uncompressed and whose entries are bzip2. */
    private fun jag(entries: List<Pair<String, ByteArray>>): ByteArray {
        val compressed = entries.map { (name, data) -> name to (data to bzip2(data)) }
        val directorySize = 2 + compressed.size * 10
        val bodySize = compressed.sumOf { it.second.second.size }
        val total = 6 + directorySize + bodySize

        val out = ByteArrayOutputStream()
        u3(out, total - 6)   // unpacked size
        u3(out, total - 6)   // packed size — equal means "not compressed at container level"
        out.write((compressed.size ushr 8) and 0xff); out.write(compressed.size and 0xff)

        for ((name, pair) in compressed) {
            val (plain, packed) = pair
            out.write((x61(name) ushr 24) and 0xff); out.write((x61(name) ushr 16) and 0xff)
            out.write((x61(name) ushr 8) and 0xff); out.write(x61(name) and 0xff)
            u3(out, plain.size)
            u3(out, packed.size)
        }
        for ((_, pair) in compressed) out.write(pair.second)

        val bytes = out.toByteArray()
        assertEquals("container sizes must agree with the built bytes", total, bytes.size)
        return bytes
    }

    private fun objDat(): ByteArray {
        val body = ByteArrayOutputStream()
        fun u1(v: Int) = body.write(v and 0xff)
        fun u2(v: Int) { body.write((v ushr 8) and 0xff); body.write(v and 0xff) }
        fun str(s: String) { for (c in s) body.write(c.code); body.write(0x0a) }

        body.write(0); body.write(2)         // count = 2
        u1(2); str("Cannonball"); u1(11); u1(12)
        body.write(0); body.write(0); body.write(0); body.write(5) // cost 5
        u1(0)
        u1(2); str("Tool kit"); u1(0)
        return body.toByteArray()
    }

    private fun npcDat(): ByteArray {
        val body = ByteArrayOutputStream()
        fun u1(v: Int) = body.write(v and 0xff)
        fun u2(v: Int) { body.write((v ushr 8) and 0xff); body.write(v and 0xff) }
        fun str(s: String) { for (c in s) body.write(c.code); body.write(0x0a) }

        body.write(0); body.write(1)         // count = 1
        u1(2); str("Hans"); u1(12); u1(1); u1(95); u2(3); u1(0)
        return body.toByteArray()
    }

    @Test
    fun `config archive yields decodable item definitions`() {
        val archive = jag(listOf("obj.dat" to objDat()))
        val entry = Jagfile377.readFile(archive, "obj.dat")

        val defs = ObjDefinitions377.decodeAll(entry)
        assertEquals(2, defs.size)
        assertEquals("Cannonball", defs[0].name)
        assertTrue(defs[0].stackable)
        assertEquals(5, defs[0].cost)
        assertEquals("Tool kit", defs[1].name)
    }

    @Test
    fun `config archive yields decodable npc definitions`() {
        val archive = jag(listOf("npc.dat" to npcDat()))
        val entry = Jagfile377.readFile(archive, "npc.dat")

        val defs = NpcDefinitions377.decodeAll(entry)
        assertEquals(1, defs.size)
        assertEquals("Hans", defs[0].name)
        assertEquals(3, defs[0].combatLevel)
        assertEquals(1, defs[0].size)
    }

    @Test
    fun `an archive holding both definitions resolves each by name`() {
        // Mirrors the real config jag: one container, many named entries.
        val archive = jag(listOf("obj.dat" to objDat(), "npc.dat" to npcDat()))

        val items = ObjDefinitions377.decodeAll(Jagfile377.readFile(archive, "obj.dat"))
        val npcs = NpcDefinitions377.decodeAll(Jagfile377.readFile(archive, "npc.dat"))
        assertEquals(2, items.size)
        assertEquals(1, npcs.size)
        assertEquals("Hans", npcs[0].name)
    }

    @Test
    fun `a missing entry is reported rather than returning another entry's bytes`() {
        val archive = jag(listOf("obj.dat" to objDat()))
        // Jagfile377 reports a missing entry with error(...), i.e. IllegalStateException.
        val error = try {
            Jagfile377.readFile(archive, "npc.dat"); null
        } catch (e: RuntimeException) {
            e
        }
        assertTrue("absent entry must throw", error != null)
        assertTrue(
            "message should name the missing entry",
            error!!.message!!.contains("npc.dat")
        )
    }
}
