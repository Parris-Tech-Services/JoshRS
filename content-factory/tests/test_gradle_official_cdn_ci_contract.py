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
    def test_changes_only_the_exact_pinned_wrapper_and_restores_on_failure(self):
        self.assertIn("$defaultGradle = 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip'",s)
        self.assertIn("$directGradle = 'distributionUrl=https\\://downloads.gradle.org/distributions/gradle-8.11.1-bin.zip'",s)
        self.assertIn("$expectedGradleHash = 'f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6'",s)
        self.assertIn("if ($hasPinned)",s)
        self.assertIn("if ($wrapperBefore -match",s)
        self.assertIn("Custom Java client Gradle wrapper version/URL preserved",s)
        self.assertIn("if ($wrapperNew -cne $wrapperBefore)",s)
        self.assertIn("Copy-Item -LiteralPath $gradleWrapper -Destination $wrapperBackup",s)
        self.assertIn("Get-FileHash -LiteralPath $gradleWrapper -Algorithm SHA256",s)
        self.assertIn("Copy-Item -LiteralPath $wrapperBackup -Destination $gradleWrapper -Force",s)
        self.assertIn("$gradleAttempts=if($env:GITHUB_ACTIONS -eq 'true' -and $ClientGradleTimeoutMs -gt 0){4}else{1}",s)
        self.assertIn("if($gradleAttempt -eq $gradleAttempts){throw}",s)
        self.assertIn("Run-Native (Join-Path $client 'gradlew.bat') @('--no-daemon','classes') $client",s)
