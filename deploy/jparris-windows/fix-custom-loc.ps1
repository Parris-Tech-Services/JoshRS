[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$runtime=Join-Path $repo 'runtime\jparris-377'
$stateFile=Join-Path $runtime 'active.json'
. (Join-Path $PSScriptRoot 'custom-loc-core.ps1')
if (-not (Test-Path -LiteralPath $stateFile -PathType Leaf)) {
    throw 'No configured JoshRS world found. Complete USB setup first.'
}
$state=Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
if ([string]$state.source -ne 'usb') {
    throw 'This option is only for the imported custom Fedora world, not a clean upstream game.'
}
$engine=(Resolve-Path -LiteralPath ([string]$state.engine) -ErrorAction Stop).Path
$parent=(Split-Path -Parent $engine)
$expectedRuntime=[IO.Path]::GetFullPath($runtime).TrimEnd('\')
$actualParent=[IO.Path]::GetFullPath((Split-Path -Parent $parent)).TrimEnd('\')
if (-not [string]::Equals((Split-Path -Leaf $engine),'engine',[StringComparison]::OrdinalIgnoreCase) -or
    -not [string]::Equals($actualParent,$expectedRuntime,[StringComparison]::OrdinalIgnoreCase) -or
    (Split-Path -Leaf $parent) -notmatch '^usb-[0-9]{8}-[0-9]{6}$') {
    throw 'The active engine is not a copied Windows USB snapshot. Original USB source will not be modified.'
}
# Stop before editing the engine source/pack settings, ensuring there are no
# file-watch races or live player save operations.
$ports=@([int]$state.gamePort,[int]$state.webPort,8898) | Select-Object -Unique
$listeners=@(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) {
    throw "JoshRS is still running or one of its ports is occupied. Save/log out and stop the server with Ctrl+C before applying the custom loc fix. Ports: $($listeners.LocalPort -join ', ')"
}
$backupRoot=Join-Path $runtime 'custom-loc-backups'
$result=Enable-JoshRSCustomLocChecks -EnginePath $engine -BackupRoot $backupRoot
Write-Host $result.Message
if ($result.BackupPath) { Write-Host "Original environment and pack source backed up locally: $($result.BackupPath)" }
Write-Host 'Reopen JoshRS and log in again. Existing chat lines are history; future modified-loc rebuilds should not trigger the original CRC warning.'
Write-Host 'All other pack verification and config parsing remain enabled.'
