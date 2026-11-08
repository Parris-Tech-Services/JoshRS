package au.com.parristech.joshrs.android

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.widget.Button
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
    companion object { private const val PICK_SAVE = 377 }

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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(49, 45, 39)
        window.navigationBarColor = Color.rgb(49, 45, 39)
        showHome()
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
        setContentView(scroll)
        root.addView(label("JoshRS 377 — Android", 24f))
        root.addView(label(
            "Native development tools for the real revision-377 game. " +
                "A playable 377 Kotlin renderer, login and game session are NOT implemented."
        ))
        root.addView(label("Local engine status", 19f))
        statusText = label(
            "No server checked. The phone-local Termux engine uses TCP 52402 and web 8888."
        ).also { root.addView(it) }
        action("Check actual phone-local server") {
            val target = statusText
            target?.text = "Checking 127.0.0.1 only..."
            Thread {
                val result = Loopback377.check()
                runOnUiThread {
                    if (statusText === target) {
                        target?.text =
                            "Game TCP: ${if (result.gameTcpReachable) "reachable" else "not reachable"}\n" +
                            "Web TCP: ${if (result.webTcpReachable) "reachable" else "not reachable"}\n" +
                            "This proves only port access, NOT a successful login, packets, quests or gameplay."
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
                        target?.text = result.message +
                            "\\nNo player account or world state has been loaded."
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
        root.addView(label("Visual study (not the 377 game)", 19f))
        action("Open original isometric preview") { showPreview() }
        root.addView(label(
            "Next integration milestone: compatible licensed 377 renderer/cache and " +
                "authenticated session against the local engine. No public network ports."
        ))
    }

    private fun showPreview() {
        root.removeAllViews()
        showingPreview = true
        val world = PreviewWorld()
        val surface = GameSurfaceView(this, world)
        game = surface
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(49, 45, 39))
        }
        root.addView(label("ORIGINAL VISUAL PREVIEW — not revision 377", 13f))
        root.addView(surface, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ))
        setContentView(root)
        surface.requestFocus()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
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
            statusText?.text = summary
        } catch (e: Exception) {
            showHome()
            statusText?.text = "Import rejected: ${e.message ?: "invalid save"}"
        }
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
