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

function Download-File([string]$url, [string]$destination) {
    # curl.exe is bundled with supported Windows 11 systems and generally transfers faster
    # than Windows PowerShell 5.1 Invoke-WebRequest for large binary files.
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curl) {
        & $curl.Source -fL --retry 3 --connect-timeout 20 --progress-bar -o $destination $url
        if ($LASTEXITCODE -ne 0) { throw "Download failed: $url" }
    } else {
        Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $destination
    }
    if (-not (Test-Path -LiteralPath $destination -PathType Leaf) -or
        (Get-Item -LiteralPath $destination).Length -eq 0) {
        throw "Downloaded file is missing or empty: $destination"
    }
}

function Enable-JoshRSGuestJava21 {
    $portable = Join-Path $root 'jdk'
    $homes = @(Get-ChildItem -LiteralPath $portable -Directory -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty FullName)
    $jdk = Find-JoshRSJdk21 -AdditionalHomes $homes
    if (-not $jdk) {
        if ($PlayOnly) { throw 'Java 21 missing. Run the installer again without -PlayOnly.' }
        if ($env:PROCESSOR_ARCHITECTURE -notin @('AMD64','ARM64')) {
            throw "Unsupported Windows CPU architecture: $env:PROCESSOR_ARCHITECTURE."
        }
        $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'aarch64' } else { 'x64' }
        Write-Host 'Java 21 not found. Downloading free portable Eclipse Temurin JDK 21 (no winget needed)...'
        $metaUrl = "https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=$arch&image_type=jdk&os=windows&vendor=eclipse"
        $assets = @(Invoke-RestMethod -Uri $metaUrl -UseBasicParsing)
        $asset = $assets | Where-Object {
            $_.binary.package.name -like '*.zip' -and $_.binary.package.checksum
        } | Select-Object -First 1
        if (-not $asset) { throw 'Could not find a zipped Eclipse Temurin JDK 21 for Windows.' }
        $downloadLink = [string]$asset.binary.package.link
        $checksum = [string]$asset.binary.package.checksum
        if ($downloadLink -notmatch '^https://github\.com/adoptium/temurin21-binaries/') {
            throw "Unexpected Java archive host: $downloadLink"
        }
        New-Item -ItemType Directory -Path $portable -Force | Out-Null
        $zip = Join-Path $root 'jdk21.zip'
        Download-File $downloadLink $zip
        $actual = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
        if ($actual -ine $checksum) {
            Remove-Item -LiteralPath $zip -Force
            throw 'Downloaded Java 21 archive failed the official SHA-256 checksum.'
        }
        Write-Host 'Verified Java SHA-256. Extracting portable JDK...'
        Expand-Archive -LiteralPath $zip -DestinationPath $portable -Force
        Remove-Item -LiteralPath $zip -Force
        $homes = @(Get-ChildItem -LiteralPath $portable -Directory | Select-Object -ExpandProperty FullName)
        $jdk = Find-JoshRSJdk21 -AdditionalHomes $homes
        if (-not $jdk) { throw 'Java archive extracted, but Java 21 compiler was not found.' }
    }
    $env:JAVA_HOME = $jdk
    $env:Path = (Join-Path $jdk 'bin') + ';' + $env:Path
    Write-Host "Using Java 21: $jdk"
    return $jdk
}

if (-not $PlayOnly) {
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    $null = Enable-JoshRSGuestJava21

    $expected = [string]$manifest.client.commit
    $pinFile = Join-Path $client 'source-pin.txt'
    if (-not (Test-Path -LiteralPath $client)) {
        Write-Host 'Downloading only pinned Client-Java source as ZIP (no Git or winget needed)...'
        $zip = Join-Path $root 'client-java.zip'
        $stage = Join-Path $root 'client-unpack'
        Download-File "https://github.com/LostCityRS/Client-Java/archive/$expected.zip" $zip
        if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
        Expand-Archive -LiteralPath $zip -DestinationPath $stage -Force
        $unpacked = @(Get-ChildItem -LiteralPath $stage -Directory | Where-Object {
            Test-Path -LiteralPath (Join-Path $_.FullName 'gradlew.bat') -PathType Leaf
        })
        if ($unpacked.Count -ne 1) { throw 'Downloaded Java client archive has an unexpected layout.' }
        Move-Item -LiteralPath $unpacked[0].FullName -Destination $client
        [System.IO.File]::WriteAllText($pinFile, $expected)
        Remove-Item -LiteralPath $stage -Recurse -Force
        Remove-Item -LiteralPath $zip -Force
    } else {
        # Never overwrite an existing client, custom code or incomplete checkout.
        if (-not (Test-Path -LiteralPath $pinFile -PathType Leaf) -or
            (Get-Content -LiteralPath $pinFile -Raw).Trim() -ne $expected) {
            throw "Client directory exists but isn't our pinned ZIP install: $client. Refusing to overwrite it."
        }
        Write-Host 'Reusing previously downloaded pinned Java client.'
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
    $null = Enable-JoshRSGuestJava21
}

Write-Host "Launching the second client. Log in/create a DIFFERENT game account named '$PlayerName'."
Write-Host 'Keep Elrothiro logged into the existing JParris Desktop server.'
Push-Location -LiteralPath $client
try {
    $clientArgs = "10 $offset highmem members 32"
    & (Join-Path $client 'gradlew.bat') --no-daemon run "--args=$clientArgs"
    if ($LASTEXITCODE -ne 0) { throw "Second player client exited with code $LASTEXITCODE." }
} finally { Pop-Location }
