$ErrorActionPreference='Stop'
$temp=Join-Path ([IO.Path]::GetTempPath()) ('joshrs-bot-fixture-'+[guid]::NewGuid().ToString('n'))
$engine=Join-Path $temp 'runtime\jparris-377\engine'
try {
 New-Item -ItemType Directory -Force -Path (Join-Path $engine 'src'),(Join-Path $engine 'data\players\main') | Out-Null
 Set-Content -LiteralPath (Join-Path $engine 'src\app.ts') -Value 'synthetic' -Encoding UTF8
 Set-Content -LiteralPath (Join-Path $engine '.env') -Value @('NODE_PROFILE=main','DEV_LUNA_BOT=true','JOSHRS_FRED_GEORGE=1','DB_PASS=NEVER_LOG_SECRET') -Encoding UTF8
 Set-Content -LiteralPath (Join-Path $temp 'runtime\jparris-377\active.json') -Value (@{engine=$engine}|ConvertTo-Json) -Encoding UTF8
 [IO.File]::WriteAllBytes((Join-Path $engine 'data\players\main\Fred.sav'),[byte[]](1,2,3))
 $script=Join-Path $PSScriptRoot '..\windows-bot-presence.ps1'
 $text=(& $script -Root $temp) -join [Environment]::NewLine
 $result=$text|ConvertFrom-Json
 if($result.scope -ne 'READ_ONLY_LOCAL_BOT_STATUS_NO_LIVE_CHANGES'){throw 'Bad diagnostic scope'}
 if($result.profile -ne 'main' -or $result.botFlags.DEV_LUNA_BOT -ne 'true' -or $result.botFlags.JOSHRS_FRED_GEORGE -ne '1'){throw 'Flags wrong'}
 if(@($result.saveMetadata).Count -ne 1 -or $result.saveMetadata[0].name -ne 'Fred'){throw 'Save metadata wrong'}
 if($text -match 'NEVER_LOG_SECRET'){throw 'Secret leaked'}
 if(-not (Test-Path -LiteralPath (Join-Path $engine 'data\players\main\Fred.sav'))){throw 'Diagnostic modified saves'}
 Write-Output 'PASS: Windows read-only bot status sanitisation, config, save metadata and nonmutation'
} finally { if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp -Recurse -Force} }
