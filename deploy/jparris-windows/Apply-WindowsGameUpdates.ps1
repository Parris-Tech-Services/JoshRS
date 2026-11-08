[CmdletBinding()]
param([switch]$Apply)

# JoshRS revision-377 Windows update coordinator.
# Designed to run unattended from setup.ps1 after an initial install, and from
# the Control Center when repairing/updating an existing game. Fail closed on
# unknown local source. Optional region/NPC mods and unfinished quests are NOT
# bundled automatically.
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$runtime=(Resolve-Path -LiteralPath (Join-Path $root 'runtime/jparris-377')).Path
$activePath=Join-Path $runtime 'active.json'
if(-not (Test-Path -LiteralPath $activePath -PathType Leaf)){
    throw 'No active 377 world. Run JoshRS.cmd setup first.'
}
$state=Get-Content -LiteralPath $activePath -Raw | ConvertFrom-Json
$engine=(Resolve-Path -LiteralPath ([string]$state.engine)).Path
$contentDir=(Resolve-Path -LiteralPath ([string]$state.content)).Path
$expected=$runtime.TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
foreach($location in @($engine,$contentDir)) {
    if(-not $location.StartsWith($expected,[StringComparison]::OrdinalIgnoreCase)) {
        throw 'Active game is outside the protected Windows runtime; no updates applied.'
    }
}
if((Split-Path -Leaf $engine) -cne 'engine' -or
   (Split-Path -Leaf $contentDir) -cne 'content' -or
   (Split-Path -Parent $engine) -cne (Split-Path -Parent $contentDir)) {
    throw 'Engine and content must belong to the same selected 377 snapshot.'
}
if([int]$state.gamePort -ne 52402 -or [int]$state.webPort -ne 8888) {
    Write-Warning 'Bundled patches skipped for nonstandard game/web ports; the configured world was not changed.'
    Write-Host 'WINDOWS_GAME_UPDATES_SKIPPED: Review the custom service topology before applying patches.'
    return
}
if(-not (Test-Path -LiteralPath (Join-Path $engine 'src/app.ts') -PathType Leaf) -or
   -not (Test-Path -LiteralPath (Join-Path $contentDir 'scripts') -PathType Container)) {
    throw 'Incomplete selected engine or content; refusing updates.'
}
if($Apply) {
    # No silent service disruption, including a separately running friends/login
    # worker. Does not stop servers or change any save/account in use.
    $ports=@([int]$state.gamePort,[int]$state.webPort,43500,43501,45099) | Sort-Object -Unique
    $busy=@([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
        Where-Object { $_.Port -in $ports })
    if($busy.Count -gt 0) {
        throw 'A JoshRS service port is listening. Log out everyone and stop all game services before updating.'
    }
}

function Invoke-GuardedPatch([string]$Name,[string]$Script,[string[]]$Arguments=@()){
    # Dedicated process: existing Friends installer intentionally calls exit 0.
    $args=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',$Script) + $Arguments
    # PowerShell 5.1 may surface a child process' stderr as an ErrorRecord.
    # A preflight refusal must be captured as BLOCKED, not abort the whole
    # update pipeline before we inspect its non-zero exit code.
    $priorErrorAction=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $output=@(& powershell.exe @args 2>&1)
        $code=$LASTEXITCODE
    } finally {
        $ErrorActionPreference=$priorErrorAction
    }
    return [pscustomobject]@{
        Name=$Name; ExitCode=$code; Text=($output -join [Environment]::NewLine)
    }
}
function Write-Outcome([string]$Name,[string]$State,[string]$Reason){
    Write-Host ("UPDATE {0}: {1} - {2}" -f $Name,$State,$Reason)
}
function Report-Blocked([string]$Name,[string]$Reason){
    # The user may still play their prior working world. Never guess how to
    # merge unknown custom source automatically.
    $short=($Reason -replace '\s+',' ').Trim()
    if($short.Length -gt 230){$short=$short.Substring(0,230)}
    Write-Warning ("UPDATE {0}: BLOCKED_CUSTOM_SOURCE - {1}" -f $Name,$short)
}

Write-Host ("JoshRS native 377 game updates: " + $(if($Apply){'APPLY'}else{'READ-ONLY CHECK'}))
Write-Host "Target runtime: $runtime"

