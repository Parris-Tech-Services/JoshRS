package au.com.parristech.joshrs.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Reference vectors were produced by running the pinned server's own
 * `src/io/Isaac.ts` (LostCityRS/Engine-TS @ 377-wip) under Node:
 *
 * ```
 * npx tsx isaacvec.ts
 * [0,0,0,0] => 405143795,806046349,...
 * ```
 *
 * A byte-for-byte match proves the Kotlin cipher advances identically to the
 * server's, which is what keeps opcode obfuscation in sync.
 */
class IsaacCipherTest {

    private fun first(cipher: IsaacCipher, n: Int): List<Int> =
        (0 until n).map { cipher.nextInt() }

    @Test
    fun `zero seed matches the pinned engine`() {
        val expected = listOf(
            405143795, 806046349, 807101986, -1333080799, 695195257, -1722677527,
            -1275090763, 264870948, 1594302383, 1378164207, -1991294526, -867394821,
            -1765589132, 880588573, -921727043, -1504119430
        )
        assertEquals(expected, first(IsaacCipher(intArrayOf(0, 0, 0, 0)), 16))
    }

    @Test
    fun `seed 1 2 3 4 matches the pinned engine`() {
        val expected = listOf(
            -621246914, 1957022519, -1345000077, -2021884860, -1882702437, 1616913581,
            -8779862, 1337573575, -729985528, -363589572, 180676801, -60666282,
            -1171063756, 804531392, 1687941800, -1114097088
        )
        assertEquals(expected, first(IsaacCipher(intArrayOf(1, 2, 3, 4)), 16))
    }

    @Test
    fun `negative seed matches the pinned engine`() {
        val expected = listOf(
            146197991, 650922333, 595844178, -179318329, -8452810, 146470846,
            -219472820, 2074033652, 280021877, -1029479909, -1742596979, 1438663079,
            -1874349064, -983239766, 2097599555, 1705561181
        )
        assertEquals(expected, first(IsaacCipher(intArrayOf(-1, 0, 0, 0)), 16))
    }

    @Test
    fun `crosses a 256 value refill boundary deterministically`() {
        // Consuming past 256 outputs forces isaac() again; the sequence must stay
        // identical for an identically seeded generator.
        val first = first(IsaacCipher(intArrayOf(7, 7, 7, 7)), 600)
        val replay = first(IsaacCipher(intArrayOf(7, 7, 7, 7)), 600)
        assertEquals(600, first.size)
        assertEquals(first, replay)
        // The post-refill values must not simply repeat the first block.
        assertEquals(false, first.take(256) == first.drop(256).take(256))
    }

    @Test
    fun `copy does not disturb the source stream`() {
        val source = IsaacCipher(intArrayOf(3, 1, 4, 1))
        val clone = source.copy()

        // A peeked opcode must not consume output from the real stream.
        repeat(10) { clone.nextInt() }

        val expected = first(IsaacCipher(intArrayOf(3, 1, 4, 1)), 5)
        assertEquals(expected, first(source, 5))
    }
}
