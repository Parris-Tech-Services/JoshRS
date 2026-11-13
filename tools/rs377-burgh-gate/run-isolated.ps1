param([string]$Engine='C:\JoshRS-TestWorlds\family-polish-20261113\engine',[string]$Scenario='gate-playtest.json')
$ErrorActionPreference='Stop'
if ([IO.Path]::GetFullPath($Engine) -notlike 'C:\JoshRS-TestWorlds\family-polish-*\engine') { throw 'Only the dedicated disposable family-polish engine is allowed.' }
$env:ISO_ENGINE_DIR=$Engine
$env:ISO_PORT='60121'
$env:ISO_WEB_PORT='60122'
$env:ISO_PROFILE='family-polish'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$output=Join-Path $Engine ($Scenario+'.txt')
& node.exe (Join-Path $repo 'tools\rs377-quest-playtest\dialogue_test.mjs') (Join-Path $PSScriptRoot $Scenario) *> $output
$result=$LASTEXITCODE
Get-Content -LiteralPath $output
exit $result
