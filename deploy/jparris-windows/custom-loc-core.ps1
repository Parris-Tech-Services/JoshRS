# Scoped fix for deliberately customised revision-377 loc definitions.
# Leave BUILD_VERIFY enabled for all other pack/config validations.
# Original source and .env are backed up before changes.
function Enable-JoshRSCustomLocChecks {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$EnginePath,
        [Parameter(Mandatory)][string]$BackupRoot
    )
    $engine=(Resolve-Path -LiteralPath $EnginePath -ErrorAction Stop).Path
    $shared=Join-Path $engine 'tools\pack\config\PackShared.ts'
    $envFile=Join-Path $engine '.env'
    if (-not (Test-Path -LiteralPath $shared -PathType Leaf)) { throw "Engine packer file not found: $shared" }
    if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) { throw "Game .env not found: $envFile" }

    $originalSource=[IO.File]::ReadAllText($shared)
    $originalEnv=[IO.File]::ReadAllText($envFile)
    $stock='if (Environment.BUILD_VERIFY && validate && !validate(client.dat, server.dat)) {'
    $custom="if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && !validate(client.dat, server.dat)) {"
    $alreadyPatched=$originalSource.Contains($custom)
    if (-not $alreadyPatched -and -not $originalSource.Contains($stock)) {
        throw 'Custom engine packer differs from the supported revision-377 version. No changes were made.'
    }
    if ($originalSource.Contains($stock) -and $alreadyPatched) {
        throw 'Engine contains both verification implementations. No changes were made.'
    }
    $newSource=if($alreadyPatched){$originalSource}else{$originalSource.Replace($stock,$custom)}
    $matches=[regex]::Matches($originalEnv,'(?m)^[ \t]*JOSHRS_CUSTOM_LOCS[ \t]*=[ \t]*([^\r\n#]*)')
    if ($matches.Count -gt 1) { throw 'Duplicate JOSHRS_CUSTOM_LOCS settings: refusing to change configuration.' }
    $eol=if($originalEnv.Contains(([string][char]13+[string][char]10))){([string][char]13+[string][char]10)}else{([string][char]10)}
    if ($matches.Count -eq 1) {
        $newEnv=$originalEnv.Remove($matches[0].Index,$matches[0].Length).Insert($matches[0].Index,'JOSHRS_CUSTOM_LOCS=true')
    } else {
        $newEnv=$originalEnv.TrimEnd([char[]]@([char]13,[char]10))+$eol+'JOSHRS_CUSTOM_LOCS=true'+$eol
    }
    # Never accidentally change or mask the general safety settings.
    if ($originalEnv -match '(?m)^[ \t]*BUILD_VERIFY[ \t]*=[ \t]*false(?:[ \t#]|$)') {
        throw 'BUILD_VERIFY=false is already set; general verification is disabled. Investigate that first.'
    }
    if ($newSource -eq $originalSource -and $newEnv -eq $originalEnv) {
        return [pscustomobject]@{Updated=$false;BackupPath='';Message='Custom loc verification already configured.'}
    }
    $snapshot=Join-Path $BackupRoot ('loc-check-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fffffff')+'-'+[guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path $snapshot | Out-Null
    $sourceBackup=Join-Path $snapshot 'PackShared.ts.original'
    $envBackup=Join-Path $snapshot '.env.original'
    [IO.File]::Copy($shared,$sourceBackup)
    [IO.File]::Copy($envFile,$envBackup)
    try {
        if ($newSource -ne $originalSource) {
            [IO.File]::WriteAllText($shared,$newSource,[Text.UTF8Encoding]::new($false))
        }
        if ($newEnv -ne $originalEnv) {
            [IO.File]::WriteAllText($envFile,$newEnv,[Text.UTF8Encoding]::new($false))
        }
    } catch {
        [IO.File]::Copy($sourceBackup,$shared,$true)
        [IO.File]::Copy($envBackup,$envFile,$true)
        throw
    }
    return [pscustomobject]@{
        Updated=$true
        BackupPath=$snapshot
        Message='Only the original loc CRC comparison is now optional for custom locs. All other BUILD_VERIFY and pack checks stay enabled.'
    }
}
