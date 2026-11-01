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
# Accept only the explicitly configured engine under runtime/<snapshot>/engine.
# Compare the actual ancestor directory instead of mixing "/" and "\" separators.
$canonicalRuntime=[IO.DirectoryInfo]::new(
    (Resolve-Path -LiteralPath $runtime -ErrorAction Stop).Path).FullName
$engineDirectory=[IO.DirectoryInfo]::new($engine)
$actualRuntime=$engineDirectory.Parent.Parent.FullName
$underPrivateRuntime=[string]::Equals(
    $canonicalRuntime.TrimEnd('\','/'),$actualRuntime.TrimEnd('\','/'),
    [StringComparison]::OrdinalIgnoreCase)
$isEngineFolder=[string]::Equals(
    $engineDirectory.Name,'engine',[StringComparison]::OrdinalIgnoreCase)
if (-not $underPrivateRuntime -or -not $isEngineFolder) {
    throw ('Active engine is not a private JoshRS 377 runtime copy. ' +
           "Private runtime match=$underPrivateRuntime; engine folder match=$isEngineFolder. No changes made.")
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
$settings=@{}
# Whitelist only. Do not print the private .env or any unrelated values.
$linePattern='(?m)^(?<prefix>[ \t]*(?<key>[A-Z_][A-Z_0-9]*)[ \t]*=[ \t]*)(?<rest>[^\r\n]*)(?<cr>\r?)$'
$valuePattern='^(?<leading>[ \t]*)(?<literal>"[^"]*"|''[^'']*''|[^ \t#]+)(?<trailing>[ \t]*(?:#.*)?)$'
foreach ($entry in [regex]::Matches($original,$linePattern)) {
    $name=$entry.Groups['key'].Value
    if ($name -notin $allowed) { continue }
    if ($config.ContainsKey($name)) {
        throw "Duplicate $name setting. Refusing to guess. No changes made."
    }
    $valueMatch=[regex]::Match($entry.Groups['rest'].Value,$valuePattern)
    if (-not $valueMatch.Success) {
        throw "Unsupported format for $name (value not printed). No changes made."
    }
    $literal=$valueMatch.Groups['literal'].Value
    if ($literal.Length -ge 2 -and (
        ($literal[0] -eq '"' -and $literal[$literal.Length-1] -eq '"') -or
        ($literal[0] -eq "'" -and $literal[$literal.Length-1] -eq "'"))) {
        $literal=$literal.Substring(1,$literal.Length-2)
    }
    $config[$name]=$literal
    $settings[$name]=@{
        Index=$entry.Index
        Length=$entry.Length
        Prefix=($entry.Groups['prefix'].Value+$valueMatch.Groups['leading'].Value)
        Suffix=($valueMatch.Groups['trailing'].Value+$entry.Groups['cr'].Value)
    }
}
# Native Engine-TS tryParseBoolean recognises only exact "true"/"false".
# Absent, "1", mixed case and "yes" behave as disabled in the engine.
foreach ($name in @('FRIEND_SERVER','EASY_STARTUP')) {
    if (-not $config.ContainsKey($name)) {
        $config[$name]='(missing)'
    } elseif ($config[$name] -notin @('true','false','1','0','TRUE','FALSE','True','False','yes','no','on','off')) {
        throw "Unsupported $name value. No changes made."
    }
}
# Embedded startup launches login, friend and logger services together.
# Missing login/logger flags default to false and can be added in offline
# mode. Explicitly disabled services may be externally managed: refuse.
foreach ($name in @('LOGIN_SERVER','LOGGER_SERVER')) {
    if ($config.ContainsKey($name) -and $config[$name] -cne 'true') {
        throw "Explicitly disabled/unsupported $name requires a controlled Agy service-topology review. No changes made."
    }
}
if ($config.ContainsKey('DB_BACKEND') -and $config['DB_BACKEND'] -cne 'sqlite') {
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
$listening=@([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
    Where-Object { $_.Port -in $ports })
$isRunning=$listening.Count -gt 0
$needsChange=($config['FRIEND_SERVER'] -cne 'true' -or $config['EASY_STARTUP'] -cne 'true' -or
             -not $config.ContainsKey('LOGIN_SERVER') -or -not $config.ContainsKey('LOGGER_SERVER'))
Write-Host 'Active JoshRS private engine verified.'
Write-Host ('Saved Friends enabled: ' + ($config['FRIEND_SERVER'] -ceq 'true'))
Write-Host ('Saved embedded service startup enabled: ' + ($config['EASY_STARTUP'] -ceq 'true'))
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
$replacements=@()
$addLines=@()
foreach ($name in @('FRIEND_SERVER','EASY_STARTUP','LOGIN_SERVER','LOGGER_SERVER')) {
    if ($config.ContainsKey($name) -and $config[$name] -ceq 'true') { continue }
    if (-not $settings.ContainsKey($name)) {
        $addLines+=($name+'=true')
        continue
    }
    $setting=$settings[$name]
    $replacements+= [pscustomobject]@{
        Index=$setting.Index
        Length=$setting.Length
        Text=($setting.Prefix+'true'+$setting.Suffix)
    }
}
# Edit old spans from the end so offsets remain valid.
foreach ($change in @($replacements | Sort-Object Index -Descending)) {
    $new=$new.Substring(0,$change.Index)+$change.Text+
         $new.Substring($change.Index+$change.Length)
}
if ($addLines.Count -gt 0) {
    $eol=[Environment]::NewLine
    if ($original.Contains([string][char]13+[char]10)) { $eol=[string][char]13+[char]10 }
    if ($new.Length -gt 0 -and -not $new.EndsWith([string][char]10)) { $new+=$eol }
    $new+=($addLines -join $eol)+$eol
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
$swapBackup=Join-Path $engine ('.env.friends-swapback-' + [guid]::NewGuid().ToString('N') + '.bak')
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
    # Windows PowerShell 5.1 / .NET Framework requires a valid backup pathname.
    # The independently verified original backup is retained separately.
    [IO.File]::Replace($temp,$envPath,$swapBackup)
    if ([IO.File]::ReadAllText($envPath) -cne $new) {
        throw 'Modified configuration readback failed.'
    }
    if (Test-Path -LiteralPath $swapBackup -PathType Leaf) {
        Remove-Item -LiteralPath $swapBackup -Force
    }
} catch {
    if (Test-Path -LiteralPath $temp -PathType Leaf) {
        Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $swapBackup -PathType Leaf) {
        Remove-Item -LiteralPath $swapBackup -Force -ErrorAction SilentlyContinue
    }
    [IO.File]::Copy($backup,$envPath,$true)
    throw ('Friends configuration installation failed; original restored. ' + $_.Exception.Message)
}
Write-Host 'Friends and embedded startup flags enabled in the private Windows copy.'
Write-Host 'Private configuration backup (contains credentials; do not publish):'
Write-Host $backup
Write-Host 'No game restarted. At your next safe maintenance window, start JoshRS normally, verify the Friends listener, and test Sylvie friend add/PM.'
