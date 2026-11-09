package au.com.parristech.joshrs.android

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.view.MotionEvent
import android.view.View
import java.io.File
import kotlin.math.hypot
import kotlin.math.min

/** A read-only loader for the REAL private 377 cache region 50,50. */
object PrivateLumbridge377 {
    fun loadFirst(filesDir: File): Region377 {
        val folder = File(filesDir, "cache377").listFiles()?.firstOrNull {
            it.isDirectory && it.name.matches(Regex("[a-f0-9]{64}")) &&
                File(it, "main_file_cache.dat").isFile &&
                File(it, "main_file_cache.idx0").isFile &&
                File(it, "main_file_cache.idx4").isFile
        } ?: throw IllegalArgumentException(
            "Import YOUR main_file_cache.dat, idx0 and idx4 together. " +
                "JoshRS does not distribute game assets."
        )
        val bytes = File(folder, "main_file_cache.dat").readBytes()
        val idx0 = File(folder, "main_file_cache.idx0").readBytes()
        val idx4 = File(folder, "main_file_cache.idx4").readBytes()
        val versionlist = LegacyStore377(bytes, idx0, 0).read(5)
            ?: error("Versionlist (#5) missing from idx0. A real 377 client must cache it.")
        val mapIndex = Jagfile377.readFile(versionlist, "map_index")
        val target = MapIndex377.region(mapIndex, 50, 50)
        val maps = LegacyStore377(bytes, idx4, 4)
        val land = maps.read(target.landId)
            ?: error("Lumbridge land #${target.landId} not present in user's idx4")
        val locs = maps.read(target.locId)
            ?: error("Lumbridge locs #${target.locId} not present in user's idx4")
        return Map377Codec.lumbridge(versionlist, land, locs)
    }
}

/** Render genuine decoded tile heights + loc coordinates, but not textures or models. */
class Lumbridge377Viewer(context: Context, private val region: Region377) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private var zoom = 1f
    private var panX = 0f
    private var panY = 0f
    private var downX = 0f
    private var downY = 0f
    private var pinchDistance = 0f
    private val baseline = region.tile(0, 32, 32).height

    /** Diagnostic tile-ID palette; NOT original terrain textures or material colours. */
    private fun colour(tile: Tile377): Int {
        val overlay = tile.overlayId != 0
        val id = if (overlay) tile.overlayId and 255 else tile.underlayId
        if (id == 0) return Color.rgb(66, 73, 65)
        val s = (id * 29 + 35) % 70
        return if (overlay) Color.rgb(56 + s / 3, 89 + s / 2, 118 + s)
        else Color.rgb(65 + s / 2, 94 + s, 58 + s / 3)
    }

    private fun project(x: Float, z: Float, height: Int, step: Float): Pair<Float, Float> =
        Pair(width / 2f + panX + (x - z) * step,
            height() * .49f + panY + (x + z - 63) * step * .46f -
                (height - baseline) * step * .015f)

    private fun height() = height.toFloat()

    private fun quad(canvas: Canvas, tile: Tile377, x: Int, z: Int, step: Float) {
        val east = region.tile(0, minOf(x + 1, 63), z)
        val north = region.tile(0, x, minOf(z + 1, 63))
        val corner = region.tile(0, minOf(x + 1, 63), minOf(z + 1, 63))
        val pts = arrayOf(
            project(x.toFloat(), z.toFloat(), tile.height, step),
            project(x + 1f, z.toFloat(), east.height, step),
            project(x + 1f, z + 1f, corner.height, step),
            project(x.toFloat(), z + 1f, north.height, step)
        )
        path.reset()
        path.moveTo(pts[0].first, pts[0].second)
        for (i in 1..3) path.lineTo(pts[i].first, pts[i].second)
        path.close()
        paint.style = Paint.Style.FILL
        paint.color = colour(tile)
        canvas.drawPath(path, paint)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawColor(Color.rgb(27, 33, 37))
        if (width <= 0 || height <= 0) return
        val step = min(width / 135f, height / 85f) * zoom
        for (sum in 0..126) for (x in maxOf(0, sum - 63)..minOf(63, sum)) {
            val z = sum - x
            quad(canvas, region.tile(0, x, z), x, z, step)
        }
        // Real positions from the private region loc stream; dots are NOT
        // model geometry and do not imply usable in-game interactions.
        paint.style = Paint.Style.FILL
        for (loc in region.locs) {
            if (loc.level != 0) continue
            val x = loc.x - region.x * 64
            val z = loc.z - region.z * 64
            val pos = project(x + .5f, z + .5f, region.tile(0, x, z).height, step)
            if (pos.first !in -8f..(width + 8f) || pos.second !in -8f..(height + 8f)) continue
            paint.color = if (loc.type <= 3) Color.rgb(228, 180, 110) else Color.rgb(190, 211, 178)
            canvas.drawCircle(pos.first, pos.second, (step * .23f).coerceIn(1f, 3f), paint)
        }
        // World coordinate for orientation only. This is NOT the real player.
        val marker = project(33.5f, 18.5f, region.tile(0, 33, 18).height, step)
        paint.color = Color.rgb(251, 102, 70)
        canvas.drawCircle(marker.first, marker.second, 6f, paint)
        paint.color = Color.WHITE
        paint.textSize = 30f
        canvas.drawText("REAL 377 LUMBRIDGE · 50,50", 16f, 43f, paint)
        paint.textSize = 19f
        canvas.drawText("64x64 tiles · ${region.locs.size} actual scene locs", 16f, 69f, paint)
        canvas.drawText("Land #${region.landFile} · Loc #${region.locFile} · No game login", 16f, 92f, paint)
        paint.color = Color.rgb(241, 218, 182)
        canvas.drawText("Pan: drag · Zoom: pinch · Colours are approximate", 16f, height - 46f, paint)
        canvas.drawText("Orange marker 3233,3218 is NOT a player", 16f, height - 20f, paint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> { downX = event.x; downY = event.y; return true }
            MotionEvent.ACTION_POINTER_DOWN -> {
                if (event.pointerCount >= 2) pinchDistance = hypot(
                    event.getX(1) - event.getX(0), event.getY(1) - event.getY(0))
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                if (event.pointerCount >= 2) {
                    val next = hypot(event.getX(1) - event.getX(0), event.getY(1) - event.getY(0))
                    if (pinchDistance > 1f) zoom = (zoom * next / pinchDistance).coerceIn(.45f, 5f)
                    pinchDistance = next
                } else {
                    panX += event.x - downX
                    panY += event.y - downY
                    downX = event.x
                    downY = event.y
                }
                invalidate()
                return true
            }
            MotionEvent.ACTION_POINTER_UP -> { pinchDistance = 0f; return true }
            MotionEvent.ACTION_UP -> { performClick(); return true }
        }
        return true
    }

    override fun performClick(): Boolean { super.performClick(); return true }
}
