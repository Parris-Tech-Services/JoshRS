# Read-only JoshRS revision-377 companion/agent status.
# Never starts/restarts game processes, reads account databases/saves or prints secrets.
# Compatible with Windows PowerShell 5.1.
[CmdletBinding()]
param([string]$RepoRoot = '')

$ErrorActionPreference = 'Stop'
if (-not $RepoRoot) { $RepoRoot = Join-Path $PSScriptRoot '..\..' }
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot -ErrorAction Stop).Path

function Get-Flag([string]$File, [string]$Key) {
    if (-not (Test-Path -LiteralPath $File -PathType Leaf)) { return 'missing' }
    # Read only explicitly permitted flag lines; do not expose other .env contents.
    $pattern = '^\s*' + [regex]::Escape($Key) + '\s*=\s*(.*)$'
    $lines = @(Get-Content -LiteralPath $File | Where-Object { $_ -match $pattern })
    if ($lines.Count -ne 1) { return 'unknown' }
    $value = [regex]::Match($lines[0], $pattern).Groups[1].Value.Trim()
    $value = ($value -replace '\s+#.*
    return $value
}
function Port-Listening([int]$Port) {
    if ($Port -lt 1 -or $Port -gt 65535) { return $false }
    $socket = New-Object Net.Sockets.TcpClient
    try {
        $async = $socket.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(350)) { return $false }
        $socket.EndConnect($async)
        return $true
    } catch { return $false } finally { $socket.Dispose() }
}
function Source-Contains([string]$File, [string]$Pattern) {
    if (-not (Test-Path -LiteralPath $File -PathType Leaf)) { return $false }
    return [bool](Select-String -LiteralPath $File -Pattern $Pattern -Quiet)
}

$activePath = Join-Path $RepoRoot 'runtime\jparris-377\active.json'
if (-not (Test-Path -LiteralPath $activePath -PathType Leaf)) {
    throw 'Active Windows world configuration absent. No files changed.'
}
$state = Get-Content -LiteralPath $activePath -Raw -ErrorAction Stop | ConvertFrom-Json
if (-not $state.engine -or -not (Test-Path -LiteralPath ([string]$state.engine) -PathType Container)) {
    throw 'Selected engine is absent. No files changed.'
}
$engine = (Resolve-Path -LiteralPath ([string]$state.engine)).Path
$gamePort = [int]$state.gamePort
$webPort = [int]$state.webPort
$envFile = Join-Path $engine '.env'
$worldSource = Join-Path $engine 'src\engine\World.ts'
$fredSource = Join-Path $engine 'src\engine\bot\FredGeorgeBot.ts'
$lunaSource = Join-Path $engine 'src\engine\entity\BotPlayer.ts'

