# Narrow offline repair of one verified RuneScript 377 compile error.
# Read only unless -Apply. Neither player saves nor account credentials are edited.
[CmdletBinding()]
param([switch]$Apply, [string]$RepoRoot = '')

$ErrorActionPreference = 'Stop'
if (-not $RepoRoot) { $RepoRoot = Join-Path $PSScriptRoot '..\..' }
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot -ErrorAction Stop).Path
$runtime = (Resolve-Path -LiteralPath (Join-Path $RepoRoot 'runtime\jparris-377') -ErrorAction Stop).Path
$active = Get-Content -LiteralPath (Join-Path $runtime 'active.json') -Raw -ErrorAction Stop | ConvertFrom-Json
if (-not $active.engine) { throw 'Active 377 engine is missing; no changes' }
$engine = (Resolve-Path -LiteralPath ([string]$active.engine) -ErrorAction Stop).Path
if (-not $engine.StartsWith($runtime + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Engine is outside the private runtime; refusing changes'
}
$contentRoot = if ($active.content) { [string]$active.content } else { Join-Path (Split-Path -Parent $engine) 'content' }
$contentRoot = (Resolve-Path -LiteralPath $contentRoot -ErrorAction Stop).Path
if (-not $contentRoot.StartsWith($runtime + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Content is outside the private runtime; refusing changes'
}
$target = Join-Path $contentRoot 'scripts\quests\quest_eadgar\scripts\quest_eadgar.rs2'
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { throw 'Custom Eadgar RuneScript not found; no changes' }
if ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw 'Refusing to change a symlinked script'
}
$raw = [IO.File]::ReadAllBytes($target)
$source = [Text.Encoding]::UTF8.GetString($raw)
if ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($source)) -cne [Convert]::ToBase64String($raw)) {
    throw 'Source is not UTF-8 round-trippable; refusing changes'
}
$oldPattern = '(?m)^([ \t]*)queue\(eadgar_quest_complete,\s*0\);([ \t]*)$'
$newPattern = '(?m)^([ \t]*)queue\(eadgar_quest_complete,\s*0,\s*0\);([ \t]*)$'
$oldCount = [regex]::Matches($source, $oldPattern).Count
$newCount = [regex]::Matches($source, $newPattern).Count
if ($oldCount -eq 0 -and $newCount -eq 1) {
    Write-Host 'ALREADY_PATCHED: Eadgar completion queue has three arguments.'
    return
}
if ($oldCount -ne 1 -or $newCount -ne 0) {
    throw 'UNRECOGNISED_SOURCE: expected exactly one two-argument Eadgar completion queue. No changes.'
}
Write-Host 'PATCH_READY: queue(eadgar_quest_complete, 0) needs the third argument required by rev377.'
Write-Host ('Target: ' + $target)
Write-Host ('Original SHA256: ' + (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash)
if (-not $Apply) {
    Write-Host 'READ_ONLY: no content, save or game process was modified.'
    return
}

function Assert-GameStopped {
    $running = @(
        Get-CimInstance Win32_Process -ErrorAction Stop |
        Where-Object {
            $_.Name -match '^(node|bun)(\.exe)?$' -and $_.CommandLine -and
            $_.CommandLine -match 'src[/\\]app\.ts'
        }
    )
    if ($running.Count -gt 0) { throw 'GAME_RUNNING: log out normally and stop JoshRS with Ctrl+C first' }
    foreach ($port in @([int]$active.gamePort,[int]$active.webPort)) {
        if ($port -lt 1 -or $port -gt 65535) { throw 'Invalid configured port; refusing change' }
        $sock = New-Object Net.Sockets.TcpClient
        try {
            $ar = $sock.BeginConnect('127.0.0.1', $port, $null, $null)
            if ($ar.AsyncWaitHandle.WaitOne(250)) {
                try {
                    $sock.EndConnect($ar)
                    throw ('GAME_PORT_LISTENING: ' + $port)
                } catch [Net.Sockets.SocketException] {}
            }
        } finally { $sock.Dispose() }
    }
}
Assert-GameStopped
$backupTool = Join-Path $RepoRoot 'deploy\jparris-windows\Protect-Elrothiro.ps1'
if (-not (Test-Path -LiteralPath $backupTool -PathType Leaf)) {
    throw 'World backup tool missing; no content modified'
}
$worldBackup = (& $backupTool -CreateBackup 6>&1 | Out-String)
if ($worldBackup -notmatch 'VERIFIED OFFLINE BACKUP CREATED') {
    throw 'Complete verified world backup was not confirmed; refusing patch'
}
Assert-GameStopped
$originalHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
if ([IO.File]::ReadAllText($target) -cne $source) {
    throw 'Content changed during backup; refusing patch'
}
$backupDir = Join-Path $runtime ('save-backups\eadgar-script-arity-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$sourceBackup = Join-Path $backupDir 'quest_eadgar.rs2.original'
$tmp = Join-Path (Split-Path -Parent $target) ('quest_eadgar.rs2.' + [guid]::NewGuid().ToString('N') + '.tmp')
$patched = [regex]::Replace($source, $oldPattern, '$1queue(eadgar_quest_complete, 0, 0);$2')
if ($patched -ceq $source) { throw 'Patch produced no change; refusing update' }
try {
    [IO.File]::WriteAllBytes($tmp, [Text.Encoding]::UTF8.GetBytes($patched))
    Assert-GameStopped
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $originalHash) {
        throw 'Content changed after backup; refusing patch'
    }
    [IO.File]::Replace($tmp, $target, $sourceBackup)
    if ((Get-FileHash -LiteralPath $sourceBackup -Algorithm SHA256).Hash -ne $originalHash) {
        throw 'Original source backup hash mismatch: stop and investigate'
    }
    if ([IO.File]::ReadAllText($target) -cne $patched) {
        throw 'Source verification failed after patch; stop and investigate'
    }
    Write-Host 'QUEUE_ARITY_REPAIR_APPLIED: exactly one Eadgar queue call updated; other content untouched.'
    Write-Host ('Original script backup: ' + $sourceBackup)
    Write-Host 'Only the known arity error is addressed. Remaining content compile errors need separate verification.'
} finally {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
}
