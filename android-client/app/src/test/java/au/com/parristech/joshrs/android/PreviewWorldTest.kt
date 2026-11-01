package au.com.parristech.joshrs.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import kotlin.math.sqrt

class PreviewWorldTest {
    @Test fun movesWithKeyboardInput() {
        val world = PreviewWorld()
        world.advance(1f, 1f, 0f)
        assertEquals(11f, world.x, 0.001f)
        assertEquals(8f, world.y, 0.001f)
    }

    @Test fun diagonalMovementDoesNotMoveFaster() {
        val world = PreviewWorld()
        world.advance(1f, 1f, 1f)
        assertEquals(8f + 3f / sqrt(2f), world.x, 0.001f)
        assertEquals(8f + 3f / sqrt(2f), world.y, 0.001f)
    }

    @Test fun tapDestinationStopsExactlyAtTarget() {
        val world = PreviewWorld()
        world.setDestination(9f, 9f)
        world.advance(2f, 0f, 0f)
        assertEquals(9f, world.x, 0.001f)
        assertEquals(9f, world.y, 0.001f)
        assertNull(world.snapshot().targetX)
    }

    @Test fun manualInputCancelsPreviousDestination() {
        val world = PreviewWorld()
        world.setDestination(40f, 40f)
        world.advance(0.5f, -1f, 0f)
        assertNull(world.snapshot().targetX)
        assertEquals(6.5f, world.x, 0.001f)
    }

    @Test fun cannotLeaveWorldBoundsOrSetNonFiniteTarget() {
        val world = PreviewWorld(47f, 0f)
        world.advance(5f, 1f, -1f)
        assertEquals(47f, world.x, 0.001f)
        assertEquals(0f, world.y, 0.001f)
        world.setDestination(Float.NaN, 4f)
        assertNull(world.snapshot().targetX)
        world.setDestination(800f, -50f)
        assertEquals(47f, world.snapshot().targetX!!, 0.001f)
        assertEquals(0f, world.snapshot().targetY!!, 0.001f)
    }

    @Test fun invalidTimeCannotMovePlayer() {
        val world = PreviewWorld()
        world.advance(Float.NaN, 1f, 1f)
        world.advance(-1f, 1f, 1f)
        assertEquals(8f, world.x, 0.001f)
        assertEquals(8f, world.y, 0.001f)
    }
}
