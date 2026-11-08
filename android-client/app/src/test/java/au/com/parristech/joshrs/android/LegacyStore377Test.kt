package au.com.parristech.joshrs.android

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class LegacyStore377Test {
    private fun put16(b: ByteArray, p: Int, n: Int) {
        b[p] = (n ushr 8).toByte()
        b[p + 1] = n.toByte()
    }

    private fun put24(b: ByteArray, p: Int, n: Int) {
        b[p] = (n ushr 16).toByte()
        b[p + 1] = (n ushr 8).toByte()
        b[p + 2] = n.toByte()
    }

    private fun fixture(): Pair<ByteArray, ByteArray> {
        val dat = ByteArray(3 * 520)
        val idx = ByteArray(43 * 6)
        val file = 42
        val total = 600
        put24(idx, file * 6, total)
        put24(idx, file * 6 + 3, 1)
        // Sector one: 512 bytes, followed by sector two with 88 bytes.
        put16(dat, 520, file)
        put16(dat, 522, 0)
        put24(dat, 524, 2)
        dat[527] = 1
        repeat(512) { dat[528 + it] = (it % 251).toByte() }
        put16(dat, 1040, file)
        put16(dat, 1042, 1)
        put24(dat, 1044, 0)
        dat[1047] = 1
        repeat(88) { dat[1048 + it] = ((it + 512) % 251).toByte() }
        return dat to idx
    }

    @Test fun readsTwoAuthenticSectorFrames() {
        val (dat, idx) = fixture()
        val bytes = LegacyStore377(dat, idx, 0).read(42)
        val expected = ByteArray(600) { (it % 251).toByte() }
        assertArrayEquals(expected, bytes)
    }

    @Test fun missingFileReturnsNull() {
        val (dat, idx) = fixture()
        assertNull(LegacyStore377(dat, idx, 0).read(41))
        assertNull(LegacyStore377(dat, idx, 0).read(-1))
    }

    @Test fun rejectsWrongIndexOrChunkRatherThanReturningMadeUpWorldData() {
        val (dat, idx) = fixture()
        assertThrows(IllegalArgumentException::class.java) {
            LegacyStore377(dat, idx, 1).read(42)
        }
        dat[1043] = 2
        assertThrows(IllegalArgumentException::class.java) {
            LegacyStore377(dat, idx, 0).read(42)
        }
    }

    @Test fun refusesLoopingSectorChain() {
        val (dat, idx) = fixture()
        put24(dat, 524, 1)
        assertThrows(IllegalArgumentException::class.java) {
            LegacyStore377(dat, idx, 0).read(42)
        }
    }

    @Test fun refusesTruncatedChainDeclaredByMaximumRepresentableLength() {
        val (dat, idx) = fixture()
        put24(idx, 42 * 6, 0xFFFFFF) // u24 cannot represent 0x1000000
        assertThrows(IllegalArgumentException::class.java) {
            LegacyStore377(dat, idx, 0).read(42)
        }
    }
}
