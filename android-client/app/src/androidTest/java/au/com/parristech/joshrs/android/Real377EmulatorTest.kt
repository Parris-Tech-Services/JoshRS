package au.com.parristech.joshrs.android

import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertTrue
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
