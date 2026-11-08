package au.com.parristech.joshrs.android

import java.security.MessageDigest
import java.util.zip.CRC32

/**
 * Read-only inspection of authentic revision-377 player .sav bytes.
 * Layout verified against JoshRS tools/rs377-saves/inspect-save.mjs and
 * pinned LostCity Engine-TS PlayerLoading (magic/version/trailing CRC-32).
 *
 * Not an account database, not an authentication implementation, and
 * deliberately never modifies player state or treats imports as logged-in users.
 */
object Save377 {
    const val MAX_BYTES = 4 * 1024 * 1024
    private val names = listOf(
        "Attack", "Defence", "Strength", "Hitpoints", "Ranged", "Prayer", "Magic",
        "Cooking", "Woodcutting", "Fletching", "Fishing", "Firemaking", "Crafting",
        "Smithing", "Mining", "Herblore", "Agility", "Thieving", "Slayer",
        "Farming", "Runecraft"
    )

    data class Skill(val name: String, val xp: Int, val level: Int)
    data class Summary(
        val version: Int,
        val x: Int,
        val z: Int,
        val plane: Int,
        val playtimeTicks: Int,
        val totalSkillXp: Long,
        val skills: List<Skill>,
        val byteCount: Int,
        val sha256: String,
        val crc32: Long
    )

    private fun u16(data: ByteArray, offset: Int): Int =
        ((data[offset].toInt() and 255) shl 8) or (data[offset + 1].toInt() and 255)

    private fun i32(data: ByteArray, offset: Int): Int =
        ((data[offset].toInt() and 255) shl 24) or
        ((data[offset + 1].toInt() and 255) shl 16) or
        ((data[offset + 2].toInt() and 255) shl 8) or
        (data[offset + 3].toInt() and 255)

    fun inspect(bytes: ByteArray): Summary {
        require(bytes.size in 137..MAX_BYTES) { "Invalid save length" }
        require(u16(bytes, 0) == 0x2004) { "Not a JoshRS/Lost City player save" }
        val version = u16(bytes, 2)
        require(version in 2..7) { "Unsupported player save format" }

        val crc = CRC32()
        crc.update(bytes, 0, bytes.size - 4)
        val expected =
            ((i32(bytes, bytes.size - 4)).toLong() and 0xffffffffL)
        require(crc.value == expected) { "Save is corrupt: CRC-32 mismatch" }

        val skills = names.mapIndexed { index, name ->
            val offset = 28 + index * 5
            val xp = i32(bytes, offset)
            require(xp >= 0) { "Save has invalid negative skill XP" }
            Skill(name, xp, bytes[offset + 4].toInt() and 255)
        }
        val sha = MessageDigest.getInstance("SHA-256").digest(bytes)
            .joinToString("") { "%02x".format(it.toInt() and 255) }
        return Summary(
            version = version,
            x = u16(bytes, 4),
            z = u16(bytes, 6),
            plane = bytes[8].toInt() and 255,
            playtimeTicks = i32(bytes, 24),
            totalSkillXp = skills.sumOf { it.xp.toLong() },
            skills = skills,
            byteCount = bytes.size,
            sha256 = sha,
            crc32 = crc.value
        )
    }
}