$fredFlag = Get-Flag $envFile 'JOSHRS_FRED_GEORGE'
$lunaFlag = Get-Flag $envFile 'DEV_LUNA_BOT'
$customStatePath = Get-Flag $envFile 'JOSHRS_FG_STATE_FILE'
$statePath = Join-Path $RepoRoot 'runtime\jparris-377\fred-george-isolated\live-bot-state.json'
if ($customStatePath -and $customStatePath -notin @('missing', 'unknown')) {
    # Status file is optional. Never follow an arbitrary environment path outside private runtime.
    $runtimeRoot = (Resolve-Path -LiteralPath (Join-Path $RepoRoot 'runtime\jparris-377')).Path
    try {
        $absolute = [IO.Path]::GetFullPath($customStatePath)
        if ($absolute.StartsWith($runtimeRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            $statePath = $absolute
        }
    } catch { }
}

$live = [ordered]@{
    reportPresent = $false
    reportFresh = $false
    ageSeconds = $null
    reportGamePortMatches = $null
    fredOnline = $null
    georgeOnline = $null
    fredTask = $null
    georgeTask = $null
}
if (Test-Path -LiteralPath $statePath -PathType Leaf) {
    $live.reportPresent = $true
    try {
        $data = Get-Content -LiteralPath $statePath -Raw -ErrorAction Stop | ConvertFrom-Json
        if ($data.schema -eq 'joshrs-fred-george-live-state-v1') {
            $utc = [DateTimeOffset]::Parse([string]$data.updated_utc).ToUniversalTime()
            $age = ([DateTimeOffset]::UtcNow - $utc).TotalSeconds
            $live.ageSeconds = [int][Math]::Round($age)
            $live.reportGamePortMatches = ([int]$data.game_port -eq $gamePort)
            $live.reportFresh = ($age -ge 0 -and $age -le 60 -and $live.reportGamePortMatches)
            if ($live.reportFresh -and $data.bots -and $data.bots.Fred -and $data.bots.George) {
                $live.fredOnline = [bool]$data.bots.Fred.online
                $live.georgeOnline = [bool]$data.bots.George.online
                $live.fredTask = [string]$data.bots.Fred.current_task
                $live.georgeTask = [string]$data.bots.George.current_task
            }
        }
    } catch {
        # Malformed or incomplete report is not proof that bots are absent.
        $live.reportFresh = $false
    }
}
$engineProcesses = $null
try {
    $engineProcesses = @(
        Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction Stop |
        Where-Object {
            $_.CommandLine -and
            $_.CommandLine.IndexOf($engine, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
            $_.CommandLine -match 'src[/\\]app\.ts'
        }
    ).Count
} catch { }

[pscustomobject]@{
    schema = 'joshrs-windows-readonly-agents-v1'
    configuredWorldPort = $gamePort
    gameListening = Port-Listening $gamePort
    webListening = Port-Listening $webPort
    matchingEngineNodeProcesses = $engineProcesses
    fredGeorge = [pscustomobject]@{
        configured = ($fredFlag -eq '1')
        moduleInstalled = (Test-Path -LiteralPath $fredSource -PathType Leaf)
        worldSpawnWired = (Source-Contains $worldSource 'spawnFredAndGeorgeBots')
        worldTickWired = (Source-Contains $worldSource 'tickFredAndGeorgeBots')
        live = [pscustomobject]$live
    }
    luna = [pscustomobject]@{
        configured = ($lunaFlag -eq 'true' -or $lunaFlag -eq '1')
        moduleInstalled = (Test-Path -LiteralPath $lunaSource -PathType Leaf)
        worldSpawnWired = (Source-Contains $worldSource 'spawnDevelopmentBots')
    }
    rsSdk = [pscustomobject]@{
        completeRevision377AgentBridgeVerified = $false
        note = 'RS-SDK revision-225 agent launch is not a drop-in client for revision 377. Current local agents may be server-side bots only.'
    }
    interpretation = 'Configuration and installed code do not prove an in-game bot. Fresh matching native report and in-game observation are stronger evidence. Read-only: no processes, credentials, accounts or saves changed.'
} | ConvertTo-Json -Depth 8
, '').Trim([char[]]@([char]39, [char]34, [char]32))
    return $value
}
function Port-Listening([int]$Port) {
    if ($Port -lt 1 -or $Port -gt 65535) { return $false }
    $socket = New-Object Net.Sockets.TcpClient
    try {
        $async = $socket.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(350)) { return $false }
        $socket.EndConnect($async)
        return $true
    } catch { return $false } finally { $socket.Dispose() }
}
function Source-Contains([string]$File, [string]$Pattern) {
    if (-not (Test-Path -LiteralPath $File -PathType Leaf)) { return $false }
    return [bool](Select-String -LiteralPath $File -Pattern $Pattern -Quiet)
}

$activePath = Join-Path $RepoRoot 'runtime\jparris-377\active.json'
if (-not (Test-Path -LiteralPath $activePath -PathType Leaf)) {
    throw 'Active Windows world configuration absent. No files changed.'
}
$state = Get-Content -LiteralPath $activePath -Raw -ErrorAction Stop | ConvertFrom-Json
if (-not $state.engine -or -not (Test-Path -LiteralPath ([string]$state.engine) -PathType Container)) {
    throw 'Selected engine is absent. No files changed.'
}
$engine = (Resolve-Path -LiteralPath ([string]$state.engine)).Path
$gamePort = [int]$state.gamePort
$webPort = [int]$state.webPort
$envFile = Join-Path $engine '.env'
$worldSource = Join-Path $engine 'src\engine\World.ts'
$fredSource = Join-Path $engine 'src\engine\bot\FredGeorgeBot.ts'
$lunaSource = Join-Path $engine 'src\engine\entity\BotPlayer.ts'

