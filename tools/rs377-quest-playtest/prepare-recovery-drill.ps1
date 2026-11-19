$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
. (Join-Path $repo 'deploy\jparris-windows\family-health.ps1')
$source='C:\JoshRS-TestWorlds\family-polish-20261113'
$destination='C:\JoshRS-TestWorlds\family-polish-recovery-20261113'
$control=Join-Path $source 'control'
if (Test-Path -LiteralPath $destination) { throw 'Recovery drill destination exists. Refusing overwrite.' }
if ((Test-JoshRSLocalPort -Port 60121) -or (Test-JoshRSLocalPort -Port 60122)) { throw 'Source disposable world must be stopped before backup.' }
New-Item -ItemType Directory -Path (Join-Path $control 'runtime\jparris-377') -Force | Out-Null
@{engine=(Join-Path $source 'engine');content=(Join-Path $source 'content');client='C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\usb-20261030-203927\client-java';gamePort=60121;webPort=60122;source='disposable-recovery-drill'} |
    ConvertTo-Json | Set-Content -LiteralPath (Join-Path $control 'runtime\jparris-377\active.json') -Encoding UTF8
& node.exe (Join-Path $repo 'tools\rs377-saves\validate-family-world.mjs') (Join-Path $source 'engine')
if ($LASTEXITCODE -ne 0) { throw 'Disposable source validation failed.' }
$backup=New-JoshRSLocalBackup -RepoRoot $control
$copy=New-JoshRSRecoveryCopy -RepoRoot $control -BackupPath $backup -Destination $destination
if (-not $copy.Verified -or $copy.Activated) { throw 'Recovery copy did not verify as a separate unactivated copy.' }
$engine=Join-Path $destination 'engine'
New-Item -ItemType Directory -Path (Join-Path $engine 'data') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $destination 'players') -Destination (Join-Path $engine 'data\players') -Recurse
foreach ($suffix in @('','-wal','-shm')) {
    $db=Join-Path $destination ('db.sqlite'+$suffix)
    if (Test-Path -LiteralPath $db) { Copy-Item -LiteralPath $db -Destination $engine }
}
Copy-Item -LiteralPath (Join-Path $source 'engine\package.json') -Destination $engine
Copy-Item -LiteralPath (Join-Path $source 'engine\tsconfig.json') -Destination $engine
foreach ($folder in @('src','tools','node_modules')) {
    New-Item -ItemType Junction -Path (Join-Path $engine $folder) -Target (Join-Path $source ('engine\'+$folder)) | Out-Null
}
New-Item -ItemType Junction -Path (Join-Path $destination 'content') -Target (Join-Path $source 'content') | Out-Null
# Assets/configuration are copied privately. Saves, database and compiled cache
# files are physically independent; only disposable source/dependencies are shared.
& robocopy (Join-Path $source 'engine\data\pack') (Join-Path $engine 'data\pack') /E /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -gt 7) { throw 'Disposable cache copy failed.' }
& robocopy (Join-Path $source 'engine\data\config') (Join-Path $engine 'data\config') /E /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -gt 7) { throw 'Disposable configuration copy failed.' }
& robocopy (Join-Path $source 'engine\data\raw') (Join-Path $engine 'data\raw') /E /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -gt 7) { throw 'Disposable raw-data copy failed.' }
@('NODE_PORT=60221','WEB_PORT=60222','WEB_MANAGEMENT_PORT=60223','LOGIN_PORT=60224','FRIEND_PORT=60225','LOGGER_PORT=60226','NODE_PROFILE=family-polish','NODE_PRODUCTION=false','NODE_MEMBERS=true','NODE_XPRATE=1','DEV_LUNA_BOT=false','LOGIN_SERVER=false','FRIEND_SERVER=false','LOGGER_SERVER=false','DB_BACKEND=sqlite','BUILD_SRC_DIR=../content','BUILD_STARTUP=false','BUILD_VERIFY=true','BUILD_VERIFY_FOLDER=true','BUILD_VERIFY_PACK=true','EASY_STARTUP=true') |
    Set-Content -LiteralPath (Join-Path $engine '.env') -Encoding ascii
& node.exe (Join-Path $repo 'tools\rs377-saves\validate-family-world.mjs') $engine
if ($LASTEXITCODE -ne 0) { throw 'Restored disposable validation failed.' }
Write-Host 'PASS: separate offline backup and restored copy verified; ready for restored-world login tests on 60221/60222.'
$global:LASTEXITCODE=0