# 1. Existing full ten-bar quest is fixed using exact old/new native 377
# source anchors and a reversible compiled pack backup. Missing scripts are
# NOT replaced by guessed generated quest content.
$barFiles=@(
    'scripts/areas/area_barbarian_outpost/scripts/barbarian_outpost_guard.rs2',
    'scripts/areas/area_barbarian_outpost/scripts/outpost_gate.rs2',
    'scripts/areas/area_seers/scripts/thormac.rs2',
    'scripts/areas/area_port_sarim/scripts/bartender.rs2',
    'scripts/areas/area_karamja/scripts/zambo.rs2'
)
$missing=@($barFiles | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $contentDir $_) -PathType Leaf)
})
if($missing.Count -gt 0) {
    Write-Outcome 'BARCRAWL' 'NOT_INCLUDED' 'Missing native 377 bartender/guard sources; no changes.'
} else {
    $installer=Join-Path $PSScriptRoot 'Install-Barcrawl377.ps1'
    $check=Invoke-GuardedPatch 'BARCRAWL' $installer
    if($check.ExitCode -ne 0 -or $check.Text -notmatch 'PREFLIGHT_OK') {
        Report-Blocked 'BARCRAWL' $check.Text
    } elseif(-not $Apply) {
        Write-Outcome 'BARCRAWL' 'PREFLIGHT_OK' 'Native source supported. No changes.'
    } else {
        $result=Invoke-GuardedPatch 'BARCRAWL' $installer @('-Apply')
        if($result.ExitCode -ne 0 -or
           $result.Text -notmatch 'SOURCE_INSTALLED_AND_COMPILED|SOURCE_ALREADY_PATCHED') {
            throw ('BARCRAWL install/compile did not complete. Review its rollback log. ' + $result.Text)
        }
        Write-Outcome 'BARCRAWL' 'COMPLETE' 'Source integrated or already current; compiled on changes.'
    }
}

# 2. Fresh JoshRS .env files already enable Friends. Old USB snapshots might
# have FRIEND_SERVER=false; the existing installer handles only the reviewed
# embedded service topology and backs up credentials privately.
$friends=Join-Path $PSScriptRoot 'fix-disabled-friends.ps1'
$friendCheck=Invoke-GuardedPatch 'FRIENDS' $friends
if($friendCheck.ExitCode -ne 0 -or $friendCheck.Text -notmatch 'READ-ONLY PREFLIGHT') {
    Report-Blocked 'FRIENDS' $friendCheck.Text
} elseif(-not $Apply) {
    Write-Outcome 'FRIENDS' 'PREFLIGHT_OK' 'Embedded-service configuration checked; no changes.'
} else {
    $result=Invoke-GuardedPatch 'FRIENDS' $friends @('-Apply')
    if($result.ExitCode -ne 0 -or
       $result.Text -notmatch 'Both flags are already true|Friends and embedded startup flags enabled') {
        throw ('FRIENDS config update did not complete. ' + $result.Text)
    }
    Write-Outcome 'FRIENDS' 'COMPLETE' 'Configuration enabled or already current; service not restarted.'
}

# 3. Luna is a custom bot, absent in clean upstream worlds. Touch only the
# exact known constructor and only when its native save exists and validates.
$botSource=Join-Path $engine 'src/engine/entity/BotPlayer.ts'
$lunaSave=Join-Path $engine 'data/players/main/Luna.sav'
if(-not (Test-Path -LiteralPath $botSource -PathType Leaf)) {
    Write-Outcome 'LUNA_PLAYTIME' 'NOT_INCLUDED' 'No Luna bot source on this world.'
} elseif(-not (Test-Path -LiteralPath $lunaSave -PathType Leaf)) {
    Write-Outcome 'LUNA_PLAYTIME' 'NO_SAVED_BOT' 'Bot source exists but Luna save missing; no change.'
} else {
    $luna=Join-Path $PSScriptRoot 'Repair-LunaPlaytime.ps1'
    $check=Invoke-GuardedPatch 'LUNA_PLAYTIME' $luna @('-RepoRoot',$root)
    if($check.ExitCode -ne 0 -or $check.Text -notmatch 'Status:\s*(PATCHABLE|ALREADY_PATCHED)') {
        Report-Blocked 'LUNA_PLAYTIME' $check.Text
    } elseif($check.Text -match 'Status:\s*ALREADY_PATCHED') {
        Write-Outcome 'LUNA_PLAYTIME' 'ALREADY_PATCHED' 'No change.'
    } elseif(-not $Apply) {
        Write-Outcome 'LUNA_PLAYTIME' 'PATCHABLE' 'Patch available after a verified offline backup.'
    } else {
        $result=Invoke-GuardedPatch 'LUNA_PLAYTIME' $luna @('-RepoRoot',$root,'-Apply')
        if($result.ExitCode -ne 0 -or
           $result.Text -notmatch 'PATCHED_SOURCE|ALREADY_PATCHED') {
            throw ('LUNA_PLAYTIME source update did not complete. ' + $result.Text)
        }
        Write-Outcome 'LUNA_PLAYTIME' 'COMPLETE' 'Source patched after native save verification.'
    }
}

Write-Host 'OPTIONAL: Yrsa stock, custom loc CRC, Eadgar, Fred/George, extra NPCs and agent manager are not blindly installed.'
Write-Host 'NOT YET INTEGRATED: Rag and Bone Man quest, missing map/objects and unfinished historical quest content.'
Write-Host 'GitHub source updates do not verify real-client quest playthroughs. Test gameplay after the next normal launch.'
Write-Host $(if($Apply){'WINDOWS_GAME_UPDATES_COMPLETE: All compatible built-in updates processed; inspect any BLOCKED warnings.'}else{'WINDOWS_GAME_UPDATES_PREFLIGHT_COMPLETE: No source, save, database or config files changed.'})
