package au.com.parristech.joshrs.android

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.util.Log
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.min

/** Original Android-only test world, with a dedicated render thread and no game network. */
class GameSurfaceView(context: Context, private val world: PreviewWorld) :
    SurfaceView(context), SurfaceHolder.Callback {

    private enum class Direction { UP, DOWN, LEFT, RIGHT }

    private val stateLock = Any()
    private val lifecycleLock = Any()
    private val keyboard = mutableSetOf<Direction>()
    private var touchDirection: Direction? = null
    private var touchPointerId = -1
    private var renderThread: Thread? = null
    @Volatile private var running = false
    @Volatile private var foreground = true

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val density = resources.displayMetrics.density

    init {
        holder.addCallback(this)
        isFocusable = true
        isFocusableInTouchMode = true
        contentDescription = "JoshRS offline preview. Tap the world to walk or use the directional pad."
        keepScreenOn = true
    }

    override fun surfaceCreated(holder: SurfaceHolder) = startRenderer()
    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) = Unit
    override fun surfaceDestroyed(holder: SurfaceHolder) = stopRenderer()

    fun pauseRendering() {
        foreground = false
        stopRenderer()
    }

    fun resumeRendering() {
        foreground = true
        if (holder.surface.isValid) startRenderer()
    }

    override fun onDetachedFromWindow() {
        stopRenderer()
        super.onDetachedFromWindow()
    }

    fun playerSnapshot(): PreviewSnapshot = synchronized(stateLock) { world.snapshot() }

    private fun startRenderer() {
        synchronized(lifecycleLock) {
            if (!foreground || running) return
            running = true
            renderThread = Thread({ renderLoop() }, "JoshRS-Android-Preview").also { it.start() }
        }
    }

    private fun stopRenderer() {
        val oldThread: Thread?
        synchronized(lifecycleLock) {
            running = false
            oldThread = renderThread
            renderThread = null
        }
        if (oldThread != null && oldThread !== Thread.currentThread()) {
            try {
                oldThread.join(1500)
            } catch (e: InterruptedException) {
                Thread.currentThread().interrupt()
            }
        }
        synchronized(stateLock) {
            keyboard.clear()
            touchDirection = null
            touchPointerId = -1
        }
    }

    private fun renderLoop() {
        var previous = System.nanoTime()
        while (running) {
            val now = System.nanoTime()
            val elapsed = ((now - previous) / 1_000_000_000f).coerceIn(0f, 0.05f)
            previous = now

            val snapshot = synchronized(stateLock) {
                val controls = keyboard.toMutableSet()
                touchDirection?.let { controls.add(it) }
                val horizontal = (if (Direction.RIGHT in controls) 1 else 0) -
                    (if (Direction.LEFT in controls) 1 else 0)
                val vertical = (if (Direction.DOWN in controls) 1 else 0) -
                    (if (Direction.UP in controls) 1 else 0)
                world.advance(elapsed, horizontal.toFloat(), vertical.toFloat())
                world.snapshot()
            }

            var canvas: Canvas? = null
            try {
                canvas = holder.lockCanvas()
                if (canvas != null) render(canvas, snapshot)
            } catch (e: Exception) {
                Log.e("JoshRS-Android", "Preview rendering failed", e)
                running = false
            } finally {
                if (canvas != null) holder.unlockCanvasAndPost(canvas)
            }

            try {
                Thread.sleep(32)
            } catch (e: InterruptedException) {
                Thread.currentThread().interrupt()
                return
            }
        }
    }

    private fun render(canvas: Canvas, player: PreviewSnapshot) {
        val w = canvas.width.toFloat()
        val h = canvas.height.toFloat()
        canvas.drawColor(Color.rgb(14, 34, 33))
        val tile = min(w / 12f, h / 10f).coerceIn(23f, 58f)
        val originX = w / 2 - player.x * tile
        val originY = h / 2 - player.y * tile

        val xStart = floor(-originX / tile).toInt().coerceIn(0, 47)
        val xEnd = ceil((w - originX) / tile).toInt().coerceIn(0, 47)
        val yStart = floor(-originY / tile).toInt().coerceIn(0, 47)
        val yEnd = ceil((h - originY) / tile).toInt().coerceIn(0, 47)
        for (x in xStart..xEnd) {
            for (y in yStart..yEnd) {
                paint.color = if ((x + y) % 2 == 0) Color.rgb(53, 99, 76)
                              else Color.rgb(58, 106, 80)
                paint.style = Paint.Style.FILL
                canvas.drawRect(
                    originX + x * tile, originY + y * tile,
                    originX + (x + 1) * tile, originY + (y + 1) * tile, paint
                )
                if ((x * 13 + y * 17) % 19 == 0) {
                    paint.color = Color.rgb(76, 128, 92)
                    canvas.drawCircle(
                        originX + (x + 0.35f) * tile,
                        originY + (y + 0.7f) * tile, tile * 0.08f, paint
                    )
                }
            }
        }

        listOf(4f to 5f, 12f to 9f, 14f to 14f, 7f to 17f, 18f to 4f).forEach { (x, y) ->
            val px = originX + x * tile
            val py = originY + y * tile
            if (px in -tile..(w + tile) && py in -tile..(h + tile)) {
                paint.color = Color.rgb(104, 68, 42)
                canvas.drawRect(px - tile * .08f, py, px + tile * .08f, py + tile * .38f, paint)
                paint.color = Color.rgb(27, 75, 47)
                canvas.drawCircle(px, py - tile * .15f, tile * .32f, paint)
            }
        }

        if (player.targetX != null && player.targetY != null) {
            paint.color = Color.rgb(255, 218, 118)
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 2.5f * density
            canvas.drawCircle(
                originX + player.targetX * tile, originY + player.targetY * tile,
                tile * .32f, paint
            )
            paint.style = Paint.Style.FILL
        }

        // The preview character is original geometry, not a game asset.
        paint.color = Color.rgb(12, 29, 36)
        canvas.drawCircle(w / 2, h / 2 + tile * .19f, tile * .29f, paint)
        paint.color = Color.rgb(237, 194, 121)
        canvas.drawCircle(w / 2, h / 2, tile * .22f, paint)
        paint.color = Color.rgb(64, 117, 192)
        canvas.drawRect(
            w / 2 - tile * .19f, h / 2 + tile * .16f,
            w / 2 + tile * .19f, h / 2 + tile * .48f, paint
        )

        paint.typeface = android.graphics.Typeface.DEFAULT_BOLD
        paint.textSize = 13f * density
        paint.color = Color.WHITE
        canvas.drawText("LOCAL PREVIEW  •  NO SERVER CONNECTION", 12f * density, 22f * density, paint)
        paint.textSize = 12f * density
        canvas.drawText("Tile: %.1f, %.1f".format(player.x, player.y),
            12f * density, 42f * density, paint)
        drawPad(canvas, w, h)
    }

    private fun padCentre(direction: Direction, height: Float): Pair<Float, Float> {
        val cx = 78f * density
        val cy = height - 83f * density
        val offset = 42f * density
        return when (direction) {
            Direction.UP -> cx to (cy - offset)
            Direction.DOWN -> cx to (cy + offset)
            Direction.LEFT -> (cx - offset) to cy
            Direction.RIGHT -> (cx + offset) to cy
        }
    }

    private fun drawPad(canvas: Canvas, width: Float, height: Float) {
        for (direction in Direction.entries) {
            val (x, y) = padCentre(direction, height)
            val selected = synchronized(stateLock) {
                direction in keyboard || direction == touchDirection
            }
            paint.color = if (selected) Color.rgb(216, 174, 87) else Color.rgb(24, 49, 50)
            canvas.drawRoundRect(
                x - 18 * density, y - 18 * density,
                x + 18 * density, y + 18 * density, 8 * density, 8 * density, paint
            )
            paint.color = Color.WHITE
            paint.textSize = 20f * density
            paint.textAlign = Paint.Align.CENTER
            val glyph = when (direction) {
                Direction.UP -> "↑"
                Direction.DOWN -> "↓"
                Direction.LEFT -> "←"
                Direction.RIGHT -> "→"
            }
            canvas.drawText(glyph, x, y + 7f * density, paint)
        }
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 12f * density
        paint.color = Color.WHITE
        canvas.drawText("TAP TO WALK", width - 112f * density,
            height - 20f * density, paint)
    }

    private fun padHit(x: Float, y: Float): Direction? {
        return Direction.entries.firstOrNull { dir ->
            val (cx, cy) = padCentre(dir, height.toFloat())
            val dx = x - cx
            val dy = y - cy
            dx * dx + dy * dy <= 24f * 24f * density * density
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
                val index = event.actionIndex
                val x = event.getX(index)
                val y = event.getY(index)
                val direction = padHit(x, y)
                synchronized(stateLock) {
                    if (direction != null && touchPointerId == -1) {
                        touchPointerId = event.getPointerId(index)
                        touchDirection = direction
                    } else if (direction == null) {
                        val tile = min(width / 12f, height / 10f).coerceIn(23f, 58f)
                        world.setDestination(
                            world.x + (x - width / 2f) / tile,
                            world.y + (y - height / 2f) / tile
                        )
                    }
                }
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP, MotionEvent.ACTION_CANCEL -> {
                synchronized(stateLock) {
                    if (event.actionMasked == MotionEvent.ACTION_CANCEL ||
                        event.getPointerId(event.actionIndex) == touchPointerId) {
                        touchDirection = null
                        touchPointerId = -1
                    }
                }
                if (event.actionMasked == MotionEvent.ACTION_UP) performClick()
                return true
            }
        }
        return true
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }

    fun handleKey(event: KeyEvent): Boolean {
        val direction = when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_W -> Direction.UP
            KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.KEYCODE_S -> Direction.DOWN
            KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_A -> Direction.LEFT
            KeyEvent.KEYCODE_DPAD_RIGHT, KeyEvent.KEYCODE_D -> Direction.RIGHT
            else -> return false
        }
        synchronized(stateLock) {
            when (event.action) {
                KeyEvent.ACTION_DOWN -> keyboard.add(direction)
                KeyEvent.ACTION_UP -> keyboard.remove(direction)
                else -> return false
            }
        }
        return true
    }
}
