package au.com.parristech.joshrs.android.protocol

import au.com.parristech.joshrs.android.Floor377
import au.com.parristech.joshrs.android.Region377
import au.com.parristech.joshrs.android.Tile377

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The first thing in this project that produces an image. It is a top-down rasteriser, not the
 * authentic 3D one, and the tests are written to keep that distinction visible: they assert
 * geometry, colour sourcing and determinism — not that anything looks like RuneScape.
 */
class TerrainRenderer377Test {

    private fun flatRegion(height: Int = 8, underlay: Int = 0, overlay: Int = 0, floors: List<Floor377> = emptyList()): Region377 {
        val tiles = ArrayList<Tile377>(64 * 64 * 4)
        for (level in 0..3) for (x in 0 until 64) for (z in 0 until 64) {
            tiles.add(Tile377(height, overlay, 0, 0, 0, underlay))
        }
        return Region377(50, 50, 1, 2, tiles, emptyList(), floors)
    }

    @Test
    fun `frame is 64 tiles wide at the requested scale`() {
        val frame = TerrainRenderer377.render(flatRegion(), scale = 4)
        assertEquals(256, frame.width)
        assertEquals(256, frame.height)
        assertEquals(256 * 256, frame.pixels.size)
    }

    @Test
    fun `flat terrain renders a single uniform colour`() {
        val frame = TerrainRenderer377.render(flatRegion(), scale = 2)
        val first = frame.at(0, 0)
        for (x in 0 until frame.width) {
            for (z in 0 until frame.height) {
                assertEquals("pixel $x,$z should match", first, frame.at(x, z))
            }
        }
    }

    @Test
    fun `tile colour comes from the floor definition when present`() {
        val floors = listOf(Floor377(0x123456, null, false))
        val frame = TerrainRenderer377.render(flatRegion(underlay = 0, floors = floors), scale = 1)
        // slope 0 => factor 1.0 => colour unchanged, alpha added
        assertEquals(0xff123456.toInt(), frame.at(0, 0))
    }

    @Test
    fun `missing floor definition falls back to a grey height ramp`() {
        val frame = TerrainRenderer377.render(flatRegion(height = 16), scale = 1)
        val p = frame.at(0, 0)
        val r = (p shr 16) and 0xff
        val g = (p shr 8) and 0xff
        val b = p and 0xff
        assertEquals("fallback must be grey", r, g)
        assertEquals(r, b)
        assertNotEquals("fallback must not be black", 0, r)
    }

    @Test
    fun `slope changes shading - a slope is not the same colour as flat`() {
        val flat = TerrainRenderer377.render(flatRegion(height = 8), scale = 1)
        // Raise a single column so tiles to its east/west have a slope.
        val region = flatRegion(height = 8)
        val tiles = region.tiles.toMutableList()
        for (z in 0 until 64) {
            val idx = (0 * 64 + 32) * 64 + z
            tiles[idx] = tiles[idx].copy(height = 24)
        }
        val sloped = Region377(50, 50, 1, 2, tiles, emptyList())
        val rendered = TerrainRenderer377.render(sloped, scale = 1)

        // The raised column is x = 32; its neighbour to the east takes the slope.
        assertNotEquals(
            "a 16-height step must shade differently from flat ground",
            flat.at(32, 0), rendered.at(32, 0)
        )
        assertEquals(
            "a tile far from the step must be unchanged",
            flat.at(2, 0), rendered.at(2, 0)
        )
    }

    @Test
    fun `rendering is deterministic`() {
        val region = flatRegion()
        val a = TerrainRenderer377.render(region, scale = 3)
        val b = TerrainRenderer377.render(region, scale = 3)
        assertArrayEquals("same input must produce identical pixels", a.pixels, b.pixels)
    }

    @Test
    fun `scale does not change the colour, only the number of pixels`() {
        val region = flatRegion(underlay = 0, floors = listOf(Floor377(0x00ff00, null, false)))
        val one = TerrainRenderer377.render(region, scale = 1)
        val four = TerrainRenderer377.render(region, scale = 4)
        assertEquals(one.at(0, 0), four.at(0, 0))
        assertEquals(one.at(0, 0), four.at(15, 15))
    }

    @Test
    fun `invalid scale and level are rejected rather than producing garbage`() {
        val region = flatRegion()
        for (bad in listOf(0, 9, -1)) {
            var threw = false
            try {
                TerrainRenderer377.render(region, scale = bad)
            } catch (e: IllegalArgumentException) {
                threw = true
            }
            assertTrue("scale $bad must be rejected", threw)
        }
        var threw = false
        try {
            TerrainRenderer377.render(region, level = 4)
        } catch (e: IllegalArgumentException) {
            threw = true
        }
        assertTrue("level 4 must be rejected", threw)
    }
}
