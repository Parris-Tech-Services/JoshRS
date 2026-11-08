[CmdletBinding()]
param([switch]$Apply)

# JoshRS revision-377 Romeo & Juliet: read-only preflight unless -Apply is set.
# Applies only the reviewed text patch. No saved characters, SQLite databases,
# map files, client jars or engine sources are modified.
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$runtime=Join-Path $root 'runtime\jparris-377'
$active=Join-Path $runtime 'active.json'
if(-not (Test-Path -LiteralPath $active -PathType Leaf)) {
    throw 'BLOCKED: selected JoshRS Windows world not configured (active.json missing).'
}
$world=Get-Content -LiteralPath $active -Raw | ConvertFrom-Json
$content=(Resolve-Path -LiteralPath ([string]$world.content)).Path
$engine=(Resolve-Path -LiteralPath ([string]$world.engine)).Path
$prefix=[IO.Path]::GetFullPath($runtime).TrimEnd('\','/')+[IO.Path]::DirectorySeparatorChar
foreach($dir in @($content,$engine)) {
    if(-not $dir.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) {
        throw 'BLOCKED: active world is outside this JoshRS private Windows runtime.'
    }
}
if((Split-Path -Leaf $content) -cne 'content' -or (Split-Path -Leaf $engine) -cne 'engine') {
    throw 'BLOCKED: unexpected engine/content layout.'
}
if([int]$world.gamePort -ne 52402 -or [int]$world.webPort -ne 8888) {
    throw 'BLOCKED: selected world ports are not the expected private JoshRS ports.'
}
$patchFolder=Join-Path $root 'content-patches\rs377\patches'
$matches=@(Get-ChildItem -LiteralPath $patchFolder -Filter '*-romeo-juliet-quest-item-and-reward-guards.patch' -File -ErrorAction Stop)
if($matches.Count -ne 1) { throw 'BLOCKED: expected exactly one approved Romeo & Juliet fix patch.' }
$patch=$matches[0].FullName
if(-not (Get-Command git.exe -ErrorAction SilentlyContinue)) { throw 'BLOCKED: Git for Windows is required.' }
$paths=@(
 'scripts/areas/area_varrock/scripts/romeo.rs2'
 'scripts/areas/area_varrock/scripts/juliet.rs2'
 'scripts/quests/quest_romeojuliet/scripts/quest_romeojuliet.rs2'
)
foreach($rel in $paths) {
    if(-not (Test-Path -LiteralPath (Join-Path $content $rel) -PathType Leaf)) {
        throw "BLOCKED: required source missing: $rel"
    }
}
$patchText=[IO.File]::ReadAllText($patch)
foreach($rel in $paths) {
    if(-not $patchText.Contains("diff --git a/$rel b/$rel")) {
        throw "BLOCKED: patch does not contain expected file: $rel"
    }
}
if(([regex]::Matches($patchText,'(?m)^diff --git ')).Count -ne $paths.Count) {
    throw 'BLOCKED: patch file modifies more than the three reviewed source scripts.'
}
function Test-Patch([switch]$Reverse) {
    $oldPreference=$ErrorActionPreference
    $ErrorActionPreference='Continue'
    try {
        if($Reverse) { & git.exe -C $content apply --reverse --check $patch 2>&1 | Out-Null }
        else { & git.exe -C $content apply --check $patch 2>&1 | Out-Null }
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference=$oldPreference
    }
}
$needsFix=Test-Patch
if(-not $needsFix -and -not (Test-Patch -Reverse)) {
    throw 'BLOCKED: source differs from expected pinned quest state; no changes made.'
}
Write-Host "SELECTED_CONTENT: $content"
Write-Host "PATCH: $patch"
Write-Host "SOURCE_NEEDS_REPAIR: $needsFix"
if(-not $Apply) {
    Write-Host 'PREFLIGHT_OK_READ_ONLY: no files have changed.'
    return
}
if(-not $needsFix) {
    Write-Host 'SOURCE_ALREADY_REPAIRED: native game playthrough is still unverified.'
    return
}
$ports=@([int]$world.gamePort,[int]$world.webPort) | Sort-Object -Unique
if(@(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue).Count -gt 0) {
    throw 'BLOCKED: game/web server still running; stop it before installing.'
}
if(-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'BLOCKED: Node/npm not found; no source changes made.'
}
$protect=Join-Path $PSScriptRoot 'Protect-Elrothiro.ps1'
if(-not (Test-Path -LiteralPath $protect -PathType Leaf)) {
    throw 'BLOCKED: family save backup tool missing.'
}
$pack=Join-Path $engine 'data\pack'
if(-not (Test-Path -LiteralPath $pack -PathType Container)) {
    throw 'BLOCKED: original compiled pack is missing.'
}
& $protect -RepoRoot $root -CreateBackup
if(-not $?) { throw 'BLOCKED: verified private family-save backup failed.' }
$backup=Join-Path $runtime ('romeojuliet377-backups\install-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$backups=@{}
foreach($rel in $paths) {
    $source=Join-Path $content $rel
    $saved=Join-Path $backup $rel
    New-Item -ItemType Directory -Path (Split-Path -Parent $saved) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $saved -Force
    if((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne
       (Get-FileHash -LiteralPath $saved -Algorithm SHA256).Hash) {
        throw "BLOCKED: verified source backup failed: $rel"
    }
    $backups[$source]=$saved
}
Copy-Item -LiteralPath $pack -Destination (Join-Path $backup 'compiled-pack') -Recurse -Force
$success=$false
try {
    & git.exe -C $content apply $patch
    if($LASTEXITCODE -ne 0) { throw "Git patch application failed: $LASTEXITCODE" }
    if(-not (Test-Patch -Reverse)) { throw 'Patch verification failed after installation.' }
    Push-Location -LiteralPath $engine
    $previousSrc=$env:BUILD_SRC_DIR
    $previousVerify=$env:BUILD_VERIFY
    $previousPack=$env:BUILD_VERIFY_PACK
    try {
        $env:BUILD_SRC_DIR=$content
        $env:BUILD_VERIFY='true'
        $env:BUILD_VERIFY_PACK='true'
        & npm.cmd run build
        if($LASTEXITCODE -ne 0) { throw "Native 377 build failed: $LASTEXITCODE" }
    } finally {
        $env:BUILD_SRC_DIR=$previousSrc
        $env:BUILD_VERIFY=$previousVerify
        $env:BUILD_VERIFY_PACK=$previousPack
        Pop-Location
    }
    foreach($rel in @('data\pack\server\script.dat','data\pack\server\script.idx')) {
        $out=Join-Path $engine $rel
        if(-not (Test-Path -LiteralPath $out -PathType Leaf) -or
           (Get-Item -LiteralPath $out).Length -le 0) {
            throw "Compiled 377 output missing: $rel"
        }
    }
    $success=$true
} finally {
    if(-not $success) {
        foreach($source in $backups.Keys) {
            Copy-Item -LiteralPath $backups[$source] -Destination $source -Force
        }
        if(Test-Path -LiteralPath $pack) { Remove-Item -LiteralPath $pack -Recurse -Force }
        Copy-Item -LiteralPath (Join-Path $backup 'compiled-pack') -Destination $pack -Recurse -Force
        Write-Host "FAILED_AND_ROLLED_BACK_SOURCES_AND_PACK: $backup"
    }
}
Write-Host "SOURCE_PATCHED_AND_COMPILED: $backup"
Write-Host 'Restart JoshRS and test Romeo, Juliet, letter exchange, Father Lawrence, Apothecary, potion, rewards and relog.'
Write-Host 'REAL_PLAYER_PLAYTHROUGH_NOT_VERIFIED'
