# Isolated Windows PowerShell 5.1 tests for Fred/George source-only relog fix.
# Test accounts/saves are synthetic; never connect to a game server.
$ErrorActionPreference = 'Stop'
$tool = Join-Path $PSScriptRoot 'Repair-FredGeorgeRelog.ps1'
$root = Join-Path ([IO.Path]::GetTempPath()) ('joshrs-fg-relog-fixture-' + [guid]::NewGuid().ToString('N'))
$runtime = Join-Path $root 'runtime\jparris-377'
$engine = Join-Path $runtime 'usb-fixture\engine'
$srcPath = Join-Path $engine 'src\engine\bot\FredGeorgeBot.ts'
$stubTool = Join-Path $root 'deploy\jparris-windows\Protect-Elrothiro.ps1'
$fakeSave = Join-Path $engine 'data\players\main\elrothiro.sav'
function Assert([bool]$ok, [string]$reason) { if (-not $ok) { throw $reason } }
try {
    foreach ($dir in @((Split-Path -Parent $srcPath), (Split-Path -Parent $stubTool), (Split-Path -Parent $fakeSave))) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    @{engine=$engine;gamePort=52402;webPort=8888} | ConvertTo-Json -Compress | Set-Content -LiteralPath (Join-Path $runtime 'active.json') -Encoding UTF8
    $content = @'
export function tickFredAndGeorgeBots(world: WorldRuntime): void {
  if (state.relogPending) {
    if (!stillInWorld && !world.logoutRequests.has(name)) {
      spawnSingleBot(world, name);
    }
  }
}
const player = PlayerLoading.load(name, savPacket, null);
'@
    [IO.File]::WriteAllText($srcPath, $content)
    [IO.File]::WriteAllBytes($fakeSave,[byte[]]@(2,6,7,8,9,11))
    [IO.File]::WriteAllText((Join-Path $engine '.env'), 'LOGIN_SERVER=true')
    $saveHash = (Get-FileHash $fakeSave -Algorithm SHA256).Hash
    $configHash = (Get-FileHash (Join-Path $engine '.env') -Algorithm SHA256).Hash
    $oldHash = (Get-FileHash $srcPath -Algorithm SHA256).Hash
    # Safe fixture stub validates that the patcher invokes the actual configured backup tool.
    $backupStub = @'
param([switch]$CreateBackup)
if (-not $CreateBackup) { throw 'missing backup switch' }
Write-Host 'VERIFIED OFFLINE BACKUP CREATED: synthetic fixture only'
'@
    [IO.File]::WriteAllText($stubTool, $backupStub)
    $dryRun = (& $tool -RepoRoot $root 6>&1 | Out-String)
    Assert ($dryRun -match 'PATCH_READY') 'Read-only preflight should find vulnerable guard'
    Assert ((Get-FileHash $srcPath -Algorithm SHA256).Hash -eq $oldHash) 'Dry run must not change code'

    $result = (& $tool -RepoRoot $root -Apply 6>&1 | Out-String)
    Assert ($result -match 'SOURCE_REPAIR_APPLIED') 'Guarded source patch did not succeed'
    $changed = [IO.File]::ReadAllText($srcPath)
    Assert ($changed.Contains('world.logoutRequests.has(player?.username ?? name.toLowerCase())')) 'Normalised guard absent after patch'
    Assert (-not $changed.Contains('world.logoutRequests.has(name)')) 'Unsafe capitalised guard remains'
    Assert ($changed.Contains('export function tickFredAndGeorgeBots')) 'Other original code lost'
    $backupFile = @(Get-ChildItem (Join-Path $runtime 'save-backups') -File -Filter 'FredGeorgeBot.ts.original' -Recurse)
    Assert ($backupFile.Count -eq 1) 'Expected one original source backup'
    Assert ((Get-FileHash $backupFile[0].FullName -Algorithm SHA256).Hash -eq $oldHash) 'Source backup is not byte-for-byte original'
    Assert ((Get-FileHash $fakeSave -Algorithm SHA256).Hash -eq $saveHash) 'Synthetic player save was touched'
    Assert ((Get-FileHash (Join-Path $engine '.env') -Algorithm SHA256).Hash -eq $configHash) 'Engine .env changed'
    $again = (& $tool -RepoRoot $root -Apply 6>&1 | Out-String)
    Assert ($again -match 'ALREADY_PATCHED') 'Second patch should be idempotent'
    Assert (@(Get-ChildItem (Join-Path $runtime 'save-backups') -File -Filter 'FredGeorgeBot.ts.original' -Recurse).Count -eq 1) 'Second run must not back up again'

    # Unknown custom implementations should fail without writing.
    [IO.File]::WriteAllText($srcPath,$content.Replace('world.logoutRequests.has(name)', 'world.logoutRequests.has(unknown)'))
    $mismatchHash=(Get-FileHash $srcPath -Algorithm SHA256).Hash
    $failed=$false
    try { & $tool -RepoRoot $root -Apply | Out-Null } catch { $failed=$true }
    Assert $failed 'Unknown custom bot source must be rejected'
    Assert ((Get-FileHash $srcPath -Algorithm SHA256).Hash -eq $mismatchHash) 'Rejected edit still changed file'
    Write-Host 'PASS: Fred/George source guard patched only when offline, backed up, idempotent and private saves untouched.'
} finally {
    if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue }
}
