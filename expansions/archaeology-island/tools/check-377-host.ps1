[CmdletBinding()]
param([string]$LauncherRoot='C:\JoshRS-Launcher\JoshRS-main',[switch]$Json)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath $LauncherRoot).Path
$stateFile=Join-Path $root 'runtime\jparris-377\active.json'
if(-not(Test-Path -LiteralPath $stateFile)){throw "No active.json. This requires an installed JoshRS 377 host; no files were changed."}
$state=Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
$checks=New-Object System.Collections.Generic.List[object]
function Add-Check([string]$name,[bool]$pass,[string]$details){$script:checks.Add([pscustomobject]@{name=$name;passed=$pass;details=$details})}
$expected=[ordered]@{engine='src\engine\World.ts';content='scripts';client='gradlew.bat'}
foreach($key in $expected.Keys){
 $dir=[string]$state.$key
 Add-Check "$key exists" (Test-Path -LiteralPath $dir -PathType Container) $dir
 if(Test-Path -LiteralPath $dir -PathType Container){Add-Check "$key signature" (Test-Path -LiteralPath (Join-Path $dir $expected[$key])) (Join-Path $dir $expected[$key])}
}
$gp=[int]$state.gamePort;$wp=[int]$state.webPort
Add-Check '377 port relationship' ($wp -eq ($gp - 43594 + 80)) "game=$gp web=$wp"
$engine=[string]$state.engine;$content=[string]$state.content
if(Test-Path -LiteralPath $engine -PathType Container){
 $envPath=Join-Path $engine '.env'
 Add-Check 'host env exists' (Test-Path -LiteralPath $envPath) $envPath
 $savePath=Join-Path $engine 'data\players'
 Add-Check 'player save directory exists' (Test-Path -LiteralPath $savePath -PathType Container) $savePath
}
if(Test-Path -LiteralPath $content -PathType Container){
 $packDir=Join-Path $content 'pack'
 Add-Check 'content pack directory' (Test-Path -LiteralPath $packDir -PathType Container) $packDir
 foreach($filename in @('model.pack','model.order','loc.pack','npc.pack','obj.pack')){
  $path=Join-Path $packDir $filename
  Add-Check "optional pack $filename" (Test-Path -LiteralPath $path -PathType Leaf) $path
 }
}
$sourceOk=(@($checks | Where-Object {($_.name -in @('engine exists','engine signature','content exists','content signature','client exists','client signature','377 port relationship')) -and -not $_.passed}).Count -eq 0)
$report=[pscustomobject]@{generated=(Get-Date).ToString('o');readOnly=$true;sourceVerified=$sourceOk;installable=$false;reason='No trusted 377-compatible packed maps/models or runtime-specific RuneScript patches exist in the source pack';checks=@($checks)}
if($Json){$report | ConvertTo-Json -Depth 6}else{$checks | Format-Table -AutoSize;Write-Host "Source verified: $sourceOk";Write-Warning 'Tideglass installation BLOCKED: compatible caches and runtime-specific scripts are not prepared. No files changed.'}
