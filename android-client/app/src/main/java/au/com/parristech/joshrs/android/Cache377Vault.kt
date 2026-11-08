package au.com.parristech.joshrs.android

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest

/**
 * Opt-in local cache inspection and import. Never downloads or redistributes
 * Jagex-owned game caches; requires the user to select their own legacy files.
 * Only the real .dat/.idx0 pair is currently supported, not map/model decoding.
 */
object Cache377Vault {
    private const val MAX_DAT = 64 * 1024 * 1024
    private const val MAX_IDX = 1024 * 1024

    data class Receipt(val readableArchives: Int, val cacheId: String, val indexNumber: Int)

    private fun filename(context: Context, uri: Uri): String {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME),
            null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) return cursor.getString(0)
        }
        throw IllegalArgumentException("Selected file has no visible name")
    }

    private fun bytes(context: Context, uri: Uri, limit: Int): ByteArray {
        val out = ByteArrayOutputStream()
        val block = ByteArray(8192)
        context.contentResolver.openInputStream(uri)?.use { stream ->
            while (true) {
                val count = stream.read(block)
                if (count < 0) break
                if (count == 0) continue
                require(out.size().toLong() + count <= limit.toLong()) {
                    "Cache file exceeds safety limit"
                }
                out.write(block, 0, count)
            }
        } ?: error("Cannot open selected cache file")
        return out.toByteArray()
    }

    fun importPair(context: Context, sources: List<Uri>): Receipt {
        require(sources.size == 2) { "Select main_file_cache.dat and either idx0 or idx1 together" }
        val named = sources.associateBy { filename(context, it) }
        val indexName = when {
            named.containsKey("main_file_cache.idx0") -> "main_file_cache.idx0"
            named.containsKey("main_file_cache.idx1") -> "main_file_cache.idx1"
            else -> throw IllegalArgumentException("Select .dat plus .idx0 or .idx1")
        }
        require(named.size == 2 && named.containsKey("main_file_cache.dat")) {
            "Expected exact legacy .dat and index file pair"
        }
        val indexNumber = if (indexName.endsWith("idx1")) 1 else 0
        val dat = bytes(context, named.getValue("main_file_cache.dat"), MAX_DAT)
        val idx = bytes(context, named.getValue(indexName), MAX_IDX)
        val store = LegacyStore377(dat, idx, indexNumber)
        // Verify actual sector structure from the user's private cache before storing.
        var readable = 0
        for (id in 0..minOf(128, idx.size / 6 - 1)) {
            val group = store.read(id)
            if (group != null) {
                require(group.isNotEmpty()) { "Empty cache archive" }
                readable++
            }
        }
        require(readable > 0) { "No readable 377 legacy archives found" }
        val sha = MessageDigest.getInstance("SHA-256")
        sha.update(dat)
        sha.update(idx)
        val identifier = sha.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
        val root = File(context.filesDir, "cache377")
        check(root.isDirectory || root.mkdirs()) { "Cannot create private cache directory" }
        val dest = File(root, identifier)
        if (!dest.exists()) {
            val staging = File(root, "import-$identifier.tmp")
            check(staging.mkdir()) { "Cache staging directory exists" }
            try {
                for ((name, payload) in listOf("main_file_cache.dat" to dat, indexName to idx)) {
                    FileOutputStream(File(staging, name)).use { output ->
                        output.write(payload)
                        output.fd.sync()
                    }
                }
                check(staging.renameTo(dest)) { "Cannot complete cache import" }
            } finally {
                if (staging.exists()) staging.deleteRecursively()
            }
        }
        return Receipt(readable, identifier.take(12), indexNumber)
    }
}
