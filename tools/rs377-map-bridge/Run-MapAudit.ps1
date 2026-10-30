[CmdletBinding()]
param(
  [string]$LauncherRoot = 'C:\JoshRS-Launcher\JoshRS-main',
  [string]$YanilleZip,
  [string]$EdgevilleZip
)
$ErrorActionPreference='Stop'
$launcher=(Resolve-Path -LiteralPath $LauncherRoot).Path
$active=Join-Path $launcher 'runtime\jparris-377\active.json'
if(-not(Test-Path -LiteralPath $active)){throw 'No active 377 runtime. No changes made.'}
$world=Get-Content -LiteralPath $active -Raw | ConvertFrom-Json
if(-not(Test-Path -LiteralPath $world.content -PathType Container)){throw 'Active content directory is missing.'}
$tool=Join-Path $launcher 'tools\rs377-map-bridge\audit-and-stage.mjs'
if(-not(Test-Path -LiteralPath $tool)){throw 'New map audit tool missing. Update JoshRS launcher from main.'}
$node=Get-Command node.exe -ErrorAction Stop
$zipFiles=@($YanilleZip,$EdgevilleZip) | Where-Object {$_}
if($zipFiles.Count -eq 0){throw 'Provide -YanilleZip and/or -EdgevilleZip; no automatic download or cache replacement.'}
$folder=Join-Path $launcher ('runtime\jparris-377\map-audit-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
if(Test-Path -LiteralPath $folder){throw 'Audit folder already exists; refusing overwrite.'}
New-Item -ItemType Directory -Path $folder -Force | Out-Null
foreach($zipPath in $zipFiles){
  $resolved=(Resolve-Path -LiteralPath $zipPath).Path
  if([IO.Path]::GetExtension($resolved).ToLowerInvariant() -ne '.zip'){throw "Expected .zip: $resolved"}
  $label=[IO.Path]::GetFileNameWithoutExtension($resolved) -replace '[^A-Za-z0-9_-]', '_'
  $extract=Join-Path $folder ("extracted-"+$label)
  New-Item -ItemType Directory -Path $extract -Force | Out-Null
  Expand-Archive -LiteralPath $resolved -DestinationPath $extract
  $gzFiles=@(Get-ChildItem -LiteralPath $extract -Filter '*.gz' -Recurse -File)
  if($gzFiles.Count -ne 2){throw "Expected exactly two .gz files in $resolved"}
  $inputs=Join-Path $folder ("input-"+$label)
  New-Item -ItemType Directory -Path $inputs -Force | Out-Null
  foreach($file in $gzFiles){
    if($file.Name -notmatch '^\d+\.gz$'){throw "Unexpected gzip file: $($file.Name)"}
    Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $inputs $file.Name)
  }
  $report=Join-Path $folder ("report-"+$label+".json")
  $stage=Join-Path $folder ("stage-"+$label)
  & $node.Source $tool $world.content $inputs $report $stage
  if($LASTEXITCODE -ne 0){throw "Audit failed for $resolved"}
  Write-Host "Audit report: $report"
  Write-Host "Staged JM2 (NOT INSTALL-SAFE): $stage"
}
Write-Warning 'No live maps, caches or player saves were modified. Generated JM2 sources require Agy compatibility repair before packing.'
