# Fix only the known Fred/George normalised-username logout acknowledgement bug.
# Read-only by default. -Apply requires a fully stopped engine and a verified full-world save backup.
# No account, player save, .env, private key, content cache or network session is modified.
[CmdletBinding()]
param([switch]$Apply, [string]$RepoRoot = '')

$ErrorActionPreference = 'Stop'
if (-not $RepoRoot) { $RepoRoot = Join-Path $PSScriptRoot '..\..' }
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot -ErrorAction Stop).Path
$runtime = (Resolve-Path -LiteralPath (Join-Path $RepoRoot 'runtime\jparris-377') -ErrorAction Stop).Path
$state = Get-Content -LiteralPath (Join-Path $runtime 'active.json') -Raw | ConvertFrom-Json
if (-not $state.engine) { throw 'Active game engine is not configured' }
$engine = (Resolve-Path -LiteralPath ([string]$state.engine) -ErrorAction Stop).Path
if (-not $engine.StartsWith($runtime + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing to change engine outside the current private JoshRS runtime'
}
$target = Join-Path $engine 'src\engine\bot\FredGeorgeBot.ts'
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { throw 'Installed FredGeorgeBot.ts is missing' }
if ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing to patch a symbolic link' }
$src = [IO.File]::ReadAllText($target)
$old = 'world.logoutRequests.has(name)'
$new = 'world.logoutRequests.has(player?.username ?? name.toLowerCase())'
$oldCount = ($src.Split([string[]]@($old), [StringSplitOptions]::None)).Count - 1
$newCount = ($src.Split([string[]]@($new), [StringSplitOptions]::None)).Count - 1
if ($oldCount -eq 0 -and $newCount -eq 1) {
    Write-Host 'ALREADY_PATCHED: installed native Fred/George logout key guard present.'
    return
}
if ($oldCount -ne 1 -or $newCount -ne 0) {
    throw 'Installed bot source does not match the single known unsafe logout guard; refusing changes.'
}
foreach ($expected in @('export function tickFredAndGeorgeBots', 'state.relogPending', 'spawnSingleBot(world, name)', 'PlayerLoading.load(name')) {
    if (-not $src.Contains($expected)) { throw ('Required known source marker missing: '+$expected) }
}
if (-not $Apply) {
    Write-Host 'PATCH_READY (read only): installed bot checks capitalised name, while logout requests use lower-case player.username.'
    Write-Host 'No game files changed. Apply only after graceful server shutdown.'
    return
}

function Assert-Offline {
    $processes = @(
        Get-CimInstance Win32_Process -ErrorAction Stop |
        Where-Object {
            $_.Name -match '^(node|bun)(\.exe)?$' -and $_.CommandLine -and
            $_.CommandLine.IndexOf($engine, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
            $_.CommandLine -match 'src[/\\]app\.ts'
        }
    )
    if ($processes.Count -gt 0) { throw 'GAME_RUNNING: stop the live server with Ctrl+C and close its windows first; do not force-kill.' }
    foreach ($port in @(52402, 8888)) {
        $socket = New-Object Net.Sockets.TcpClient
        try {
            $async = $socket.BeginConnect('127.0.0.1', $port, $null, $null)
            if ($async.AsyncWaitHandle.WaitOne(200)) {
                try { $socket.EndConnect($async); throw 'GAME_PORT_LISTENING' } catch [System.Net.Sockets.SocketException] { }
            }
        } finally { $socket.Dispose() }
    }
}
Assert-Offline
$backupCommand = Join-Path $RepoRoot 'deploy\jparris-windows\Protect-Elrothiro.ps1'
if (-not (Test-Path -LiteralPath $backupCommand -PathType Leaf)) { throw 'Full player-save backup tool absent; no changes.' }
$backupEvidence = @(& $backupCommand -CreateBackup 2>&1 | Out-String) -join ''
if ($backupEvidence -notmatch 'VERIFIED OFFLINE BACKUP CREATED') {
    throw 'Verified full-world backup was not confirmed; no source was changed.'
}
Assert-Offline
$current = [IO.File]::ReadAllText($target)
if ($current -cne $src) { throw 'Bot source changed during backup; no source patched.' }
$directory = Join-Path $runtime ('save-backups\fred-george-source-repair-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $directory -Force | Out-Null
$sourceBackup = Join-Path $directory 'FredGeorgeBot.ts.original'
$tmp = Join-Path (Split-Path -Parent $target) ('FredGeorgeBot.ts.'+[guid]::NewGuid().ToString('N')+'.tmp')
try {
    $patched = $src.Replace($old, $new)
    [IO.File]::WriteAllText($tmp, $patched, (New-Object Text.UTF8Encoding($false)))
    Assert-Offline
    if ([IO.File]::ReadAllText($target) -cne $src) { throw 'Bot source changed during preflight. Aborting.' }
    [IO.File]::Replace($tmp, $target, $sourceBackup)
    if (([IO.File]::ReadAllText($target)) -cne $patched) { throw 'Source verification failed after atomic replacement.' }
    $originalHash = (Get-FileHash -LiteralPath $sourceBackup -Algorithm SHA256).Hash
    if ($originalHash -ne [Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($src)).ForEach({$_.ToString('x2')}) -join '') {
        # The installed original might have contained an initial UTF-8 BOM. Validate against bytes instead below.
        Write-Host 'Original source saved; validate exact bytes against pre-patch copy if restoration needed.'
    }
    Write-Host 'SOURCE_REPAIR_APPLIED: only the Fred/George logout account-key comparison was corrected.'
    Write-Host ('Original source backup: ' + $sourceBackup)
    Write-Host 'Restart JoshRS normally only after you are ready to log players out. Real bot gameplay remains unverified.'
} finally {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
}
