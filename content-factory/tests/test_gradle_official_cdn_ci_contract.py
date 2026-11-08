"""Source-safety gate: Gradle's 504 workaround only affects disposable CI."""
from pathlib import Path
import unittest
p=Path(__file__).resolve().parents[2]/"deploy/jparris-windows/setup.ps1"
s=p.read_text()
class GradleCdnSafety(unittest.TestCase):
    def test_uses_same_exact_pinned_version_from_official_host(self):
        self.assertIn("distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip",s)
        self.assertIn("distributionUrl=https\\://downloads.gradle.org/distributions/gradle-8.11.1-bin.zip",s)
        self.assertIn("$env:GITHUB_ACTIONS -eq 'true'",s)
    def test_changes_only_when_timeout_flag_active_and_drift_rejected(self):
        self.assertLess(s.index("if ($ClientGradleTimeoutMs -gt 0)"),s.index("$expectedDistribution = "))
        self.assertIn("refusing to redirect an unrecognised distribution",s)
        self.assertIn("if ($replacement -cne $originalWrapper)",s)
        self.assertIn("[IO.File]::WriteAllText($wrapper,$replacement)",s)
        self.assertIn("if ($env:GITHUB_ACTIONS -eq 'true' -and $ClientGradleTimeoutMs -gt 0)",s)
        self.assertIn("for ($attempt = 1; $attempt -le 4; $attempt++)",s)
        self.assertIn("if ($attempt -eq 4) { throw }",s)
        self.assertIn("Run-Native $gradleWrapperExe @('--no-daemon','classes') $client",s)
