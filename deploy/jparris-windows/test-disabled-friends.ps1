$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot 'fix-disabled-friends.ps1'
$fixture=Join-Path $env:TEMP ('joshrs-friends-fixture-' + [guid]::NewGuid().ToString('N'))
$listener=$null
function Free-Port {
    $t=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
    $t.Start()
    try { return [int]$t.LocalEndpoint.Port } finally { $t.Stop() }
}
try {
    $scriptFolder=Join-Path $fixture 'deploy/jparris-windows'
    $runtime=Join-Path $fixture 'runtime/jparris-377'
    $engine=Join-Path $runtime 'usb-20261101-150000/engine'
    $appPath=Join-Path $engine 'src/app.ts'
    $envPath=Join-Path $engine '.env'
    foreach($dir in @($scriptFolder,(Split-Path -Parent $appPath))) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Copy-Item -LiteralPath $source -Destination $scriptFolder
    [IO.File]::WriteAllText((Join-Path $runtime 'active.json'),
        (@{engine=$engine; gamePort=52402; webPort=8888} | ConvertTo-Json))
    [IO.File]::WriteAllText($appPath,
        "if (Environment.EASY_STARTUP) {new Worker(new URL('./friend.ts', import.meta.url))}")
    $reserved=@()
    while ($reserved.Count -lt 5) {
        $n=Free-Port
        if ($n -notin $reserved) { $reserved+= $n }
    }
    $envText=@(
        '# example private world file'
        'DB_PASS=nonpublic-windows-only'
        'NODE_PROFILE=main'
        'DB_BACKEND=sqlite'
        ('NODE_PORT='+$reserved[0])
        ('WEB_PORT='+$reserved[1])
        ('FRIEND_PORT='+$reserved[2])
        ('LOGIN_PORT='+$reserved[3])
        ('LOGGER_PORT='+$reserved[4])
        'LOGIN_SERVER=true'
        'LOGGER_SERVER=true'
        'FRIEND_SERVER=false'
        'EASY_STARTUP=false'
        'EXTRA_CUSTOM_SETTING=leave_this_alone'
        ''
    ) -join [Environment]::NewLine
    [IO.File]::WriteAllText($envPath,$envText,[Text.UTF8Encoding]::new($false))
    $beforeHash=(Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash
    $fix=Join-Path $scriptFolder 'fix-disabled-friends.ps1'
    & $fix
    if ((Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash -ne $beforeHash) {
        throw 'Read-only preflight unexpectedly changed .env'
    }
    $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$reserved[0])
    $listener.Start()
    $blocked=$false
    try { & $fix -Apply } catch {
        $blocked=($_.Exception.Message -like '*listener is active*')
    }
    if (-not $blocked) { throw 'Game-active protection failed' }
    if ((Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash -ne $beforeHash) {
        throw 'Active-world test modified .env'
    }
    $listener.Stop()
    $listener=$null
    & $fix -Apply
    $updated=[IO.File]::ReadAllText($envPath)
    if (-not $updated.Contains('FRIEND_SERVER=true') -or
        -not $updated.Contains('EASY_STARTUP=true')) {
        throw 'Expected Friends and startup settings not enabled'
    }
    if (-not $updated.Contains('DB_PASS=nonpublic-windows-only') -or
        -not $updated.Contains('EXTRA_CUSTOM_SETTING=leave_this_alone') -or
        -not $updated.Contains('NODE_PROFILE=main')) {
        throw 'Other .env keys were altered'
    }
    $backups=@(Get-ChildItem -LiteralPath (Join-Path $runtime 'friends-config-backups') -File)
    if ($backups.Count -ne 1 -or [IO.File]::ReadAllText($backups[0].FullName) -cne $envText) {
        throw 'Exact original .env was not backed up'
    }
    & $fix -Apply
    if (@(Get-ChildItem -LiteralPath (Join-Path $runtime 'friends-config-backups') -File).Count -ne 1) {
        throw 'Idempotent repair created another backup'
    }
    $withDuplicate=$updated+[Environment]::NewLine+'FRIEND_SERVER=false'+[Environment]::NewLine
    [IO.File]::WriteAllText($envPath,$withDuplicate)
    $blocked=$false
    try { & $fix -Apply } catch {
        $blocked=($_.Exception.Message -like '*Duplicate FRIEND_SERVER*')
    }
    if (-not $blocked -or [IO.File]::ReadAllText($envPath) -cne $withDuplicate) {
        throw 'Duplicate flag configuration was not preserved and refused'
    }
    $loggerDisabled=$envText.Replace('LOGGER_SERVER=true','LOGGER_SERVER=false')
    [IO.File]::WriteAllText($envPath,$loggerDisabled)
    $blocked=$false
    try { & $fix -Apply } catch {
        $blocked=($_.Exception.Message -like '*requires a controlled Agy review*')
    }
    if (-not $blocked -or [IO.File]::ReadAllText($envPath) -cne $loggerDisabled) {
        throw 'Unexpected custom logger configuration was not rejected'
    }
    # Imported Fedora .env may omit optional Friends/embedded startup
    # entirely; the previous installer incorrectly rejected that situation.
    $missing=$envText -split '\r?\n' | Where-Object {
        $_ -notmatch '^(FRIEND_SERVER|EASY_STARTUP)='
    }
    $missing=$missing -join [Environment]::NewLine
    [IO.File]::WriteAllText($envPath,$missing)
    & $fix
    & $fix -Apply
    $missingFixed=[IO.File]::ReadAllText($envPath)
    if ($missingFixed -notmatch '(?m)^FRIEND_SERVER=true\r?, read-only preflight, running-world protection, byte-exact private backup, restricted flag change, repeat idempotence, duplicate/custom refusal. No game, database, or saves were opened.'
} finally {
    if ($listener) { $listener.Stop() }
    if (Test-Path -LiteralPath $fixture -PathType Container) {
        Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue
    }
}
 -or
        $missingFixed -notmatch '(?m)^EASY_STARTUP=true\r?, read-only preflight, running-world protection, byte-exact private backup, restricted flag change, repeat idempotence, duplicate/custom refusal. No game, database, or saves were opened.'
} finally {
    if ($listener) { $listener.Stop() }
    if (Test-Path -LiteralPath $fixture -PathType Container) {
        Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue
    }
}
 -or
        $missingFixed -notmatch '(?m)^LOGIN_SERVER=true\r?, read-only preflight, running-world protection, byte-exact private backup, restricted flag change, repeat idempotence, duplicate/custom refusal. No game, database, or saves were opened.'
} finally {
    if ($listener) { $listener.Stop() }
    if (Test-Path -LiteralPath $fixture -PathType Container) {
        Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue
    }
}
 -or
        $missingFixed -notmatch '(?m)^LOGGER_SERVER=true\r?, read-only preflight, running-world protection, byte-exact private backup, restricted flag change, repeat idempotence, duplicate/custom refusal. No game, database, or saves were opened.'
} finally {
    if ($listener) { $listener.Stop() }
    if (Test-Path -LiteralPath $fixture -PathType Container) {
        Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue
    }
}
) {
        throw 'Missing Friends flags were not appended correctly'
    }
    if (-not $missingFixed.Contains('DB_PASS=nonpublic-windows-only')) {
        throw 'Missing-flag repair altered private unrelated settings'
    }
    # Native Boolean only accepts lowercase true/false; quoted/uppercase/1
    # must be normalized without losing inline comments.
    $quoted=$envText.Replace('FRIEND_SERVER=false', 'FRIEND_SERVER="false"  # old config')
    $quoted=$quoted.Replace('EASY_STARTUP=false','EASY_STARTUP=0  # disabled previously')
    [IO.File]::WriteAllText($envPath,$quoted)
    & $fix -Apply
    $quotedFixed=[IO.File]::ReadAllText($envPath)
    if (-not $quotedFixed.Contains('FRIEND_SERVER=true  # old config') -or
        -not $quotedFixed.Contains('EASY_STARTUP=true  # disabled previously')) {
        throw 'Quoted/zero flag normalization failed or destroyed comments'
    }
    # Missing login/logger defaults are also false in pinned Engine-TS.
    # When no listener is active, establish safe self-contained startup.
    $missingWorkers=($envText -split '\r?\n' | Where-Object {
        $_ -notmatch '^(LOGIN_SERVER|LOGGER_SERVER|FRIEND_SERVER|EASY_STARTUP)='
    }) -join [Environment]::NewLine
    [IO.File]::WriteAllText($envPath,$missingWorkers)
    & $fix -Apply
    $workersFixed=[IO.File]::ReadAllText($envPath)
    foreach ($key in @('FRIEND_SERVER','EASY_STARTUP','LOGIN_SERVER','LOGGER_SERVER')) {
        if ($workersFixed -notmatch "(?m)^$key=true\r?$") {
            throw "Missing embedded worker flag was not added: $key"
        }
    }
    # A valid explicit external-manager configuration must still be refused.
    $externalManager=$envText.Replace('LOGIN_SERVER=true','LOGIN_SERVER=false')
    [IO.File]::WriteAllText($envPath,$externalManager)
    $blocked=$false
    try { & $fix -Apply } catch {
        $blocked=($_.Exception.Message -like '*service-topology review*')
    }
    if (-not $blocked -or [IO.File]::ReadAllText($envPath) -cne $externalManager) {
        throw 'Explicitly disabled external login configuration was not preserved'
    }
    Write-Host 'PASS: supported 377 startup verified, read-only preflight, running-world protection, byte-exact private backup, restricted flag change, repeat idempotence, duplicate/custom refusal. No game, database, or saves were opened.'
} finally {
    if ($listener) { $listener.Stop() }
    if (Test-Path -LiteralPath $fixture -PathType Container) {
        Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue
    }
}
