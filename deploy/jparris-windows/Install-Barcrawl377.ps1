[CmdletBinding()]
param([switch]$Apply)

# Guarded, non-destructive text edits for the known selected JoshRS Windows 377 world.
# Never switches worlds or touches accounts/player saves.
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$runtime=Join-Path $root 'runtime/jparris-377'
$state=Get-Content -LiteralPath (Join-Path $runtime 'active.json') -Raw | ConvertFrom-Json
$contentDir=(Resolve-Path -LiteralPath ([string]$state.content)).Path
$engine=(Resolve-Path -LiteralPath ([string]$state.engine)).Path
$prefix=[IO.Path]::GetFullPath($runtime).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
if(-not $contentDir.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase) -or
   -not $engine.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase) -or
   (Split-Path -Leaf $contentDir) -cne 'content' -or
   (Split-Path -Leaf $engine) -cne 'engine') {
    throw 'The selected game is not the private JoshRS Windows runtime.'
}
if([int]$state.gamePort -ne 52402 -or [int]$state.webPort -ne 8888) {
    throw 'Unexpected ports: refusing to target a different world.'
}
$changes=@(
 @{File='scripts/areas/area_barbarian_outpost/scripts/barbarian_outpost_guard.rs2'
   Before=@'
        %barcrawl = ^barcrawl_started;
        inv_add(inv, barcrawl_card, 1);
'@
   After=@'
        if(inv_freespace(inv) < 1) {
            ~chatnpc("<p,neutral>Make room in your pack before I give you a card.");
            return;
        }
        %barcrawl = ^barcrawl_started;
        inv_add(inv, barcrawl_card, 1);
'@
 },
 @{File='scripts/areas/area_barbarian_outpost/scripts/barbarian_outpost_guard.rs2'
   Before=@'
    ~chatnpc("<p,angry>What are you like?|You're gonna have to start all over now.");
    %barcrawl = 1;
    inv_add(inv, barcrawl_card, 1);
'@
   After=@'
    ~chatnpc("<p,neutral>I'll replace your card. Your earlier stops still count.");
    if(inv_freespace(inv) < 1) {
        ~chatnpc("<p,neutral>Make room in your pack and ask me again.");
        return;
    }
    inv_add(inv, barcrawl_card, 1);
'@
 },
 @{File='scripts/areas/area_barbarian_outpost/scripts/outpost_gate.rs2'
   Before=@'
    if(npc_find(coord, barbguard1, 5, 0) = true) {
        @outpost_guard_talk;
    }
}
sound_synth
'@
   After=@'
    if(npc_find(coord, barbguard1, 5, 0) = true) {
        @outpost_guard_talk;
    }
    // An absent guard, declined challenge or unfinished card must not open the gate.
    if(%barcrawl ! ^barcrawl_complete) {
        mes("Finish Alfred Grimhand's Barcrawl before entering the outpost.");
        return;
    }
}
sound_synth
'@
 },
 @{File='scripts/areas/area_seers/scripts/thormac.rs2'
   Before=@'
[label,thormac_assistance]
// COMMENTED OUT FOR NOW: Not sure if this is an OSRS update, you can only start the quest if the barcrawl has been previously completed
// (this doesn't include if you use a dupe card to redo the barcrawl, which is why i'm checking it like this)
//if(testbit(%barcrawl_progress, 1) = ^false) {
//    ~chatnpc("<p,neutral>Hello I am Thormac the sorcerer.");
//    ~chatplayer("<p,quiz>Do you need anything?");
//    ~chatnpc("<p,neutral>Not right now, but thank you for offering.");
//    ~mesbox("You do not meet all of the requirements to start|the Scorpion Catcher quest.");
//    return;
//}
~chatnpc
'@
   After=@'
[label,thormac_assistance]
if(%barcrawl ! ^barcrawl_complete) {
    ~chatnpc("<p,neutral>Only those who have finished the Barbarian Outpost drinking challenge can help me.");
    ~mesbox("Complete Alfred Grimhand's Barcrawl before starting Scorpion Catcher.");
    return;
}
~chatnpc
'@
 },
 @{File='scripts/areas/area_port_sarim/scripts/bartender.rs2'
   Before=@'
if(inv_total(inv, coins) < 7) {
    ~chatplayer("<p,sad>I don't have 8 coins with me.");
'@
   After=@'
if(inv_total(inv, coins) < 8) {
    ~chatplayer("<p,sad>I don't have 8 coins with me.");
'@
 },
 @{File='scripts/areas/area_karamja/scripts/zambo.rs2'
   Before=@'
mes("You swirl it around and swallow it.");
p_delay(2);
mes("Zambo signs your card.");
'@
   After=@'
mes("You swirl it around and swallow it.");
p_delay(2);
stat_sub(attack, 5, 5);
stat_sub(defence, 5, 5);
mes("Zambo signs your card.");
'@
 }
)
$lf=[string][char]10
$crlf=([string][char]13)+$lf
$files=@{}
foreach($change in $changes) {
    $path=Join-Path $contentDir $change.File
    if(-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Missing source file: $($change.File)"
    }
    if(-not $files.ContainsKey($path)) {
        $old=[IO.File]::ReadAllText($path)
        $files[$path]=@{Original=$old; New=$old.Replace($crlf,$lf)}
    }
    $file=$files[$path]
    $before=([string]$change.Before).Replace($crlf,$lf)
    $after=([string]$change.After).Replace($crlf,$lf)
    $count=[regex]::Matches($file.New,[regex]::Escape($before)).Count
    if($count -eq 1) {
        $file.New=$file.New.Replace($before,$after)
    } elseif($count -eq 0 -and $file.New.Contains($after)) {
        # Exact patch is already present.
    } else {
        throw "Unexpected local source or duplicate handler in $($change.File); no edits made."
    }
}
$changed=@($files.Keys | Where-Object { $files[$_].New -cne $files[$_].Original.Replace($crlf,$lf) })
Write-Host "ACTIVE_CONTENT: $contentDir"
Write-Host "CHECKED_FILES: $($files.Count); FILES_TO_PATCH: $($changed.Count)"
if(-not $Apply) {
    Write-Host 'PREFLIGHT_OK: READ_ONLY. Run with -Apply only when everyone is logged out and server stopped.'
    return
}
$ports=@([int]$state.gamePort,[int]$state.webPort) | Sort-Object -Unique
if(@(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue).Count -gt 0) {
    throw 'The game server is still running. Stop it gracefully first.'
}
if($changed.Count -eq 0) {
    Write-Host 'SOURCE_ALREADY_PATCHED: no edits; runtime compilation/playthrough not verified.'
    return
}
if(-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm.cmd missing.' }
$protect=Join-Path $PSScriptRoot 'Protect-Elrothiro.ps1'
if(-not (Test-Path -LiteralPath $protect)) { throw 'Verified family backup tool missing.' }
& $protect -RepoRoot $root -CreateBackup
if(-not $?) { throw 'Verified family backup failed; no source changed.' }
$pack=Join-Path $engine 'data/pack'
if(-not (Test-Path -LiteralPath $pack -PathType Container)) { throw 'Original compiled pack missing.' }
$backup=Join-Path $runtime ('barcrawl377-backups/install-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$names=@{}
$i=0
foreach($p in $files.Keys) {
    $i++
    $name='source-' + $i + '.rs2'
    Copy-Item -LiteralPath $p -Destination (Join-Path $backup $name) -Force
    if((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash -ne
       (Get-FileHash -LiteralPath (Join-Path $backup $name) -Algorithm SHA256).Hash) {
        throw 'Source backup verification failed.'
    }
    $names[$p]=$name
}
Copy-Item -LiteralPath $pack -Destination (Join-Path $backup 'compiled-pack') -Recurse -Force
$compiled=$false
try {
    foreach($p in $changed) {
        $out=$files[$p].New
        if($files[$p].Original.Contains($crlf)) { $out=$out.Replace($lf,$crlf) }
        [IO.File]::WriteAllText($p,$out,[Text.UTF8Encoding]::new($false))
    }
    Push-Location -LiteralPath $engine
    try {
        $env:BUILD_SRC_DIR=$contentDir
        $env:BUILD_VERIFY='true'
        $env:BUILD_VERIFY_PACK='true'
        & npm.cmd run build
        if($LASTEXITCODE -ne 0) { throw "Native 377 build failed: $LASTEXITCODE" }
    } finally { Pop-Location }
    foreach($file in @('data/pack/server/script.dat','data/pack/server/script.idx')) {
        $p=Join-Path $engine $file
        if(-not (Test-Path -LiteralPath $p) -or (Get-Item -LiteralPath $p).Length -eq 0) {
            throw "Missing compiled output: $file"
        }
    }
    $compiled=$true
} finally {
    if(-not $compiled) {
        foreach($p in $names.Keys) {
            Copy-Item -LiteralPath (Join-Path $backup $names[$p]) -Destination $p -Force
        }
        if(Test-Path -LiteralPath $pack) { Remove-Item -LiteralPath $pack -Recurse -Force }
        Copy-Item -LiteralPath (Join-Path $backup 'compiled-pack') -Destination $pack -Recurse -Force
        Write-Host "BUILD_FAILED_AND_ROLLED_BACK: $backup"
    }
}
Write-Host 'SOURCE_INSTALLED_AND_COMPILED: Restart JoshRS and test gameplay and relog.'
Write-Host "Source/pack backup: $backup"
