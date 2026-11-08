# Scoped NPC CRC accommodation for copied, customised revision-377 worlds.
# BUILD_VERIFY and BUILD_VERIFY_PACK remain enabled; parsing is never bypassed.
# The caller must first validate the private USB runtime, stop the server, and
# create a verified save backup before calling Enable-JoshRSCustomNpcChecks.
function Get-JoshRSCustomNpcPlan {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EnginePath)
    $engine=(Resolve-Path -LiteralPath $EnginePath -ErrorAction Stop).Path
    $sourceFile=Join-Path $engine 'tools\pack\config\PackShared.ts'
    $envFile=Join-Path $engine '.env'
    if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf)) { throw "Missing engine packer: $sourceFile" }
    if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) { throw "Missing engine env: $envFile" }
    $originalSource=[IO.File]::ReadAllText($sourceFile)
    $originalEnv=[IO.File]::ReadAllText($envFile)
    $stock='if (Environment.BUILD_VERIFY && validate && !validate(client.dat, server.dat)) {'
    $loc="if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && !validate(client.dat, server.dat)) {"
    $npc="if (Environment.BUILD_VERIFY && validate && !(extension === '.npc' && process.env.JOSHRS_CUSTOM_NPCS === 'true') && !validate(client.dat, server.dat)) {"
    $both="if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && !(extension === '.npc' && process.env.JOSHRS_CUSTOM_NPCS === 'true') && !validate(client.dat, server.dat)) {"
    $supported=@($stock,$loc,$npc,$both)
    $matches=@($supported | Where-Object { $originalSource.Contains($_) })
    if ($matches.Count -ne 1) {
        throw 'Unsupported/ambiguous packer verification expression. No changes made; update only after inspecting private engine source.'
    }
    if ([regex]::Matches($originalSource,[regex]::Escape($matches[0])).Count -ne 1) {
        throw 'Duplicate packer verification expressions. No changes made.'
    }
    $chosen=$matches[0]
    $desired=if ($chosen -eq $stock) {$npc} elseif ($chosen -eq $loc) {$both} else {$chosen}
    $newSource=if($desired -eq $chosen){$originalSource}else{$originalSource.Replace($chosen,$desired)}
    # Fail closed if the default safety flags have already been switched off.
    if ($originalEnv -match '(?m)^[ \t]*BUILD_VERIFY(?:_PACK)?[ \t]*=[ \t]*false(?:[ \t#]|$)') {
        throw 'BUILD_VERIFY or BUILD_VERIFY_PACK disabled in .env; investigate before running a custom NPC checksum patch.'
    }
    $settings=[regex]::Matches($originalEnv,'(?m)^[ \t]*JOSHRS_CUSTOM_NPCS[ \t]*=[ \t]*([^\r\n#]*)')
    if ($settings.Count -gt 1) { throw 'Duplicate custom NPC settings. No changes made.' }
    $eol=if($originalEnv.Contains("`r`n")){"`r`n"}else{"`n"}
    if ($settings.Count -eq 1) {
        $newEnv=$originalEnv.Remove($settings[0].Index,$settings[0].Length).Insert($settings[0].Index,'JOSHRS_CUSTOM_NPCS=true')
    } else {
        $newEnv=$originalEnv.TrimEnd([char[]]@([char]13,[char]10))+$eol+'JOSHRS_CUSTOM_NPCS=true'+$eol
    }
    return [pscustomobject]@{
        SourceFile=$sourceFile; EnvFile=$envFile
        OriginalSource=$originalSource; OriginalEnv=$originalEnv
        NewSource=$newSource; NewEnv=$newEnv
        NeedsUpdate=($newSource -cne $originalSource -or $newEnv -cne $originalEnv)
        PreservesLoc=($chosen -eq $loc -or $chosen -eq $both)
        SourceHash=(Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash
        EnvHash=(Get-FileHash -LiteralPath $envFile -Algorithm SHA256).Hash
    }
}
function Enable-JoshRSCustomNpcChecks {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Plan,
        [Parameter(Mandatory)][string]$BackupPath
    )
    if(-not $Plan.NeedsUpdate) { return $false }
    if(-not (Test-Path -LiteralPath $BackupPath -PathType Container)) {
        throw 'A verified installation-backup directory is required before editing engine files.'
    }
    if((Get-FileHash -LiteralPath $Plan.SourceFile -Algorithm SHA256).Hash -ne $Plan.SourceHash -or
       (Get-FileHash -LiteralPath $Plan.EnvFile -Algorithm SHA256).Hash -ne $Plan.EnvHash) {
        throw 'Packer or .env changed after preflight. No edits made.'
    }
    $srcBak=Join-Path $BackupPath 'PackShared.ts.before'
    $envBak=Join-Path $BackupPath 'engine.env.before'
    if((Test-Path -LiteralPath $srcBak) -or (Test-Path -LiteralPath $envBak)) {
        throw 'Backup file collision; refusing to overwrite the previous engine snapshot.'
    }
    Copy-Item -LiteralPath $Plan.SourceFile -Destination $srcBak -ErrorAction Stop
    Copy-Item -LiteralPath $Plan.EnvFile -Destination $envBak -ErrorAction Stop
    if((Get-FileHash -LiteralPath $srcBak -Algorithm SHA256).Hash -ne $Plan.SourceHash -or
       (Get-FileHash -LiteralPath $envBak -Algorithm SHA256).Hash -ne $Plan.EnvHash) {
        throw 'Engine source/env snapshot verification failed; no edits made.'
    }
    try {
        if($Plan.NewSource -cne $Plan.OriginalSource) {
            [IO.File]::WriteAllText($Plan.SourceFile,$Plan.NewSource,[Text.UTF8Encoding]::new($false))
        }
        if($Plan.NewEnv -cne $Plan.OriginalEnv) {
            [IO.File]::WriteAllText($Plan.EnvFile,$Plan.NewEnv,[Text.UTF8Encoding]::new($false))
        }
    } catch {
        Copy-Item -LiteralPath $srcBak -Destination $Plan.SourceFile -Force
        Copy-Item -LiteralPath $envBak -Destination $Plan.EnvFile -Force
        throw
    }
    return $true
}
function Restore-JoshRSCustomNpcChecks {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Plan,
        [Parameter(Mandatory)][string]$BackupPath
    )
    $srcBak=Join-Path $BackupPath 'PackShared.ts.before'
    $envBak=Join-Path $BackupPath 'engine.env.before'
    if(-not (Test-Path -LiteralPath $srcBak -PathType Leaf) -or
       -not (Test-Path -LiteralPath $envBak -PathType Leaf)) {
        throw 'Cannot restore customised engine: the required snapshots are missing.'
    }
    if((Get-FileHash -LiteralPath $srcBak -Algorithm SHA256).Hash -ne $Plan.SourceHash -or
       (Get-FileHash -LiteralPath $envBak -Algorithm SHA256).Hash -ne $Plan.EnvHash) {
        throw 'Cannot restore customised engine: snapshot hash mismatch.'
    }
    Copy-Item -LiteralPath $srcBak -Destination $Plan.SourceFile -Force -ErrorAction Stop
    Copy-Item -LiteralPath $envBak -Destination $Plan.EnvFile -Force -ErrorAction Stop
    if((Get-FileHash -LiteralPath $Plan.SourceFile -Algorithm SHA256).Hash -ne $Plan.SourceHash -or
       (Get-FileHash -LiteralPath $Plan.EnvFile -Algorithm SHA256).Hash -ne $Plan.EnvHash) {
        throw 'Engine rollback verification failed: do not start the game.'
    }
}
