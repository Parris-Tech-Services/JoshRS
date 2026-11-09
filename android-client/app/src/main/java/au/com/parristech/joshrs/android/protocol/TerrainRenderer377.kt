package au.com.parristech.joshrs.android.protocol

import au.com.parristech.joshrs.android.Floor377
import au.com.parristech.joshrs.android.Region377
import au.com.parristech.joshrs.android.Tile377

/**
 * Top-down terrain rasteriser: turns a decoded [Region377] into ARGB pixels.
 *
 * This is deliberately the simplest honest renderer — **not** the authentic 3D one. It proves
 * that decoded terrain reaches a frame buffer with sane geometry, colour and shading, which is
 * the first thing in this project that produces an image at all.
 *
 * Rules:
 *  - base colour comes from the tile's underlay/overlay floor RGB when the cache supplies it,
 *    otherwise a height ramp, so a missing `flo.dat` degrades visibly rather than lying;
 *  - shading is a north-west light: a slope rising towards -x/-z is brightened, falling darkened;
 *  - output is deterministic — no timestamps, no randomness — so a test can hash it.
 *
 * Deliberately absent: textures, lighting models, models, entities. Those need the real
 * rasteriser and are not attempted here.
 */
object TerrainRenderer377 {

    const val TILES = 64

    data class Frame(val width: Int, val height: Int, val pixels: IntArray) {
        fun at(x: Int, z: Int): Int = pixels[z * width + x]
    }

    /**
     * Renders one plane.
     *
     * @param scale pixels per tile, 1–8.
     */
    fun render(region: Region377, level: Int = 0, scale: Int = 4): Frame {
        require(level in 0..3) { "level must be 0..3" }
        require(scale in 1..8) { "scale must be 1..8" }
        val size = TILES * scale
        val pixels = IntArray(size * size)

        val floors = region.floors
        for (x in 0 until TILES) {
            for (z in 0 until TILES) {
                val tile = region.tile(level, x, z)
                val colour = tileColour(tile, floors)
                val shaded = shade(colour, slope(region, level, x, z))
                fill(pixels, size, x, z, scale, shaded)
            }
        }
        return Frame(size, size, pixels)
    }

    /** Height difference between this tile and its northern/western neighbours. */
    fun slope(region: Region377, level: Int, x: Int, z: Int): Int {
        val here = region.tile(level, x, z).height
        var delta = 0
        if (x > 0) delta += here - region.tile(level, x - 1, z).height
        if (z > 0) delta += here - region.tile(level, x, z - 1).height
        return delta
    }

    fun tileColour(tile: Tile377, floors: List<Floor377>): Int {
        val floorId = if (tile.overlayId > 0) tile.overlayId else tile.underlayId
        val rgb = floors.getOrNull(floorId)?.rgb
        if (rgb != null && rgb in 1..0xFFFFFF) return rgb
        // No floor definition: a labelled height ramp, so a missing flo.dat is visible as
        // obviously synthetic rather than passing for real terrain.
        val ramp = 0x30 + (tile.height and 0x3f)
        return (ramp shl 16) or (ramp shl 8) or ramp
    }

    /** North-west light: positive slope (rising towards -x/-z) is brighter. */
    fun shade(rgb: Int, slope: Int): Int {
        val factor = 1.0 + (slope.coerceIn(-8, 8) * 0.03)
        fun channel(shift: Int): Int {
            val v = ((rgb shr shift) and 0xff) * factor
            return v.toInt().coerceIn(0, 255)
        }
        return (0xff shl 24) or (channel(16) shl 16) or (channel(8) shl 8) or channel(0)
    }

    private fun fill(pixels: IntArray, size: Int, tileX: Int, tileZ: Int, scale: Int, argb: Int) {
        val x0 = tileX * scale
        val z0 = tileZ * scale
        for (dz in 0 until scale) {
            val row = (z0 + dz) * size
            for (dx in 0 until scale) pixels[row + x0 + dx] = argb
        }
    }
}
