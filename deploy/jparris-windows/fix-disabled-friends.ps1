[CmdletBinding()]
param([switch]$Apply)

# Private Windows-only, fail-closed Friends service configuration repair.
# Does not stop/start game services, open saves/SQLite, or log .env contents.
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$runtime=Join-Path $root 'runtime/jparris-377'
$activePath=Join-Path $runtime 'active.json'
if (-not (Test-Path -LiteralPath $activePath -PathType Leaf)) {
    throw 'Missing active JoshRS 377 configuration. No changes made.'
}
$active=Get-Content -LiteralPath $activePath -Raw | ConvertFrom-Json
if (-not $active.engine) { throw 'Missing active 377 engine path. No changes made.' }
$engine=(Resolve-Path -LiteralPath ([string]$active.engine) -ErrorAction Stop).Path
$runtimePrefix=[IO.Path]::GetFullPath($runtime).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
if (-not $engine.StartsWith($runtimePrefix,[StringComparison]::OrdinalIgnoreCase) -or
    (Split-Path -Leaf $engine) -cne 'engine') {
    throw 'Active engine is not a private JoshRS 377 runtime copy. No changes made.'
}
$source=Join-Path $engine 'src/app.ts'
$envPath=Join-Path $engine '.env'
if (-not (Test-Path -LiteralPath $source -PathType Leaf) -or
    -not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
    throw 'Required engine source or .env missing. No changes made.'
}
$app=[IO.File]::ReadAllText($source)
if ($app -notmatch 'Environment\.EASY_STARTUP' -or
    $app -notmatch 'friend\.ts') {
    throw 'This customised engine does not match the supported embedded friends startup. No changes made.'
}
$original=[IO.File]::ReadAllText($envPath)
$allowed=@('FRIEND_SERVER','EASY_STARTUP','LOGIN_SERVER','LOGGER_SERVER',
           'LOGIN_PORT','LOGGER_PORT','FRIEND_PORT','NODE_PORT','WEB_PORT','DB_BACKEND')
