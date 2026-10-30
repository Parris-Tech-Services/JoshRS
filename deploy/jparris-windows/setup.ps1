[CmdletBinding()]
param(
    [string]$UsbPath = '',
    [switch]$SkipStart,
    [switch]$CheckOnly,
    [switch]$Interactive
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtime = Join-Path $repo 'runtime\jparris-377'
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'upstreams.json') -Raw | ConvertFrom-Json
$activeFile = Join-Path $runtime 'active.json'
. (Join-Path $PSScriptRoot 'jdk.ps1')

function Run-Native([string]$exe, [string[]]$arguments, [string]$workingDirectory) {
    Push-Location -LiteralPath $workingDirectory
    try {
        & $exe @arguments
        if ($LASTEXITCODE -ne 0) { throw "$exe failed with exit code $LASTEXITCODE" }
    } finally { Pop-Location }
}
function Check-Requirements {
    $requirements = @(
        @{ command='git.exe'; package='Git.Git' },
        @{ command='node.exe'; package='OpenJS.NodeJS.LTS' },
        @{ command='npm.cmd'; package='OpenJS.NodeJS.LTS' }
    )
    $missing = @($requirements | Where-Object { -not (Get-Command $_.command -ErrorAction SilentlyContinue) } |
        Select-Object -ExpandProperty package -Unique)
    if ($missing.Count -gt 0) {
        Write-Host 'Installing missing free tools using Windows Package Manager:'
        $missing | ForEach-Object { Write-Host "  $_" }
        if (-not (Get-Command 'winget.exe' -ErrorAction SilentlyContinue)) {
            throw 'Install Git, Node.js 24+ and JDK 21, then run this setup again. Windows Package Manager was not found.'
        }
        foreach ($id in $missing) {
            & winget.exe install --id $id --exact --source winget --accept-package-agreements --accept-source-agreements
            if ($LASTEXITCODE -ne 0) { throw "Installer failed for $id. Check the message above and rerun setup." }
        }
        # Reload PATH after native installers complete.
        $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
            [Environment]::GetEnvironmentVariable('Path','User')
        $availableCount = @(Get-Command 'git.exe','node.exe','npm.cmd','java.exe','javac.exe' -ErrorAction SilentlyContinue).Count
        if ($availableCount -ne 3) {
            throw 'Tool installation finished. Close this terminal, open a new one and run setup again.'
        }
    }
    $nodeMajor = [int](& node.exe -p "Number(process.versions.node.split('.')[0])")
    if ($LASTEXITCODE -ne 0 -or $nodeMajor -lt [int]$manifest.nodeMinMajor) {
        throw "Node.js $($manifest.nodeMinMajor)+ is required. Update Node using: winget upgrade --id OpenJS.NodeJS.LTS --exact"
    }
    # Java 17 can coexist with JDK 21. Install or find 21 and use it only
    # for this installation and the child Gradle/Java processes.
    $selectedJdk=Set-JoshRSJdk21 -InstallIfMissing
    Write-Host "Prerequisites OK: Node $(& node.exe --version), Git, JDK 21 at $selectedJdk"
}
function Get-PinnedRepo($spec, [string]$directory) {
    if (Test-Path -LiteralPath (Join-Path $directory '.git')) {
        $head = (& git.exe -C $directory rev-parse HEAD).Trim()
        if ($head -ne [string]$spec.commit) {
            throw "Existing upstream checkout has changed: $directory. Refusing to overwrite your files; inspect this checkout before reusing."
        }
        Write-Host "Reusing pinned checkout: $directory"
        return
    }
    if (Test-Path -LiteralPath $directory) {
        throw "Destination exists but is not a Git checkout: $directory. Move it aside rather than overwriting it."
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $directory) -Force | Out-Null
    Run-Native 'git.exe' @('clone','--depth','1','--single-branch','--branch',[string]$spec.branch,[string]$spec.url,$directory) $repo
    $head = (& git.exe -C $directory rev-parse HEAD).Trim()
    if ($head -ne [string]$spec.commit) {
        Run-Native 'git.exe' @('-C',$directory,'fetch','--depth','1','origin',[string]$spec.commit) $repo
        Run-Native 'git.exe' @('-C',$directory,'checkout','--detach',[string]$spec.commit) $repo
    }
    $head = (& git.exe -C $directory rev-parse HEAD).Trim()
    if ($head -ne [string]$spec.commit) { throw "Source checksum mismatch for $directory" }
}
function Validate-Game([string]$engine, [string]$content) {
    foreach ($file in @('package.json','src\app.ts','src\engine\World.ts')) {
        if (-not (Test-Path -LiteralPath (Join-Path $engine $file) -PathType Leaf)) {
            throw "Incomplete game engine: missing $file in $engine"
        }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $content 'scripts') -PathType Container)) {
        throw "Incomplete game content: missing scripts/ in $content"
    }
}
function Find-UsbGame([string]$location) {
    $p = (Resolve-Path -LiteralPath $location).Path
    # Prefer the dedicated 377 checkout if both a root engine and a nested lostcity377 exist.
    foreach ($candidate in @((Join-Path $p 'lostcity377'),(Join-Path $p 'JoshRS\lostcity377'),
        $p,(Join-Path $p 'JoshRS'))) {
        if ((Test-Path -LiteralPath (Join-Path $candidate 'engine')) -and
            (Test-Path -LiteralPath (Join-Path $candidate 'content'))) { return $candidate }
    }
    throw "No engine/content folders found below $p. Select the USB folder containing your JoshRS copy."
}
function Copy-UsbFolder([string]$source, [string]$destination) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    & robocopy.exe $source $destination /E /XJ /R:1 /W:1 /XD node_modules .git .gradle build logs /NFL /NDL /NJH /NJS /NP
    if ($LASTEXITCODE -ge 8) { throw "USB copy failed (robocopy code $LASTEXITCODE). Existing USB files are unchanged." }
}
function EnvironmentValue([string]$file, [string]$key, [string]$fallback) {
    if (Test-Path -LiteralPath $file) {
        $line = Get-Content -LiteralPath $file | Where-Object { $_ -match ('^\s*' + [regex]::Escape($key) + '\s*=') } | Select-Object -Last 1
        if ($line) { return ($line -split '=',2)[1].Trim() }
    }
    return $fallback
}

