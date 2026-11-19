$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'family-health.ps1')
function Assert([bool]$ok,[string]$message) { if (-not $ok) { throw $message } }
$fixtureRoot=Join-Path $env:TEMP ('joshrs-family-'+[guid]::NewGuid().ToString('N'))
$repo=Join-Path $fixtureRoot 'repo'
$engine=Join-Path $repo 'world\engine'
$content=Join-Path $repo 'world\content'
$client=Join-Path $repo 'world\client'
$listener=$null
try {
    foreach ($folder in @('runtime\jparris-377','world\engine\src','world\engine\data\players\main','world\content\scripts','world\client')) {
        New-Item -ItemType Directory -Path (Join-Path $repo $folder) -Force | Out-Null
    }
    'app' | Set-Content -LiteralPath (Join-Path $engine 'src\app.ts')
    'client' | Set-Content -LiteralPath (Join-Path $client 'gradlew.bat')
    'character-a' | Set-Content -LiteralPath (Join-Path $engine 'data\players\main\elrothiro.sav')
    'character-b' | Set-Content -LiteralPath (Join-Path $engine 'data\players\main\sylvie.sav')
    'synthetic-db' | Set-Content -LiteralPath (Join-Path $engine 'db.sqlite')
    $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0); $listener.Start()
    $port=$listener.LocalEndpoint.Port; $listener.Stop(); $listener=$null
    @{engine=$engine;content=$content;client=$client;gamePort=$port;webPort=$port;source='synthetic'} |
        ConvertTo-Json | Set-Content -LiteralPath (Join-Path $repo 'runtime\jparris-377\active.json')
    Assert ((Get-JoshRSFamilyHealth -RepoRoot $fixtureRoot).State -eq 'Failed') 'Unconfigured world should fail clearly'
    Assert ((Get-JoshRSFamilyHealth -RepoRoot $repo).State -eq 'Stopped') 'Offline world should report stopped'
    Assert (-not (Get-JoshRSVerifiedBackup -RepoRoot $repo)) 'No backup must not be reported as verified'
    $backup=New-JoshRSLocalBackup -RepoRoot $repo
    Assert ((Get-JoshRSVerifiedBackup -RepoRoot $repo).Family) 'Both family saves should be detected'
    $copy=New-JoshRSRecoveryCopy -RepoRoot $repo -BackupPath $backup -Destination (Join-Path $fixtureRoot 'restored')
    Assert ($copy.Verified -and -not $copy.Activated) 'Recovery must verify without activating'
    foreach ($relative in @('players\main\elrothiro.sav','players\main\sylvie.sav','db.sqlite')) {
        Assert ((Get-FileHash -LiteralPath (Join-Path $backup $relative)).Hash -eq (Get-FileHash -LiteralPath (Join-Path $copy.Path $relative)).Hash) 'Recovery changed bytes'
    }
    $rejected=$false
    try { New-JoshRSRecoveryCopy -RepoRoot $repo -BackupPath $backup -Destination $copy.Path | Out-Null } catch { $rejected=$true }
    Assert $rejected 'Existing destination must not be overwritten'
    $rejected=$false
    try { New-JoshRSRecoveryCopy -RepoRoot $repo -BackupPath $backup -Destination (Join-Path $engine 'new') | Out-Null } catch { $rejected=$true }
    Assert $rejected 'Recovery into active installation must be refused'
    'tamper' | Add-Content -LiteralPath (Join-Path $backup 'players\main\sylvie.sav')
    Assert (-not (Get-JoshRSVerifiedBackup -RepoRoot $repo)) 'Tampered backup must not be reported verified'
    $rejected=$false
    try { New-JoshRSRecoveryCopy -RepoRoot $repo -BackupPath $backup -Destination (Join-Path $fixtureRoot 'tampered') | Out-Null } catch { $rejected=$true }
    Assert $rejected 'Tampered backup must not be recovered'
    $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$port); $listener.Start()
    Assert ((Get-JoshRSFamilyHealth -RepoRoot $repo).State -eq 'Conflict') 'An unrelated TCP listener must not be Ready'
    Assert (-not (Test-JoshRSRuntimeIdentity -Engine $engine)) 'Missing PID lock must not identify a world'
    Write-Host 'PASS: state, unrelated port, verified family backup, recovery byte equality, no overwrite, protected path and tamper rejection.'
} finally {
    if ($listener) { $listener.Stop() }
    $resolved=[IO.Path]::GetFullPath($fixtureRoot)
    if (-not $resolved.StartsWith([IO.Path]::GetFullPath($env:TEMP).TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe test cleanup path' }
    if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force }
}
