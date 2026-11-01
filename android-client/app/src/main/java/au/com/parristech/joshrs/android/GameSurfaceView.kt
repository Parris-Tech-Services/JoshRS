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
    private val classicRenderer = ClassicPreviewRenderer()
    private var selectedTab = 0

    init {
        holder.addCallback(this)
        isFocusable = true
        isFocusableInTouchMode = true
        contentDescription = "JoshRS classic visual prototype. Tap the isometric world to walk, use the directional pad, or select preview tabs."
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
        classicRenderer.render(canvas, player, synchronized(stateLock) { selectedTab })
    }

    private fun padHit(x: Float, y: Float): Direction? {
        val index = classicRenderer.padDirection(x, y, width, height) ?: return null
        return Direction.entries.getOrNull(index)
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
                        val tab = classicRenderer.tabAt(x, y, width, height)
                        if (tab != null) {
                            selectedTab = tab
                        } else {
                            val destination = classicRenderer.worldAt(
                                x, y, world.snapshot(), width, height
                            )
                            if (destination != null) {
                                world.setDestination(destination.first, destination.second)
                            }
                        }
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
