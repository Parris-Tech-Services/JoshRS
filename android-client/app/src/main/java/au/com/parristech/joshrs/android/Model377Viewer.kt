package au.com.parristech.joshrs.android

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.view.MotionEvent
import android.view.View
import java.io.File
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin

/** Read-only model chosen from user-imported local 377 idx1 cache, not a Jagex asset bundle. */
object PrivateModel377 {
    data class Loaded(val fileId: Int, val geometry: Geometry377)

    fun loadFirst(filesDir: File): Loaded {
        val root = File(filesDir, "cache377")
        val folder = root.listFiles()?.firstOrNull {
            it.isDirectory &&
                File(it, "main_file_cache.dat").isFile &&
                File(it, "main_file_cache.idx1").isFile
        } ?: throw IllegalArgumentException(
            "Import your own main_file_cache.dat and main_file_cache.idx1 first"
        )
        val index = File(folder, "main_file_cache.idx1").readBytes()
        val data = File(folder, "main_file_cache.dat").readBytes()
        val store = LegacyStore377(data, index, 1)
        // Bounded diagnostic search; malformed archive must not crash the UI.
        for (id in 0 until minOf(1024, index.size / 6)) {
            val raw = try { store.read(id) } catch (_: IllegalArgumentException) { null }
            if (raw == null) continue
            val mesh = try { Model377Codec.decodeCached(raw) }
                catch (_: Exception) { null }
            if (mesh != null && mesh.triangles.isNotEmpty()) return Loaded(id, mesh)
        }
        throw IllegalArgumentException(
            "No decodable old-format 377 model found in the first 1024 archive slots"
        )
    }
}

/**
 * Original perspective 3D geometry inspector. Projects real decoded private
 * vertices and renders untextured triangle faces with a rotating camera.
 * This is explicitly NOT the complete 377 terrain/animation/render pipeline.
 */
class Model377Viewer(context: Context, val loaded: PrivateModel377.Loaded) : View(context) {
    private val brush = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private var yaw = 0.65f
    private var pitch = 0.3f
    private var scale = 1f
    private var lastX = 0f
    private var lastY = 0f

    private val mesh = loaded.geometry
    private val cx = (mesh.vertices.minOf { it.x } + mesh.vertices.maxOf { it.x }) / 2f
    private val cy = (mesh.vertices.minOf { it.y } + mesh.vertices.maxOf { it.y }) / 2f
    private val cz = (mesh.vertices.minOf { it.z } + mesh.vertices.maxOf { it.z }) / 2f
    private val extent = max(32f, max(
        (mesh.vertices.maxOf { it.x } - mesh.vertices.minOf { it.x }).toFloat(),
        max(
            (mesh.vertices.maxOf { it.y } - mesh.vertices.minOf { it.y }).toFloat(),
            (mesh.vertices.maxOf { it.z } - mesh.vertices.minOf { it.z }).toFloat()
        )
    ))

    private data class Projected(val x: Float, val y: Float, val depth: Float)
    private data class DrawFace(val face: Triangle377, val depth: Float)

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawColor(Color.rgb(35, 41, 44))
        if (width == 0 || height == 0) return
        val sy = sin(yaw)
        val cyaw = cos(yaw)
        val sp = sin(pitch)
        val cp = cos(pitch)
        val distance = extent * 3.8f
        val focal = minOf(width, height) * 1.85f * scale
        val projected = mesh.vertices.map { vertex ->
            val vx = vertex.x - cx
            val vy = -(vertex.y - cy)
            val vz = vertex.z - cz
            val rx = vx * cyaw + vz * sy
            val rz = vz * cyaw - vx * sy
            val ry = vy * cp - rz * sp
            val depth = vy * sp + rz * cp
            val perspective = focal / (distance - depth).coerceAtLeast(extent * 0.6f)
            Projected(width / 2f + rx * perspective,
                height * 0.46f - ry * perspective, depth)
        }
        val faces = mesh.triangles.take(4000).map { face ->
            DrawFace(face, (projected[face.a].depth +
                projected[face.b].depth + projected[face.c].depth) / 3f)
        }.sortedBy { it.depth }
        brush.style = Paint.Style.FILL
        for (entry in faces) {
            val face = entry.face
            val p1 = projected[face.a]
            val p2 = projected[face.b]
            val p3 = projected[face.c]
            path.reset()
            path.moveTo(p1.x, p1.y)
            path.lineTo(p2.x, p2.y)
            path.lineTo(p3.x, p3.y)
            path.close()
            brush.color = packedHslToRgb(face.packedHsl)
            canvas.drawPath(path, brush)
            brush.color = Color.argb(90, 20, 22, 20)
            brush.strokeWidth = 0.4f
            brush.style = Paint.Style.STROKE
            canvas.drawPath(path, brush)
            brush.style = Paint.Style.FILL
        }
        brush.color = Color.WHITE
        brush.textSize = 29f
        canvas.drawText("REAL 377 MESH #${loaded.fileId}", 18f, 38f, brush)
        brush.textSize = 20f
        canvas.drawText(
            "${mesh.vertices.size} vertices, ${mesh.triangles.size} triangles",
            18f, 68f, brush
        )
        canvas.drawText("Drag to rotate. Untextured model inspector; no game world.", 18f,
            (height - 28f).coerceAtLeast(88f), brush)
    }

    // Approximates the original HSL palette, without importing source art.
    private fun packedHslToRgb(hsl: Int): Int {
        val h = ((hsl ushr 10) and 63) / 64f
        val s = ((hsl ushr 7) and 7) / 8f
        val l = (hsl and 127) / 128f
        if (s <= 0.001f) {
            val v = (l * 255f).toInt().coerceIn(0, 255)
            return Color.rgb(v, v, v)
        }
        val q = if (l < 0.5f) l * (1f + s) else l + s - l * s
        val p = 2f * l - q
        fun component(t: Float): Int {
            var v = t
            if (v < 0f) v += 1f
            if (v > 1f) v -= 1f
            val value = when {
                v < 1f / 6f -> p + (q - p) * 6f * v
                v < 0.5f -> q
                v < 2f / 3f -> p + (q - p) * (2f / 3f - v) * 6f
                else -> p
            }
            return (value * 255f).toInt().coerceIn(0, 255)
        }
        return Color.rgb(component(h + 1f / 3f), component(h), component(h - 1f / 3f))
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                lastX = event.x
                lastY = event.y
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                yaw += (event.x - lastX) / 175f
                pitch = (pitch + (event.y - lastY) / 250f).coerceIn(-1.2f, 1.2f)
                lastX = event.x
                lastY = event.y
                invalidate()
                return true
            }
            MotionEvent.ACTION_UP -> {
                performClick()
                return true
            }
        }
        return true
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }
}
