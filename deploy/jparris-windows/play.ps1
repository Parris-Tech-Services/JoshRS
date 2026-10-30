[CmdletBinding()]
param([ValidateSet('Both','Server','Client')][string]$Role='Both')

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$stateFile = Join-Path $repo 'runtime\jparris-377\active.json'
if (-not (Test-Path -LiteralPath $stateFile)) {
    throw 'JoshRS is not configured on this computer. First run jparris-setup.cmd.'
}
$s = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
foreach ($path in @($s.engine,$s.content,$s.client)) {
    if (-not (Test-Path -LiteralPath $path -PathType Container)) {
        throw "A required game directory is missing: $path. Restore your USB backup or rerun setup."
    }
}
function Port-Open([int]$number) {
    $socket = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $socket.BeginConnect('127.0.0.1',$number,$null,$null)
        if (-not $async.AsyncWaitHandle.WaitOne(600)) { return $false }
        $socket.EndConnect($async)
        return $true
    } catch { return $false } finally { $socket.Dispose() }
}
function Start-RoleWindow([string]$role) {
    $command = "-NoProfile -NoExit -ExecutionPolicy Bypass -File " +
        ('"' + $PSCommandPath + '"') + " -Role $role"
    Start-Process -FilePath 'powershell.exe' -ArgumentList $command -WorkingDirectory $repo
}
if ($Role -eq 'Server') {
    Push-Location -LiteralPath $s.engine
    try {
        Write-Host "Starting JoshRS revision 377 on TCP $($s.gamePort); press Ctrl+C to stop gracefully."
        & npm.cmd run quickstart
        if ($LASTEXITCODE -ne 0) { throw "Server exited with code $LASTEXITCODE" }
    } finally { Pop-Location }
    return
}
if ($Role -eq 'Client') {
    Push-Location -LiteralPath $s.client
    try {
        $clientArguments = "10 $($s.portOffset) highmem members 32"
        Write-Host "Starting Java client (args: $clientArguments)"
        & (Join-Path $s.client 'gradlew.bat') run "--args=$clientArguments"
        if ($LASTEXITCODE -ne 0) { throw "Java client exited with code $LASTEXITCODE" }
    } finally { Pop-Location }
    return
}

$port = [int]$s.gamePort
$web = [int]$s.webPort
if (Port-Open $port) {
    Write-Warning "TCP port $port is already listening. I will NOT start a duplicate server."
    Write-Host 'Confirm the existing process belongs to your JoshRS game if the client cannot connect.'
} else {
    if (Port-Open $web) {
        throw "Port $web is already occupied but game port $port is not listening. Resolve the conflicting local web service without stopping unrelated programs."
    }
    Start-RoleWindow 'Server'
    Write-Host 'Server window opened. Waiting for the game and web services to become ready...'
}
$ready = $false
for ($i=0; $i -lt 120; $i++) {
    if ((Port-Open $port) -and (Port-Open $web)) { $ready=$true; break }
    Start-Sleep -Seconds 5
}
if (-not $ready) {
    throw "The game has not become reachable on $port and $web. Check the separate server window for errors before trying again."
}
Write-Host 'Game and web ports respond on this computer. Starting the Java client.'
Start-RoleWindow 'Client'
