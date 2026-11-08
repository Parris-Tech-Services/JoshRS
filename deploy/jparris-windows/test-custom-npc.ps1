$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'custom-npc-core.ps1')
function Assert([bool]$ok,[string]$message) { if(-not $ok) { throw "NPC_CRC_REGRESSION_FAILED: $message" } }
$temp=Join-Path $env:TEMP ('joshrs-npc-crc-'+[guid]::NewGuid().ToString('N'))
$engine=Join-Path $temp 'usb-20261030-203927\engine'
$packer=Join-Path $engine 'tools\pack\config\PackShared.ts'
$envFile=Join-Path $engine '.env'
$backup=Join-Path $temp 'backup'
$stock='if (Environment.BUILD_VERIFY && validate && !validate(client.dat, server.dat)) {'
$loc="if (Environment.BUILD_VERIFY && validate && !(extension === '.loc' && process.env.JOSHRS_CUSTOM_LOCS === 'true') && !validate(client.dat, server.dat)) {"
$env0="BUILD_VERIFY=true`r`nBUILD_VERIFY_PACK=true`r`nJOSHRS_CUSTOM_LOCS=true`r`n"
try {
    New-Item -ItemType Directory -Path (Split-Path -Parent $packer) -Force | Out-Null
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    foreach($mode in @('stock','existing-loc')) {
        $base=if($mode -eq 'stock'){$stock}else{$loc}
        $originalSource="function readConfigs(extension) {`n    $base`n        throw new Error('checksum mismatch');`n    }`n}"
        [IO.File]::WriteAllText($packer,$originalSource,[Text.UTF8Encoding]::new($false))
        [IO.File]::WriteAllText($envFile,$env0,[Text.UTF8Encoding]::new($false))
        $plan=Get-JoshRSCustomNpcPlan -EnginePath $engine
        Assert $plan.NeedsUpdate "$mode should require patch"
        $runBackup=Join-Path $backup $mode
        New-Item -ItemType Directory -Path $runBackup | Out-Null
        Assert (Enable-JoshRSCustomNpcChecks -Plan $plan -BackupPath $runBackup) "$mode was not applied"
        $patched=[IO.File]::ReadAllText($packer)
        Assert ($patched.Contains("extension === '.npc'")) "$mode did not add NPC-only check"
        Assert ($patched.Contains("Environment.BUILD_VERIFY && validate")) "$mode disabled general verification"
        Assert ($patched.Contains('!validate(client.dat, server.dat)')) "$mode removed normal validation"
        Assert (([IO.File]::ReadAllText($envFile)).Contains('BUILD_VERIFY_PACK=true')) "$mode disabled pack checks"
        Assert (([IO.File]::ReadAllText($envFile)).Contains('JOSHRS_CUSTOM_NPCS=true')) "$mode lacks NPC opt-in"
        if($mode -eq 'existing-loc') {
            Assert ($patched.Contains("extension === '.loc'")) 'existing loc exception was lost'
        }
        $repeat=Get-JoshRSCustomNpcPlan -EnginePath $engine
        Assert (-not $repeat.NeedsUpdate) "$mode is not idempotent"
        Restore-JoshRSCustomNpcChecks -Plan $plan -BackupPath $runBackup
        Assert (([IO.File]::ReadAllText($packer)) -ceq $originalSource) "$mode source rollback differs"
        Assert (([IO.File]::ReadAllText($envFile)) -ceq $env0) "$mode env rollback differs"
    }
    [IO.File]::WriteAllText($packer,'// different, unsupported engine')
    $blocked=$false
    try { [void](Get-JoshRSCustomNpcPlan -EnginePath $engine) } catch { $blocked=$true }
    Assert $blocked 'unsupported packer must be rejected'
    [IO.File]::WriteAllText($packer,$stock)
    [IO.File]::WriteAllText($envFile,"BUILD_VERIFY=false`n")
    $blocked=$false
    try { [void](Get-JoshRSCustomNpcPlan -EnginePath $engine) } catch { $blocked=$true }
    Assert $blocked 'general build verification disabled must be rejected'
    [IO.File]::WriteAllText($envFile,"BUILD_VERIFY=true`nJOSHRS_CUSTOM_NPCS=false`nJOSHRS_CUSTOM_NPCS=true`n")
    $blocked=$false
    try { [void](Get-JoshRSCustomNpcPlan -EnginePath $engine) } catch { $blocked=$true }
    Assert $blocked 'duplicate NPC overrides must be rejected'
    Write-Host 'PASS: both stock and loc packers, NPC-only exception, backups, idempotence, rollback, unsupported source, unsafe flags and duplicate settings.'
} finally {
    if(Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
