# Exact-commit, exact-Git-blob, no-overwrite Windows Agent Manager installer.
# Runs on JParrisDesktop with PowerShell 5.1. No game restart; no private data upload.
[CmdletBinding()]
param(
    [string]$Root = 'C:\JoshRS-Launcher\JoshRS-main',
    [switch]$Launch
)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root -ErrorAction Stop).Path
if (-not (Test-Path -LiteralPath (Join-Path $Root 'runtime\jparris-377\active.json') -PathType Leaf)) {
    throw 'Expected JoshRS private runtime is missing. Refusing to install into an unrelated directory.'
}
$repo = 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/6800b9dc06c83b8de623587729c83220910d905f'
$manifest = @(
    @{path='JoshRS-Agent-Manager.cmd';sha='55453198d08f522b4b68bde4ee184a3cef79aa30'}
    @{path='deploy/jparris-windows/Start-JoshRSAgentManager.ps1';sha='8e0a710e44cfe5c7237308b0c38c0a0699fe0bcb'}
    @{path='tools/rs377-agent-manager/fleet.mjs';sha='a7efb361f6b6aa9c25d43115193e4ba4ce072796'}
    @{path='tools/rs377-agent-manager/native377.mjs';sha='d4a9946acedfc12bcae6939c886d1b319d60b34e'}
    @{path='tools/rs377-agent-manager/serve.mjs';sha='d05d6456a61eed81b659ae97e5508f2409510950'}
    @{path='tools/rs377-agent-manager/public/index.html';sha='f78f40d095f86da178da8e69d6a203c452286386'}
    @{path='tools/rs377-agent-manager/public/app.js';sha='c377592b6d1ed1d0d276d9b510e3674d8924e974'}
    @{path='tools/rs377-agent-manager/README.md';sha='7fca4b3356d18d9fc24b78ce8b6d5ccdb97a9ebd'}
    @{path='tools/rs377-chatgpt-bridge/src/session.mjs';sha='ae2ce593fc7f67bc528bc03ec953bc326aecdade'}
    @{path='tools/rs377-chatgpt-bridge/src/protocol.mjs';sha='67f6d497c6b1392c6070c4bc85b84b26c76e32af'}
    @{path='tools/rs377-chatgpt-bridge/src/observation.mjs';sha='b18dfc30de00ad9210adeefc87852f2def1eff4d'}
    @{path='tools/rs377-chatgpt-bridge/src/engine-observer.mjs';sha='172d37ef659efc786c998d6a6ed3cc4cb9522042'}
    @{path='tools/rs377-chatgpt-bridge/src/native-observer.mjs';sha='3c6a5893026b9c104e01bd4c46868a6bf0b0fd0b'}
    @{path='tools/rs377-chatgpt-bridge/src/sdk-bridge.mjs';sha='f3d1232d173de0c2ad338e0c5ea7ae465cc54884'}
    @{path='tools/rs377-chatgpt-bridge/src/sdk-runtime.mjs';sha='229ea6f4e541e4d8d0176e25f4d771fa2f06b402'}
)
function Get-GitBlobSha([string]$Path) {
    $bytes = [IO.File]::ReadAllBytes($Path)
    $header = [Text.Encoding]::ASCII.GetBytes(('blob ' + $bytes.Length + [char]0))
    $blob = New-Object byte[] ($header.Length + $bytes.Length)
    [Array]::Copy($header, 0, $blob, 0, $header.Length)
    [Array]::Copy($bytes, 0, $blob, $header.Length, $bytes.Length)
    $sha = [Security.Cryptography.SHA1]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($blob)).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Get-NormalizedGitBlobSha([string]$Path) {
    # GitHub/Git for Windows may check out LF text as CRLF without changing
    # content. Check that ONLY newline normalization explains the mismatch.
    $bytes = [IO.File]::ReadAllBytes($Path)
    $strictUtf8 = New-Object Text.UTF8Encoding($false,$true)
    try { $text = $strictUtf8.GetString($bytes) }
    catch { return $null }
    $normalized = $text.Replace([string][char]13+[string][char]10,[string][char]10)
    if ($normalized -ceq $text) { return $null }
    $canonical = $strictUtf8.GetBytes($normalized)
    $header = [Text.Encoding]::ASCII.GetBytes(('blob ' + $canonical.Length + [char]0))
    $blob = New-Object byte[] ($header.Length + $canonical.Length)
    [Array]::Copy($header, 0, $blob, 0, $header.Length)
    [Array]::Copy($canonical, 0, $blob, $header.Length, $canonical.Length)
    $sha = [Security.Cryptography.SHA1]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($blob)).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
$pending = @()
foreach ($entry in $manifest) {
    $rel = $entry.path.Replace('/', [IO.Path]::DirectorySeparatorChar)
    $target = Join-Path $Root $rel
    if (Test-Path -LiteralPath $target) {
        $got = Get-GitBlobSha $target
        if ($got -cne $entry.sha) {
            $lineEndingOnly = Get-NormalizedGitBlobSha $target
            if ($lineEndingOnly -cne $entry.sha) {
                throw ('LOCAL_CUSTOMISATION_PRESENT: refusing to overwrite ' + $entry.path +
                    '. No files changed. Compare this file manually before trying again.')
            }
            Write-Host ('PRESENT (verified CRLF checkout): ' + $entry.path)
        } else {
            Write-Host ('PRESENT (verified): ' + $entry.path)
        }
    } else {
        $pending += [pscustomobject]@{entry=$entry;target=$target}
    }
}
if ($pending.Count -eq 0) {
    Write-Host 'AGENT_MANAGER_ALREADY_INSTALLED: all reviewed source files match the pinned GitHub commit.'
} else {
    $staging = Join-Path $env:TEMP ('joshrs-agent-manager-' + [guid]::NewGuid().ToString('N'))
    $installed = @()
    New-Item -ItemType Directory -Path $staging -Force | Out-Null
    try {
        $downloads = @()
        for ($i = 0; $i -lt $pending.Count; $i++) {
            $item = $pending[$i]
            $temp = Join-Path $staging ('download-' + $i + '.part')
            $url = $repo + '/' + $item.entry.path
            Invoke-WebRequest -Uri $url -OutFile $temp -UseBasicParsing -ErrorAction Stop
            if ((Get-GitBlobSha $temp) -cne $item.entry.sha) {
                throw ('SOURCE_HASH_MISMATCH: refused unverified file ' + $item.entry.path)
            }
            $downloads += [pscustomobject]@{target=$item.target;temp=$temp;path=$item.entry.path}
        }
        # Only after ALL external files are verified, install absent files.
        foreach ($item in $downloads) {
            $dir = Split-Path -Parent $item.target
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            if (Test-Path -LiteralPath $item.target) { throw ('Destination changed while installing: ' + $item.path) }
            [IO.File]::Copy($item.temp, $item.target, $false)
            $installed += $item.target
            Write-Host ('INSTALLED (SHA verified): ' + $item.path)
        }
        Write-Host 'SOURCE_INSTALL_VERIFIED: no running engine, account, save or password changed.'
    } catch {
        foreach ($target in $installed) {
            if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Force -ErrorAction SilentlyContinue }
        }
        throw
    } finally {
        if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue }
    }
}
Write-Host 'LOCAL UI: http://127.0.0.1:18886 (isolated disposable accounts only).'
if ($Launch) {
    & (Join-Path $Root 'deploy\jparris-windows\Start-JoshRSAgentManager.ps1')
}
