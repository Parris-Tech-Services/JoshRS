# Import the host's CUSTOMISED Java client into a separate Windows VM.
# Requires a READ-ONLY VirtualBox Shared Folder exposing only the host client tree.
# Never reads/copies engine, content, save files, accounts or database.
[CmdletBinding()]
param(
    [string]$Source = '\\VBOXSVR\JoshRSClient',
    [string]$HostAddress = '10.0.2.2'
)
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:LOCALAPPDATA 'JoshRS-SecondPlayer'
$client = Join-Path $root 'client-java'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stage = Join-Path $root ('import-stage-' + $stamp)
$backup = Join-Path $root ('client-java-before-custom-' + $stamp)
$stageMoved = $false
$backupCreated = $false

$address = $null
if (-not [System.Net.IPAddress]::TryParse($HostAddress, [ref]$address) -or
    $address.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
    throw 'HostAddress must be an IPv4 address, such as 10.0.2.2.'
}
$HostAddress = $address.ToString()
$required = @('gradlew.bat','build.gradle','src\main\java\jagex2\client\Client.java')
foreach ($relative in $required) {
    if (-not (Test-Path -LiteralPath (Join-Path $Source $relative) -PathType Leaf)) {
        throw "Cannot read $relative from $Source. In VirtualBox, share the HOST's active Java client folder as READ-ONLY with name JoshRSClient; install Guest Additions if \\VBOXSVR is not available."
    }
}
if (-not (Test-Path -LiteralPath $client -PathType Container)) {
    throw "VM's isolated client not found at $client. Run the original VM client-only setup first."
}
$marker = Join-Path $root 'host-client-import.txt'
if (Test-Path -LiteralPath $marker) {
    Write-Host "A host client was imported previously. A new timestamped backup will be made."
}
Write-Host "Reading custom client from read-only share: $Source"
Write-Host "Installing ONLY into the VM's private client folder: $client"
Write-Host 'No server, player saves or account database will be touched.'
New-Item -ItemType Directory -Path $stage -Force | Out-Null
$cleanStage = $false
try {
    $args = @($Source,$stage,'/E','/XJ','/R:1','/W:1',
        '/XD','.git','.gradle','build','node_modules','.idea','.vscode','logs',
        '/XF','*.sav','*.sqlite','*.sqlite3','db.sqlite','.env','*.log',
        '/NFL','/NDL','/NJH','/NJS','/NP')
    & robocopy.exe @args | Out-Null
    $copyCode = $LASTEXITCODE
    if ($copyCode -ge 8) {
        throw "Copy from VirtualBox shared folder failed (robocopy exit $copyCode)."
    }
    foreach ($relative in $required) {
        if (-not (Test-Path -LiteralPath (Join-Path $stage $relative) -PathType Leaf)) {
            throw "Custom client archive incomplete: $relative"
        }
    }
    $sourceFile = Join-Path $stage 'src\main\java\jagex2\client\Client.java'
    $original = [System.IO.File]::ReadAllText($sourceFile)
    $localUrl = 'return new URL("http://127.0.0.1:" + (portOffset + 80));'
    $newUrl = 'return new URL("http://' + $HostAddress + ':" + (portOffset + 80));'
    $localGuard = 'if (host.endsWith("127.0.0.1")) {'
    $newGuard = 'if (host.endsWith("' + $HostAddress + '")) {'
    if ($original.Contains($localUrl)) {
        $modified = $original.Replace($localUrl, $newUrl)
    } elseif ($original.Contains($newUrl)) {
        $modified = $original
    } else {
        throw "Custom Java client's getCodeBase() differs from supported source. Stopped safely. Ask to adapt the network patch to this custom client without replacing its UI features."
    }
    if (-not $modified.Contains($newGuard)) {
        if (-not $modified.Contains($localGuard)) {
            throw 'Custom Java client host validation differs from supported source. Import stopped safely.'
        }
        $insert = $newGuard + [Environment]::NewLine +
            '            validHost = true;' + [Environment]::NewLine +
            '        }' + [Environment]::NewLine + '        '
        $modified = $modified.Replace($localGuard, $insert + $localGuard)
    }
    if ($original -ne $modified) {
        [System.IO.File]::WriteAllText($sourceFile,$modified,[System.Text.UTF8Encoding]::new($false))
    }

    # Use the working JDK 21 from the previous VM installation. No installers.
    . (Join-Path $PSScriptRoot 'jdk.ps1')
    $homes = @(Get-ChildItem -LiteralPath (Join-Path $root 'jdk') -Directory -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty FullName)
    $jdk = Find-JoshRSJdk21 -AdditionalHomes $homes
    if (-not $jdk) { throw 'Java 21 not found. Install the second-player VM client first.' }
    $env:JAVA_HOME = $jdk
    $env:Path = (Join-Path $jdk 'bin') + ';' + $env:Path
    Write-Host "Compiling customised client with Java 21: $jdk"
    Push-Location -LiteralPath $stage
    try {
        & (Join-Path $stage 'gradlew.bat') --no-daemon classes
        if ($LASTEXITCODE -ne 0) { throw 'Custom client compilation failed. Existing VM client remains untouched.' }
    } finally { Pop-Location }

    # Do not replace active JVM process files.
    $running = @(Get-CimInstance Win32_Process -Filter "Name='java.exe' OR Name='javaw.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and
            $_.CommandLine.Contains($client, [StringComparison]::OrdinalIgnoreCase) })
    if ($running.Count -gt 0) {
        throw 'Sylvie client is still running. Close its RuneScape window and run this import again. The existing client has NOT been replaced.'
    }
    if (Test-Path -LiteralPath $backup) {
        throw "Backup path already exists; refusing to replace: $backup"
    }
    Move-Item -LiteralPath $client -Destination $backup
    $backupCreated = $true
    try {
        Move-Item -LiteralPath $stage -Destination $client
        $stageMoved = $true
    } catch {
        Move-Item -LiteralPath $backup -Destination $client
        $backupCreated = $false
        throw
    }
    $notes = "Imported $stamp from VirtualBox shared client; host=$HostAddress; original VM client backed up locally to $backup"
    [System.IO.File]::WriteAllText($marker,$notes)
    $cleanStage = $true
    Write-Host 'SUCCESS: Custom Java client installed into Sylvie VM.'
    Write-Host "Original VM client backup: $backup"
    Write-Host 'Launch the existing Play JoshRS - Second Player desktop shortcut.'
    Write-Host 'Log into Sylvie and verify Zoom, fullscreen and World Map manually.'
} finally {
    if (-not $stageMoved -and (Test-Path -LiteralPath $stage)) {
        # Keep staging sources for troubleshooting after a failed import, not player data.
        Write-Host "Safe-to-delete incomplete staging folder: $stage"
    }
}
