package au.com.parristech.joshrs.android

import org.junit.Assert.*
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPOutputStream
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorOutputStream

/** Synthetic fixtures built in-memory; NO proprietary cache or map asset. */
class Map377CodecTest {
    private fun ByteArrayOutputStream.put2(v: Int) {
        write((v ushr 8) and 255)
        write(v and 255)
    }
    private fun ByteArrayOutputStream.put3(v: Int) {
        write((v ushr 16) and 255)
        write((v ushr 8) and 255)
        write(v and 255)
    }
    private fun ByteArrayOutputStream.put4(v: Int) {
        put2(v ushr 16)
        put2(v)
    }
    private fun ByteArrayOutputStream.putSmart(v: Int) {
        require(v in 0..32767)
        if (v < 128) write(v) else put2(v + 32768)
    }
    private fun gz(payload: ByteArray): ByteArray {
        val output = ByteArrayOutputStream()
        GZIPOutputStream(output).use { it.write(payload) }
        return output.toByteArray()
    }
    private fun bz(payload: ByteArray): ByteArray {
        val output = ByteArrayOutputStream()
        BZip2CompressorOutputStream(output, 1).use { it.write(payload) }
        // The original 377 JAG format omits BZh1, exactly 4 bytes.
        return output.toByteArray().copyOfRange(4, output.size())
    }
    private fun land(): ByteArray {
        val output = ByteArrayOutputStream()
        for (i in 0 until 4 * 64 * 64) {
            if (i == 0) {
                output.write(2)    // overlay shape 0, rotation 0
                output.write(255)  // overlay id -1 (signed)
                output.write(50)   // flag 1
            }
            output.write(82)       // underlay 1
            output.write(1)        // explicit height
            output.write(2)        // -16 per level
        }
        return output.toByteArray()
    }
    private fun locs(): ByteArray {
        val output = ByteArrayOutputStream()
        output.putSmart(11) // object id 10 (-1 + 11)
        output.putSmart(((33 shl 6) or 18) + 1) // 3233,3218
        output.write((10 shl 2) or 2) // type 10, rotation 2
        output.putSmart(0) // end positions
        output.putSmart(0) // end ids
        return output.toByteArray()
    }
    private fun mapIndex(): ByteArray {
        val output = ByteArrayOutputStream()
        output.put2((50 shl 8) or 50)
        output.put2(12)
        output.put2(13)
        output.write(1)
        return output.toByteArray()
    }
    private fun versionlist(global: Boolean = false): ByteArray {
        val index = mapIndex()
        val nameHash = "MAP_INDEX".fold(0) { h, char -> h * 61 + char.code - 32 }
        val body = ByteArrayOutputStream()
        body.put2(1) // one archive entry
        body.put4(nameHash)
        body.put3(index.size)
        val packed = if (global) index else bz(index)
        body.put3(packed.size)
        body.write(packed)
        val uncompressed = body.toByteArray()
        val stored = if (global) bz(uncompressed) else uncompressed
        val master = ByteArrayOutputStream()
        master.put3(uncompressed.size)
        master.put3(stored.size)
        master.write(stored)
        return master.toByteArray()
    }

    @Test fun rev377MapIndexSelectsActualRegionAndRejectsOthers() {
        assertEquals(MapFile377(12, 13), MapIndex377.region(mapIndex(), 50, 50))
        assertThrows(IllegalStateException::class.java) {
            MapIndex377.region(mapIndex(), 50, 51)
        }
        assertThrows(IllegalArgumentException::class.java) {
            MapIndex377.region(byteArrayOf(0, 1, 2), 50, 50)
        }
    }

    @Test fun versionlistJagfileUsesOriginalMapIndexNameHashWithBzip2() {
        assertArrayEquals(mapIndex(), Jagfile377.readFile(versionlist(), "map_index"))
        assertArrayEquals(mapIndex(), Jagfile377.readFile(versionlist(true), "map_index"))
        assertThrows(IllegalStateException::class.java) {
            Jagfile377.readFile(versionlist(), "missing")
        }
    }

    @Test fun original377TerrainDecodesAllPlanesWithoutInventingFlatHeights() {
        val terrain = Map377Codec.terrain(land(), 50, 50)
        assertEquals(4 * 64 * 64, terrain.size)
        assertEquals(-16, terrain[0].height)
        assertEquals(-32, terrain[64 * 64].height)
        assertEquals(-64, terrain[3 * 64 * 64].height)
        assertEquals(-1, terrain[0].overlayId)
        assertEquals(1, terrain[0].underlayId)
        assertEquals(1, terrain[0].flag)
        assertEquals(0, terrain[0].rotation)
        assertThrows(IllegalArgumentException::class.java) {
            Map377Codec.terrain(land().copyOfRange(0, land().size - 1), 50, 50)
        }
    }

    @Test fun original377LocDeltasLocateOneRealObjectWithoutMakingUpGeometry() {
        val locations = Map377Codec.locations(locs(), 50, 50)
        assertEquals(1, locations.size)
        assertEquals(LocPlacement377(10, 3233, 3218, 0, 10, 2), locations.single())
        assertThrows(IllegalArgumentException::class.java) {
            Map377Codec.locations(locs().copyOfRange(0, locs().size - 2), 50, 50)
        }
    }

    @Test fun lumbridgeEndToEndUsesPrivateIndexedLandAndLocations() {
        val region = Map377Codec.lumbridge(versionlist(), gz(land()), gz(locs()))
        assertEquals(50, region.x)
        assertEquals(50, region.z)
        assertEquals(12, region.landFile)
        assertEquals(13, region.locFile)
        assertEquals(-16, region.tile(0, 33, 18).height)
        assertEquals(3233, region.locs.single().x)
        assertEquals(3218, region.locs.single().z)
        assertEquals(0, region.locs.single().level)
        assertThrows(IllegalArgumentException::class.java) {
            Map377Codec.lumbridge(versionlist(), byteArrayOf(1, 2, 3), gz(locs()))
        }
    }
}
