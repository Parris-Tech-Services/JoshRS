param([ValidateSet('complete','new-player')][string]$Scenario)
$ErrorActionPreference='Stop'
$env:ISO_ENGINE_DIR='C:\JoshRS-TestWorlds\family-polish-recovery-20261113\engine'
$env:ISO_PORT='60221';$env:ISO_WEB_PORT='60222';$env:ISO_PROFILE='family-polish'
$output=Join-Path $env:ISO_ENGINE_DIR ('recovery-'+$Scenario+'.txt')
& node.exe (Join-Path $PSScriptRoot 'dialogue_test.mjs') (Join-Path $PSScriptRoot ('recovery-'+$Scenario+'.json')) *> $output
$result=$LASTEXITCODE
Get-Content -LiteralPath $output | Select-String '^PASS|^FAIL|RESULT|EVIDENCE MODE'
exit $result
