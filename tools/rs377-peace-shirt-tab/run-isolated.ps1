param([ValidateSet('new-player','complete')][string]$Scenario)
$ErrorActionPreference='Stop'
$env:ISO_ENGINE_DIR='C:\JoshRS-TestWorlds\family-polish-20261113\engine'
$env:ISO_PORT='60121';$env:ISO_WEB_PORT='60122';$env:ISO_PROFILE='family-polish'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$output=Join-Path $env:ISO_ENGINE_DIR ('tab-'+$Scenario+'.txt')
& node.exe (Join-Path $repo 'tools\rs377-quest-playtest\dialogue_test.mjs') (Join-Path $PSScriptRoot ('tab-'+$Scenario+'.json')) *> $output
$result=$LASTEXITCODE
Get-Content -LiteralPath $output | Select-String '^PASS|^FAIL|RESULT|EVIDENCE MODE'
exit $result
