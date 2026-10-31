# JoshRS revision-377 second-player launcher for a Windows guest.
# Installs ONLY the pinned Java client, never an engine, content pack, or account DB.
# Intended for VirtualBox NAT: 10.0.2.2 normally reaches the Windows host.
[CmdletBinding()]
param(
    [string]$HostAddress = '10.0.2.2',
    [string]$PlayerName = 'Second Player',
    [switch]$PlayOnly
)

$ErrorActionPreference = 'Stop'
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'upstreams.json') -Raw | ConvertFrom-Json
. (Join-Path $PSScriptRoot 'jdk.ps1')
$root = Join-Path $env:LOCALAPPDATA 'JoshRS-SecondPlayer'
$client = Join-Path $root 'client-java'
$sourceFile = Join-Path $client 'src\main\java\jagex2\client\Client.java'
$gamePort = [int]$manifest.gamePort
$webPort = [int]$manifest.webPort
$offset = [int]$manifest.clientPortOffset

$parsedHost = $null
if (-not [System.Net.IPAddress]::TryParse($HostAddress, [ref]$parsedHost) -or
    $parsedHost.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
    throw 'HostAddress must be a valid IPv4 address. For standard VirtualBox NAT use 10.0.2.2.'
}
$HostAddress = $parsedHost.ToString()
if ($PlayerName -notmatch '^[A-Za-z0-9_ ]{1,12}$') {
    throw 'PlayerName must be between 1 and 12 letters, numbers, spaces or underscores.'
}
if ($webPort -ne ($offset + 80) -or $gamePort -ne ($offset + 43594)) {
    throw "Pinned manifest has incompatible ports: game=$gamePort HTTP=$webPort offset=$offset."
}

function Test-TcpPort([string]$address, [int]$port) {
    $socket = [System.Net.Sockets.TcpClient]::new()
    try {
        $attempt = $socket.BeginConnect($address, $port, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne(1800)) { return $false }
        $socket.EndConnect($attempt)
        return $true
    } catch { return $false } finally { $socket.Dispose() }
}

Write-Host "JoshRS second-player client - $PlayerName"
Write-Host "Checking existing JParris Desktop world at $HostAddress (game $gamePort, HTTP $webPort)..."
$gameReady = Test-TcpPort $HostAddress $gamePort
$webReady = Test-TcpPort $HostAddress $webPort
if (-not $gameReady -or -not $webReady) {
    throw ("Existing JoshRS host is not reachable from this VM. Game port " + $gamePort +
        " reachable: " + $gameReady + "; HTTP port " + $webPort + " reachable: " + $webReady +
        ". Check that the original JoshRS server is running on JParris Desktop. " +
        "On this VM try: Test-NetConnection " + $HostAddress + " -Port " + $gamePort +
        ". No second server or player save has been created.")
}
Write-Host 'Both host ports are reachable. This VM will NOT start a game server.'

