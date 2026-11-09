package au.com.parristech.joshrs.android

import org.junit.Assert.*
import org.junit.Test

/** Deterministic full gameplay checks; no phones, servers, or proprietary caches. */
class OfflineLumbridgeQuestTest {
    private fun travel(w: OfflineLumbridgeQuest, place: String) {
        assertTrue("Must find route to " + place, w.walkTo(place).success)
        var steps = 0
        while (w.moving() && steps < 1000) {
            w.advance(.25f)
            assertTrue("Every walked tile is passable", w.walkable(w.x, w.z))
            steps++
        }
        assertFalse("Must arrive instead of warping", w.moving())
        assertTrue("Landmark must be reachable", w.nearby().any { it.id == place })
    }

    @Test fun completeCookFromFreshOfflineStateWithActualIngredientsAndMill() {
        val w = OfflineLumbridgeQuest.fresh()
        assertEquals(0, w.stage)
        assertEquals(0, w.questPoints)
        assertFalse(w.interact("cook").success) // Not near Cook yet.
        travel(w, "cook")
        assertTrue(w.interact("cook").success)
        assertEquals(1, w.stage)
        assertFalse(w.interact("cook").success) // Missing ingredients.
        travel(w, "supplies")
        assertTrue(w.interact("supplies").success)
        assertTrue(w.has("Pot"))
        assertTrue(w.has("Bucket"))
        assertFalse(w.interact("supplies").success) // No duplicate equipment.

        travel(w, "egg")
        assertTrue(w.interact("egg").success)
        assertFalse(w.interact("egg").success)
        assertTrue(w.has("Egg"))

        travel(w, "cow")
        assertTrue(w.interact("cow").success)
        assertFalse(w.has("Bucket"))
        assertTrue(w.has("Bucket of milk"))

        travel(w, "wheat")
        assertTrue(w.interact("wheat").success)
        assertTrue(w.has("Grain"))
        travel(w, "mill")
        assertTrue(w.interact("mill").success) // Grain into hopper.
        assertFalse(w.has("Grain"))
        assertEquals(1, w.hopperStep)
        assertTrue(w.interact("mill").success) // Operate.
        assertEquals(2, w.hopperStep)
        assertTrue(w.interact("mill").success) // Pot of flour.
        assertTrue(w.has("Pot of flour"))
        assertFalse(w.has("Pot"))
        assertEquals(3, w.hopperStep)

        travel(w, "cook")
        assertTrue(w.interact("cook").success)
        assertEquals(2, w.stage)
        assertEquals(300, w.cookingXp)
        assertEquals(1, w.questPoints)
        assertFalse(w.has("Egg"))
        assertFalse(w.has("Bucket of milk"))
        assertFalse(w.has("Pot of flour"))
        assertTrue(w.interact("cook").success)
        assertEquals("Reward must not repeat", 300, w.cookingXp)
        assertEquals(1, w.questPoints)
        assertTrue(w.walkedTiles > 200)
    }

    @Test fun persistsCompletedQuestAndRejectsCorruptOrTamperedSaves() {
        val w = OfflineLumbridgeQuest.fresh()
        travel(w, "cook")
        assertTrue(w.interact("cook").success)
        val stored = w.save()
        val restored = OfflineLumbridgeQuest.restore(stored)
        assertEquals(1, restored.stage)
        assertEquals(w.x, restored.x)
        assertEquals(w.z, restored.z)
        assertEquals(w.walkedTiles, restored.walkedTiles)
        assertEquals(stored, restored.save())
        assertEquals(0, OfflineLumbridgeQuest.restore(stored.replace("|1|0|0|", "|2|0|0|")).stage)
        assertEquals(0, OfflineLumbridgeQuest.restore("not a game save").stage)
        assertEquals(0, OfflineLumbridgeQuest.restore("x".repeat(2000)).stage)
    }

    @Test fun milkingAndFlourRequireOrdinaryItemsAndSteps() {
        val w = OfflineLumbridgeQuest.fresh()
        travel(w, "cow")
        assertFalse(w.interact("cow").success)
        travel(w, "wheat")
        assertFalse(w.interact("wheat").success)
        travel(w, "mill")
        assertFalse(w.interact("mill").success)
        assertEquals(0, w.questPoints)
        assertEquals(0, w.cookingXp)
    }

    @Test fun walkingIsBoundedAndCrossesRiverOnlyOnBridge() {
        val w = OfflineLumbridgeQuest.fresh()
        assertFalse(w.walkTo(9999, 9999).success)
        assertFalse(w.walkTo(3240, 3270).success)
        assertTrue(w.walkTo("cow").success)
        var crossing = false
        for (i in 0..500) {
            if (!w.moving()) break
            w.advance(.08f)
            if (w.x in 3239..3241) {
                crossing = true
                assertTrue(w.z in 3248..3253 || w.z in 3287..3291)
            }
        }
        assertTrue(crossing)
        assertEquals(3253, w.x)
        assertEquals(3270, w.z)
        assertFalse(w.moving())
    }

    @Test fun invalidMovementAndRemoteAccountSavesHaveNoEffect() {
        val w = OfflineLumbridgeQuest.fresh()
        val before = w.save()
        w.advance(Float.NaN)
        w.advance(-1f)
        assertEquals(before, w.save())
        assertEquals(0, w.inventory().size)
        assertFalse(w.interact("fake npc").success)
    }
}
