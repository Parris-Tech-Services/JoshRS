[CmdletBinding()]
param(
    [string]$RepoRoot='',
    [switch]$CreateBackup,
    [string]$VerifyBackup='',
    [string]$CandidateSavePath=''
)
$ErrorActionPreference='Stop'
if (-not $RepoRoot) { $RepoRoot=Join-Path $PSScriptRoot '..\..' }
$RepoRoot=(Resolve-Path -LiteralPath $RepoRoot -ErrorAction Stop).Path
. (Join-Path $PSScriptRoot 'support.ps1')
. (Join-Path $PSScriptRoot 'save-integrity.ps1')
if ($VerifyBackup) {
    $r=Test-JoshRSBackupIntegrity -BackupPath $VerifyBackup
    Write-Host "VERIFIED BACKUP INTEGRITY: $($r.FileCount) files. Elrothiro present: $($r.ContainsElrothiro)"
    return
}
$status=Get-JoshRSStatus -RepoRoot $RepoRoot
if (-not $status.Configured) { throw 'JoshRS 377 is not configured here. No saves changed.' }
$savePath=Join-Path $status.Engine 'data\players\main\elrothiro.sav'
if (-not (Test-Path -LiteralPath $savePath -PathType Leaf)) {
    throw 'Elrothiro save not found in ACTIVE world. Stop: a different or clean world may be selected.'
}
$save=Get-Item -LiteralPath $savePath
if ($save.Length -lt 32) { throw 'Elrothiro save is unexpectedly small. Do not restore or replace it.' }
$hash=(Get-FileHash -LiteralPath $savePath -Algorithm SHA256).Hash
$codeRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$validator=Join-Path $codeRoot 'tools\rs377-saves\inspect-save.mjs'
if (-not (Test-Path -LiteralPath $validator -PathType Leaf)) { throw '377 save-format validator is missing. Update JoshRS first.' }
$node=Get-Command node.exe -ErrorAction Stop
$validationOutput=& $node.Source $validator $savePath
if ($LASTEXITCODE -ne 0) { throw 'Elrothiro failed the native 377 save-format/CRC verification.' }
$decoded=($validationOutput -join [Environment]::NewLine) | ConvertFrom-Json
if (-not $decoded.valid -or $decoded.version -gt 7 -or $decoded.sha256 -ne $hash) {
    throw 'Elrothiro save format, checksum or SHA-256 does not match.'
}
Write-Host "VALIDATED native 377 save version $($decoded.version), CRC32 $($decoded.crc32)."
Write-Host "Total skill XP: $($decoded.totalSkillXP); playtime ticks: $($decoded.playtimeTicks)."
Write-Host "ACTIVE ELROTHIRO SAVE FOUND: $($save.Length) bytes."
Write-Host "Modified UTC: $($save.LastWriteTimeUtc.ToString('o'))"
Write-Host "SHA-256: $hash"
Write-Host "Account database present: $($status.DatabasePresent)"
if ($status.DatabasePresent) {
    $accountTool=Join-Path $codeRoot 'tools\rs377-saves\inspect-account-db.mjs'
    if (Test-Path -LiteralPath $accountTool -PathType Leaf) {
        $dbPath=Join-Path $status.Engine 'db.sqlite'
        $dbOutput=& $node.Source $accountTool $dbPath
        if ($LASTEXITCODE -eq 0) {
            $dbReport=($dbOutput -join [Environment]::NewLine) | ConvertFrom-Json
            Write-Host "Account DB quick_check passed: $($dbReport.sqliteVerified). Account records: $($dbReport.accountRecords)."
            if (-not $dbReport.characterAccountPresent) {
                Write-Warning 'Elrothiro account record NOT FOUND in the current SQLite DB; save alone cannot prove login restoration.'
            }
        } else {
            Write-Warning 'Account DB integrity could not be verified. Do not presume that login recovery works.'
            $global:LASTEXITCODE=0 # Database inspection is advisory; PowerShell must not report a failed backup.
        }
    }
}

Write-Host "Player save files detected: $($status.SaveCount)"
Write-Host 'Binary save presence does not prove a successful game login or that it is your newest progress.'
if ($CandidateSavePath) {
    $candidate=(Resolve-Path -LiteralPath $CandidateSavePath -ErrorAction Stop).Path
    $output=& $node.Source $validator $candidate
    if ($LASTEXITCODE -ne 0) { throw 'Recovery candidate failed revision-377 CRC verification. Do not restore.' }
    $other=($output -join [Environment]::NewLine) | ConvertFrom-Json
    Write-Host "Recovery candidate valid: $($other.bytes) bytes; SHA-256: $($other.sha256)."
    if ($other.sha256 -eq $decoded.sha256) {
        Write-Host 'Recovery candidate is byte-identical to the current active Elrothiro save.'
    } else {
        Write-Host "Compared with active: XP difference $($other.totalSkillXP - $decoded.totalSkillXP); playtime-tick difference $($other.playtimeTicks - $decoded.playtimeTicks)."
        Write-Warning 'Differences do NOT prove which save has the latest items, quests or progress. No files have been restored.'
    }
}

if ($CreateBackup) {
    if ($status.GamePortOpen -or $status.WebPortOpen) {
        throw 'Stop the game gracefully before backup. No copy made.'
    }
    $dest=New-JoshRSLocalBackup -RepoRoot $RepoRoot
    $report=Write-JoshRSBackupIntegrity -BackupPath $dest -Engine $status.Engine
    if (-not $report.Verified -or -not $report.ContainsElrothiro) {
        throw 'The copy does not contain verified Elrothiro data. Do not restore.'
    }
    $after=(Get-FileHash -LiteralPath $savePath -Algorithm SHA256).Hash
    if ($hash -ne $after) { throw 'Elrothiro changed during backup. Snapshot must not be used.' }
    Write-Host "VERIFIED OFFLINE BACKUP CREATED: $dest"
    Write-Host "Files checked: $($report.FileCount); Elrothiro preserved: True"
    Write-Host 'Keep one additional encrypted copy on a separate offline drive. Never publish saves in GitHub.'
}
