$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot '..\Install-FredGeorgeRelogFix.ps1'
$script=(Resolve-Path -LiteralPath $script).Path
$tokens=$null;$errors=$null
[Management.Automation.Language.Parser]::ParseFile($script,[ref]$tokens,[ref]$errors)|Out-Null
if($errors.Count){throw "PowerShell parser reported $($errors.Count) errors"}
$source=Get-Content -LiteralPath $script -Raw
foreach($required in @('Get-GitBlob','Assert-WorldStopped','-CreateBackup','[IO.File]::Replace','UNKNOWN_LOCAL_CUSTOMISATIONS','a8e2d2503566dc7af35ea9d74ecdb2956792e2a0')) {
    if(-not $source.Contains($required)){throw "Guard absent: $required"}
}
$folder=Join-Path ([IO.Path]::GetTempPath()) ('joshrs-fg-updater-'+[guid]::NewGuid().ToString('n'))
$game=Join-Path $folder 'runtime\jparris-377\usb-test\engine'
try {
    New-Item -ItemType Directory -Path (Join-Path $game 'src\engine\bot') -Force|Out-Null
    $stateFile=Join-Path $folder 'runtime\jparris-377\active.json'
    @{engine=$game;gamePort=52402;webPort=8888} | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
    $target=Join-Path $game 'src\engine\bot\FredGeorgeBot.ts'
    [IO.File]::WriteAllText($target,'private customised bot implementation',[Text.UTF8Encoding]::new($false))
    $before=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    $output=(& $script -RepoRoot $folder 2>&1 | Out-String)
    if($output -notmatch 'UNKNOWN_LOCAL_CUSTOMISATIONS'){throw "Preflight did not report unknown source: $output"}
    $failed=$false
    try{& $script -RepoRoot $folder -Apply|Out-Null}catch{$failed=$true}
    if(-not $failed){throw 'Unknown local bot source was not rejected'}
    if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $before){throw 'Modified unknown source'}
    if(Test-Path -LiteralPath (Join-Path $folder 'runtime\jparris-377\source-recovery')){throw 'Created source recovery folder before verifying source'}
    Write-Output 'PASS: Windows parser, preflight and unknown-source refusal (no production world, saves or source touched)'
} finally{
    if(Test-Path -LiteralPath $folder){Remove-Item -LiteralPath $folder -Recurse -Force}
}
