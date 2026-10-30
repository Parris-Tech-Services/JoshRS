# Shared, side-effect-free inspection and explicit backup operations for the
# JParris Desktop control center. No UI or server starts when dot-sourced.

function Test-JoshRSLocalPort {
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateRange(1,65535)][int]$Port)
    $socket = [System.Net.Sockets.TcpClient]::new()
    try {
        $request = $socket.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $request.AsyncWaitHandle.WaitOne(250)) { return $false }
        $socket.EndConnect($request)
        return $true
    } catch {
        return $false
    } finally {
        $socket.Dispose()
    }
}

function Get-JoshRSStatus {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot)
    $stateFile = Join-Path $RepoRoot 'runtime\jparris-377\active.json'
    $result = [ordered]@{
        Configured=$false; StateFile=$stateFile; Problem=''; Source='not installed';
        Engine=''; Content=''; Client='';
        GamePort=52402; WebPort=8888; GamePortOpen=$false; WebPortOpen=$false;
        EngineExists=$false; ContentExists=$false; ClientExists=$false;
        SavePresent=$false; DatabasePresent=$false; SaveCount=0;
        BackupRoot=(Join-Path $RepoRoot 'runtime\jparris-377\save-backups')
    }
    if (-not (Test-Path -LiteralPath $stateFile -PathType Leaf)) {
        $result.Problem='Not installed yet. Restore your USB folder or install a clean world.'
        return [pscustomobject]$result
    }
    try {
        $state = Get-Content -LiteralPath $stateFile -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        foreach ($property in @('engine','content','client','gamePort','webPort')) {
            if (-not $state.PSObject.Properties[$property]) { throw "State is missing $property." }
        }
        $result.Engine=[string]$state.engine
        $result.Content=[string]$state.content
        $result.Client=[string]$state.client
        $result.Source=[string]$state.source
        $result.GamePort=[int]$state.gamePort
        $result.WebPort=[int]$state.webPort
        if ($result.GamePort -lt 1 -or $result.GamePort -gt 65535 -or
            $result.WebPort -lt 1 -or $result.WebPort -gt 65535) { throw 'Saved TCP ports are invalid.' }
        $result.EngineExists = (Test-Path -LiteralPath (Join-Path $result.Engine 'src\app.ts') -PathType Leaf)
        $result.ContentExists = (Test-Path -LiteralPath (Join-Path $result.Content 'scripts') -PathType Container)
        $result.ClientExists = (Test-Path -LiteralPath (Join-Path $result.Client 'gradlew.bat') -PathType Leaf)
        $playerFolder=Join-Path $result.Engine 'data\players'
        if (Test-Path -LiteralPath $playerFolder -PathType Container) {
            $result.SaveCount=@(Get-ChildItem -LiteralPath $playerFolder -Filter '*.sav' -Recurse -File -ErrorAction SilentlyContinue).Count
        }
        $result.SavePresent=($result.SaveCount -gt 0)
        $result.DatabasePresent=(Test-Path -LiteralPath (Join-Path $result.Engine 'db.sqlite') -PathType Leaf)
        $result.GamePortOpen=Test-JoshRSLocalPort -Port $result.GamePort
        $result.WebPortOpen=Test-JoshRSLocalPort -Port $result.WebPort
        $result.Configured=($result.EngineExists -and $result.ContentExists -and $result.ClientExists)
        if (-not $result.Configured) {
            $result.Problem='The configured game paths are incomplete. Check USB import or reinstall.'
        }
    } catch {
        $result.Problem='Unable to read the local game configuration: ' + $_.Exception.Message
    }
    return [pscustomobject]$result
}

