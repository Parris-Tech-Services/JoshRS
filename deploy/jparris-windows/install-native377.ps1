[CmdletBinding()]
param([switch]$Apply)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$runtime=Join-Path $root 'runtime/jparris-377'
$active=Join-Path $runtime 'active.json'
if (-not (Test-Path -LiteralPath $active -PathType Leaf)) { throw 'Run JoshRS.cmd setup before installing the addon.' }
$state=Get-Content -LiteralPath $active -Raw | ConvertFrom-Json
$engine=(Resolve-Path -LiteralPath ([string]$state.engine)).Path
$contentDir=(Resolve-Path -LiteralPath ([string]$state.content)).Path
$prefix=[IO.Path]::GetFullPath($runtime).TrimEnd('\','/')+[IO.Path]::DirectorySeparatorChar
if (-not $engine.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase) -or
    -not $contentDir.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase) -or
    (Split-Path -Leaf $engine) -ne 'engine' -or
    (Split-Path -Leaf $contentDir) -ne 'content') {
    throw 'Refusing to modify an original USB or a game outside JoshRS private runtime.'
}
$ports=@([int]$state.gamePort,[int]$state.webPort,8898) | Sort-Object -Unique
if (@(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue).Count -gt 0) {
    throw 'The JoshRS server is running. Log out and stop it gracefully before installing.'
}
$sourceRoot=Join-Path $root 'content-factory/generated/native377'
$manifest=Get-Content -LiteralPath (Join-Path $sourceRoot 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.schema -ne 1 -or $manifest.includes_player_save_changes -ne $false -or
    @($manifest.files).Count -ne 2 -or @($manifest.npc_names).Count -ne 1) {
    throw 'Unexpected content manifest; no changes made.'
}
$npc=[string]$manifest.npc_names[0]
if ($npc -cnotmatch '^joshrs_[a-z0-9_]{1,60}$') { throw 'Invalid original NPC name.' }
$planned=@()
foreach ($entry in @($manifest.files)) {
    $rel=[string]$entry.path
    if ($rel -cnotmatch '^scripts/areas/joshrs_custom/(configs|scripts)/joshrs_[a-z0-9_]+\.(rs2|npc)$') {
        throw "Blocked file path: $rel"
    }
    $source=Join-Path $sourceRoot $rel.Replace('/','\')
    $destination=Join-Path $contentDir $rel.Replace('/','\')
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing file: $rel" }
    $sha=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    if (-not $sha.Equals([string]$entry.sha256,[StringComparison]::OrdinalIgnoreCase)) { throw "Bad checksum: $rel" }
    if (Test-Path -LiteralPath $destination) {
        $present=(Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
        if (-not $present.Equals($sha,[StringComparison]::OrdinalIgnoreCase)) { throw "Existing custom file differs: $destination" }
    }
    $planned+=@{Source=$source;Destination=$destination}
}
$packFile=Join-Path $contentDir 'pack/npc.pack'
$shared=Join-Path $engine 'tools/pack/config/PackShared.ts'
$envFile=Join-Path $engine '.env'
foreach($path in @($packFile,$shared,$envFile)) {
    if(-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Required active game file missing: $path" }
}
$originalPack=[IO.File]::ReadAllText($packFile)
$maxId=-1; $seenIds=@{}; $seenNames=@{}; $presentNpc=$false
foreach($row in ($originalPack -split '\r?\n')) {
    $line=$row.Trim()
    if(-not $line -or $line.StartsWith('//')) { continue }
    if($line -cnotmatch '^([0-9]+)=([^=]+)$') { throw 'Invalid existing NPC registry.' }
    $id=[int]$Matches[1]; $name=[string]$Matches[2]
    if($seenIds.ContainsKey($id) -or $seenNames.ContainsKey($name)) { throw 'Duplicate NPC registry entry.' }
    $seenIds[$id]=$true; $seenNames[$name]=$true
    if($id -gt $maxId) { $maxId=$id }
    if($name -eq $npc) { $presentNpc=$true }
}
if(-not $presentNpc -and $maxId -ge 65534) { throw 'No spare NPC ID.' }
$originalSource=[IO.File]::ReadAllText($shared)
$originalEnv=[IO.File]::ReadAllText($envFile)
$stock='if (Environment.BUILD_VERIFY && validate && !validate(client.dat, server.dat)) {'
$loc="if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && !validate(client.dat, server.dat)) {"
$npcCheck="!(extension === '.npc' && process.env.JOSHRS_CUSTOM_NPCS === 'true')"
$onlyNpc="if (Environment.BUILD_VERIFY && validate && $npcCheck && !validate(client.dat, server.dat)) {"
$both="if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && $npcCheck && !validate(client.dat, server.dat)) {"
if($originalSource.Contains($stock)) { $newSource=$originalSource.Replace($stock,$onlyNpc) }
elseif($originalSource.Contains($loc)) { $newSource=$originalSource.Replace($loc,$both) }
elseif($originalSource.Contains($onlyNpc) -or $originalSource.Contains($both)) { $newSource=$originalSource }
else { throw 'Unsupported engine checksum source. Refusing to disable broad verification.' }
if($originalEnv -match '(?m)^[ \t]*BUILD_VERIFY[ \t]*=[ \t]*false(?:\s|$)') { throw 'General BUILD_VERIFY is disabled. Investigate first.' }
if($originalEnv -match '(?m)^[ \t]*JOSHRS_CUSTOM_NPCS[ \t]*=' -and
    $originalEnv -notmatch '(?m)^[ \t]*JOSHRS_CUSTOM_NPCS[ \t]*=[ \t]*true(?:\s|$)') {
    throw 'Conflicting JOSHRS_CUSTOM_NPCS setting.'
}
$newEnv=$originalEnv
if($originalEnv -notmatch '(?m)^[ \t]*JOSHRS_CUSTOM_NPCS[ \t]*=') {
    $newEnv=$originalEnv.TrimEnd([char[]]@([char]13,[char]10))+[Environment]::NewLine+'JOSHRS_CUSTOM_NPCS=true'+[Environment]::NewLine
}
Write-Host "Private game content: $contentDir"
Write-Host "Original NPC: $npc"
Write-Host $(if($presentNpc){'NPC ID already registered'}else{"New NPC ID: $($maxId+1)"})
if(-not $Apply) { Write-Host 'CHECK ONLY; no changes made. Run JoshRS-Install-377-Content.cmd to install.'; exit 0 }
if(-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm.cmd is missing. Run JoshRS.cmd setup first.' }
$backup=Join-Path $runtime ('native377-backups/install-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$items=@(
    @{Path=(Join-Path $engine 'data/pack');Name='engine-pack'},
    @{Path=(Join-Path $contentDir 'pack');Name='content-pack'},
    @{Path=(Join-Path $contentDir 'scripts/areas/joshrs_custom');Name='custom-source'},
    @{Path=$shared;Name='PackShared.ts'},
    @{Path=$envFile;Name='engine.env'}
)
foreach($item in $items) {
    if(Test-Path -LiteralPath $item.Path) {
        Copy-Item -LiteralPath $item.Path -Destination (Join-Path $backup $item.Name) -Recurse -Force
    }
}
try {
    foreach($file in $planned) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $file.Destination) -Force | Out-Null
        if(-not (Test-Path -LiteralPath $file.Destination)) {
            Copy-Item -LiteralPath $file.Source -Destination $file.Destination
        }
    }
    if(-not $presentNpc) {
        $nl=[Environment]::NewLine
        $sep=if($originalPack.EndsWith([string][char]10)){''}else{$nl}
        [IO.File]::AppendAllText($packFile,$sep+[string]($maxId+1)+'='+$npc+$nl)
    }
    if($newSource -ne $originalSource) { [IO.File]::WriteAllText($shared,$newSource) }
    if($newEnv -ne $originalEnv) { [IO.File]::WriteAllText($envFile,$newEnv) }
    Push-Location -LiteralPath $engine
    try {
        $env:BUILD_SRC_DIR=$contentDir
        $env:BUILD_VERIFY='true'
        $env:BUILD_VERIFY_PACK='true'
        $env:JOSHRS_CUSTOM_NPCS='true'
        & npm.cmd run build
        if($LASTEXITCODE -ne 0) { throw "377 compiler failed: $LASTEXITCODE" }
    } finally { Pop-Location }
    foreach($relative in @('data/pack/server/script.dat','data/pack/server/script.idx')) {
        if(-not (Test-Path -LiteralPath (Join-Path $engine $relative) -PathType Leaf)) {
            throw "Compilation output absent: $relative"
        }
    }
    Write-Host "377 content compiled. Safe local backup: $backup"
    Write-Host 'Start JoshRS and test the new guide with the admin NPC spawn command.'
} catch {
    $reason=$_.Exception.Message
    foreach($item in $items) {
        $snapshot=Join-Path $backup $item.Name
        if(Test-Path -LiteralPath $item.Path) { Remove-Item -LiteralPath $item.Path -Force -Recurse }
        if(Test-Path -LiteralPath $snapshot) {
            Copy-Item -LiteralPath $snapshot -Destination $item.Path -Recurse -Force
        }
    }
    throw "Build failed; copied scripts, compiled packs and engine settings restored. Player saves untouched. $reason"
}
