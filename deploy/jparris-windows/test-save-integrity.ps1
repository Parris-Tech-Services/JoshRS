$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'support.ps1')
. (Join-Path $PSScriptRoot 'save-integrity.ps1')
function Assert([bool]$truth,[string]$reason) { if (-not $truth) {throw "Elrothiro regression failed: $reason"} }
$root=Join-Path ([IO.Path]::GetTempPath()) ('joshrs-elrothiro-'+[guid]::NewGuid().ToString('N'))
$engine=Join-Path $root 'copy\engine'
$content=Join-Path $root 'copy\content'
$client=Join-Path $root 'copy\client'
try {
    @(
        (Join-Path $engine 'src\engine'),
        (Join-Path $engine 'data\players\main'),
        (Join-Path $content 'scripts'),
        $client,
        (Join-Path $root 'runtime\jparris-377')
    ) | ForEach-Object { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
    'app' | Set-Content (Join-Path $engine 'src\app.ts')
    'world' | Set-Content (Join-Path $engine 'src\engine\World.ts')
    'gradle' | Set-Content (Join-Path $client 'gradlew.bat')
    [IO.File]::WriteAllBytes((Join-Path $engine 'data\players\main\elrothiro.sav'),[Convert]::FromBase64String('IAQABwyQDR4AAAAAAAAAAAAAAAAAAAAAAABDDQAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALaEoco='))
    'MOCK-DB-DO-NOT-TREAT-AS-SQLITE' | Set-Content (Join-Path $engine 'db.sqlite')
    'mock-wal' | Set-Content (Join-Path $engine 'db.sqlite-wal')
    @{engine=$engine;content=$content;client=$client;gamePort=54373;webPort=54374;source='test'} |
      ConvertTo-Json | Set-Content (Join-Path $root 'runtime\jparris-377\active.json')
    $original=(Get-FileHash (Join-Path $engine 'data\players\main\elrothiro.sav') -Algorithm SHA256).Hash
    & (Join-Path $PSScriptRoot 'Protect-Elrothiro.ps1') -RepoRoot $root | Out-Null
    Assert (-not (Test-Path (Join-Path $root 'runtime\jparris-377\save-backups'))) 'inspection modified data'
    & (Join-Path $PSScriptRoot 'Protect-Elrothiro.ps1') -RepoRoot $root -CreateBackup | Out-Null
    $snap=@(Get-ChildItem (Join-Path $root 'runtime\jparris-377\save-backups') -Directory)
    Assert ($snap.Count -eq 1) 'backup should contain exactly one snapshot'
    $valid=Test-JoshRSBackupIntegrity -BackupPath $snap[0].FullName
    Assert $valid.Verified 'backup integrity should pass'
    Assert $valid.ContainsElrothiro 'backup missing Elrothiro'
    Assert ($valid.FileCount -eq 3) 'save, db and WAL should be included'
    $hash=(Get-FileHash (Join-Path $engine 'data\players\main\elrothiro.sav') -Algorithm SHA256).Hash
    Assert ($hash -eq $original) 'live character was altered'
    'TAMPER' | Add-Content (Join-Path $snap[0].FullName 'players\main\elrothiro.sav')
    $rejected=$false
    try{[void](Test-JoshRSBackupIntegrity -BackupPath $snap[0].FullName)}catch{$rejected=($_.Exception.Message -like '*hash or size mismatch*')}
    Assert $rejected 'corrupted backup should be rejected'
    Write-Host 'PASS: read-only identity check, consistent offline backup, SHA256 verification, tamper rejection, untouched live save.'
}finally {
    if(Test-Path -LiteralPath $root){Remove-Item -LiteralPath $root -Recurse -Force}
}
