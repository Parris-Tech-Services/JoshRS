[CmdletBinding()]
param([Parameter(Mandatory)][string]$RepoRoot,[Parameter(Mandatory)][string]$ReleaseRoot)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'family-health.ps1')
$s=Get-JoshRSStatus -RepoRoot $RepoRoot
if (-not $s.Configured -or $s.GamePortOpen -or $s.WebPortOpen -or (Test-JoshRSRuntimeIdentity -Engine $s.Engine)) {
    throw 'The selected world must be completely stopped before installation.'
}
$manifest=Get-Content -LiteralPath (Join-Path $ReleaseRoot 'manifest.json') -Raw | ConvertFrom-Json
$expected=@(
    (Join-Path $s.Content 'scripts\joshrs_original\scripts\burgh_gate.rs2'),
    (Join-Path $s.Content 'scripts\joshrs_original\scripts\burgh_vilager_3.rs2'),
    (Join-Path $s.Content 'scripts\joshrs_original\scripts\peace_shirt_journal.rs2'),
    (Join-Path $s.Engine 'data\pack\server\script.dat'),
    (Join-Path $s.Engine 'data\pack\server\script.idx'),
    (Join-Path $s.Content 'pack\script.pack')
) | ForEach-Object { [IO.Path]::GetFullPath($_) }
if ($manifest.version -ne 1 -or @($manifest.files).Count -ne 6) { throw 'Unexpected release manifest.' }
$seen=@{}
foreach ($file in $manifest.files) {
    $target=[IO.Path]::GetFullPath($file.target)
    if ($expected -notcontains $target -or $seen.ContainsKey($target)) { throw 'Release contains an unexpected or repeated destination.' }
    $seen[$target]=$true
    if ($file.payload -notmatch '^[0-5]$') { throw 'Invalid release payload path.' }
    $payload=Join-Path $ReleaseRoot $file.payload
    if ((Get-FileHash -LiteralPath $payload -Algorithm SHA256).Hash -ne $file.after) { throw 'Release payload changed after testing.' }
    if ($file.before) {
        if (-not (Test-Path -LiteralPath $target -PathType Leaf) -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $file.before) { throw 'Installed source changed since staging. Reconcile before deployment.' }
    } elseif (Test-Path -LiteralPath $target) { throw 'A new release file already exists. Refusing overwrite.' }
}
& node.exe (Join-Path $PSScriptRoot '..\..\tools\rs377-saves\validate-family-world.mjs') $s.Engine
if ($LASTEXITCODE -ne 0) { throw 'Family saves or account database failed verification. Nothing installed.' }
$saveBackup=New-JoshRSLocalBackup -RepoRoot $RepoRoot
$saveProof=Test-JoshRSBackupIntegrity -BackupPath $saveBackup
if (-not $saveProof.Verified) { throw 'Offline save backup failed verification.' }
$releaseBackup=Join-Path $RepoRoot ('runtime\jparris-377\backups\family-polish-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
if (Test-Path -LiteralPath $releaseBackup) { throw 'Release backup already exists.' }
New-Item -ItemType Directory -Path $releaseBackup | Out-Null
$entries=@()
foreach ($file in $manifest.files) {
    if ($file.before) {
        Copy-Item -LiteralPath $file.target -Destination (Join-Path $releaseBackup $file.payload) -ErrorAction Stop
        if ((Get-FileHash -LiteralPath (Join-Path $releaseBackup $file.payload)).Hash -ne $file.before) { throw 'Rollback file verification failed.' }
    }
    $entries+=,$file
}
@{version=1;engine=$s.Engine;content=$s.Content;saveBackup=$saveBackup;files=$entries} |
    ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $releaseBackup 'rollback.json') -Encoding UTF8
$written=@()
try {
    foreach ($file in $entries) {
        Copy-Item -LiteralPath (Join-Path $ReleaseRoot $file.payload) -Destination $file.target -ErrorAction Stop
        $written+=,$file
        if ((Get-FileHash -LiteralPath $file.target).Hash -ne $file.after) { throw 'Installed payload hash differs.' }
    }
    # Deployment does not touch saves or accounts. Prove every byte still matches
    # the verified offline snapshot, including all profiles and SQLite sidecars.
    $integrity=Get-Content -LiteralPath (Join-Path $saveBackup 'integrity.json') -Raw | ConvertFrom-Json
    foreach ($record in $integrity.files) {
        $source=if ($record.relativePath.StartsWith('players/')) {
            Join-Path $s.Engine ('data\players\'+$record.relativePath.Substring(8).Replace('/','\'))
        } else { Join-Path $s.Engine $record.relativePath }
        if ((Get-FileHash -LiteralPath $source).Hash -ne $record.sha256) { throw 'A save/account file changed during offline installation.' }
    }
} catch {
    foreach ($file in @($written | Sort-Object payload -Descending)) {
        if ($file.before) { Copy-Item -LiteralPath (Join-Path $releaseBackup $file.payload) -Destination $file.target -Force }
        elseif (Test-Path -LiteralPath $file.target) { Remove-Item -LiteralPath $file.target -Force }
    }
    throw
}
Write-Host 'Installed six verified source/script-pack files. All offline save/account bytes are unchanged.'
Write-Host "Verified save backup: $saveBackup"
Write-Host "Code rollback files: $releaseBackup"
@{installed=(Get-Date).ToUniversalTime().ToString('o');source='windows-family-polish-20261113';files=@($entries | Select-Object kind,name,after);saveBackup=$saveBackup;rollback=$releaseBackup} |
    ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $RepoRoot 'runtime\jparris-377\family-polish-installed.json') -Encoding UTF8
