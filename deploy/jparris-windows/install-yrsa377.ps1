[CmdletBinding()]
param([switch]$Apply)

# Apply only to the selected *private* personalised JoshRS 377 runtime.
# Never terminate an active server, overwrite local overrides or touch saved accounts.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$runtime = Join-Path $root 'runtime/jparris-377'
$activePath = Join-Path $runtime 'active.json'
if (-not (Test-Path -LiteralPath $activePath -PathType Leaf)) {
    throw 'JoshRS 377 is not configured. Run JoshRS.cmd setup first.'
}
$state = Get-Content -LiteralPath $activePath -Raw | ConvertFrom-Json
$engine = (Resolve-Path -LiteralPath ([string]$state.engine)).Path
$contentDir = (Resolve-Path -LiteralPath ([string]$state.content)).Path
$prefix = [IO.Path]::GetFullPath($runtime).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
if (-not $engine.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase) -or
    -not $contentDir.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase) -or
    (Split-Path -Leaf $engine) -cne 'engine' -or
    (Split-Path -Leaf $contentDir) -cne 'content') {
    throw 'Active game is outside the private JoshRS Windows runtime. No changes made.'
}

# Never interrupt either logged-in character.
$ports = @([int]$state.gamePort,[int]$state.webPort) | Sort-Object -Unique
if (@(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue).Count -gt 0) {
    throw 'Game server is still running. Finish playing, log out both accounts and gracefully stop it before applying.'
}

$patchRoot = Join-Path $PSScriptRoot 'yrsa377'
$sourceScript = Join-Path $patchRoot 'yrsa_trade.rs2'
$sourceInv = Join-Path $patchRoot 'yrsa_cloaks.inv'
$targetScript = Join-Path $contentDir 'scripts/areas/joshrs_custom/scripts/joshrs_yrsa_trade.rs2'
$targetInv = Join-Path $contentDir 'scripts/areas/joshrs_custom/configs/joshrs_yrsa_cloaks.inv'
$npcRegistry = Join-Path $contentDir 'pack/npc.pack'
$invRegistry = Join-Path $contentDir 'pack/inv.pack'
$objRegistry = Join-Path $contentDir 'pack/obj.pack'
$shared = Join-Path $engine 'tools/pack/config/PackShared.ts'
$envFile = Join-Path $engine '.env'
$enginePack = Join-Path $engine 'data/pack'
foreach ($path in @($sourceScript,$sourceInv,$npcRegistry,$invRegistry,$objRegistry,$shared,$envFile)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing expected source: $path" }
}
if (-not (Test-Path -LiteralPath $enginePack -PathType Container)) {
    throw 'Compiled engine pack missing. Repair this installation before patching Yrsa.'
}
if ((Get-Content -LiteralPath $npcRegistry -Raw) -notmatch '(?m)^[0-9]+=viking_clothing_shopkeeper\r?$') {
    throw 'Existing Yrsa NPC is not in the active 377 registry.'
}
if ((Get-Content -LiteralPath $invRegistry -Raw) -notmatch '(?m)^[0-9]+=viking_clothes_shop\r?$') {
    throw 'Existing Yrsa clothing inventory is not in the active 377 registry.'
}
$stock = @(Get-Content -LiteralPath $sourceInv | Where-Object { $_ -match '^stock[0-9]+=' })
if ($stock.Count -ne 21) { throw 'Expected 21 clothing entries (11 capes); package has changed.' }
$objs = Get-Content -LiteralPath $objRegistry -Raw
foreach ($line in $stock) {
    if ($line -cnotmatch '^stock[0-9]+=([a-z0-9_]+),[0-9]+,[0-9]+$') {
        throw "Unrecognised inventory line: $line"
    }
    $name = [string]$Matches[1]
    if ($objs -notmatch "(?m)^[0-9]+=$([regex]::Escape($name))\r?$") {
        throw "The active game does not know the clothing item: $name"
    }
}
$cloakCount = @($stock | Where-Object { $_ -match '^stock[0-9]+=viking_cloak_' }).Count
if ($cloakCount -ne 11) { throw 'Expected 11 coloured Fremennik cloaks.' }

