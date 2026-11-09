package au.com.parristech.joshrs.android

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

/**
 * Native JoshRS 377 phone diagnostics, verified offline save vault, and optional
 * clearly-labelled original visual preview. This is not a fake login/game client:
 * the legacy 377 renderer and authenticated game packets are not implemented.
 */
class MainActivity : Activity() {
    companion object { private const val PICK_SAVE = 377; private const val PICK_CACHE = 378 }

    private var game: GameSurfaceView? = null
    private var showingPreview = false
    private lateinit var root: LinearLayout
    private var statusText: TextView? = null

    private fun label(message: String, size: Float = 16f): TextView = TextView(this).apply {
        text = message
        textSize = size
        setTextColor(Color.rgb(241, 229, 204))
        setPadding(20, 10, 20, 14)
    }

    private fun action(text: String, click: () -> Unit) {
        val button = Button(this).apply {
            this.text = text
            setOnClickListener { click() }
            setAllCaps(false)
        }
        root.addView(button, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ))
    }

    /**
     * Android 15/16 draw behind the status and navigation bars by default.
     * Apply platform insets to EVERY screen, including the SurfaceView preview.
     */
    private fun setSafeContent(content: View) {
        val frame = FrameLayout(this).apply {
            contentDescription = "JoshRS safe content container"
            setBackgroundColor(Color.rgb(49, 45, 39))
            addView(content, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))
            setOnApplyWindowInsetsListener { view, insets ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    val bars = insets.getInsets(
                        WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout()
                    )
                    view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                } else {
                    @Suppress("DEPRECATION")
                    view.setPadding(
                        insets.systemWindowInsetLeft, insets.systemWindowInsetTop,
                        insets.systemWindowInsetRight, insets.systemWindowInsetBottom
                    )
                }
                insets
            }
        }
        setContentView(frame)
        frame.requestApplyInsets()
    }

    private fun showDiagnostic(message: String, title: String = "JoshRS result") {
        statusText?.text = message
        if (!isFinishing && !isDestroyed) {
            AlertDialog.Builder(this)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show()
        }
    }

    private fun chooseCacheFiles() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }
        startActivityForResult(intent, PICK_CACHE)
    }

    private fun hasLumbridgeCache(): Boolean =
        File(filesDir, "cache377").listFiles()?.any { folder ->
            folder.isDirectory && folder.name.matches(Regex("[a-f0-9]{64}")) &&
                listOf("main_file_cache.dat", "main_file_cache.idx0",
                    "main_file_cache.idx4").all { File(folder, it).isFile }
        } == true

    private fun explainCacheImport() {
        AlertDialog.Builder(this)
            .setTitle("Real Lumbridge needs your private 377 cache")
            .setMessage(
                "On your own JoshRS computer, locate main_file_cache.dat, " +
                    "main_file_cache.idx0 and main_file_cache.idx4. Copy all three " +
                    "to your phone without changing the originals, then select " +
                    "all three files together here. Nothing is downloaded or " +
                    "copied from a server automatically. This is still a " +
                    "read-only terrain viewer, not a playable game."
            )
            .setPositiveButton("Select cache files") { _, _ -> chooseCacheFiles() }
            .setNegativeButton("Not now", null)
            .show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(49, 45, 39)
        window.navigationBarColor = Color.rgb(49, 45, 39)
        showHome()
        if (savedInstanceState?.getBoolean("preview377", false) == true) {
            showPreview(
                savedInstanceState.getFloat("previewX", 8f),
                savedInstanceState.getFloat("previewY", 8f)
            )
        }
    }

    private fun showHome() {
        game?.pauseRendering()
        game = null
        showingPreview = false
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(18, 22, 18, 18)
            setBackgroundColor(Color.rgb(49, 45, 39))
        }
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            addView(root)
        }
        setSafeContent(scroll)
        root.addView(label("JoshRS 377 — Android", 24f))
        root.addView(label(
            "Native development tools for the real revision-377 game. " +
                "A playable 377 Kotlin renderer, login and game session are NOT implemented."
        ))
        root.addView(label("Local engine status", 19f))
        statusText = label(
            "No server checked. The phone-local Termux engine uses TCP 52402 and web 8888."
        ).also { root.addView(it) }
        // Authentic cache-backed Lumbridge is the PRIMARY view, not the mock preview.
        root.addView(label("REAL RuneScape 377 Lumbridge — private map cache", 19f))
        action(
            if (hasLumbridgeCache()) "Explore real Lumbridge (region 50,50)"
            else "Explore real Lumbridge — import cache first"
        ) { openLumbridge() }
        root.addView(label(
            "This reads actual 377 terrain and placed object positions from your own " +
                "main_file_cache.dat, idx0 and idx4. Import those three together below. " +
                "Read-only map viewer: no animated NPCs, real 3D buildings or online avatar yet."
        ))
        action("Check actual phone-local server") {
            val target = statusText
            target?.text = "Checking 127.0.0.1 only..."
            Thread {
                val result = Loopback377.check()
                runOnUiThread {
                    if (statusText === target) {
                        showDiagnostic(
                            "Game TCP: ${if (result.gameTcpReachable) "reachable" else "not reachable"}\n" +
                                "Web TCP: ${if (result.webTcpReachable) "reachable" else "not reachable"}\n" +
                                "These check this PHONE's 127.0.0.1, not JParrisDesktop. " +
                                "Port access does not prove a game login.",
                            "Phone-local server"
                        )
                    }
                }
            }.start()
        }
        action("Test real 377 login negotiation (no password)") {
            val target = statusText
            target?.text = "Negotiating revision-377 protocol on 127.0.0.1..."
            Thread {
                val result = Negotiation377.probe()
                runOnUiThread {
                    if (statusText === target) {
                        showDiagnostic(
                            result.message + "\nNo player account or world state has been loaded.",
                            "Phone-local 377 handshake"
                        )
                    }
                }
            }.start()
        }
        root.addView(label("Private LAN / Windows host (diagnostic only)", 19f))
        root.addView(label(
            "To test JParrisDesktop, enter its CURRENT private IPv4 address on the same " +
                "home network or approved tailnet. The server must already be listening " +
                "on that address. No passwords, player saves or login packets are sent."
        ))
        val lanAddress = EditText(this).apply {
            hint = "e.g. 192.168.1.20"
            setSingleLine(true)
            inputType = InputType.TYPE_CLASS_PHONE
            setTextColor(Color.WHITE)
            setHintTextColor(Color.LTGRAY)
            setText("127.0.0.1")
            contentDescription = "Private IPv4 address of JoshRS revision-377 server"
        }
        root.addView(lanAddress)
        action("Test private LAN revision-377 negotiation") {
            val host = lanAddress.text.toString()
            val target = statusText
            target?.text = "Checking private address (credential-free handshake only)..."
            Thread {
                val result = Negotiation377.probe(host = host)
                runOnUiThread {
                    if (statusText === target) {
                        showDiagnostic(
                            result.message +
                                "\nThis is NOT account login or a playable 377 session. " +
                                "No world or character state was changed.",
                            "Private LAN 377 handshake"
                        )
                    }
                }
            }.start()
        }
        root.addView(label("Offline 377 character backup", 19f))
        root.addView(label(
            "Import a copy of a native .sav file into Android private storage. " +
                "Checks its 0x2004 header, version, CRC-32 and 21 skill values. " +
                "Does not overwrite a server character or alter the original file."
        ))
        action("Inspect and safely import a .sav copy") {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "*/*"
            }
            startActivityForResult(intent, PICK_SAVE)
        }
        val count = File(filesDir, "saves377").listFiles { f -> f.isFile && f.name.endsWith(".sav") }?.size ?: 0
        root.addView(label("Validated private save copies: $count"))
        root.addView(label("Private historical cache inspector", 19f))
        root.addView(label(
            "Select your own main_file_cache.dat plus idx0, idx1 or idx4. " +
                "To inspect real Lumbridge, select dat + idx0 + idx4 TOGETHER. " +
                "No copyrighted game data is bundled or downloaded."
        ))
        action("Import private .dat with idx0 / idx1 / idx4") { chooseCacheFiles() }
        val cacheCount = File(filesDir, "cache377").listFiles {
            f -> f.isDirectory && !f.name.endsWith(".tmp")
        }?.size ?: 0
        root.addView(label("Private cache snapshots: $cacheCount"))
        action("View a real 377 model from private idx1 cache") {
            statusText?.text = "Decoding your own real 377 model (read-only)..."
            Thread {
                try {
                    val loaded = PrivateModel377.loadFirst(filesDir)
                    runOnUiThread { showRealModel(loaded) }
                } catch (error: Exception) {
                    runOnUiThread {
                        showDiagnostic(
                            "Model loading blocked: ${error.message ?: "unsupported archive"}",
                            "Real 377 model unavailable"
                        )
                    }
                }
            }.start()
        }

        root.addView(label("Optional fictional drawing demo — NOT the actual map", 19f))
        action("Open fictional offline art preview") { showPreview() }
        root.addView(label(
            "Next integration milestone: compatible licensed 377 renderer/cache and " +
                "authenticated session against the local engine. No public network ports."
        ))
    }

    private fun openLumbridge() {
        if (!hasLumbridgeCache()) {
            explainCacheImport()
            return
        }
        val target = statusText
        target?.text = "Reading authentic 377 Lumbridge from your private cache..."
        Thread {
            try {
                val decoded = PrivateLumbridge377.loadFirst(filesDir)
                runOnUiThread { if (!isFinishing) showLumbridge(decoded) }
            } catch (error: Exception) {
                runOnUiThread {
                    if (!isFinishing) {
                        // Errors must be visible even when invoked from the full-screen mock.
                        showHome()
                        showDiagnostic(
                            "REAL Lumbridge unavailable: " +
                                (error.message ?: "No valid 377 map cache") +
                                "\nCheck your idx0/idx4 pair and try importing all three files again. " +
                                "No substitute landscape will be shown.",
                            "Lumbridge cache could not be loaded"
                        )
                    }
                }
            }
        }.start()
    }

    private fun showLumbridge(region: Region377) {
        game?.pauseRendering()
        game = null
        showingPreview = true // Back returns to diagnostics; no online world state.
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(49, 45, 39))
        }
        root.addView(label("REAL 377 LUMBRIDGE — terrain and locs, not game play", 15f))
        root.addView(Lumbridge377Viewer(this, region), LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ))
        setSafeContent(root)
    }

    private fun showRealModel(model: PrivateModel377.Loaded) {
        game?.pauseRendering()
        game = null
        showingPreview = true // Back button returns to diagnostics
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(49, 45, 39))
        }
        root.addView(label("PRIVATE CACHE GEOMETRY — not a playable 377 world", 15f))
        root.addView(Model377Viewer(this, model), LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ))
        setSafeContent(root)
    }

    private fun showPreview(x: Float = 8f, y: Float = 8f) {
        showingPreview = true
        val world = PreviewWorld(x, y)
        val surface = GameSurfaceView(this, world)
        game = surface
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(49, 45, 39))
        }
        root.addView(label("FICTIONAL OFFLINE DRAWING — NOT RuneScape Lumbridge", 13f))
        action("Switch to REAL 377 Lumbridge map") { openLumbridge() }
        root.addView(surface, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ))
        setSafeContent(root)
        surface.requestFocus()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == PICK_CACHE && resultCode == RESULT_OK) {
            val uris = buildList {
                val clips = data?.clipData
                if (clips != null) {
                    for (i in 0 until clips.itemCount) add(clips.getItemAt(i).uri)
                } else {
                    data?.data?.let { add(it) }
                }
            }
            try {
                val receipt = Cache377Vault.importPair(this, uris)
                showHome()
                showDiagnostic(
                    "Real legacy cache structure verified: " +
                        "${receipt.readableArchives} archives (indices ${receipt.indices}) read. " +
                        "Private snapshot ${receipt.cacheId}; no assets redistributed.",
                    "Private cache imported"
                )
            } catch (e: Exception) {
                showHome()
                showDiagnostic("Cache import refused: ${e.message ?: "invalid cache"}", "Cache import failed")
            }
            return
        }
        if (requestCode != PICK_SAVE || resultCode != RESULT_OK) return
        val uri = data?.data ?: return
        try {
            val bytes = ByteArrayOutputStream()
            val chunk = ByteArray(8192)
            contentResolver.openInputStream(uri)?.use { input ->
                while (true) {
                    val n = input.read(chunk)
                    if (n == -1) break
                    bytes.write(chunk, 0, n)
                    require(bytes.size() <= Save377.MAX_BYTES) { "File exceeds 4 MiB safety limit" }
                }
            } ?: error("Cannot open selected file")
            val validBytes = bytes.toByteArray()
            val inspected = Save377.inspect(validBytes)
            val vault = File(filesDir, "saves377")
            check(vault.isDirectory || vault.mkdirs()) { "Cannot create private save vault" }
            val dest = File(vault, inspected.sha256 + ".sav")
            if (!dest.exists()) {
                val tmp = File.createTempFile("import-", ".tmp", vault)
                try {
                    FileOutputStream(tmp).use { out ->
                        out.write(validBytes)
                        out.fd.sync()
                    }
                    check(tmp.renameTo(dest)) { "Cannot finalise save copy" }
                } finally {
                    if (tmp.exists()) tmp.delete()
                }
            }
            showHome()
            val summary = "Verified original save v${inspected.version}: " +
                "${inspected.skills.size} skills, ${inspected.totalSkillXp} total XP, " +
                "tile ${inspected.x},${inspected.z}. Stored privately; NOT loaded into a game."
            showDiagnostic(summary, "Private save copy verified")
        } catch (e: Exception) {
            showHome()
            showDiagnostic("Import rejected: ${e.message ?: "invalid save"}", "Save import failed")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        val snapshot = game?.playerSnapshot()
        if (showingPreview && snapshot != null) {
            outState.putBoolean("preview377", true)
            outState.putFloat("previewX", snapshot.x)
            outState.putFloat("previewY", snapshot.y)
        }
        super.onSaveInstanceState(outState)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (game?.handleKey(event) == true) return true
        return super.dispatchKeyEvent(event)
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (showingPreview) showHome() else super.onBackPressed()
    }

    override fun onPause() {
        game?.pauseRendering()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        game?.resumeRendering()
    }
}
