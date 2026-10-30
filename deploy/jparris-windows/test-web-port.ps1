$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'web-port.ps1')
function Assert([bool]$ok,[string]$message){if(-not $ok){throw "Web port regression: $message"}}
$directory=Join-Path $env:TEMP ('JoshRS Port Fixture ' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $directory | Out-Null
try {
    $file=Join-Path $directory '.env'
    $original="NODE_PORT=52402" + [Environment]::NewLine + 'WEB_PORT=80' + [Environment]::NewLine +
        'WEB_MANAGEMENT_PORT=8898' + [Environment]::NewLine + 'DB_BACKEND=sqlite' + [Environment]::NewLine
    [IO.File]::WriteAllText($file,$original)
    $changed=Repair-JoshRSLocalWebPort -EnvFile $file -GamePort 52402
    Assert $changed.Updated 'Fedora port 80 should be repaired'
    Assert ($changed.WebPort -eq 8888) 'expected client update port 8888'
    Assert (Test-Path -LiteralPath $changed.BackupPath) 'original environment backup should exist'
    Assert ([IO.File]::ReadAllText($changed.BackupPath) -eq $original) 'original environment bytes should be preserved'
    $fixed=[IO.File]::ReadAllText($file)
    Assert ($fixed -match '(?m)^WEB_PORT=8888$') 'private Windows copy should use port 8888'
    Assert ($fixed -match '(?m)^DB_BACKEND=sqlite$') 'database configuration must be preserved'
    Assert ($fixed -match '(?m)^WEB_MANAGEMENT_PORT=8898$') 'management configuration must be preserved'
    $repeat=Repair-JoshRSLocalWebPort -EnvFile $file -GamePort 52402
    Assert (-not $repeat.Updated) 'repeated recovery must be idempotent'
    Assert ([IO.File]::ReadAllText($file) -eq $fixed) 'idempotence must not rewrite original'
    [IO.File]::WriteAllText($file,"WEB_PORT=9000" + [Environment]::NewLine)
    $blocked=$false
    try{[void](Repair-JoshRSLocalWebPort -EnvFile $file -GamePort 52402)}catch{$blocked=$true}
    Assert $blocked 'unknown custom port must not be silently overwritten'
    Assert ([IO.File]::ReadAllText($file) -match 'WEB_PORT=9000') 'unknown custom port must remain unchanged'
    [IO.File]::WriteAllText($file,"NODE_PORT=52402" + [Environment]::NewLine)
    $missing=Repair-JoshRSLocalWebPort -EnvFile $file -GamePort 52402
    Assert $missing.Updated 'implicit default port 80 should be repaired'
    Assert ([IO.File]::ReadAllText($file) -match '(?m)^WEB_PORT=8888$') 'missing port should be appended'
    [IO.File]::WriteAllText($file,("WEB_PORT=80" + [Environment]::NewLine + "WEB_PORT=80"))
    $blocked=$false
    try{[void](Repair-JoshRSLocalWebPort -EnvFile $file -GamePort 52402)}catch{$blocked=$true}
    Assert $blocked 'duplicate port settings must be refused'
    Write-Host 'PASS: Fedora WEB_PORT=80 migration, .env backup, idempotence, custom port protection, missing keys and duplicate guard.'
}finally{
    if(Test-Path -LiteralPath $directory){Remove-Item -LiteralPath $directory -Recurse -Force}
}
