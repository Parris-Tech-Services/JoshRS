package au.com.parristech.joshrs.android.protocol

/**
 * ISAAC CSPRNG used to obfuscate every game-frame opcode in either direction.
 *
 * Kotlin transliteration of `LostCityRS/Engine-TS` `src/io/Isaac.ts`
 * (MIT License, Copyright (c) 2023-2026 Lost City), which is itself the
 * algorithm used by the original revision-377 client.
 *
 * Semantics that must match the server exactly:
 *  - all arithmetic is 32-bit two's-complement and wraps (JS `Int32Array`);
 *  - `<<` is [shl] and `>>>` is [ushr];
 *  - [nextInt] decrements *after* the zero test, exactly like `count--` in JS.
 */
class IsaacCipher(seed: IntArray = intArrayOf(0, 0, 0, 0)) {

    private var count: Int = 0
    private val rsl = IntArray(256)
    private val mem = IntArray(256)
    private var a: Int = 0
    private var b: Int = 0
    private var c: Int = 0

    init {
        for (i in seed.indices) {
            rsl[i] = seed[i]
        }
        initState()
    }

    private fun initState() {
        val golden = 0x9e3779b9.toInt()
        var a = golden
        var b = golden
        var c = golden
        var d = golden
        var e = golden
        var f = golden
        var g = golden
        var h = golden

        repeat(4) {
            a = a xor (b shl 11); d += a; b += c
            b = b xor (c ushr 2); e += b; c += d
            c = c xor (d shl 8); f += c; d += e
            d = d xor (e ushr 16); g += d; e += f
            e = e xor (f shl 10); h += e; f += g
            f = f xor (g ushr 4); a += f; g += h
            g = g xor (h shl 8); b += g; h += a
            h = h xor (a ushr 9); c += h; a += b
        }

        var i = 0
        while (i < 256) {
            a += rsl[i]; b += rsl[i + 1]; c += rsl[i + 2]; d += rsl[i + 3]
            e += rsl[i + 4]; f += rsl[i + 5]; g += rsl[i + 6]; h += rsl[i + 7]

            a = a xor (b shl 11); d += a; b += c
            b = b xor (c ushr 2); e += b; c += d
            c = c xor (d shl 8); f += c; d += e
            d = d xor (e ushr 16); g += d; e += f
            e = e xor (f shl 10); h += e; f += g
            f = f xor (g ushr 4); a += f; g += h
            g = g xor (h shl 8); b += g; h += a
            h = h xor (a ushr 9); c += h; a += b

            mem[i] = a; mem[i + 1] = b; mem[i + 2] = c; mem[i + 3] = d
            mem[i + 4] = e; mem[i + 5] = f; mem[i + 6] = g; mem[i + 7] = h
            i += 8
        }

        i = 0
        while (i < 256) {
            a += mem[i]; b += mem[i + 1]; c += mem[i + 2]; d += mem[i + 3]
            e += mem[i + 4]; f += mem[i + 5]; g += mem[i + 6]; h += mem[i + 7]

            a = a xor (b shl 11); d += a; b += c
            b = b xor (c ushr 2); e += b; c += d
            c = c xor (d shl 8); f += c; d += e
            d = d xor (e ushr 16); g += d; e += f
            e = e xor (f shl 10); h += e; f += g
            f = f xor (g ushr 4); a += f; g += h
            g = g xor (h shl 8); b += g; h += a
            h = h xor (a ushr 9); c += h; a += b

            mem[i] = a; mem[i + 1] = b; mem[i + 2] = c; mem[i + 3] = d
            mem[i + 4] = e; mem[i + 5] = f; mem[i + 6] = g; mem[i + 7] = h
            i += 8
        }

        isaac()
        count = 256
    }

    private fun isaac() {
        c++
        b += c

        for (i in 0 until 256) {
            val x = mem[i]
            a = when (i and 3) {
                0 -> a xor (a shl 13)
                1 -> a xor (a ushr 6)
                2 -> a xor (a shl 2)
                else -> a xor (a ushr 16)
            }
            a += mem[(i + 128) and 0xff]

            val y = mem[(x ushr 2) and 0xff] + a + b
            mem[i] = y
            b = mem[(y ushr 10) and 0xff] + x
            rsl[i] = b
        }
    }

    /**
     * Snapshot of the full generator state.
     *
     * Used to *peek* an opcode without consuming output: if the rest of the frame
     * has not arrived yet, the real stream must be left untouched or the session
     * desynchronises from the server.
     */
    private constructor(src: IsaacCipher) : this() {
        count = src.count
        src.rsl.copyInto(rsl)
        src.mem.copyInto(mem)
        a = src.a
        b = src.b
        c = src.c
    }

    fun copy(): IsaacCipher = IsaacCipher(this)

    /** Next 32-bit output. Matches the server's `nextInt()` call order exactly. */
    fun nextInt(): Int {
        if (count-- == 0) {
            isaac()
            count = 255
        }
        return rsl[count]
    }
}
