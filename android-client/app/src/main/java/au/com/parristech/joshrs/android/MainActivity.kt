package au.com.parristech.joshrs.android

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.widget.LinearLayout

/** Stage 1 only: independent Android window, not a RuneScape network client. */
class MainActivity : Activity() {
    private lateinit var game: GameSurfaceView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(49, 45, 39)
        window.navigationBarColor = Color.rgb(49, 45, 39)

        val world = PreviewWorld(
            savedInstanceState?.getFloat("playerX", 8f) ?: 8f,
            savedInstanceState?.getFloat("playerY", 8f) ?: 8f
        )
        game = GameSurfaceView(this, world)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(49, 45, 39))
        }
        root.addView(game, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT
        ))

        if (Build.VERSION.SDK_INT >= 30) {
            root.setOnApplyWindowInsetsListener { view: View, insets: WindowInsets ->
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                insets
            }
        }
        setContentView(root)
        game.requestFocus()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (::game.isInitialized && game.handleKey(event)) return true
        return super.dispatchKeyEvent(event)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        if (::game.isInitialized) {
            val position = game.playerSnapshot()
            outState.putFloat("playerX", position.x)
            outState.putFloat("playerY", position.y)
        }
        super.onSaveInstanceState(outState)
    }

    override fun onPause() {
        if (::game.isInitialized) game.pauseRendering()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        if (::game.isInitialized) game.resumeRendering()
    }
}
