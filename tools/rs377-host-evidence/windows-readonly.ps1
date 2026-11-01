# JoshRS - Windows host identity and listener capture.
# READ-ONLY: no game start/stop, account reads, environment dumps or player/save access.
# Compatible with Windows PowerShell 5.1. Review before running.
[CmdletBinding()]
param(
    [string]$ActiveStatePath = 'C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json'
)
$ErrorActionPreference = 'Stop'

function Safe-SourceHash([string]$file) {
    try {
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { return $null }
        return (Get-FileHash -LiteralPath $file -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant()
    } catch { return $null }
}
function Scope-Of([string]$address) {
    if ($address -in @('127.0.0.1','::1')) { return 'loopback' }
    if ($address -in @('0.0.0.0','::')) { return 'all-interfaces' }
    return 'specific-interface-address-redacted'
}
$gamePorts = @(52402,8888,8898,53402,8988)
$listenerReports = @(
    foreach ($port in $gamePorts) {
        $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
        if ($listeners.Count -eq 0) {
            [pscustomobject]@{port=$port;listening=$false;bindings=@()}
            continue
        }
        $details = @(
            foreach ($listener in $listeners) {
                $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
                [pscustomobject]@{
                    scope=Scope-Of ([string]$listener.LocalAddress)
                    pid=[int]$listener.OwningProcess
                    process=if ($owner) { [string]$owner.ProcessName } else { 'owner-hidden-or-unknown' }
                }
            }
        )
        [pscustomobject]@{port=$port;listening=$true;bindings=$details}
    }
)
$statePresent = Test-Path -LiteralPath $ActiveStatePath -PathType Leaf
$runtime = [ordered]@{activeConfigFound=[bool]$statePresent;stateFileSha256=$null;
    engineSourceFound=$null;engineSourceSha256=$null;clientSourceFound=$null;
    clientSourceSha256=$null;note='File hashes identify a configured installation, NOT the active server/world.'}
if ($statePresent) {
    try {
        $active = Get-Content -LiteralPath $ActiveStatePath -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        $runtime.stateFileSha256 = Safe-SourceHash $ActiveStatePath
        if ($active.engine) {
            $source = Join-Path ([string]$active.engine) 'src\app.ts'
            $runtime.engineSourceFound = Test-Path -LiteralPath $source -PathType Leaf
            $runtime.engineSourceSha256 = Safe-SourceHash $source
        }
        if ($active.client) {
            $source = Join-Path ([string]$active.client) 'src\main\java\jagex2\client\Client.java'
            $runtime.clientSourceFound = Test-Path -LiteralPath $source -PathType Leaf
            $runtime.clientSourceSha256 = Safe-SourceHash $source
        }
    } catch {
        $runtime.note = 'Active config was found but could not be read/parsed. No other files inspected.'
    }
}
$addresses = @(
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.AddressState -eq 'Preferred' } |
        Select-Object -First 12 -Property InterfaceAlias,IPAddress
)
$report = [ordered]@{
    tool='JoshRS Windows host read-only identity check'
    capturedAtUtc=(Get-Date).ToUniversalTime().ToString('o')
    computerName=$env:COMPUTERNAME
    osCaption=(Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue).Caption
    networkIPv4=$addresses
    listeners=$listenerReports
    configuredRuntime=$runtime
    separateWorldIdentity='UNVERIFIED: source hashes and ports do not prove which live world Elrothiro uses'
    realBotLogin='NOT TESTED'
    sameWorldBotVisibility='NOT TESTED'
    guarantee='Read-only: no credentials, player saves, SQLite database, private keys, process command-lines or game restarts accessed.'
}
$report | ConvertTo-Json -Depth 8
