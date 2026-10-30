[CmdletBinding()]
param([switch]$InstallSunshine,[switch]$CheckOnly)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
. (Join-Path $PSScriptRoot 'support.ps1')
$s=Get-JoshRSStatus -RepoRoot $repo
Write-Host 'JoshRS 377 — free local-network mobile streaming preflight'
if (-not $s.Configured) { Write-Warning 'No complete personalised 377 installation detected. Do not launch a clean replacement world.'; if(-not $CheckOnly){exit 1}else{return} }
$save=Join-Path $s.Engine 'data\players\main\elrothiro.sav'
if(-not(Test-Path -LiteralPath $save -PathType Leaf)){throw 'Elrothiro character save missing in active world: streaming would show a different character.'}
$validator=Join-Path $repo 'tools\rs377-saves\inspect-save.mjs'
$node=Get-Command node.exe -ErrorAction Stop
if(-not(Test-Path -LiteralPath $validator -PathType Leaf)){throw 'Native save format verifier missing.'}
$summary=& $node.Source $validator $save
if($LASTEXITCODE -ne 0){throw 'Native Elrothiro save CRC check failed. Do not start streaming or restore.'}
$report=($summary -join [Environment]::NewLine)|ConvertFrom-Json
if(-not $report.valid){throw 'Elrothiro save invalid'}
Write-Host "Valid 377 Elrothiro save: $($report.bytes) bytes; skill XP $($report.totalSkillXP)."
Write-Host "Configured game TCP port: $($s.GamePort); game listening: $($s.GamePortOpen)"
Write-Host 'Sunshine does NOT replace the existing Java client or relocate player saves.'
$sunshineExe=@(
 (Join-Path $env:ProgramFiles 'Sunshine\sunshine.exe'),
 (Join-Path $env:ProgramFiles 'Sunshine\tools\sunshine.exe')
)|Where-Object{Test-Path -LiteralPath $_ -PathType Leaf}|Select-Object -First 1
if(-not $sunshineExe){
 if($InstallSunshine -and -not $CheckOnly){
  $winget=Get-Command winget.exe -ErrorAction Stop
  Write-Host 'Installing the free LizardByte Sunshine Windows streaming host (requires Windows consent).'
  & $winget.Source install --id LizardByte.Sunshine --exact --source winget --accept-source-agreements --accept-package-agreements
  if($LASTEXITCODE -ne 0){throw 'Sunshine installation failed; no changes were made to JoshRS.'}
 }else{Write-Host 'Sunshine is not detected. Optional: winget install -e --id LizardByte.Sunshine'}
}else{Write-Host "Sunshine installed: $sunshineExe"}
Write-Host 'On the desktop, configure Sunshine securely at https://localhost:47990 (set a strong password).'
Write-Host 'On Android, install Moonlight Game Streaming and pair to this Windows computer on the same Wi-Fi.'
Write-Host 'Launch the existing JoshRS Java client as normal, then stream the Windows desktop in Moonlight.'
Write-Host 'Do NOT open router ports or expose the Sunshine web UI publicly.'
Write-Host 'Remote account login / phone input / full gameplay NOT tested by this preflight.'