# Reject duplicate shop definition/Trade handler without touching either.
# If the user already has an inventory definition in the custom world, keep it.
$existingInv = @()
$existingTrade = @()
$allScripts = Join-Path $contentDir 'scripts'
foreach ($file in @(Get-ChildItem -LiteralPath $allScripts -File -Recurse -Filter '*.inv')) {
    if (Select-String -LiteralPath $file.FullName -Pattern '^\s*\[viking_clothes_shop\]\s*$' -Quiet) {
        $existingInv += $file.FullName
    }
}
foreach ($file in @(Get-ChildItem -LiteralPath $allScripts -File -Recurse -Filter '*.rs2')) {
    if ($file.FullName -eq $targetScript) { continue }
    if (Select-String -LiteralPath $file.FullName -Pattern '^\s*\[opnpc3,\s*viking_clothing_shopkeeper\s*\]\s*$' -Quiet) {
        $existingTrade += $file.FullName
    }
}
if ($existingTrade.Count -gt 0) {
    throw ('An existing Yrsa Trade handler needs investigation: ' + ($existingTrade -join ', '))
}
if ($existingInv.Count -gt 1) {
    throw ('Duplicate active Yrsa inventories detected: ' + ($existingInv -join ', '))
}
$needsInventory = ($existingInv.Count -eq 0)
$planned = @(@{ From=$sourceScript; To=$targetScript })
if ($needsInventory) { $planned += @{ From=$sourceInv; To=$targetInv } }
foreach ($item in $planned) {
    if (Test-Path -LiteralPath $item.To -PathType Leaf) {
        $expected = (Get-FileHash -LiteralPath $item.From -Algorithm SHA256).Hash
        $current = (Get-FileHash -LiteralPath $item.To -Algorithm SHA256).Hash
        if ($current -ne $expected) {
            throw "Existing customised file differs; refusing overwrite: $($item.To)"
        }
    }
}
if (-not $needsInventory -and $existingInv[0] -ne $targetInv) {
    Write-Host "Preserving existing Yrsa inventory definition: $($existingInv[0])"
}

$originalSource = [IO.File]::ReadAllText($shared)
$originalEnv = [IO.File]::ReadAllText($envFile)
if ($originalEnv -match '(?m)^\s*BUILD_VERIFY\s*=\s*false(?:\s|$)') {
    throw 'Broad build verification is disabled in active world. Investigate before applying.'
}
$newSource = $originalSource
$newEnv = $originalEnv
if ($needsInventory) {
    $validation = '!validate(client.dat, server.dat)'
    $skipInv = "!(extension === '.inv' && process.env.JOSHRS_CUSTOM_INVS === 'true') && $validation"
    if ($originalSource -notmatch 'JOSHRS_CUSTOM_INVS') {
        if ($originalSource -notmatch 'if \(Environment\.BUILD_VERIFY && validate') {
            throw 'Unexpected engine pack checksum implementation. No changes made.'
        }
        if ([regex]::Matches($originalSource,[regex]::Escape($validation)).Count -ne 1) {
            throw 'Engine checksum validation differs from supported 377. No changes made.'
        }
        $newSource = $originalSource.Replace($validation,$skipInv)
    }
    if ($originalEnv -match '(?m)^\s*JOSHRS_CUSTOM_INVS\s*=' -and
        $originalEnv -notmatch '(?m)^\s*JOSHRS_CUSTOM_INVS\s*=\s*true(?:\s|$)') {
        throw 'Conflicting JOSHRS_CUSTOM_INVS setting. No changes made.'
    }
    if ($originalEnv -notmatch '(?m)^\s*JOSHRS_CUSTOM_INVS\s*=') {
        $newEnv = $originalEnv.TrimEnd([char[]]@([char]13,[char]10)) +
            [Environment]::NewLine + 'JOSHRS_CUSTOM_INVS=true' + [Environment]::NewLine
    }
}
Write-Host "Verified Yrsa NPC and shop registry in: $contentDir"
Write-Host "Item definitions verified: $($stock.Count), including $cloakCount cloaks"
Write-Host "Inventory definition needed: $needsInventory"
Write-Host 'The running world and player saves will NOT be modified.'
if (-not $Apply) {
    Write-Host 'PREFLIGHT ONLY. No files changed. Use JoshRS-Fix-Yrsa.cmd to install after both players log out.'
    exit 0
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm.cmd not available; repair Node.js using JoshRS.cmd.'
}

