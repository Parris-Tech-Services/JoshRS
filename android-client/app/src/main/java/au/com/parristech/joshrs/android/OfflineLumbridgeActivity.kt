package au.com.parristech.joshrs.android

import android.app.Activity
import android.app.AlertDialog
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.ceil
import kotlin.math.roundToInt

/**
 * Playable, entirely offline Android quest slice. Its map is an ORIGINAL
 * schematic reconstruction, not the authentic Jagex 377 rendered world.
 * Saves only to this APK's private preferences, not the server or native .sav.
 */
class OfflineLumbridgeActivity : Activity() {
    private lateinit var game: OfflineLumbridgeQuest
    private lateinit var map: QuestMap
    private lateinit var message: TextView
    private val handler = Handler(Looper.getMainLooper())
    private var ticking = false
    private var previousTick = 0L
    private var previousSave = 0L
    private val prefs by lazy { getSharedPreferences("offline_lumbridge_quest_v1", MODE_PRIVATE) }

    private val ticker = object : Runnable {
        override fun run() {
            if (!ticking) return
            val now = SystemClock.elapsedRealtime()
            val dt = ((now - previousTick) / 1000f).coerceIn(0f, .20f)
            previousTick = now
            if (game.advance(dt)) {
                map.invalidate()
                showStatus()
                if (now - previousSave > 1600L) saveProgress()
            }
            handler.postDelayed(this, 55L)
        }
    }

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        window.statusBarColor = Color.rgb(32, 33, 28)
        window.navigationBarColor = Color.rgb(32, 33, 28)
        game = OfflineLumbridgeQuest.restore(prefs.getString("progress", null))
        renderUi()
    }

    private fun saveProgress() {
        prefs.edit().putString("progress", game.save()).commit()
        previousSave = SystemClock.elapsedRealtime()
    }

    private fun renderUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(32, 33, 28))
            setPadding(8, 8, 8, 8)
            setOnApplyWindowInsetsListener { view, insets ->
                val bars = insets.getInsets(
                    WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout()
                )
                view.setPadding(8 + bars.left, 8 + bars.top, 8 + bars.right, 8 + bars.bottom)
                insets
            }
        }
        setContentView(root)
        fun heading(text: String, size: Float, colour: Int): TextView = TextView(this).apply {
            this.text = text
            textSize = size
            setTextColor(colour)
            setPadding(10, 4, 8, 6)
        }
        root.addView(heading("LUMBRIDGE · OFFLINE QUEST", 19f, Color.rgb(240, 208, 135)))
        root.addView(heading(
            "Playable reconstruction • Original artwork • NOT the full RuneScape 377 client",
            11f, Color.rgb(198, 188, 170)))
        message = heading("", 13f, Color.rgb(235, 225, 202))
        root.addView(message)
        map = QuestMap()
        root.addView(map, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        root.addView(heading(
            "Tap map to walk · Travel to landmarks · Interact within 2 tiles",
            11f, Color.rgb(197, 186, 164)))
        root.addView(buttonRow(
            "Travel" to { travelMenu() },
            "Interact" to { interactionMenu() },
            "Bag" to { bagDialog() }))
        root.addView(buttonRow(
            "Quest journal" to { journalDialog() },
            "Save" to { saveProgress(); notice("Progress saved offline on this phone.") },
            "More" to { optionsMenu() }))
        showStatus()
    }

    private fun buttonRow(vararg entries: Pair<String, () -> Unit>): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            for ((name, fn) in entries) {
                addView(Button(this@OfflineLumbridgeActivity).apply {
                    text = name
                    textSize = 12f
                    isAllCaps = false
                    setOnClickListener { fn() }
                }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
            }
        }

    private fun showStatus() {
        val stage = when (game.stage) {
            0 -> "Talk to Cook"
            1 -> "Gather ingredients"
            else -> "QUEST COMPLETE · 1 QP"
        }
        message.text = stage + "  •  Tile " + game.x + "," + game.z +
            "\n" + game.lastMessage
    }

    private fun notice(text: String) {
        showStatus()
        AlertDialog.Builder(this).setTitle("JoshRS offline").setMessage(text)
            .setPositiveButton("OK", null).show()
    }

    private fun travelMenu() {
        val choices = OfflineLumbridgeQuest.places
        AlertDialog.Builder(this)
            .setTitle("Walk to a landmark")
            .setItems(choices.map {
                it.name + " · " + game.distance(it.x, it.z) + " tiles"
            }.toTypedArray()) { _, which ->
                val r = game.walkTo(choices[which].id)
                showStatus(); map.invalidate()
                if (!r.success) notice(r.message)
            }
            .setNegativeButton("Cancel", null).show()
    }

    private fun interactionMenu() {
        val near = game.nearby()
        if (near.isEmpty()) {
            notice("No quest NPC or object within reach. Tap Travel to walk to a landmark.")
            return
        }
        AlertDialog.Builder(this).setTitle("Interact")
            .setItems(near.map { game.actionName(it) }.toTypedArray()) { _, index ->
                val r = game.interact(near[index].id)
                saveProgress(); showStatus(); map.invalidate()
                notice(r.message)
            }
            .setNegativeButton("Cancel", null).show()
    }

    private fun bagDialog() {
        val contents = game.inventory()
        notice(if (contents.isEmpty()) "Your backpack is empty."
            else contents.joinToString("\n") { "• " + it })
    }

    private fun journalDialog() {
        val details = when (game.stage) {
            0 -> "Cook's Assistant — NOT STARTED\nVisit the Cook at Lumbridge Castle."
            2 -> "Cook's Assistant — COMPLETE\n300 Cooking XP · 1 quest point\n" +
                "Quest completed through local interactions and saved on this phone."
            else -> "Cook's Assistant — IN PROGRESS\n" +
                (if (game.has("Egg")) "✓" else "○") + " Egg\n" +
                (if (game.has("Bucket of milk")) "✓" else "○") + " Bucket of milk\n" +
                (if (game.has("Pot of flour")) "✓" else "○") + " Pot of flour\n" +
                "Use the mill's hopper, controls and flour bin in order."
        }
        notice(details + "\n\nCooking XP: " + game.cookingXp +
            " · Quest points: " + game.questPoints +
            "\nWalked " + game.walkedTiles + " tiles.")
    }

    private fun optionsMenu() {
        val entries = arrayOf("View quest journal", "Save progress", "Start NEW offline quest", "Return to JoshRS home")
        AlertDialog.Builder(this).setTitle("Offline game options")
            .setItems(entries) { _, index ->
                when (index) {
                    0 -> journalDialog()
                    1 -> { saveProgress(); notice("Saved on this phone.") }
                    2 -> AlertDialog.Builder(this).setTitle("Reset only offline quest?")
                        .setMessage("This resets the offline reconstruction's progress. It does not touch any RuneScape or JoshRS saves, apps or accounts.")
                        .setNegativeButton("Cancel", null)
                        .setPositiveButton("Reset offline quest") { _, _ ->
                            game = OfflineLumbridgeQuest.fresh()
                            saveProgress(); showStatus(); map.invalidate()
                        }.show()
                    else -> { saveProgress(); finish() }
                }
            }.show()
    }

    override fun onResume() {
        super.onResume()
        ticking = true
        previousTick = SystemClock.elapsedRealtime()
        handler.removeCallbacks(ticker)
        handler.post(ticker)
    }

    override fun onPause() {
        ticking = false
        handler.removeCallbacks(ticker)
        saveProgress()
        super.onPause()
    }

    override fun onDestroy() {
        handler.removeCallbacks(ticker)
        super.onDestroy()
    }

    /** Custom Android Canvas; no cache, Java desktop renderer or external files. */
    private inner class QuestMap : View(this@OfflineLumbridgeActivity) {
        private val p = Paint(Paint.ANTI_ALIAS_FLAG)
        private fun colour(v: Int) { p.color = v; p.style = Paint.Style.FILL }
        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val size = (width / 19.5f).coerceIn(11f, 28f)
            val centreX = width / 2f
            val centreY = height / 2f
            fun sx(x: Float) = centreX + (x - game.x) * size
            fun sy(z: Float) = centreY + (game.z - z) * size
            canvas.drawColor(Color.rgb(72, 103, 64))
            val radiusX = ceil(width / size / 2).toInt() + 1
            val radiusZ = ceil(height / size / 2).toInt() + 1
            for (tx in (game.x-radiusX)..(game.x+radiusX)) {
                for (tz in (game.z-radiusZ)..(game.z+radiusZ)) {
                    if (tx !in OfflineLumbridgeQuest.MIN_X..OfflineLumbridgeQuest.MAX_X ||
                        tz !in OfflineLumbridgeQuest.MIN_Z..OfflineLumbridgeQuest.MAX_Z) continue
                    val river = tx in 3239..3241
                    val bridge = river && game.walkable(tx, tz)
                    val castle = tx in 3204..3216 && tz in 3207..3225
                    val farm = tx in 3224..3240 && tz in 3289..3303
                    val wheat = tx in 3156..3178 && tz in 3293..3311
                    val path = tx in 3209..3211 || tz in 3250..3252
                    val c = when {
                        bridge -> Color.rgb(169, 147, 108)
                        river -> Color.rgb(49, 111, 145)
                        castle -> if ((tx+tz)%2==0) Color.rgb(140,135,121) else Color.rgb(124,121,111)
                        path -> Color.rgb(156, 144, 111)
                        wheat -> if ((tx+tz)%2==0) Color.rgb(173,160,67) else Color.rgb(142,141,63)
                        farm -> Color.rgb(117, 139, 79)
                        (tx+tz)%3==0 -> Color.rgb(80, 121, 68)
                        else -> Color.rgb(91, 132, 73)
                    }
                    colour(c)
                    val left=sx(tx.toFloat()-0.5f);val top=sy(tz.toFloat()+0.5f)
                    canvas.drawRect(left,top,left+size+1f,top+size+1f,p)
                }
            }
            // Landmarks use original graphic markers; not original cache models.
            for (site in OfflineLumbridgeQuest.places) {
                val mx=sx(site.x.toFloat());val my=sy(site.z.toFloat())
                if(mx < -90f || mx > width+90f || my < -40f || my > height+40f)continue
                colour(Color.rgb(51, 42, 35))
                canvas.drawCircle(mx,my,size*0.51f,p)
                colour(if (game.distance(site.x,site.z)<=2)
                    Color.rgb(246,207,106) else Color.rgb(232,179,109))
                canvas.drawCircle(mx,my,size*0.40f,p)
                p.color=Color.rgb(34,35,28);p.textSize=size*0.49f
                p.textAlign=Paint.Align.CENTER
                canvas.drawText(site.id.take(1).uppercase(),mx,my+size*.17f,p)
                if (size>14f) {
                    p.color=Color.WHITE;p.textSize=size*.44f
                    canvas.drawText(site.name.take(23),mx,my-size*.67f,p)
                }
            }
            // A gold destination ring does not imply teleportation.
            game.target()?.let { dest ->
                val dx=sx(dest.first.toFloat());val dy=sy(dest.second.toFloat())
                colour(Color.rgb(252,231,147));p.style=Paint.Style.STROKE;p.strokeWidth=3f
                canvas.drawCircle(dx,dy,size*.55f,p);p.style=Paint.Style.FILL
            }
            val px=centreX;val py=centreY
            colour(Color.argb(140,24,25,22))
            canvas.drawOval(RectF(px-size*.40f,py+size*.23f,
                px+size*.40f,py+size*.47f),p)
            colour(Color.rgb(54,99,190))
            canvas.drawCircle(px,py,size*.40f,p)
            colour(Color.rgb(242,219,176))
            canvas.drawCircle(px,py-size*.12f,size*.16f,p)
            p.color=Color.WHITE;p.textAlign=Paint.Align.LEFT
            p.textSize=12f
            canvas.drawText("N ↑   Original offline map • Not historical 377 terrain",8f,17f,p)
            p.textSize=11f
            canvas.drawText("X " + game.x + " / Z " + game.z +
                (if (game.moving()) "  · walking" else "  · standing"),8f,height-10f,p)
        }

        override fun onTouchEvent(event: MotionEvent): Boolean {
            if(event.actionMasked==MotionEvent.ACTION_UP){
                val size=(width/19.5f).coerceIn(11f,28f)
                val tx=(game.x+(event.x-width/2f)/size).roundToInt()
                val tz=(game.z-(event.y-height/2f)/size).roundToInt()
                game.walkTo(tx,tz)
                showStatus()
                invalidate()
                performClick()
                return true
            }
            return true
        }
        override fun performClick(): Boolean {
            super.performClick()
            return true
        }
    }
}