if ($CheckOnly) {
    Write-Host "Upstream source lock: revision $($manifest.revision)"
    Write-Host "Engine: $($manifest.engine.commit)"
    Write-Host "Content: $($manifest.content.commit)"
    Write-Host "Java client: $($manifest.client.commit)"
    Write-Host "USB path: $UsbPath"
    exit 0
}

# Serialize setup so simultaneous launchers cannot migrate the same save files.
$setupMutex=[System.Threading.Mutex]::new($false, 'Local\JoshRS377WindowsSetup')
$setupLock=$false
try {
    $setupLock=$setupMutex.WaitOne(0)
    if (-not $setupLock) {
        throw 'JoshRS setup is already running in another window. Finish the first installation.'
    }

if ($Interactive -and -not $UsbPath -and -not (Test-Path -LiteralPath $activeFile)) {
    Write-Host '1. Restore my customised world and character from USB (recommended)'
    Write-Host '2. Install a clean world without my saved character'
    Write-Host 'Q. Cancel'
    $choice = Read-Host 'Choose 1, 2 or Q'
    if ($choice -eq '1') {
        Add-Type -AssemblyName System.Windows.Forms
        $picker = New-Object System.Windows.Forms.FolderBrowserDialog
        $picker.Description = 'Select the JoshRS folder on your USB drive'
        $picker.ShowNewFolderButton = $false
        try {
            if ($picker.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { throw 'Setup cancelled; no game files were changed.' }
            $UsbPath = $picker.SelectedPath
        } finally { $picker.Dispose() }
    } elseif ($choice -ne '2') { throw 'Setup cancelled; no game files were changed.' }
}
# Reject incomplete or recursive copies before installing any software.
if ($UsbPath) {
    $source = Find-UsbGame $UsbPath
    Validate-Game (Join-Path $source 'engine') (Join-Path $source 'content')
    $sourcePrefix = $source.TrimEnd('\') + '\'
    if ($runtime.StartsWith($sourcePrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Extract this launcher outside the USB game folder before importing it.'
    }
}
if (Test-Path -LiteralPath $activeFile) {
    $previous = Get-Content -LiteralPath $activeFile -Raw | ConvertFrom-Json
    $listener = Get-NetTCPConnection -State Listen -LocalPort ([int]$previous.gamePort),([int]$previous.webPort) -ErrorAction SilentlyContinue
    if ($listener) { throw 'Stop the running world with Ctrl+C in its server window before running setup. To play, use jparris-play.cmd.' }
}
Check-Requirements
New-Item -ItemType Directory -Path $runtime -Force | Out-Null

if ($UsbPath) {
    $source = Find-UsbGame $UsbPath
    Validate-Game (Join-Path $source 'engine') (Join-Path $source 'content')
    $label = 'usb-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
    $destination = Join-Path $runtime $label
    if (Test-Path -LiteralPath $destination) { throw 'A snapshot with this timestamp already exists. Retry once the second changes.' }
    Write-Host "Copying your original Fedora work to: $destination"
    Copy-UsbFolder $source $destination
    $engine = Join-Path $destination 'engine'
    $content = Join-Path $destination 'content'
    $client = Join-Path $destination 'client-java'
    if (-not (Test-Path -LiteralPath (Join-Path $client 'gradlew.bat'))) {
        # The original project sometimes keeps client-java beside lostcity377.
        $other = @((Join-Path $source '..\client-java'),(Join-Path $source '..\..\client-java')) |
            Where-Object { Test-Path -LiteralPath (Join-Path $_ 'gradlew.bat') } |
            Select-Object -First 1
        if ($other) { Copy-UsbFolder $other $client }
        else {
            Write-Warning 'Custom Java client not found on USB. A clean upstream Java client will be used; your custom world map will not appear until that client is imported.'
            $client = Join-Path $runtime 'upstream-client'
            Get-PinnedRepo $manifest.client $client
        }
    }
} elseif (Test-Path -LiteralPath $activeFile) {
    $existing = Get-Content -LiteralPath $activeFile -Raw | ConvertFrom-Json
    $engine = [string]$existing.engine
    $content = [string]$existing.content
    $client = [string]$existing.client
    Write-Host "Reusing configured game: $engine"
} else {
    $base = Join-Path $runtime 'upstream'
    $engine = Join-Path $base 'engine'
    $content = Join-Path $base 'content'
    $client = Join-Path $base 'client-java'
    Write-Warning 'No USB folder supplied. This sets up CLEAN revision 377, not your personalised Fedora game or player.'
    Get-PinnedRepo $manifest.engine $engine
    Get-PinnedRepo $manifest.content $content
    Get-PinnedRepo $manifest.client $client
}
Validate-Game $engine $content
if (-not (Test-Path -LiteralPath (Join-Path $client 'gradlew.bat') -PathType Leaf)) {
    throw "The Java client is incomplete: $client"
}

$envFile = Join-Path $engine '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
    $values = @(
        'WEB_PORT=8888','WEB_MANAGEMENT_PORT=8898','NODE_PORT=52402','NODE_ID=10',
        'NODE_MEMBERS=true','DB_BACKEND=sqlite','LOGIN_SERVER=true',
        'FRIEND_SERVER=true','LOGGER_SERVER=true','EASY_STARTUP=true',
        'BUILD_SRC_DIR=../content'
    )
    [System.IO.File]::WriteAllLines($envFile, $values)
    Write-Host 'Created local server configuration. No existing .env was overwritten.'
}
$gamePort = [int](EnvironmentValue $envFile 'NODE_PORT' '43594')
$webPort = [int](EnvironmentValue $envFile 'WEB_PORT' '80')
$offset = $gamePort - 43594
if ($offset -lt 0 -or $webPort -ne ($offset + 80)) {
    throw "Java client requires WEB_PORT = NODE_PORT - 43594 + 80. Current values: game $gamePort, web $webPort. Resolve the original .env configuration before starting."
}
if ((EnvironmentValue $envFile 'DB_BACKEND' 'sqlite') -ne 'sqlite') {
    throw 'The copied server uses a non-SQLite database. No automatic migration will be attempted. Review its database setup first.'
}
# Back up all character saves and the SQLite account database before migrations.
$playerFolder = Join-Path $engine 'data\players'
$dbFile = Join-Path $engine 'db.sqlite'
if ((Test-Path -LiteralPath $playerFolder) -or (Test-Path -LiteralPath $dbFile)) {
    $backup = Join-Path $runtime ('save-backups\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    if (Test-Path -LiteralPath $playerFolder) {
        Copy-Item -LiteralPath $playerFolder -Destination (Join-Path $backup 'players') -Recurse -Force
    }
    foreach ($suffix in @('','.shm','-wal','-shm')) {
        $sourceDb = $dbFile + $suffix
        if (Test-Path -LiteralPath $sourceDb -PathType Leaf) {
            Copy-Item -LiteralPath $sourceDb -Destination $backup -Force
        }
    }
    Write-Host "Saved a private local backup before database migration: $backup"
}
Write-Host 'Installing engine dependencies...'
$install = if (Test-Path -LiteralPath (Join-Path $engine 'package-lock.json')) { 'ci' } else { 'install' }
Run-Native 'npm.cmd' @($install,'--no-audit','--no-fund') $engine
Write-Host 'Applying non-destructive SQLite database migrations...'
Run-Native 'npm.cmd' @('run','sqlite:migrate') $engine
Write-Host 'Compiling the revision 377 Java client...'
Run-Native (Join-Path $client 'gradlew.bat') @('--no-daemon','classes') $client

$state = @{ engine=$engine; content=$content; client=$client; gamePort=$gamePort; webPort=$webPort; portOffset=$offset; source=$(if($UsbPath){'usb'}else{'upstream-or-existing'}) }
$pendingState = $activeFile + '.tmp'
$state | ConvertTo-Json | Set-Content -LiteralPath $pendingState -Encoding UTF8
Move-Item -LiteralPath $pendingState -Destination $activeFile -Force
try {
    $desktop = [Environment]::GetFolderPath('Desktop')
    if ($desktop) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut((Join-Path $desktop 'Play JoshRS.lnk'))
        $shortcut.TargetPath = Join-Path $repo 'JoshRS.cmd'
        $shortcut.WorkingDirectory = $repo
        $shortcut.Description = 'Open your JoshRS control center to play, restore and back up the game'
        $shortcut.Save()
        Write-Host 'Created Play JoshRS on your desktop.'
    }
} catch { Write-Warning "Desktop shortcut unavailable. Use jparris-play.cmd: $_" }
Write-Host "Setup complete. Game port: $gamePort; web port: $webPort; client offset: $offset"
if (-not $SkipStart) { & (Join-Path $PSScriptRoot 'play.ps1') }
} finally {
    if ($setupLock) { $setupMutex.ReleaseMutex() }
    $setupMutex.Dispose()
}