$backup = Join-Path $runtime ('yrsa377-backups/install-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$watch = @(
    @{Path=$targetScript; Backup='yrsa_trade.rs2'},
    @{Path=$targetInv; Backup='yrsa_cloaks.inv'},
    @{Path=$shared; Backup='PackShared.ts'},
    @{Path=$envFile; Backup='engine.env'}
)
$originalExists = @{}
foreach ($item in $watch) {
    $present = Test-Path -LiteralPath $item.Path -PathType Leaf
    $originalExists[$item.Path] = $present
    if ($present) { Copy-Item -LiteralPath $item.Path -Destination (Join-Path $backup $item.Backup) -Force }
}
Copy-Item -LiteralPath $enginePack -Destination (Join-Path $backup 'engine-pack') -Recurse -Force
try {
    foreach ($item in $planned) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $item.To) -Force | Out-Null
        Copy-Item -LiteralPath $item.From -Destination $item.To -Force
    }
    if ($newSource -cne $originalSource) { [IO.File]::WriteAllText($shared,$newSource) }
    if ($newEnv -cne $originalEnv) { [IO.File]::WriteAllText($envFile,$newEnv) }
    Push-Location -LiteralPath $engine
    try {
        $env:BUILD_SRC_DIR = $contentDir
        $env:BUILD_VERIFY = 'true'
        $env:BUILD_VERIFY_PACK = 'true'
        if ($needsInventory) { $env:JOSHRS_CUSTOM_INVS = 'true' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw "Native 377 build failed (exit code $LASTEXITCODE)" }
    } finally { Pop-Location }
    foreach ($rel in @('data/pack/server/script.dat','data/pack/server/script.idx')) {
        if (-not (Test-Path -LiteralPath (Join-Path $engine $rel) -PathType Leaf)) {
            throw "Missing compiled script: $rel"
        }
    }
    Write-Host 'Yrsa native shop compiled. Backup:'
    Write-Host $backup
    Write-Host 'Start the normal server, Trade Yrsa, buy/equip a cloak and test both accounts.'
} catch {
    $reason = $_.Exception.Message
    $rollbackIssues = @()
    foreach ($item in $watch) {
        try {
            if (Test-Path -LiteralPath $item.Path) { Remove-Item -LiteralPath $item.Path -Force }
            if ($originalExists[$item.Path]) {
                Copy-Item -LiteralPath (Join-Path $backup $item.Backup) -Destination $item.Path -Force
            }
        } catch { $rollbackIssues += $_.Exception.Message }
    }
    try {
        if (Test-Path -LiteralPath $enginePack) {
            Remove-Item -LiteralPath $enginePack -Force -Recurse
        }
        Copy-Item -LiteralPath (Join-Path $backup 'engine-pack') -Destination $enginePack -Recurse -Force
    } catch { $rollbackIssues += $_.Exception.Message }
    if ($rollbackIssues.Count -gt 0) {
        throw ('BUILD FAILED; ROLLBACK INCOMPLETE. Original backups at ' + $backup +
               '. Errors: ' + ($rollbackIssues -join '; ') + '. Initial error: ' + $reason)
    }
    throw ('Yrsa install failed and original files/packs restored from ' + $backup + '. ' + $reason)
}
