package au.com.parristech.joshrs.android.protocol

/**
 * RS2-style byte buffer matching `LostCityRS/Engine-TS` `src/io/Packet.ts`
 * (MIT License, Copyright (c) 2023-2026 Lost City) for the accessors a
 * revision-377 client actually needs.
 *
 * Big-endian for `p2`/`p4`, little-endian for `p2le`, signed accessors return
 * the same bit pattern reinterpreted; strings are NUL/LF terminated and read
 * as ISO-8859-1, as the original client does.
 */
class PacketBuffer(val data: ByteArray) {

    var pos: Int = 0

    val remaining: Int get() = data.size - pos

    fun g1(): Int = data[pos++].toInt() and 0xff

    fun g1s(): Int = data[pos++].toInt()

    fun g2(): Int {
        val v = ((data[pos].toInt() and 0xff) shl 8) or (data[pos + 1].toInt() and 0xff)
        pos += 2
        return v
    }

    fun g2s(): Int {
        val v = ((data[pos].toInt() and 0xff) shl 8) or (data[pos + 1].toInt() and 0xff)
        pos += 2
        return if (v > 0x7fff) v - 0x10000 else v
    }

    fun g3(): Int {
        val v = ((data[pos].toInt() and 0xff) shl 16) or
            ((data[pos + 1].toInt() and 0xff) shl 8) or
            (data[pos + 2].toInt() and 0xff)
        pos += 3
        return v
    }

    fun g4(): Int {
        val v = ((data[pos].toInt() and 0xff) shl 24) or
            ((data[pos + 1].toInt() and 0xff) shl 16) or
            ((data[pos + 2].toInt() and 0xff) shl 8) or
            (data[pos + 3].toInt() and 0xff)
        pos += 4
        return v
    }

    fun g8(): Long {
        var hi = 0L
        var lo = 0L
        for (i in 0 until 8) {
            val b = (data[pos++].toInt() and 0xff).toLong()
            if (i < 4) hi = (hi shl 8) or b else lo = (lo shl 8) or b
        }
        return (hi shl 32) or lo
    }

    /** NUL- or [terminator]-terminated string. */
    fun gjstr(terminator: Int = 10): String {
        val start = pos
        while (pos < data.size && (data[pos].toInt() and 0xff) != terminator) {
            pos++
        }
        val s = String(data, start, pos - start, Charsets.ISO_8859_1)
        pos++ // consume terminator
        return s
    }

    fun gdata(dest: ByteArray, offset: Int, length: Int) {
        System.arraycopy(data, pos, dest, offset, length)
        pos += length
    }

    fun gdata(length: Int): ByteArray {
        val out = ByteArray(length)
        gdata(out, 0, length)
        return out
    }

    fun p1(value: Int): PacketBuffer {
        data[pos++] = value.toByte()
        return this
    }

    fun p2(value: Int): PacketBuffer {
        data[pos++] = (value ushr 8).toByte()
        data[pos++] = value.toByte()
        return this
    }

    fun p3(value: Int): PacketBuffer {
        data[pos++] = (value ushr 16).toByte()
        data[pos++] = (value ushr 8).toByte()
        data[pos++] = value.toByte()
        return this
    }

    fun p4(value: Int): PacketBuffer {
        data[pos++] = (value ushr 24).toByte()
        data[pos++] = (value ushr 16).toByte()
        data[pos++] = (value ushr 8).toByte()
        data[pos++] = value.toByte()
        return this
    }

    fun p8(value: Long): PacketBuffer {
        data[pos++] = (value ushr 56).toByte()
        data[pos++] = (value ushr 48).toByte()
        data[pos++] = (value ushr 40).toByte()
        data[pos++] = (value ushr 32).toByte()
        data[pos++] = (value ushr 24).toByte()
        data[pos++] = (value ushr 16).toByte()
        data[pos++] = (value ushr 8).toByte()
        data[pos++] = value.toByte()
        return this
    }

    /** NUL-terminated string, as used for player names in the login block. */
    fun pjstr(value: String): PacketBuffer {
        for (ch in value) {
            if (ch.code > 0xff) throw IllegalArgumentException("pjstr is single-byte only: $ch")
            data[pos++] = ch.code.toByte()
        }
        data[pos++] = 0
        return this
    }

    fun pdata(src: ByteArray, offset: Int, length: Int): PacketBuffer {
        System.arraycopy(src, offset, data, pos, length)
        pos += length
        return this
    }

    /**
     * Writes a 1-byte payload length into the slot reserved immediately *before*
     * the payload. Matches `Packet.psize1`: `pos - size - 1`.
     */
    fun psize1(size: Int) {
        data[pos - size - 1] = size.toByte()
    }

    /**
     * Writes a 2-byte payload length into the slot reserved immediately *before*
     * the payload. Matches `Packet.psize2`: `pos - size - 2`.
     */
    fun psize2(size: Int) {
        data[pos - size - 2] = (size ushr 8).toByte()
        data[pos - size - 1] = size.toByte()
    }

    companion object {
        /** Standard reflected CRC-32 (poly 0xEDB88320), as used for the 9 cache CRCs. */
        private val CRC_TABLE = IntArray(256).also { table ->
            for (i in 0 until 256) {
                var c = i
                repeat(8) {
                    c = if (c and 1 != 0) (c ushr 1) xor 0xEDB88320.toInt() else c ushr 1
                }
                table[i] = c
            }
        }

        /**
         * Matches `Packet.getcrc(src, offset, length)` from the engine, including its
         * convention that [length] is the exclusive end index rather than a count.
         */
        fun crc32(src: ByteArray, offset: Int = 0, length: Int = src.size): Int {
            var crc = -1
            for (i in offset until length) {
                crc = (crc ushr 8) xor CRC_TABLE[(crc xor src[i].toInt()) and 0xff]
            }
            return crc.inv()
        }
    }
}