function New-JoshRSLocalBackup {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot)
    $status=Get-JoshRSStatus -RepoRoot $RepoRoot
    if (-not $status.Configured) { throw 'No complete local JoshRS installation was found.' }
    # Never take a possibly inconsistent copy of the SQLite account database
    # while the game or its update service is listening.
    if ($status.GamePortOpen -or $status.WebPortOpen) {
        throw 'Stop your JoshRS server gracefully before backing up. The game or HTTP port is still responding.'
    }
    $players=Join-Path $status.Engine 'data\players'
    $database=Join-Path $status.Engine 'db.sqlite'
    if (-not (Test-Path -LiteralPath $players -PathType Container) -and
        -not (Test-Path -LiteralPath $database -PathType Leaf)) {
        throw 'No player directory or SQLite account database exists to back up.'
    }
    $root=$status.BackupRoot
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    $stamp=Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'
    $final=Join-Path $root ('manual-' + $stamp)
    $temporary=$final + '.incomplete'
    if ((Test-Path -LiteralPath $final) -or (Test-Path -LiteralPath $temporary)) {
        throw 'Backup name collision. No data was changed.'
    }
    New-Item -ItemType Directory -Path $temporary | Out-Null
    try {
        if (Test-Path -LiteralPath $players -PathType Container) {
            Copy-Item -LiteralPath $players -Destination (Join-Path $temporary 'players') -Recurse -ErrorAction Stop
        }
        foreach ($suffix in @('','-wal','-shm')) {
            $filename=$database + $suffix
            if (Test-Path -LiteralPath $filename -PathType Leaf) {
                Copy-Item -LiteralPath $filename -Destination $temporary -ErrorAction Stop
            }
        }
        # Compare every copied save/database byte-for-byte using SHA-256 before exposing the backup.
        $fileDigests = New-Object System.Collections.ArrayList
        $copyFiles = @(Get-ChildItem -LiteralPath $temporary -File -Recurse -ErrorAction Stop)
        foreach ($copy in $copyFiles) {
            $relative=$copy.FullName.Substring($temporary.Length).TrimStart([char[]]@([char]'\\',[char]'/'))
            $relative=$relative.Replace('\\','/')
            if ($relative -notmatch '^(players/|db\\.sqlite(?:-wal|-shm)?$)') {
                throw "Backup contains unexpected file $relative. Refusing to complete."
            }
            $originalFile=if ($relative.StartsWith('players/')) {
                Join-Path $players ($relative.Substring(8).Replace('/','\\'))
            } else {
                Join-Path $status.Engine $relative
            }
            if (-not (Test-Path -LiteralPath $originalFile -PathType Leaf)) {
                throw "Backup source disappeared during the copy: $relative"
            }
            $sourceSha=(Get-FileHash -LiteralPath $originalFile -Algorithm SHA256 -ErrorAction Stop).Hash
            $backupSha=(Get-FileHash -LiteralPath $copy.FullName -Algorithm SHA256 -ErrorAction Stop).Hash
            if ($sourceSha -ne $backupSha) { throw "Source changed during backup: $relative" }
            [void]$fileDigests.Add([ordered]@{relativePath=$relative;size=$copy.Length;sha256=$backupSha})
        }
        if ((Test-JoshRSLocalPort -Port $status.GamePort) -or
            (Test-JoshRSLocalPort -Port $status.WebPort)) {
            throw 'The game restarted during backup. Aborting inconsistent snapshot.'
        }
        $manifest=[ordered]@{
            integrityFormat=1
            files=@($fileDigests.ToArray())
            created=(Get-Date).ToString('o')
            type='local-offline-backup'
            game='JoshRS revision 377'
            playerSaveCount=$status.SaveCount
            databaseIncluded=$status.DatabasePresent
            note='Keep this folder private. Do not commit it to public GitHub.'
        }
        $manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $temporary 'backup-info.json') -Encoding UTF8
        # Verify the new manifest against the staged copy before atomic promotion.
        [void](Test-JoshRSBackupIntegrity -BackupPath $temporary)
        Move-Item -LiteralPath $temporary -Destination $final -ErrorAction Stop
        return $final
    } catch {
        if (Test-Path -LiteralPath $temporary) {
            Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
        }
        throw
    }
}

function Test-JoshRSBackupIntegrity {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$BackupPath)
    $folder=(Resolve-Path -LiteralPath $BackupPath -ErrorAction Stop).Path
    $manifestPath=Join-Path $folder 'backup-info.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        throw 'Backup manifest missing; do not restore this snapshot.'
    }
    $manifest=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json -ErrorAction Stop
    if ($manifest.integrityFormat -ne 1 -or -not $manifest.files) {
        throw 'Legacy or unverified backup. No cryptographic file manifest is present.'
    }
    $verified=0
    $listed=New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($file in @($manifest.files)) {
        $relative=[string]$file.relativePath
        if ($relative -notmatch '^(?:players/(?:[A-Za-z0-9._-]+/)*[A-Za-z0-9._-]+|db\.sqlite(?:-wal|-shm)?)
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot)
    $s=Get-JoshRSStatus -RepoRoot $RepoRoot
    $available=@()
    foreach ($tool in @('git.exe','node.exe','npm.cmd','java.exe','javac.exe')) {
        $available += ('{0}: {1}' -f $tool, $(if (Get-Command $tool -ErrorAction SilentlyContinue) {'found'} else {'missing'}))
    }
    # Deliberately omit environment contents, player file contents and passwords.
    return (@(
        'JoshRS Windows diagnostics'
        ('Installed: ' + $s.Configured)
        ('Source: ' + $s.Source)
        ('Game port: ' + $s.GamePort + ' (reachable: ' + $s.GamePortOpen + ')')
        ('HTTP port: ' + $s.WebPort + ' (reachable: ' + $s.WebPortOpen + ')')
        ('Engine present: ' + $s.EngineExists)
        ('Content present: ' + $s.ContentExists)
        ('Java client present: ' + $s.ClientExists)
        ('Player saves detected: ' + $s.SaveCount)
        ('Account database present: ' + $s.DatabasePresent)
        ('Problem: ' + $s.Problem)
        $available
    ) -join [Environment]::NewLine)
}


