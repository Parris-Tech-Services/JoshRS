[CmdletBinding()]
param(
    [string]$RepoRoot='',
    [switch]$CreateBackup,
    [string]$VerifyBackup=''
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
Write-Host "ACTIVE ELROTHIRO SAVE FOUND: $($save.Length) bytes."
Write-Host "Modified UTC: $($save.LastWriteTimeUtc.ToString('o'))"
Write-Host "SHA-256: $hash"
Write-Host "Account database present: $($status.DatabasePresent)"
Write-Host "Player save files detected: $($status.SaveCount)"
Write-Host 'Binary save presence does not prove a successful game login or that it is your newest progress.'
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
