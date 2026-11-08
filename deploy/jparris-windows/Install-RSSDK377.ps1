# Installs the complete pinned RS-SDK source as a private, isolated dependency.
# Never modifies an active JoshRS engine/content/client, account, or player save.
# PowerShell 5.1 compatible. Does not start a game server or bot.
[CmdletBinding()]
param(
    [string]$Root = 'C:\JoshRS-Launcher\JoshRS-main',
    [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$pin = 'db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb'
$upstream = 'https://github.com/MaxBittker/rs-sdk.git'
$rootPath = (Resolve-Path -LiteralPath $Root -ErrorAction Stop).Path
$runtime = Join-Path $rootPath 'runtime\jparris-377'
if (-not (Test-Path -LiteralPath (Join-Path $runtime 'active.json') -PathType Leaf)) {
    throw 'This is not the expected JoshRS launcher runtime. No changes made.'
}
$dest = Join-Path $runtime ('upstream-rs-sdk-' + $pin)
$git = Get-Command git.exe -ErrorAction SilentlyContinue
if (-not $git) { $git = Get-Command git -ErrorAction SilentlyContinue }
$bun = Get-Command bun.exe -ErrorAction SilentlyContinue
if (-not $bun) { $bun = Get-Command bun -ErrorAction SilentlyContinue }
if (-not $git) { throw 'Git is required. Install Git for Windows; existing game untouched.' }
if (-not $bun) { throw 'Bun is required to execute the original RS-SDK TypeScript. Existing game untouched.' }
function Get-ExactCommit([string]$Dir) {
    $sha = (& $git.Source -C $Dir rev-parse HEAD 2>&1)
    if ($LASTEXITCODE -ne 0) { throw 'Could not verify SDK Git commit. No overwrite performed.' }
    return ([string]$sha).Trim()
}
if (Test-Path -LiteralPath $dest) {
    if (-not (Test-Path -LiteralPath (Join-Path $dest 'sdk\index.ts') -PathType Leaf)) {
        throw 'SDK destination exists without original source. Refusing to overwrite it.'
    }
    if ((Get-ExactCommit $dest) -cne $pin) {
        throw 'SDK destination contains a different source revision. Refusing to overwrite it.'
    }
    Write-Host ('UPSTREAM_RS_SDK_PINNED_ALREADY_PRESENT: ' + $dest)
    if ($CheckOnly) { Write-Host 'CHECK_ONLY: no game or SDK files changed.'; return }
    if (-not (Test-Path -LiteralPath (Join-Path $dest 'node_modules') -PathType Container)) {
        throw 'SDK checkout lacks dependencies. Refusing to modify an existing checkout; restore into a new clean folder.'
    }
    Write-Host 'SDK_AVAILABLE: upstream source and local dependencies present. No game changes.'
    return
}
if ($CheckOnly) {
    Write-Host ('SDK_NOT_INSTALLED: ' + $dest)
    Write-Host 'CHECK_ONLY: Git and Bun available. Zero changes to SDK or game files.'
    return
}
$stage = Join-Path $runtime ('.rs-sdk-install-' + [guid]::NewGuid().ToString('N'))
$created = $false
try {
    & $git.Source clone --no-checkout --filter=blob:none --depth 1 $upstream $stage
    if ($LASTEXITCODE -ne 0) { throw 'Could not clone upstream RS-SDK.' }
    $created = $true
    & $git.Source -C $stage fetch --depth 1 origin $pin
    if ($LASTEXITCODE -ne 0) { throw 'Could not fetch pinned upstream SDK revision.' }
    & $git.Source -C $stage checkout --detach $pin
    if ($LASTEXITCODE -ne 0) { throw 'Could not checkout pinned upstream SDK.' }
    if ((Get-ExactCommit $stage) -cne $pin) { throw 'Upstream SDK commit mismatch.' }
    if (-not (Test-Path -LiteralPath (Join-Path $stage 'sdk\index.ts') -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path $stage 'sdk\actions.ts') -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path $stage 'LICENSE') -PathType Leaf)) {
        throw 'Pinned SDK code or licence is missing.'
    }
    Push-Location -LiteralPath $stage
    try {
        # Never run third-party dependency lifecycle scripts automatically.
        & $bun.Source install --ignore-scripts
        if ($LASTEXITCODE -ne 0) { throw 'Pinned SDK dependency installation failed.' }
    } finally { Pop-Location }
    if (-not (Test-Path -LiteralPath (Join-Path $stage 'node_modules') -PathType Container)) {
        throw 'SDK dependency installation produced no node_modules directory.'
    }
    if (Test-Path -LiteralPath $dest) { throw 'Destination appeared while installing; no overwrite.' }
    Move-Item -LiteralPath $stage -Destination $dest -ErrorAction Stop
    $created = $false
    Write-Host 'UPSTREAM_RS_SDK_INSTALLED: pinned full SDK source and dependencies.'
    Write-Host ('SDK_DIRECTORY: ' + $dest)
    Write-Host 'The family game and player saves were not read, changed or restarted.'
    Write-Host 'The SDK is not connected to the family world. An isolated gateway is required.'
} finally {
    if ($created -and (Test-Path -LiteralPath $stage)) {
        Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    }
}
