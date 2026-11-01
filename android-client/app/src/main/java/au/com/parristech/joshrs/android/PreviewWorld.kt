package au.com.parristech.joshrs.android

import kotlin.math.hypot
import kotlin.math.min

/**
 * An original, disposable local preview. No networking, accounts, XP or JoshRS saves.
 * Coordinate units are tiles. Kept Android-free for deterministic JVM tests.
 */
class PreviewWorld(startX: Float = 8f, startY: Float = 8f) {
    companion object {
        const val MAX_COORD = 47f
        const val WALK_SPEED = 3f
    }

    var x: Float = startX.coerceIn(0f, MAX_COORD)
        private set
    var y: Float = startY.coerceIn(0f, MAX_COORD)
        private set

    private var goalX: Float? = null
    private var goalY: Float? = null

    fun setDestination(toX: Float, toY: Float) {
        if (!toX.isFinite() || !toY.isFinite()) return
        goalX = toX.coerceIn(0f, MAX_COORD)
        goalY = toY.coerceIn(0f, MAX_COORD)
    }

    fun stopWalking() {
        goalX = null
        goalY = null
    }

    fun advance(seconds: Float, horizontal: Float, vertical: Float) {
        if (!seconds.isFinite() || seconds <= 0f) return
        val dx = if (horizontal.isFinite()) horizontal.coerceIn(-1f, 1f) else 0f
        val dy = if (vertical.isFinite()) vertical.coerceIn(-1f, 1f) else 0f
        val magnitude = hypot(dx, dy)
        if (magnitude > 0.001f) {
            stopWalking()
            val distance = WALK_SPEED * seconds / magnitude.coerceAtLeast(1f)
            x = (x + dx * distance).coerceIn(0f, MAX_COORD)
            y = (y + dy * distance).coerceIn(0f, MAX_COORD)
            return
        }

        val tx = goalX ?: return
        val ty = goalY ?: return
        val distance = hypot(tx - x, ty - y)
        val step = WALK_SPEED * seconds
        if (distance <= step || distance < 0.001f) {
            x = tx
            y = ty
            stopWalking()
        } else {
            val portion = min(1f, step / distance)
            x += (tx - x) * portion
            y += (ty - y) * portion
        }
    }

    fun snapshot() = PreviewSnapshot(x, y, goalX, goalY)
}

data class PreviewSnapshot(
    val x: Float,
    val y: Float,
    val targetX: Float?,
    val targetY: Float?
)
