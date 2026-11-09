package au.com.parristech.joshrs.android

import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

/**
 * This instrumentation suite MUST connect through adb reverse to a real,
 * disposable LostCity Engine-TS 377 service on the CI host.
 *
 * There is no fake socket server in this APK or in these tests.
 * A green result proves protocol negotiation and Android UI reachability,
 * never authenticated gameplay.
 */
@RunWith(AndroidJUnit4::class)
class Real377EmulatorTest {
    @Test fun androidSystemBarsDoNotCoverHomeOrDrawingScreen() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                fun checkSafeFrame() {
                    val content = activity.findViewById<ViewGroup>(android.R.id.content)
                    val frame = content.getChildAt(0) as FrameLayout
                    assertEquals("JoshRS safe content container", frame.contentDescription)
                    val insets = frame.rootWindowInsets
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R &&
                        insets != null) {
                        val bars = insets.getInsets(
                            android.view.WindowInsets.Type.systemBars() or
                                android.view.WindowInsets.Type.displayCutout()
                        )
                        assertTrue("Top inset missing: padding=${frame.paddingTop}, required=${bars.top}",
                            frame.paddingTop >= bars.top)
                        assertTrue("Bottom inset missing: padding=${frame.paddingBottom}, required=${bars.bottom}",
                            frame.paddingBottom >= bars.bottom)
                    }
                }
                checkSafeFrame()
                var preview: Button? = null
                descend(activity.window.decorView) { view ->
                    if (view is Button &&
                        view.text.toString().contains("fictional offline art preview")) {
                        preview = view
                    }
                }
                assertTrue("Original drawing preview was not available", preview != null)
                preview!!.performClick()
                checkSafeFrame()
            }
        }
    }

    @Test fun threeDimensionalRendererActuallyDrawsTriangleOnEmulatorCanvas() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val mesh = Geometry377(
                    listOf(
                        Vertex377(-64, -64, 0),
                        Vertex377(64, -64, 0),
                        Vertex377(0, 64, 0)
                    ),
                    listOf(Triangle377(0, 1, 2, 300)),
                    0
                )
                val viewer = Model377Viewer(activity, PrivateModel377.Loaded(999, mesh))
                viewer.layout(0, 0, 600, 600)
                val bitmap = android.graphics.Bitmap.createBitmap(
                    600, 600, android.graphics.Bitmap.Config.ARGB_8888
                )
                viewer.draw(android.graphics.Canvas(bitmap))
                var triangleVisible = false
                for (y in 100..500 step 12) {
                    for (x in 100..500 step 12) {
                        val pixel = bitmap.getPixel(x, y)
                        if (pixel != android.graphics.Color.rgb(35, 41, 44) &&
                            pixel != android.graphics.Color.WHITE) {
                            triangleVisible = true
                        }
                    }
                }
                assertTrue("3D perspective triangle failed to rasterise", triangleVisible)
                bitmap.recycle()
            }
        }
    }

    @Test fun privateLumbridgeTerrainViewerActuallyRasterisesOnAndroidEmulator() {
        // Geometry fixture is SYNTHETIC. The real idx0/idx4 decoding is tested
        // separately; do not mistake this for an original game-world screenshot.
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val region = Region377(
                    50, 50, 12, 13,
                    List(4 * 64 * 64) { index ->
                        Tile377(
                            height = if (index < 64 * 64) -16 else -32,
                            overlayId = 0,
                            overlayShape = 0,
                            rotation = 0,
                            flag = 0,
                            underlayId = if (index % 2 == 0) 1 else 2
                        )
                    },
                    listOf(LocPlacement377(10, 3233, 3218, 0, 10, 2))
                )
                val view = Lumbridge377Viewer(activity, region)
                view.layout(0, 0, 720, 960)
                val bitmap = android.graphics.Bitmap.createBitmap(
                    720, 960, android.graphics.Bitmap.Config.ARGB_8888
                )
                view.draw(android.graphics.Canvas(bitmap))
                val background = android.graphics.Color.rgb(27, 33, 37)
                var painted = 0
                for (y in 240..720 step 8) for (x in 80..640 step 8) {
                    if (bitmap.getPixel(x, y) != background) painted++
                }
                assertTrue("Authentic-coordinate terrain viewer did not paint tiles", painted > 100)
                bitmap.recycle()
            }
        }
    }

    @Test fun emulatorNegotiatesWithActualPinned377Engine() {
        val result = Negotiation377.probe()
        assertTrue("Actual 377 server negotiation failed: ${result.message}", result.negotiated)
    }

    private fun descend(root: View, visit: (View) -> Unit) {
        visit(root)
        if (root is ViewGroup) {
            for (i in 0 until root.childCount) descend(root.getChildAt(i), visit)
        }
    }

    @Test fun appDisplaysActualServerReplyRatherThanMockSuccess() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            var didClick = false
            scenario.onActivity { activity ->
                descend(activity.window.decorView) { view ->
                    if (view is Button && view.text.toString().contains("real 377 login negotiation")) {
                        view.performClick()
                        didClick = true
                    }
                }
            }
            assertTrue("Genuine 377 probe button missing", didClick)
            var success = false
            repeat(60) {
                scenario.onActivity { activity ->
                    descend(activity.window.decorView) { view ->
                        if (view is TextView &&
                            view.text.toString().contains("377 negotiation accepted (not logged in)")) {
                            success = true
                        }
                    }
                }
                if (success) return@use
                Thread.sleep(100)
            }
            assertTrue("The Android UI never displayed an actual 377 negotiation", success)
        }
    }
}
