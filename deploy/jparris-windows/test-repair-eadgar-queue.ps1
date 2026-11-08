# Synthetic PowerShell 5.1 tests. Runs only in a disposable TEMP fixture.
$ErrorActionPreference='Stop'
$tool=Join-Path $PSScriptRoot 'Repair-EadgarQueue.ps1'
$root=Join-Path ([IO.Path]::GetTempPath()) ('joshrs-eadgar-test-'+[guid]::NewGuid().ToString('N'))
$runtime=Join-Path $root 'runtime\jparris-377'
$engine=Join-Path $runtime 'usb-fixture\engine'
$contentRoot=Join-Path $runtime 'usb-fixture\content'
$quest=Join-Path $contentRoot 'scripts\quests\quest_eadgar\scripts\quest_eadgar.rs2'
$fakeSave=Join-Path $engine 'data\players\main\elrothiro.sav'
$stubTool=Join-Path $root 'deploy\jparris-windows\Protect-Elrothiro.ps1'
function Assert([bool]$ok,[string]$why){if(-not $ok){throw $why}}
try {
    foreach($dir in @((Split-Path -Parent $quest),(Split-Path -Parent $fakeSave),(Split-Path -Parent $stubTool))){
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    @{engine=$engine;content=$contentRoot;gamePort=52402;webPort=8888} |
        ConvertTo-Json -Compress | Set-Content -LiteralPath (Join-Path $runtime 'active.json') -Encoding UTF8
    $original=[string]@'
[queue,eadgar_quest_complete]
%eadgar_quest = ^eadgar_complete;
queue(eadgar_quest_complete, 0);
'@
    [IO.File]::WriteAllText($quest,$original)
    [IO.File]::WriteAllBytes($fakeSave,[byte[]]@(1,5,11,17,29))
    [IO.File]::WriteAllText((Join-Path $engine '.env'),'SYNTHETIC_PASSWORD=NEVER_UPLOAD')
    $fixtureEnvHash=(Get-FileHash (Join-Path $engine '.env') -Algorithm SHA256).Hash
    $fixtureSaveHash=(Get-FileHash $fakeSave -Algorithm SHA256).Hash
    $originalHash=(Get-FileHash $quest -Algorithm SHA256).Hash
    $backupStub=@'
param([switch]$CreateBackup)
if(-not $CreateBackup){throw 'Expected verified full backup switch'}
Write-Host 'VERIFIED OFFLINE BACKUP CREATED: synthetic fixture only'
'@
    [IO.File]::WriteAllText($stubTool,$backupStub)
    $dry=(& $tool -RepoRoot $root 6>&1 | Out-String)
    Assert ($dry -match 'PATCH_READY') 'Read-only preflight failed'
    Assert ((Get-FileHash $quest -Algorithm SHA256).Hash -eq $originalHash) 'Dry run modified source'
    $result=(& $tool -RepoRoot $root -Apply 6>&1 | Out-String)
    Assert ($result -match 'QUEUE_ARITY_REPAIR_APPLIED') 'Offline repair did not complete'
    $new=[IO.File]::ReadAllText($quest)
    Assert ($new.Contains('queue(eadgar_quest_complete, 0, 0);')) 'Arity not repaired'
    Assert (-not $new.Contains('queue(eadgar_quest_complete, 0);')) 'Invalid call remains'
    Assert ($new.Contains('%eadgar_quest = ^eadgar_complete;')) 'Other code was modified'
    $sourceBackup=@(Get-ChildItem -LiteralPath (Join-Path $runtime 'save-backups') -Filter 'quest_eadgar.rs2.original' -Recurse -File)
    Assert ($sourceBackup.Count -eq 1) 'Expected exactly one source backup'
    Assert ((Get-FileHash $sourceBackup[0].FullName -Algorithm SHA256).Hash -eq $originalHash) 'Original was not preserved byte-for-byte'
    Assert ((Get-FileHash $fakeSave -Algorithm SHA256).Hash -eq $fixtureSaveHash) 'Save touched'
    Assert ((Get-FileHash (Join-Path $engine '.env') -Algorithm SHA256).Hash -eq $fixtureEnvHash) 'Private configuration touched'
    $again=(& $tool -RepoRoot $root -Apply 6>&1 | Out-String)
    Assert ($again -match 'ALREADY_PATCHED') 'Idempotency failed'
    Assert (@(Get-ChildItem (Join-Path $runtime 'save-backups') -Filter 'quest_eadgar.rs2.original' -Recurse -File).Count -eq 1) 'Second application created another backup'
    [IO.File]::WriteAllText($quest,$original.Replace('queue(eadgar_quest_complete, 0);','queue(bogus_quest, 0);'))
    $badHash=(Get-FileHash $quest -Algorithm SHA256).Hash
    $failed=$false
    try { & $tool -RepoRoot $root -Apply 6>&1 | Out-Null } catch { $failed=$true }
    Assert $failed 'Unfamiliar content must fail closed'
    Assert ((Get-FileHash $quest -Algorithm SHA256).Hash -eq $badHash) 'Fail-closed check modified source'
    Write-Host 'PASS: Eadgar source patch backs up original, changes one call, preserves private data, refuses unknown edits.'
} finally {
    if(Test-Path -LiteralPath $root){Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue}
}
