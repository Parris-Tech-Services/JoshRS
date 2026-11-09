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

    data class Receipt(val readableArchives: Int, val cacheId: String, val indexNumber: Int, val indices: List<Int>)

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
        require(sources.size in 2..4) {
            "Select main_file_cache.dat and one or more of idx0, idx1, idx4"
        }
        val named = sources.associateBy { filename(context, it) }
        require(named.size == sources.size && named.containsKey("main_file_cache.dat")) {
            "Duplicate or missing main_file_cache.dat file"
        }
        val selected = named.keys.filter { it != "main_file_cache.dat" }.sorted()
        val recognised = mapOf(
            "main_file_cache.idx0" to 0,
            "main_file_cache.idx1" to 1,
            "main_file_cache.idx4" to 4
        )
        require(selected.isNotEmpty() && selected.all { it in recognised }) {
            "Only private legacy idx0, idx1 and idx4 archives are supported"
        }
        val indexNumber = recognised.getValue(selected.first())
        val dat = bytes(context, named.getValue("main_file_cache.dat"), MAX_DAT)
        val indexBytes = selected.associateWith { bytes(context, named.getValue(it), MAX_IDX) }
        // Validate sector chains in each selected store without modifying any cache file.
        var readable = 0
        for (name in selected) {
            val idx = indexBytes.getValue(name)
            val store = LegacyStore377(dat, idx, recognised.getValue(name))
            for (id in 0 until minOf(1024, idx.size / 6)) {
                val group = store.read(id)
                if (group != null) {
                    require(group.isNotEmpty()) { "Empty legacy cache archive" }
                    readable++
                }
            }
        }
        require(readable > 0) { "No readable 377 cache sectors found" }
        val sha = MessageDigest.getInstance("SHA-256")
        sha.update(dat)
        for (name in selected) {
            sha.update(name.toByteArray(Charsets.US_ASCII))
            sha.update(indexBytes.getValue(name))
        }
        val identifier = sha.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
        val root = File(context.filesDir, "cache377")
        check(root.isDirectory || root.mkdirs()) { "Cannot create private cache directory" }
        val dest = File(root, identifier)
        if (!dest.exists()) {
            val staging = File(root, "import-$identifier.tmp")
            check(staging.mkdir()) { "Cache staging directory exists" }
            try {
                for ((name, payload) in (listOf("main_file_cache.dat" to dat) +
                    selected.map { it to indexBytes.getValue(it) })) {
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
        return Receipt(readable, identifier.take(12), indexNumber,
            selected.map { recognised.getValue(it) })
    }
}
