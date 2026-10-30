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
        $manifest=[ordered]@{
            created=(Get-Date).ToString('o')
            type='local-offline-backup'
            game='JoshRS revision 377'
            playerSaveCount=$status.SaveCount
            databaseIncluded=$status.DatabasePresent
            note='Keep this folder private. Do not commit it to public GitHub.'
        }
        $manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $temporary 'backup-info.json') -Encoding UTF8
        Move-Item -LiteralPath $temporary -Destination $final -ErrorAction Stop
        return $final
    } catch {
        if (Test-Path -LiteralPath $temporary) {
            Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
        }
        throw
    }
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
