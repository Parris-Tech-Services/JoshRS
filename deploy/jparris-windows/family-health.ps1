# Read-only status helpers. Dot-sourcing never starts a game or writes a save.
. (Join-Path $PSScriptRoot 'support.ps1')
. (Join-Path $PSScriptRoot 'save-integrity.ps1')

function Get-JoshRSVerifiedBackup {
    param([Parameter(Mandatory)][string]$RepoRoot)
    $folder=Join-Path $RepoRoot 'runtime\jparris-377\save-backups'
    foreach ($candidate in @(Get-ChildItem -LiteralPath $folder -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike '*.incomplete' } | Sort-Object LastWriteTimeUtc -Descending)) {
        try {
            $proof=Test-JoshRSBackupIntegrity -BackupPath $candidate.FullName
            if ($proof.Verified) {
                $manifest=Get-Content -LiteralPath (Join-Path $candidate.FullName 'integrity.json') -Raw | ConvertFrom-Json
                return [pscustomobject]@{Path=$candidate.FullName;Created=$manifest.created;Files=$proof.FileCount;Family=($proof.ContainsElrothiro -and $proof.ContainsSylvie)}
            }
        } catch { continue }
    }
    return $null
}

function Test-JoshRSRuntimeIdentity {
    param([Parameter(Mandatory)][string]$Engine)
    # Our customised engine writes this exclusive PID lock before opening services.
    # Verify the process references this exact engine's loader, not simply an open port.
    $envFile=Join-Path $Engine '.env'
    $profile='main'
    if (Test-Path -LiteralPath $envFile) {
        $profiles=@(Select-String -LiteralPath $envFile -Pattern '^\s*NODE_PROFILE\s*=\s*(.*?)\s*$')
        if ($profiles.Count -gt 1) { return $false }
        if ($profiles.Count -eq 1) { $profile=$profiles[0].Matches[0].Groups[1].Value.Trim([char[]]@([char]'"',[char]"'")) }
    }
    if ($profile -notmatch '^[a-zA-Z0-9_-]+$') { return $false }
    $lock=Join-Path $Engine ('data\.josh-rs-377-'+$profile+'.pid')
    if (-not (Test-Path -LiteralPath $lock -PathType Leaf)) { return $false }
    $processNumber=0
    if (-not [int]::TryParse(([IO.File]::ReadAllText($lock).Trim()),[ref]$processNumber) -or $processNumber -le 0) { return $false }
    $process=Get-CimInstance Win32_Process -Filter "ProcessId=$processNumber" -ErrorAction SilentlyContinue
    if (-not $process -or $process.Name -ne 'node.exe') { return $false }
    $expected=([IO.Path]::GetFullPath($Engine).TrimEnd('\')+'\node_modules\tsx\').ToLowerInvariant()
    $command=([string]$process.CommandLine).Replace('/','\').ToLowerInvariant()
    return ($command.Contains($expected) -and $command -match '(?:^|\s)src[\\/]app\.ts(?:\s|$)')
}

function Get-JoshRSFamilyHealth {
    param([Parameter(Mandatory)][string]$RepoRoot)
    $s=Get-JoshRSStatus -RepoRoot $RepoRoot
    $state='Stopped'; $detail='Ready to launch the selected world.'
    if (-not $s.Configured) { $state='Failed'; $detail=$s.Problem }
    elseif ($s.GamePortOpen -or $s.WebPortOpen) {
        if (-not (Test-JoshRSRuntimeIdentity -Engine $s.Engine)) {
            $state='Conflict'; $detail='A service is responding, but it could not be identified as the selected JoshRS world.'
        } elseif ($s.GamePortOpen -and $s.WebPortOpen) {
            $state='Ready'; $detail='Selected JoshRS server is running. Login and quest playability still require in-game checks.'
        } else { $state='Starting'; $detail='Selected server has not opened both services yet.' }
    }
    $backup=Get-JoshRSVerifiedBackup -RepoRoot $RepoRoot
    $scriptPack=if ($s.Engine) { Join-Path $s.Engine 'data\pack\server\script.dat' } else { '' }
    $pack=$null
    if ($s.Engine -and (Test-Path -LiteralPath $scriptPack -PathType Leaf)) {
        $item=Get-Item -LiteralPath $scriptPack
        $pack=[pscustomobject]@{SHA256=(Get-FileHash -LiteralPath $scriptPack -Algorithm SHA256).Hash;Built=$item.LastWriteTimeUtc.ToString('o')}
    }
    return [pscustomobject]@{State=$state;Detail=$detail;Backup=$backup;ScriptPack=$pack;Installation=$s}
}

function New-JoshRSRecoveryCopy {
    param([Parameter(Mandatory)][string]$RepoRoot,[Parameter(Mandatory)][string]$BackupPath,[Parameter(Mandatory)][string]$Destination)
    $proof=Test-JoshRSBackupIntegrity -BackupPath $BackupPath
    if (-not $proof.Verified) { throw 'Backup verification failed.' }
    $target=[IO.Path]::GetFullPath($Destination).TrimEnd('\')
    if (Test-Path -LiteralPath $target) { throw 'Recovery destination must not already exist. No overwrite permitted.' }
    $status=Get-JoshRSStatus -RepoRoot $RepoRoot
    foreach ($protected in @($RepoRoot,$status.Engine,$status.Content,$status.Client,$BackupPath)) {
        if (-not $protected) { continue }
        $canonical=[IO.Path]::GetFullPath($protected).TrimEnd('\')
        if ($target.Equals($canonical,[StringComparison]::OrdinalIgnoreCase) -or
            $target.StartsWith($canonical+'\',[StringComparison]::OrdinalIgnoreCase) -or
            $canonical.StartsWith($target+'\',[StringComparison]::OrdinalIgnoreCase)) {
            throw 'Recovery destination overlaps the installation or backup. Choose a separate empty folder.'
        }
    }
    # Reject junctions/symlinks in the destination ancestry and backup tree.
    $ancestor=Split-Path -Parent $target
    while ($ancestor) {
        if ((Test-Path -LiteralPath $ancestor) -and ((Get-Item -LiteralPath $ancestor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            throw 'Recovery destination traverses a link; choose a physical directory.'
        }
        $parent=Split-Path -Parent $ancestor
        if ($parent -eq $ancestor) { break }; $ancestor=$parent
    }
    if (@(Get-ChildItem -LiteralPath $BackupPath -Recurse -Force | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count) {
        throw 'Backup contains links; refusing recovery.'
    }
    # Copy only to a new private directory, then verify again. Never activates it.
    Copy-Item -LiteralPath $BackupPath -Destination $target -Recurse -ErrorAction Stop
    $result=Test-JoshRSBackupIntegrity -BackupPath $target
    return [pscustomobject]@{Path=$target;Verified=$result.Verified;Activated=$false;ContainsElrothiro=$result.ContainsElrothiro;ContainsSylvie=$result.ContainsSylvie}
}
