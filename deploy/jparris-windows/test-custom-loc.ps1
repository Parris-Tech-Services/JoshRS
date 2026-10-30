$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'custom-loc-core.ps1')
function Assert([bool]$test,[string]$message) { if(-not $test) { throw "Custom loc regression failed: $message" } }
$temp=Join-Path $env:TEMP ('joshrs-custom-loc-'+[guid]::NewGuid().ToString('N'))
$engine=Join-Path $temp 'usb-test\engine'
$packer=Join-Path $engine 'tools\pack\config\PackShared.ts'
$envFile=Join-Path $engine '.env'
$backupRoot=Join-Path $temp 'backups'
try {
    New-Item -ItemType Directory -Path (Split-Path -Parent $packer) -Force | Out-Null
    $originalCode=@'
function readConfigs(extension) {
    if (Environment.BUILD_VERIFY && validate && !validate(client.dat, server.dat)) {
        throw new Error('checksum mismatch');
    }
}
'@
    $originalEnv='NODE_PORT=52402' + [Environment]::NewLine + 'BUILD_VERIFY=true' + [Environment]::NewLine + 'BUILD_VERIFY_PACK=true' + [Environment]::NewLine
    [IO.File]::WriteAllText($packer,$originalCode)
    [IO.File]::WriteAllText($envFile,$originalEnv)
    $r=Enable-JoshRSCustomLocChecks -EnginePath $engine -BackupRoot $backupRoot
    Assert $r.Updated 'first run must patch the custom copy'
    Assert (Test-Path -LiteralPath (Join-Path $r.BackupPath '.env.original')) 'must preserve original env'
    Assert (Test-Path -LiteralPath (Join-Path $r.BackupPath 'PackShared.ts.original')) 'must preserve packer'
    Assert ([IO.File]::ReadAllText((Join-Path $r.BackupPath '.env.original')) -eq $originalEnv) 'original env must be byte-identical'
    Assert ([IO.File]::ReadAllText((Join-Path $r.BackupPath 'PackShared.ts.original')) -eq $originalCode) 'original pack source must be byte-identical'
    $updated=[IO.File]::ReadAllText($packer)
    Assert ($updated.Contains("extension === '.loc'")) 'only custom loc comparison may be bypassed'
    Assert ($updated.Contains("Environment.BUILD_VERIFY && validate")) 'general checks must remain enabled'
    Assert (([IO.File]::ReadAllText($envFile)) -match '(?m)^BUILD_VERIFY=true\r?$') 'general verification must remain enabled'
    Assert (([IO.File]::ReadAllText($envFile)) -match '(?m)^BUILD_VERIFY_PACK=true\r?$') 'pack checks must remain enabled'
    Assert (([IO.File]::ReadAllText($envFile)) -match '(?m)^JOSHRS_CUSTOM_LOCS=true\r?$') 'opt-in env key must exist'
    $repeat=Enable-JoshRSCustomLocChecks -EnginePath $engine -BackupRoot $backupRoot
    Assert (-not $repeat.Updated) 're-running the fix must be idempotent'
    [IO.File]::WriteAllText($packer,'// unsupported modified packer')
    $blocked=$false
    try { [void](Enable-JoshRSCustomLocChecks -EnginePath $engine -BackupRoot $backupRoot) }
    catch {$blocked=$true}
    Assert $blocked 'unsupported engine source must not be modified'
    Assert ([IO.File]::ReadAllText($packer) -eq '// unsupported modified packer') 'unsupported engine source must remain untouched'
    Write-Host 'PASS: scoped loc mismatch fix, BUILD_VERIFY preservation, source/env backups, idempotence and unsupported-engine refusal.'
} finally {
    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