$fredFlag = Get-Flag $envFile 'JOSHRS_FRED_GEORGE'
$lunaFlag = Get-Flag $envFile 'DEV_LUNA_BOT'
$customStatePath = Get-Flag $envFile 'JOSHRS_FG_STATE_FILE'
$statePath = Join-Path $RepoRoot 'runtime\jparris-377\fred-george-isolated\live-bot-state.json'
if ($customStatePath -and $customStatePath -notin @('missing', 'unknown')) {
    # Status file is optional. Never follow an arbitrary environment path outside private runtime.
    $runtimeRoot = (Resolve-Path -LiteralPath (Join-Path $RepoRoot 'runtime\jparris-377')).Path
    try {
        $absolute = [IO.Path]::GetFullPath($customStatePath)
        if ($absolute.StartsWith($runtimeRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            $statePath = $absolute
        }
    } catch { }
}

$live = [ordered]@{
    reportPresent = $false
    reportFresh = $false
    ageSeconds = $null
    reportGamePortMatches = $null
    fredOnline = $null
    georgeOnline = $null
    fredTask = $null
    georgeTask = $null
}
if (Test-Path -LiteralPath $statePath -PathType Leaf) {
    $live.reportPresent = $true
    try {
        $data = Get-Content -LiteralPath $statePath -Raw -ErrorAction Stop | ConvertFrom-Json
        if ($data.schema -eq 'joshrs-fred-george-live-state-v1') {
            $utc = [DateTimeOffset]::Parse([string]$data.updated_utc).ToUniversalTime()
            $age = ([DateTimeOffset]::UtcNow - $utc).TotalSeconds
            $live.ageSeconds = [int][Math]::Round($age)
            $live.reportGamePortMatches = ([int]$data.game_port -eq $gamePort)
            $live.reportFresh = ($age -ge 0 -and $age -le 60 -and $live.reportGamePortMatches)
            if ($live.reportFresh -and $data.bots) {
                $live.fredOnline = [bool]$data.bots.Fred.online
                $live.georgeOnline = [bool]$data.bots.George.online
                $live.fredTask = [string]$data.bots.Fred.current_task
                $live.georgeTask = [string]$data.bots.George.current_task
            }
        }
    } catch {
        # Malformed or incomplete report is not proof that bots are absent.
        $live.reportFresh = $false
    }
}
$engineProcesses = $null
try {
    $engineProcesses = @(
        Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction Stop |
        Where-Object {
            $_.CommandLine -and
            $_.CommandLine.IndexOf($engine, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
            $_.CommandLine -match 'src[/\\]app\.ts'
        }
    ).Count
} catch { }

[pscustomobject]@{
    schema = 'joshrs-windows-readonly-agents-v1'
    configuredWorldPort = $gamePort
    gameListening = Port-Listening $gamePort
    webListening = Port-Listening $webPort
    matchingEngineNodeProcesses = $engineProcesses
    fredGeorge = [pscustomobject]@{
        configured = ($fredFlag -eq '1')
        moduleInstalled = (Test-Path -LiteralPath $fredSource -PathType Leaf)
        worldSpawnWired = (Source-Contains $worldSource 'spawnFredAndGeorgeBots')
        worldTickWired = (Source-Contains $worldSource 'tickFredAndGeorgeBots')
        live = [pscustomobject]$live
    }
    luna = [pscustomobject]@{
        configured = ($lunaFlag -eq 'true' -or $lunaFlag -eq '1')
        moduleInstalled = (Test-Path -LiteralPath $lunaSource -PathType Leaf)
        worldSpawnWired = (Source-Contains $worldSource 'spawnDevelopmentBots')
    }
    rsSdk = [pscustomobject]@{
        completeRevision377AgentBridgeVerified = $false
        note = 'RS-SDK revision-225 agent launch is not a drop-in client for revision 377. Current local agents may be server-side bots only.'
    }
    interpretation = 'Configuration and installed code do not prove an in-game bot. Fresh matching native report and in-game observation are stronger evidence. Read-only: no processes, credentials, accounts or saves changed.'
} | ConvertTo-Json -Depth 8
