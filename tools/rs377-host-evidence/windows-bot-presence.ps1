param([string]$Root='C:\JoshRS-Launcher\JoshRS-main')
# Read-only private host status for JoshRS rev377 bots. Never reads passwords, keys or saves.
$ErrorActionPreference='Stop'
$statePath=Join-Path $Root 'runtime\jparris-377\active.json'
$s=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$engine=[IO.Path]::GetFullPath([string]$s.engine)
if(-not (Test-Path (Join-Path $engine 'src\app.ts') -PathType Leaf)){throw 'Configured game engine not found'}
$envPath=Join-Path $engine '.env'
$allow=@('NODE_PROFILE','JOSHRS_FRED_GEORGE','DEV_LUNA_BOT','FRIEND_SERVER','NODE_PORT','WEB_PORT','FRIEND_PORT')
$config=@{}
foreach($line in @(Get-Content -LiteralPath $envPath)){if($line -match '^([A-Z][A-Z0-9_]*)=(.*)$' -and $allow -contains $matches[1]){$config[$matches[1]]=$matches[2].Trim()}}
$profile=if($config['NODE_PROFILE']){$config['NODE_PROFILE']}else{'main'}
if($profile -notmatch '^[a-zA-Z0-9_-]+$'){throw 'Unsafe or unknown profile; refusing to inspect save filenames'}
$saving=Join-Path $engine ('data\players\'+$profile)
$botSaves=@()
if(Test-Path -LiteralPath $saving){$botSaves=@(Get-ChildItem -LiteralPath $saving -File -Filter '*.sav' | Where-Object {$_.BaseName -in @('Fred','George','Luna')} | Sort-Object Name | ForEach-Object { [pscustomobject]@{name=$_.BaseName;bytes=$_.Length;modifiedUtc=$_.LastWriteTimeUtc.ToString('o')} })}
$botSource=Join-Path $engine 'src\engine\bot\FredGeorgeBot.ts'
$worldSource=Join-Path $engine 'src\engine\World.ts'
$installed=[ordered]@{fredGeorgeBotSource=(Test-Path -LiteralPath $botSource -PathType Leaf);worldSource=(Test-Path -LiteralPath $worldSource -PathType Leaf)}
$ports=@(52402,8888,43500,43501,45099)
$listeners=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$ports -contains $_.LocalPort} | Sort-Object LocalPort -Unique | ForEach-Object { [pscustomobject]@{port=$_.LocalPort;pid=$_.OwningProcess} })
$r=Join-Path $Root 'runtime\jparris-377'
$candidate=Join-Path $r 'fred-george-isolated\live-bot-state.json'
$evidence=[ordered]@{pathType='isolated_or_external_telemetry_not_family_proof';exists=(Test-Path -LiteralPath $candidate -PathType Leaf)}
if($evidence.exists){
  $item=Get-Item -LiteralPath $candidate
  $evidence['modifiedUtc']=$item.LastWriteTimeUtc.ToString('o')
  try{$j=Get-Content -LiteralPath $candidate -Raw | ConvertFrom-Json
    $evidence['updatedEpochMs']=$j.updated_epoch_ms
    $evidence['worldId']=$j.world_id
    $evidence['fredReportedOnline']=$j.bots.Fred.online
    $evidence['georgeReportedOnline']=$j.bots.George.online
  }catch{$evidence['parseError']='Cannot read bot-only telemetry JSON'}
}
$out=[ordered]@{scope='READ_ONLY_LOCAL_BOT_STATUS_NO_LIVE_CHANGES';gameEngineFound=$true;profile=$profile;botFlags=$config;installedSource=$installed;ports=$listeners;saveMetadata=$botSaves;botTelemetry=$evidence;note='Engine-side players and isolated telemetry do not prove friend visibility or RS SDK connections.'}
$out|ConvertTo-Json -Depth 7
