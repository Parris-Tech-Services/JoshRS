[CmdletBinding()]
param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$target = Join-Path $PSScriptRoot 'play.ps1'
$helper = Join-Path $PSScriptRoot 'launch-java-client-safe.ps1'
$active = Join-Path $repo 'runtime/jparris-377/active.json'
$marker = 'JOSHRS_SAFE_CLIENT_LAUNCH_V1'

# This is a *launcher source-only* repair, not a game/server/saves patch.
foreach ($path in @($target,$helper,$active)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Missing required file: $path. No changes made."
    }
}
$state = Get-Content -LiteralPath $active -Raw | ConvertFrom-Json
if (-not $state.client -or -not (Test-Path -LiteralPath (Join-Path $state.client 'gradlew.bat') -PathType Leaf)) {
    throw 'The active Java client is not a verified Gradle client; no changes made.'
}
$before = [IO.File]::ReadAllText($target)
if ($before.Contains($marker)) {
    Write-Host 'JoshRS Java client launch repair is already installed. No changes made.'
    exit 0
}
$pattern = '(?ms)^[ \t]*if[ \t]*\([ \t]*\$Role[ \t]+-eq[ \t]+[''"]Client[''"][ \t]*\)[ \t]*\{.*?^\}[ \t]*(?=\r?\n|$)'
$clientBlocks = [regex]::Matches($before,$pattern)
if ($clientBlocks.Count -ne 1) {
    throw "Expected exactly one top-level Client role block, found $($clientBlocks.Count). Refusing to overwrite Agy customisations."
}
$old = $clientBlocks[0].Value
# Reject a different launch shape rather than blindly wiping local tweaks.
if ($old -notmatch 'Java client|java client|gradlew|java\.exe|javaExe|jvmArgs') {
    throw 'Client branch does not match a recognised Java launcher. No changes made.'
}
$replacement = @'
if ($Role -eq 'Client') {
    # JOSHRS_SAFE_CLIENT_LAUNCH_V1: isolated Java-argument repair.
    # Original custom Client branch is backed up; server/friends/bots untouched.
    $mutex = [System.Threading.Mutex]::new($false, 'Local\JoshRS377JavaClient')
    $acquired = $false
    try {
        $acquired = $mutex.WaitOne(0)
        if (-not $acquired) {
            Write-Warning 'A JoshRS Java client launch is already running; duplicate prevented.'
            return
        }
        & (Join-Path $PSScriptRoot 'launch-java-client-safe.ps1') -ClientPath ([string]$s.client) -PortOffset ([int]$s.portOffset)
    } finally {
        if ($acquired) { $mutex.ReleaseMutex() }
        $mutex.Dispose()
    }
    return
}
'@
$new = $before.Substring(0,$clientBlocks[0].Index) + $replacement + $before.Substring($clientBlocks[0].Index + $old.Length)
$tokens = $null
$errors = $null
[void][System.Management.Automation.Language.Parser]::ParseInput($new,[ref]$tokens,[ref]$errors)
if ($errors.Count -gt 0) {
    throw "The proposed launcher does not parse in PowerShell: $($errors | Out-String)"
}
$tokens = $null
$errors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($helper,[ref]$tokens,[ref]$errors)
if ($errors.Count -gt 0) { throw 'Safe Java launch helper has a syntax error. No changes made.' }

Write-Host 'Recognised the existing local Client block. Only that block will be changed.'
Write-Host 'Server startup, runtime, Java client files, engine, saves and SQLite remain untouched.'
if (-not $Apply) {
    Write-Host 'READ-ONLY preflight passed. Run JoshRS-Fix-Java-Client.cmd to apply.'
    exit 0
}
$backupRoot = Join-Path $repo 'runtime/jparris-377/launcher-backups'
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$backup = Join-Path $backupRoot ('play-before-java-args-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fffffff') + '.ps1')
Copy-Item -LiteralPath $target -Destination $backup -ErrorAction Stop
if ((Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash -ne
    (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash) {
    throw 'Launcher backup verification failed. No changes made.'
}
try {
    # Never use Set-Content, which would silently alter Unicode/BOM/line endings.
    $encoding = [Text.UTF8Encoding]::new($false)
    if ([IO.File]::ReadAllBytes($target).Length -ge 3) {
        $bytes = [IO.File]::ReadAllBytes($target)
        if ($bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
            $encoding = [Text.UTF8Encoding]::new($true)
        }
    }
    [IO.File]::WriteAllText($target,$new,$encoding)
    $actual = [IO.File]::ReadAllText($target)
    if ($actual -cne $new) { throw 'Readback mismatch after launcher write.' }
} catch {
    Copy-Item -LiteralPath $backup -Destination $target -Force
    throw
}
Write-Host 'Java client argument launcher repaired. Original saved at:'
Write-Host $backup
Write-Host 'Use your existing Play JoshRS desktop shortcut. No reinstall, restart or save changes were performed.'