function Get-JoshRSRecentLogFile {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot)
    $logFolder=Join-Path $RepoRoot 'runtime\jparris-377\logs'
    if (-not (Test-Path -LiteralPath $logFolder -PathType Container)) { return $null }
    # Only local launcher log files may be opened by the dashboard.
    $file=Get-ChildItem -LiteralPath $logFolder -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^(server|client|dashboard)-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}\.log$' } |
        Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    if ($file) { return $file.FullName }
    return $null
}
function New-JoshRSLaunchLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][ValidateSet('server','client','dashboard')][string]$Role
    )
    $folder=Join-Path $RepoRoot 'runtime\jparris-377\logs'
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $filename='{0}-{1}-{2}.log' -f $Role,(Get-Date -Format 'yyyyMMdd-HHmmss'),([guid]::NewGuid().ToString('N').Substring(0,8))
    $path=Join-Path $folder $filename
    # Keep the newest 25 logs. Failures to remove an in-use old log are harmless.
    $old=@(Get-ChildItem -LiteralPath $folder -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^(server|client|dashboard)-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}\.log$' } |
        Sort-Object LastWriteTimeUtc -Descending | Select-Object -Skip 24)
    foreach ($item in $old) { Remove-Item -LiteralPath $item.FullName -Force -ErrorAction SilentlyContinue }
    return $path
}
 -or
            $relative.Contains('..') -or -not $listed.Add($relative)) {
            throw 'Backup manifest contains an unsafe or duplicate path.'
        }
        $target=Join-Path $folder ($relative.Replace('/','\'))
        if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { throw "Backup file missing: $relative" }
        $info=Get-Item -LiteralPath $target
        if ([long]$file.size -ne [long]$info.Length) { throw "Backup size mismatch: $relative" }
        $actual=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
        if ($actual -ne [string]$file.sha256) { throw "Backup SHA-256 mismatch: $relative" }
        $verified++
    }
    $allFiles=@(Get-ChildItem -LiteralPath $folder -File -Recurse |
        Where-Object { $_.FullName -ne $manifestPath })
    if ($allFiles.Count -ne $verified) { throw 'Backup contains additional untracked files.' }
    return [pscustomobject]@{Verified=$true;FileCount=$verified;BackupPath=$folder}
}

function Get-JoshRSSafeDiagnostics {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot)
    $s=Get-JoshRSStatus -RepoRoot $RepoRoot
    $available=@()
    foreach ($tool in @('git.exe','node.exe','npm.cmd','java.exe','javac.exe')) {
        $available += ('{0}: {1}' -f $tool, $(if (Get-Command $tool -ErrorAction SilentlyContinue) {'found'} else {'missing'}))
    }
    # Deliberately omit environment contents, player file contents and passwords.
    return (@(
        'JoshRS Windows diagnostics'
        ('Installed: ' + $s.Configured)
        ('Source: ' + $s.Source)
        ('Game port: ' + $s.GamePort + ' (reachable: ' + $s.GamePortOpen + ')')
        ('HTTP port: ' + $s.WebPort + ' (reachable: ' + $s.WebPortOpen + ')')
        ('Engine present: ' + $s.EngineExists)
        ('Content present: ' + $s.ContentExists)
        ('Java client present: ' + $s.ClientExists)
        ('Player saves detected: ' + $s.SaveCount)
        ('Account database present: ' + $s.DatabasePresent)
        ('Problem: ' + $s.Problem)
        $available
    ) -join [Environment]::NewLine)
}


function Get-JoshRSRecentLogFile {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot)
    $logFolder=Join-Path $RepoRoot 'runtime\jparris-377\logs'
    if (-not (Test-Path -LiteralPath $logFolder -PathType Container)) { return $null }
    # Only local launcher log files may be opened by the dashboard.
    $file=Get-ChildItem -LiteralPath $logFolder -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^(server|client|dashboard)-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}\.log$' } |
        Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    if ($file) { return $file.FullName }
    return $null
}
function New-JoshRSLaunchLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][ValidateSet('server','client','dashboard')][string]$Role
    )
    $folder=Join-Path $RepoRoot 'runtime\jparris-377\logs'
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $filename='{0}-{1}-{2}.log' -f $Role,(Get-Date -Format 'yyyyMMdd-HHmmss'),([guid]::NewGuid().ToString('N').Substring(0,8))
    $path=Join-Path $folder $filename
    # Keep the newest 25 logs. Failures to remove an in-use old log are harmless.
    $old=@(Get-ChildItem -LiteralPath $folder -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^(server|client|dashboard)-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}\.log$' } |
        Sort-Object LastWriteTimeUtc -Descending | Select-Object -Skip 24)
    foreach ($item in $old) { Remove-Item -LiteralPath $item.FullName -Force -ErrorAction SilentlyContinue }
    return $path
}
