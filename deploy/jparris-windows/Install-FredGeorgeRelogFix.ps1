# Safely install only the reviewed Fred/George relog fix on JParrisDesktop.
# Default is read-only preflight. -Apply requires world OFFLINE and matching source bytes.
[CmdletBinding()]
param(
    [string]$RepoRoot = 'C:\JoshRS-Launcher\JoshRS-main',
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$oldBlob = 'f224729ddfcdf952e87958b5039b7394155cf2aa'
$newBlob = '71ea6b85eea63da1cd0cfc665edbb65467ec5de0'
$pinned = 'a8e2d2503566dc7af35ea9d74ecdb2956792e2a0'
$url = "https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/$pinned/tools/rs377-bot-bench/engine-patch/src/engine/bot/FredGeorgeBot.ts"

function Get-GitBlob([string]$Path) {
    $git = Get-Command 'git.exe' -ErrorAction Stop
    $result = & $git.Source hash-object --no-filters -- $Path
    if ($LASTEXITCODE -ne 0 -or $result -notmatch '^[a-f0-9]{40}$') {
        throw 'Unable to fingerprint local source. No files changed.'
    }
    return [string]$result
}
function Port-Open([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $connect = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $connect.AsyncWaitHandle.WaitOne(350)) { return $false }
        $client.EndConnect($connect)
        return $true
    } catch { return $false } finally { $client.Dispose() }
}
function Assert-WorldStopped([int[]]$Ports,[string]$EnginePath) {
    foreach ($p in $Ports) {
        if (Port-Open $p) { throw "Game-related TCP port $p responds. Log out and Ctrl+C in the JoshRS Server window first. No source modified." }
    }
    $processes = @(Get-CimInstance Win32_Process -ErrorAction Stop |
        Where-Object {
            ($_.Name -in @('node.exe','cmd.exe','powershell.exe','pwsh.exe')) -and
            $_.CommandLine -and
            ((($_.Name -in @('node.exe','cmd.exe')) -and $_.CommandLine -match 'src[\/\\]app\.ts') -or
              (($_.Name -eq 'node.exe') -and $_.CommandLine.IndexOf($EnginePath,[StringComparison]::OrdinalIgnoreCase) -ge 0))
        })
    if ($processes.Count -gt 0) {
        throw "JoshRS game/startup process still appears active ($($processes.Count) match). Stop it gracefully before applying. No source modified."
    }
}

$root = (Resolve-Path -LiteralPath $RepoRoot).Path
$runtime = (Resolve-Path -LiteralPath (Join-Path $root 'runtime\jparris-377')).Path
$state = Get-Content -LiteralPath (Join-Path $runtime 'active.json') -Raw | ConvertFrom-Json
if (-not $state.engine) { throw 'Selected game engine missing from active.json.' }
$engine = (Resolve-Path -LiteralPath ([string]$state.engine)).Path
if (-not $engine.StartsWith($runtime + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {
    throw 'Configured engine is outside the private JoshRS runtime. Refusing to apply an unexpected source tree.'
}
$target = Join-Path $engine 'src\engine\bot\FredGeorgeBot.ts'
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { throw 'FredGeorgeBot.ts is missing from the selected game. No changes.' }
$blob = Get-GitBlob $target
$stateLabel = if ($blob -eq $newBlob) { 'ALREADY_UPDATED' } elseif ($blob -eq $oldBlob) { 'SUPPORTED_OLD_VERSION' } else { 'UNKNOWN_LOCAL_CUSTOMISATIONS' }
Write-Host "Fred/George active engine source: $target"
Write-Host "Git blob SHA: $blob"
Write-Host "Status: $stateLabel"
if (-not $Apply) {
    Write-Host 'READ-ONLY preflight complete. No server, saves, accounts or source changed.'
    if ($stateLabel -eq 'UNKNOWN_LOCAL_CUSTOMISATIONS') {
        Write-Warning 'This USB copy differs from both reviewed versions. DO NOT overwrite it. A targeted merge is needed.'
    } elseif ($stateLabel -eq 'SUPPORTED_OLD_VERSION') {
        Write-Host 'Eligible for guarded update only AFTER all players log out and the game server stops.'
    }
    return
}
if ($blob -eq $newBlob) {
    Write-Host 'Already has the reviewed fix. No changes or restart required.'
    return
}
if ($blob -ne $oldBlob) {
    throw 'BLOCKED: Unknown local source. Won''t overwrite custom game changes. No changes made.'
}
$ports = @([int]$state.gamePort,[int]$state.webPort,43500,43501,45099)
Assert-WorldStopped -Ports $ports -EnginePath $engine

# A verified cold snapshot is required before *any* source change.
$protector = Join-Path $root 'deploy\jparris-windows\Protect-Elrothiro.ps1'
if (-not (Test-Path -LiteralPath $protector -PathType Leaf)) { throw 'Verified backup helper missing.' }
& $protector -RepoRoot $root -CreateBackup
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'Backup command returned a failure.' }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'
$backupRoot = Join-Path $runtime ('source-recovery\fred-george-' + $stamp)
New-Item -ItemType Directory -Path $backupRoot -Force -ErrorAction Stop | Out-Null
$oldCopy = Join-Path $backupRoot 'FredGeorgeBot.previous.ts'
Copy-Item -LiteralPath $target -Destination $oldCopy -ErrorAction Stop
if ((Get-GitBlob $oldCopy) -ne $oldBlob) { throw 'Source backup mismatch. No source changed.' }

# Download and verify the exact merged file; never accept changing "main" contents.
$download = Join-Path $backupRoot 'FredGeorgeBot.reviewed.ts'
Invoke-WebRequest -Uri $url -OutFile $download -UseBasicParsing -ErrorAction Stop
if ((Get-GitBlob $download) -ne $newBlob) {
    throw 'Downloaded source does not match vetted Git blob SHA. No source changed.'
}
Assert-WorldStopped -Ports $ports -EnginePath $engine
if ((Get-GitBlob $target) -ne $oldBlob) {
    throw 'Game source changed during maintenance. Refusing to overwrite it.'
}
$next = "$target.reviewed-new"
$swapBackup = Join-Path $backupRoot 'FredGeorgeBot.atomic-previous.ts'
Copy-Item -LiteralPath $download -Destination $next -ErrorAction Stop
try {
    [IO.File]::Replace($next,$target,$swapBackup)
    if ((Get-GitBlob $target) -ne $newBlob) {
        throw 'Post-update source fingerprint incorrect; restore reviewed backup before launching'
    }
    Write-Host "VERIFIED SOURCE UPDATE: $target"
    Write-Host "Original source safely copied to: $oldCopy"
    Write-Host 'No account, content, Java client or save files were changed by this installer.'
    Write-Host 'Restart the original game normally and verify Fred/George in the active world.'
} catch {
    Write-Warning "Patch failed; original source in $oldCopy"
    throw
} finally {
    if (Test-Path -LiteralPath $next) { Remove-Item -LiteralPath $next -Force }
}