if (-not $PlayOnly) {
    if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
        if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
            throw 'Git is missing and winget is unavailable. Install free Git for Windows, then rerun.'
        }
        Write-Host 'Installing free Git for Windows...'
        & winget.exe install --exact --id Git.Git --source winget --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -ne 0) { throw 'Git installation failed. Read the installer message and retry.' }
        $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
            [Environment]::GetEnvironmentVariable('Path','User')
        if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
            throw 'Git installed but is not on PATH yet. Open a new PowerShell window and retry.'
        }
    }

    $null = Set-JoshRSJdk21 -InstallIfMissing
    New-Item -ItemType Directory -Path $root -Force | Out-Null

    $expected = [string]$manifest.client.commit
    if (-not (Test-Path -LiteralPath $client)) {
        Write-Host 'Downloading only the pinned revision-377 Java client (not the game server)...'
        & git.exe clone --depth 1 --single-branch --branch ([string]$manifest.client.branch) ([string]$manifest.client.url) $client
        if ($LASTEXITCODE -ne 0) { throw 'Java client download failed.' }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $client '.git') -PathType Container)) {
        throw "Client folder is not a Git checkout; refusing to overwrite it: $client"
    }
    $head = (& git.exe -C $client rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Could not identify the existing Java client checkout.' }
    if ($head -ne $expected) {
        # Only allow an untouched initial clone to be pinned; don't reset a modified installation.
        $dirty = & git.exe -C $client status --porcelain
        if ($LASTEXITCODE -ne 0 -or $dirty) {
            throw 'Existing Java client has modifications or an unexpected commit. Refusing to overwrite it.'
        }
        & git.exe -C $client fetch --depth 1 origin $expected
        if ($LASTEXITCODE -ne 0) { throw 'Could not fetch pinned client revision.' }
        & git.exe -C $client checkout --detach $expected
        if ($LASTEXITCODE -ne 0) { throw 'Could not check out pinned client revision.' }
    }
    if ((& git.exe -C $client rev-parse HEAD).Trim() -ne $expected) {
        throw 'Java client does not match the pinned source revision.'
    }
    if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf)) {
        throw "Pinned client is missing source: $sourceFile"
    }

    # Non-applet Client.java uses getCodeBase() to find both game and HTTP endpoints.
    # Its host validation must explicitly allow this chosen LAN/NAT host.
    $original = [System.IO.File]::ReadAllText($sourceFile)
    $localUrl = 'return new URL("http://127.0.0.1:" + (portOffset + 80));'
    $remoteUrl = 'return new URL("http://' + $HostAddress + ':" + (portOffset + 80));'
    $guard = 'if (host.endsWith("127.0.0.1")) {'
    $remoteGuard = 'if (host.endsWith("' + $HostAddress + '")) {'
    $patched = $original
    if ($patched.Contains($localUrl)) {
        $patched = $patched.Replace($localUrl, $remoteUrl)
    } elseif (-not $patched.Contains($remoteUrl)) {
        throw 'Unexpected client getCodeBase implementation; refusing to guess a network patch.'
    }
    if (-not $patched.Contains($remoteGuard)) {
        if (-not $patched.Contains($guard)) {
            throw 'Unexpected client host verification; refusing to bypass security checks.'
        }
        $allow = $remoteGuard + [Environment]::NewLine +
            '            validHost = true;' + [Environment]::NewLine +
            '        }' + [Environment]::NewLine + '        '
        $patched = $patched.Replace($guard, $allow + $guard)
    }
    if ($patched -ne $original) {
        [System.IO.File]::WriteAllText($sourceFile, $patched, [System.Text.UTF8Encoding]::new($false))
        Write-Host "Patched only this VM's Java client to reach $HostAddress."
    }
    Write-Host 'Compiling Java client...'
    Push-Location -LiteralPath $client
    try {
        & (Join-Path $client 'gradlew.bat') --no-daemon classes
        if ($LASTEXITCODE -ne 0) { throw 'Client compilation failed. No game server was changed.' }
    } finally { Pop-Location }

    try {
        $desktop = [Environment]::GetFolderPath('Desktop')
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut((Join-Path $desktop 'Play JoshRS - Second Player.lnk'))
        $shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
        $shortcut.Arguments = ('-NoProfile -NoExit -ExecutionPolicy Bypass -File "' + $PSCommandPath +
            '" -PlayOnly -HostAddress ' + $HostAddress + ' -PlayerName "' + $PlayerName + '"')
        $shortcut.WorkingDirectory = $root
        $shortcut.Description = 'Launch only a second JoshRS 377 Java client; connects to the existing world.'
        $shortcut.Save()
        Write-Host 'Created desktop shortcut: Play JoshRS - Second Player'
    } catch {
        Write-Warning "Desktop shortcut could not be created: $_"
    }
} else {
    if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf)) {
        throw "Client-only setup has not completed. First rerun the launcher without -PlayOnly."
    }
    $null = Set-JoshRSJdk21
}

Write-Host "Launching the second client. Log in/create a DIFFERENT game account named '$PlayerName'."
Write-Host 'Keep Elrothiro logged into the existing JParris Desktop server.'
Push-Location -LiteralPath $client
try {
    $clientArgs = "10 $offset highmem members 32"
    & (Join-Path $client 'gradlew.bat') --no-daemon run "--args=$clientArgs"
    if ($LASTEXITCODE -ne 0) { throw "Second player client exited with code $LASTEXITCODE." }
} finally { Pop-Location }
