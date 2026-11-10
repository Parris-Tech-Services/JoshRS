[CmdletBinding()]
param()

# One-command read-only report of the EXISTING family world.
# Does NOT restart services, open/modify saves, install content, create logs,
# run bots, update .env, or invoke any patch/install/repack command.
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
. (Join-Path $PSScriptRoot 'support.ps1')
$status=Get-JoshRSStatus -RepoRoot $root

Write-Host '=== JoshRS 377 FAMILY GAME CHECK (READ ONLY) ==='
Write-Host ('Configured: '+$status.Configured)
Write-Host ('Game TCP '+$status.GamePort+': '+$(if($status.GamePortOpen){'reachable'}else{'NOT listening'}))
Write-Host ('Web HTTP '+$status.WebPort+': '+$(if($status.WebPortOpen){'reachable'}else{'NOT listening'}))
if (-not $status.Configured) {
    Write-Host ('No active complete 377 world in this checkout: '+$status.Problem)
    Write-Host 'NO CHANGES MADE'
    return
}

# Session count is only a transport hint, never proof of player identities.
if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
    $connections=@(Get-NetTCPConnection -State Established -LocalPort $status.GamePort -ErrorAction SilentlyContinue)
    Write-Host ('Established game TCP connections (not player identities): '+$connections.Count)
}

# Only inspect metadata. Character .sav contents and .env contents are not printed.
foreach ($player in @('elrothiro','sylvie')) {
    $save=Join-Path $status.Engine ('data/players/main/'+$player+'.sav')
    if (Test-Path -LiteralPath $save -PathType Leaf) {
        $item=Get-Item -LiteralPath $save
        $age=[math]::Round(((Get-Date).ToUniversalTime()-$item.LastWriteTimeUtc).TotalMinutes,1)
        Write-Host ($player+' save: '+$item.Length+' bytes; saved UTC '+$item.LastWriteTimeUtc.ToString('o')+'; '+$age+' min old')
    } else {
        Write-Host ($player+' save: NOT FOUND (check active.json; do not create a new save)')
    }
}
$compiled=Join-Path $status.Engine 'data/pack/server/script.dat'
if (Test-Path -LiteralPath $compiled -PathType Leaf) {
    $item=Get-Item -LiteralPath $compiled
    Write-Host ('Compiled script pack: '+$item.Length+' bytes; modified '+$item.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))
} else {
    Write-Host 'Compiled script pack: MISSING; do not repack the running world.'
}

# Existing friends repair has an explicit read-only default.
$friends=Join-Path $PSScriptRoot 'fix-disabled-friends.ps1'
if (Test-Path -LiteralPath $friends -PathType Leaf) {
    Write-Host '--- Friends-service configuration (read-only preflight) ---'
    try { & $friends } catch {
        Write-Host ('Friends-service check blocked: '+$_.Exception.Message)
    }
}

Write-Host 'Existing source patches and GitHub commits are NOT installed into a running world automatically.'
Write-Host 'Offline updater preflight (only when convenient): node tools/rs377-unified-updater/updater.mjs --check'
Write-Host 'Only run --apply with both characters logged out, the game stopped, and verified private backups.'
Write-Host 'NO CHANGES MADE'
