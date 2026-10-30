$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'support.ps1')

function Assert([bool]$condition,[string]$explanation) {
    if (-not $condition) { throw "JoshRS Windows regression: $explanation" }
}
$root=Join-Path ([System.IO.Path]::GetTempPath()) ('joshrs-win-tests-' + [guid]::NewGuid().ToString('N'))
$fakeEngine=Join-Path $root 'fake\engine'
$fakeContent=Join-Path $root 'fake\content'
$fakeClient=Join-Path $root 'fake\client-java'
$runtime=Join-Path $root 'runtime\jparris-377'
$listener=$null
try {
    New-Item -ItemType Directory -Force -Path (Join-Path $fakeEngine 'src\engine'),
        (Join-Path $fakeEngine 'data\players\main'),(Join-Path $fakeContent 'scripts'),
        $fakeClient,$runtime | Out-Null
    'mock' | Set-Content -LiteralPath (Join-Path $fakeEngine 'src\app.ts')
    'mock' | Set-Content -LiteralPath (Join-Path $fakeEngine 'src\engine\World.ts')
    'mock' | Set-Content -LiteralPath (Join-Path $fakeClient 'gradlew.bat')
    'mock-save' | Set-Content -LiteralPath (Join-Path $fakeEngine 'data\players\main\elrothiro.sav')
    'mock-db' | Set-Content -LiteralPath (Join-Path $fakeEngine 'db.sqlite')
    'mock-wal' | Set-Content -LiteralPath (Join-Path $fakeEngine 'db.sqlite-wal')
    'PASSWORD=FakeSuperSecret' | Set-Content -LiteralPath (Join-Path $fakeEngine '.env')
    $probe=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,0)
    $probe.Start()
    $gamePort=[int]$probe.LocalEndpoint.Port
    $probe.Stop()
    $webPort=if($gamePort -eq 65535){65534}else{$gamePort + 1}
    @{
        engine=$fakeEngine;content=$fakeContent;client=$fakeClient;
        gamePort=$gamePort;webPort=$webPort;source='usb'
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'active.json')
    $s=Get-JoshRSStatus -RepoRoot $root
    Assert $s.Configured 'a complete mock USB game should be configured'
    Assert ($s.SaveCount -eq 1) 'player saves should be counted'
    Assert $s.DatabasePresent 'the account database should be detected'
    $diagnostics=Get-JoshRSSafeDiagnostics -RepoRoot $root
    Assert (-not $diagnostics.Contains('FakeSuperSecret')) 'diagnostics must never echo .env credentials'
    $backup=New-JoshRSLocalBackup -RepoRoot $root
    Assert (Test-Path -LiteralPath (Join-Path $backup 'players\main\elrothiro.sav')) 'player save backup missing'
    Assert (Test-Path -LiteralPath (Join-Path $backup 'db.sqlite')) 'SQLite database backup missing'
    Assert (Test-Path -LiteralPath (Join-Path $backup 'db.sqlite-wal')) 'SQLite WAL backup missing'
    Assert (Test-Path -LiteralPath (Join-Path $backup 'backup-info.json')) 'backup metadata missing'
    Assert ((Get-Content -LiteralPath (Join-Path $fakeEngine 'db.sqlite') -Raw).Contains('mock-db')) 'source database must remain unchanged'
    $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$gamePort)
    $listener.Start()
    Assert (Test-JoshRSLocalPort -Port $gamePort) 'a real open listener should be detected'
    $blocked=$false
    try { [void](New-JoshRSLocalBackup -RepoRoot $root) }
    catch { $blocked=($_.Exception.Message -like '*Stop your JoshRS server*') }
    Assert $blocked 'online backups should be blocked until the server stops'
    $listener.Stop()
    $listener=$null
    Assert (-not (Test-JoshRSLocalPort -Port $gamePort)) 'closed listener should not report open'
    Write-Host 'PASS: synthetic install, save/database discovery, credential-free diagnostics, offline backup and live-port protection.'
} finally {
    if ($listener) { $listener.Stop() }
    if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
}
