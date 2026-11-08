# Offline synthetic fixtures only; never use real character saves.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '../../deploy/jparris-windows/save-integrity.ps1')
function Assert-Throws([scriptblock]$Action,[string]$Case) {
    $threw=$false
    try { & $Action } catch { $threw=$true }
    if (-not $threw) { throw "Expected rejection: $Case" }
}
$root=Join-Path ([IO.Path]::GetTempPath()) ('joshrs-backup-tests-'+[guid]::NewGuid().ToString('N'))
$engine=Join-Path $root 'engine';$backup=Join-Path $root 'backup'
try {
    New-Item -ItemType Directory -Path (Join-Path $engine 'data/players/main'),(Join-Path $backup 'players/main') -Force | Out-Null
    foreach ($name in @('elrothiro','sylvie')) {
        $src=Join-Path $engine "data/players/main/$name.sav"
        [IO.File]::WriteAllBytes($src,[byte[]](1..140))
        Copy-Item -LiteralPath $src -Destination (Join-Path $backup "players/main/$name.sav")
    }
    [IO.File]::WriteAllBytes((Join-Path $engine 'db.sqlite'),[byte[]](1..80))
    Copy-Item -LiteralPath (Join-Path $engine 'db.sqlite') -Destination (Join-Path $backup 'db.sqlite')
    $r=Write-JoshRSBackupIntegrity -BackupPath $backup -Engine $engine
    if (-not $r.Verified -or -not $r.ContainsElrothiro -or -not $r.ContainsSylvie -or $r.FileCount -ne 3) { throw 'Both-player snapshot not verified' }
    Assert-Throws { Write-JoshRSBackupIntegrity -BackupPath $backup -Engine $engine } 'manifest overwrite'
    [IO.File]::WriteAllBytes((Join-Path $backup 'players/main/sylvie.sav'),[byte[]](2..141))
    Assert-Throws { Test-JoshRSBackupIntegrity -BackupPath $backup } 'tampered Sylvie save'
    Copy-Item -LiteralPath (Join-Path $engine 'data/players/main/sylvie.sav') -Destination (Join-Path $backup 'players/main/sylvie.sav') -Force
    if (-not (Test-JoshRSBackupIntegrity -BackupPath $backup).Verified) { throw 'Restored fixture failed verification' }
    [IO.File]::WriteAllBytes((Join-Path $backup 'players/main/extra.sav'),[byte[]](1..140))
    Assert-Throws { Test-JoshRSBackupIntegrity -BackupPath $backup } 'unlisted file'
    Remove-Item -LiteralPath (Join-Path $backup 'players/main/extra.sav')
    [IO.File]::WriteAllBytes((Join-Path $engine 'data/players/main/sylvie.sav'),[byte[]](3..142))
    $second=Join-Path $root 'second';New-Item -ItemType Directory -Path (Join-Path $second 'players/main') -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $backup 'players/main/*') -Destination (Join-Path $second 'players/main')
    Copy-Item -LiteralPath (Join-Path $backup 'db.sqlite') -Destination $second
    Assert-Throws { Write-JoshRSBackupIntegrity -BackupPath $second -Engine $engine } 'changed source during backup'
    Write-Host 'PASS: both players, SHA-256, tamper, extra file, manifest non-overwrite, changed source'
} finally { Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue }
