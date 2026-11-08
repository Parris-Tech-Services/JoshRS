[CmdletBinding()]
param([switch]$Apply)

# JoshRS 377 Cook range and optional NPC guide fix.
# Read-only by default. Does not touch player saves, accounts, database or .env.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$runtime = Join-Path $root 'runtime\jparris-377'
$active = Join-Path $runtime 'active.json'
if (-not (Test-Path -LiteralPath $active -PathType Leaf)) { throw 'JoshRS active.json is missing.' }
$state = Get-Content -LiteralPath $active -Raw | ConvertFrom-Json
$contentDir = (Resolve-Path -LiteralPath ([string]$state.content)).Path
$engine = (Resolve-Path -LiteralPath ([string]$state.engine)).Path
$prefix = [IO.Path]::GetFullPath($runtime).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
foreach ($candidate in @($contentDir,$engine)) {
    if (-not $candidate.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) {
        throw 'BLOCKED: active world is outside the private JoshRS Windows runtime.'
    }
}
if ((Split-Path -Leaf $contentDir) -cne 'content' -or (Split-Path -Leaf $engine) -cne 'engine') {
    throw 'BLOCKED: unrecognised engine/content layout.'
}
if ([int]$state.gamePort -ne 52402 -or [int]$state.webPort -ne 8888) {
    throw 'BLOCKED: unexpected game/web ports.'
}
$quest = Join-Path $contentDir 'scripts\quests\quest_cook\scripts\quest_cook.rs2'
$cooking = Join-Path $contentDir 'scripts\skill_cooking\scripts\cooking.rs2'
if (-not (Test-Path -LiteralPath $quest) -or -not (Test-Path -LiteralPath $cooking)) {
    throw 'BLOCKED: 377 quest or cooking script missing.'
}
$generic = [IO.File]::ReadAllText($cooking)
if (-not $generic.Contains('[label,attempt_cook_item]') -or
    -not $generic.Contains('loc_type = cooksquestrange')) {
    throw 'BLOCKED: generic cooking and special-range modifiers are not present.'
}
$oldText = [IO.File]::ReadAllText($quest)
$lf = [string][char]10
$crlf = [string][char]13 + $lf
$normalized = $oldText.Replace($crlf,$lf)
$rangeAnchor = '[oplocu,cooksquestrange]'
if ($normalized.Split([string[]]@($rangeAnchor),[StringSplitOptions]::None).Count -ne 2) {
    throw 'BLOCKED: the special range must have exactly one source handler.'
}
$old = '    //TODO 377 enable Lumbridge range after cooking is ported' + $lf +
       '    //@attempt_cook_item(last_useitem);'
$new = '    @attempt_cook_item(last_useitem);'
$beforeMatches = [regex]::Matches($normalized,[regex]::Escape($old)).Count
$rangeSection = $normalized.Split([string[]]@($rangeAnchor),[StringSplitOptions]::None)[1]
$afterMatches = [regex]::Matches($rangeSection,'(?m)^ *\@attempt_cook_item\(last_useitem\);$').Count
if ($beforeMatches -eq 1 -and $afterMatches -eq 0) {
    $patched = $normalized.Replace($old,$new)
} elseif ($beforeMatches -eq 0 -and $afterMatches -eq 1 -and
        $rangeSection.Contains('%cookquest < ^cook_complete')) {
    $patched = $normalized
} else {
    throw 'BLOCKED: unexpected or conflicting Cook range source. No changes made.'
}
if ($oldText.Contains($crlf)) { $patched = $patched.Replace($lf,$crlf) }
$rangeNeedsChange = $patched -cne $oldText

# These short guidance lines are ORIGINAL JoshRS content, not Jagex transcripts.
# Existing dialogue is always preserved, never duplicated.
$helpers = @(
    @{
        Name='millie_the_miller'
        Rel='scripts\areas\area_lumbridge\scripts\joshrs_cook_millie_377.rs2'
        Text=@'
// Original JoshRS functional guidance, not a transcript of Jagex dialogue.
// The NPC and original game-world placements are provided by the pinned 377 cache.
[opnpc1,millie_the_miller]
~chatnpc("<p,neutral>To make flour, put grain in the hopper upstairs, then operate the controls.");
~chatnpc("<p,neutral>After that, take an empty pot to the flour bin on the ground floor.");
'@
    },
    @{
        Name='gillie_the_milkmaid'
        Rel='scripts\areas\area_lumbridge\scripts\joshrs_cook_gillie_377.rs2'
        Text=@'
// Original JoshRS functional guidance, not a transcript of Jagex dialogue.
// The NPC and original game-world placements are provided by the pinned 377 cache.
[opnpc1,gillie_the_milkmaid]
~chatnpc("<p,neutral>For fresh milk, bring an empty bucket and milk one of the dairy cows in the field.");
'@
    }
)
$scripts = @(Get-ChildItem -LiteralPath (Join-Path $contentDir 'scripts') -Filter '*.rs2' -Recurse -File)
$missing = @()
foreach ($helper in $helpers) {
    $pattern = '(?m)^\[opnpc1,' + [regex]::Escape([string]$helper.Name) + '\]\s*$'
    $found = @()
    foreach ($script in $scripts) {
        if ([regex]::IsMatch([IO.File]::ReadAllText($script.FullName),$pattern)) {
            $found += $script.FullName
        }
    }
    if ($found.Count -gt 1) { throw "BLOCKED: duplicate NPC handler for $($helper.Name)." }
    if ($found.Count -eq 1) {
        Write-Host "NPC_HANDLER_ALREADY_PRESENT: $($helper.Name) in $($found[0])"
        continue
    }
    $destination = Join-Path $contentDir ([string]$helper.Rel)
    if (Test-Path -LiteralPath $destination) {
        throw "BLOCKED: conflicting helper exists at $destination"
    }
    $missing += @{Name=$helper.Name; Destination=$destination; Text=$helper.Text}
    Write-Host "NPC_HANDLER_MISSING: $($helper.Name) - safe original functional guidance available"
}
Write-Host "ACTIVE_WORLD: $contentDir"
Write-Host "RANGE_NEEDS_PATCH: $rangeNeedsChange"
Write-Host "SUPPORT_NPCS_MISSING: $($missing.Count)"
if (-not $Apply) {
    Write-Host 'PREFLIGHT_OK: READ ONLY. Close JoshRS before using -Apply.'
    return
}
$ports = @([int]$state.gamePort,[int]$state.webPort) | Sort-Object -Unique
if (@(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue).Count -gt 0) {
    throw 'BLOCKED: JoshRS is still running. Stop the world gracefully.'
}
if (-not $rangeNeedsChange -and $missing.Count -eq 0) {
    Write-Host 'SOURCE_ALREADY_PATCHED. Real player testing still required.'
    return
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'BLOCKED: npm.cmd missing.' }
$protect = Join-Path $PSScriptRoot 'Protect-Elrothiro.ps1'
if (-not (Test-Path -LiteralPath $protect -PathType Leaf)) {
    throw 'BLOCKED: family save backup helper missing.'
}
$pack = Join-Path $engine 'data\pack'
if (-not (Test-Path -LiteralPath $pack -PathType Container)) {
    throw 'BLOCKED: compiled pack directory missing.'
}
& $protect -RepoRoot $root -CreateBackup
if (-not $?) { throw 'BLOCKED: family save backup could not be verified.' }
$backup = Join-Path $runtime ('cooksrange377-backups\install-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $quest -Destination (Join-Path $backup 'quest_cook.rs2') -Force
if ((Get-FileHash -LiteralPath $quest -Algorithm SHA256).Hash -ne
    (Get-FileHash -LiteralPath (Join-Path $backup 'quest_cook.rs2') -Algorithm SHA256).Hash) {
    throw 'BLOCKED: source backup SHA256 mismatch.'
}
Copy-Item -LiteralPath $pack -Destination (Join-Path $backup 'compiled-pack') -Recurse -Force
$success = $false
try {
    if ($rangeNeedsChange) { [IO.File]::WriteAllText($quest,$patched,[Text.UTF8Encoding]::new($false)) }
    foreach ($helper in $missing) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $helper.Destination) -Force | Out-Null
        [IO.File]::WriteAllText($helper.Destination,([string]$helper.Text).TrimEnd() + $lf,[Text.UTF8Encoding]::new($false))
    }
    $previousSrc=$env:BUILD_SRC_DIR
    $previousVerify=$env:BUILD_VERIFY
    $previousPack=$env:BUILD_VERIFY_PACK
    Push-Location -LiteralPath $engine
    try {
        $env:BUILD_SRC_DIR=$contentDir
        $env:BUILD_VERIFY='true'
        $env:BUILD_VERIFY_PACK='true'
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw "Native 377 build failed with code $LASTEXITCODE" }
    } finally {
        $env:BUILD_SRC_DIR=$previousSrc
        $env:BUILD_VERIFY=$previousVerify
        $env:BUILD_VERIFY_PACK=$previousPack
        Pop-Location
    }
    foreach ($name in @('data\pack\server\script.dat','data\pack\server\script.idx')) {
        $artifact=Join-Path $engine $name
        if (-not (Test-Path -LiteralPath $artifact -PathType Leaf) -or
            (Get-Item -LiteralPath $artifact).Length -lt 1) {
            throw "Native script pack output missing: $name"
        }
    }
    $success=$true
} finally {
    if (-not $success) {
        if ($rangeNeedsChange) {
            Copy-Item -LiteralPath (Join-Path $backup 'quest_cook.rs2') -Destination $quest -Force
        }
        foreach ($helper in $missing) {
            if (Test-Path -LiteralPath $helper.Destination -PathType Leaf) {
                Remove-Item -LiteralPath $helper.Destination -Force
            }
        }
        if (Test-Path -LiteralPath $pack) { Remove-Item -LiteralPath $pack -Recurse -Force }
        Copy-Item -LiteralPath (Join-Path $backup 'compiled-pack') -Destination $pack -Recurse -Force
        Write-Host "COMPILATION_FAILED; SOURCE_AND_PACK_ROLLED_BACK: $backup"
    }
}
Write-Host "SOURCE_PATCHED_AND_COMPILED: backup $backup"
Write-Host 'Restart JoshRS; test cooking, Millie, Gillie, quest rewards and relog.'
Write-Host 'FULL_LIVE_QUEST_VERIFICATION: NOT YET DONE'
