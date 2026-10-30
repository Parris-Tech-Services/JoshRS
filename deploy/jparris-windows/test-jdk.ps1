$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'jdk.ps1')
$installedJdk=$env:JAVA_HOME
if (-not $installedJdk -or -not (Test-JoshRSJdk21 -JdkDirectory $installedJdk)) {
    throw 'The test runner does not have a complete JDK 21.'
}
$previousPath=$env:Path
$previousJavaHome=$env:JAVA_HOME
try {
    $env:JAVA_HOME=Join-Path $env:TEMP 'invalid-jdk-17'
    if (Test-JoshRSJdk21 -JdkDirectory $env:JAVA_HOME) {
        throw 'An invalid Java installation was mistakenly accepted.'
    }
    # Simulate a Windows installation configured to prefer Java 17.
    # Supply a known JDK 21 as a detected candidate without changing system settings.
    $selected=Set-JoshRSJdk21 -AdditionalHomes @($installedJdk)
    if ($selected -ne $installedJdk) { throw 'Did not select the available JDK 21.' }
    if ($env:JAVA_HOME -ne $installedJdk) { throw 'JAVA_HOME was not corrected for JoshRS.' }
    if ((& javac.exe -version 2>&1 | Out-String).Trim() -notmatch '^javac 21(?:[.\s]|$)') {
        throw 'javac did not use version 21 after selection.'
    }
    Write-Host 'PASS: JDK 21 selected despite incorrect existing JAVA_HOME.'
} finally {
    $env:JAVA_HOME=$previousJavaHome
    $env:Path=$previousPath
}