$config=@{}
foreach ($line in ($original -split '\r?\n')) {
    if ($line -notmatch '^[ \t]*([A-Z_]+)[ \t]*=[ \t]*([^#\r\n]*?)[ \t]*(?:#.*)?$') { continue }
    $name=$Matches[1]
    if ($name -notin $allowed) { continue }
    if ($config.ContainsKey($name)) {
        throw "Duplicate $name setting. Refusing to guess. No changes made."
    }
    $config[$name]=$Matches[2].Trim()
}
foreach ($name in @('FRIEND_SERVER','EASY_STARTUP','LOGIN_SERVER','LOGGER_SERVER')) {
    if (-not $config.ContainsKey($name) -or $config[$name] -notin @('true','false')) {
        throw "Missing or unsupported $name value. No changes made."
    }
}
if ($config['LOGIN_SERVER'] -ne 'true' -or $config['LOGGER_SERVER'] -ne 'true') {
    throw 'Custom login/logger service configuration requires a controlled Agy review. No changes made.'
}
if ($config.ContainsKey('DB_BACKEND') -and $config['DB_BACKEND'] -ne 'sqlite') {
    throw 'Unsupported custom database backend. No changes made.'
}
$defaultPorts=@{
    NODE_PORT=52402
    WEB_PORT=8888
    FRIEND_PORT=45099
    LOGIN_PORT=43500
    LOGGER_PORT=43501
}
$ports=@()
foreach ($key in $defaultPorts.Keys) {
    $value=$defaultPorts[$key]
    if ($config.ContainsKey($key)) {
        if ($config[$key] -notmatch '^\d{1,5}$') { throw "Malformed $key. No changes made." }
        $value=[int]$config[$key]
    } elseif ($key -eq 'NODE_PORT' -and $active.gamePort) {
        $value=[int]$active.gamePort
    } elseif ($key -eq 'WEB_PORT' -and $active.webPort) {
        $value=[int]$active.webPort
    }
    if ($value -lt 1 -or $value -gt 65535) {
        throw "Invalid $key. No changes made."
    }
    $ports+= $value
}
$ports=@($ports | Sort-Object -Unique)
$listening=@([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().
    GetActiveTcpListeners() | Where-Object { $_.Port -in $ports })
$isRunning=$listening.Count -gt 0
$needsChange=($config['FRIEND_SERVER'] -eq 'false' -or $config['EASY_STARTUP'] -eq 'false')
Write-Host 'Active JoshRS private engine verified.'
Write-Host ('Saved Friends enabled: ' + $config['FRIEND_SERVER'])
Write-Host ('Saved embedded service startup enabled: ' + $config['EASY_STARTUP'])
Write-Host ('Known game/service listeners currently occupied: ' + $isRunning)
Write-Host 'No player saves, SQLite databases or account records were opened.'
if (-not $Apply) {
    Write-Host 'READ-ONLY PREFLIGHT. To apply later, finish playing and gracefully stop the server.'
    exit 0
}
if ($isRunning) {
    throw 'Game or associated service listener is active. Log out both players and stop the server/services gracefully first; no changes made.'
}
if (-not $needsChange) {
    Write-Host 'Both flags are already true. No file changes or duplicate backup needed.'
    exit 0
}
$new=$original
foreach ($name in @('FRIEND_SERVER','EASY_STARTUP')) {
    if ($config[$name] -eq 'true') { continue }
    $pattern='(?m)^([ \t]*'+[regex]::Escape($name)+'[ \t]*=[ \t]*)false([ \t]*(?:#[^\r\n]*)?\r?)$'
    $hits=[regex]::Matches($new,$pattern)
    if ($hits.Count -ne 1) {
        throw "Cannot safely rewrite $name while preserving the original file. No changes made."
    }
    $hit=$hits[0]
    $changed=$hit.Groups[1].Value+'true'+$hit.Groups[2].Value
    $new=$new.Substring(0,$hit.Index)+$changed+$new.Substring($hit.Index+$hit.Length)
}
if ($new -ceq $original) { throw 'No expected change calculated. Refusing to write.' }
$backupFolder=Join-Path $runtime 'friends-config-backups'
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
$backup=Join-Path $backupFolder ('.env.before-friends-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fffffff') + '.bak')
[IO.File]::Copy($envPath,$backup,$false)
if ((Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash -ne
    (Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash) {
    throw 'Private .env backup could not be verified; no changes made.'
}
$temp=Join-Path $engine ('.env.friends-staged-' + [guid]::NewGuid().ToString('N'))
try {
    # Preserve UTF-8 BOM if it was present. Never echo secrets.
    $bytes=[IO.File]::ReadAllBytes($envPath)
    $utf8=[Text.UTF8Encoding]::new(($bytes.Length -ge 3 -and
        $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191))
    if ((Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash -ne
        (Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash) {
        throw 'Environment file was changed during preflight; no changes made.'
    }
    [IO.File]::WriteAllText($temp,$new,$utf8)
    # Same-directory atomic replacement; preserve original in separate private backup.
    [IO.File]::Replace($temp,$envPath,$null)
    if ([IO.File]::ReadAllText($envPath) -cne $new) {
        throw 'Modified configuration readback failed.'
    }
} catch {
    if (Test-Path -LiteralPath $temp -PathType Leaf) {
        Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
    }
    [IO.File]::Copy($backup,$envPath,$true)
    throw ('Friends configuration installation failed; original restored. ' + $_.Exception.Message)
}
Write-Host 'Friends and embedded startup flags enabled in the private Windows copy.'
Write-Host 'Private configuration backup (contains credentials; do not publish):'
Write-Host $backup
Write-Host 'No game restarted. At your next safe maintenance window, start JoshRS normally, verify the Friends listener, and test Sylvie friend add/PM.'
