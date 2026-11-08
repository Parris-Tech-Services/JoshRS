# Synthetic Windows PowerShell 5.1 tests. No connection to real JoshRS.
$ErrorActionPreference = 'Stop'
$root = Join-Path ([IO.Path]::GetTempPath()) ('joshrs-agent-check-' + [guid]::NewGuid().ToString('N'))
$tool = Join-Path $PSScriptRoot 'Inspect-Agents.ps1'
function Assert-JoshRS([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}
try {
    $runtime = Join-Path $root 'runtime\jparris-377'
    $engine = Join-Path $runtime 'usb-fixture\engine'
    $botDir = Join-Path $engine 'src\engine\bot'
    $entityDir = Join-Path $engine 'src\engine\entity'
    $stateDir = Join-Path $runtime 'fred-george-isolated'
    foreach ($dir in @($botDir, $entityDir, $stateDir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -LiteralPath (Join-Path $engine 'src\engine\World.ts') -Value '// spawnFredAndGeorgeBots tickFredAndGeorgeBots spawnDevelopmentBots' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $botDir 'FredGeorgeBot.ts') -Value '// synthetic test bot' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $entityDir 'BotPlayer.ts') -Value '// synthetic test Luna' -Encoding UTF8
    $envText = @(
        '# Only explicit safe flags are read'
        'PASSWORD=SECRET_MUST_NOT_LEAK'
        'JOSHRS_FRED_GEORGE=1'
        'DEV_LUNA_BOT=true'
    ) -join [Environment]::NewLine
    Set-Content -LiteralPath (Join-Path $engine '.env') -Value $envText -Encoding UTF8
    # Synthetic loopback listener makes the fresh report genuinely reachable.
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $port = [int]$listener.LocalEndpoint.Port
    @{engine=$engine;gamePort=$port;webPort=8888} | ConvertTo-Json -Compress | Set-Content -LiteralPath (Join-Path $runtime 'active.json') -Encoding UTF8
    $livePath = Join-Path $stateDir 'live-bot-state.json'
    @{
        schema='joshrs-fred-george-live-state-v1'
        updated_utc=[DateTimeOffset]::UtcNow.ToString('o')
        game_port=$port
        bots=@{
            Fred=@{online=$true;current_task='gather safely'}
            George=@{online=$true;current_task='quest safely'}
        }
    } | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $livePath -Encoding UTF8
    $originalEnvHash = (Get-FileHash -LiteralPath (Join-Path $engine '.env') -Algorithm SHA256).Hash
    $originalStateHash = (Get-FileHash -LiteralPath (Join-Path $runtime 'active.json') -Algorithm SHA256).Hash
    $out = (& $tool -RepoRoot $root | Out-String)
    Assert-JoshRS (-not $out.Contains('SECRET_MUST_NOT_LEAK')) 'Private .env field leaked'
    $report = $out | ConvertFrom-Json
    Assert-JoshRS ($report.fredGeorge.configured -eq $true) 'Fred/George flag not read'
    Assert-JoshRS ($report.fredGeorge.moduleInstalled -eq $true) 'Fred/George source not detected'
    Assert-JoshRS ($report.fredGeorge.worldSpawnWired -eq $true) 'Fred/George spawn not detected'
    Assert-JoshRS ($report.fredGeorge.worldTickWired -eq $true) 'Fred/George tick not detected'
    Assert-JoshRS ($report.luna.configured -eq $true) 'Luna flag not read'
    Assert-JoshRS ($report.luna.worldSpawnWired -eq $true) 'Luna start not detected'
    Assert-JoshRS ($report.fredGeorge.live.reportFresh -eq $true) 'Fresh live state not recognised'
    Assert-JoshRS ($report.fredGeorge.live.fredOnline -eq $true) 'Fresh Fred not recognised'
    Assert-JoshRS ($report.fredGeorge.live.georgeOnline -eq $true) 'Fresh George not recognised'
    Assert-JoshRS ($report.rsSdk.completeRevision377AgentBridgeVerified -eq $false) 'Do not claim RS-SDK ready'
    Assert-JoshRS ((Get-FileHash (Join-Path $engine '.env') -Algorithm SHA256).Hash -eq $originalEnvHash) 'Env mutated'
    Assert-JoshRS ((Get-FileHash (Join-Path $runtime 'active.json') -Algorithm SHA256).Hash -eq $originalStateHash) 'Active world mutated'

    # A recent report from a STOPPED server must be marked stale and bots unknown.
    $listener.Stop()
    $stoppedReport = (& $tool -RepoRoot $root | Out-String) | ConvertFrom-Json
    Assert-JoshRS ($stoppedReport.gameListening -eq $false) 'Stopped fixture port incorrectly listening'
    Assert-JoshRS ($stoppedReport.fredGeorge.live.reportPresent -eq $true) 'Recent stopped report missing'
    Assert-JoshRS ($stoppedReport.fredGeorge.live.reportFresh -eq $false) 'Fresh stopped-server file incorrectly treated as live'
    Assert-JoshRS ($null -eq $stoppedReport.fredGeorge.live.fredOnline) 'Stopped server Fred must be unknown'
    Assert-JoshRS ($null -eq $stoppedReport.fredGeorge.live.georgeOnline) 'Stopped server George must be unknown'

    # A previously written but stale file must NOT be treated as live bots.
    $stale = Get-Content $livePath -Raw | ConvertFrom-Json
    $stale.updated_utc = [DateTimeOffset]::UtcNow.AddMinutes(-10).ToString('o')
    $stale | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $livePath -Encoding UTF8
    $report = (& $tool -RepoRoot $root | Out-String) | ConvertFrom-Json
    Assert-JoshRS ($report.fredGeorge.live.reportPresent -eq $true) 'Stale file should still be found'
    Assert-JoshRS ($report.fredGeorge.live.reportFresh -eq $false) 'Stale report accepted as fresh'
    Assert-JoshRS ($null -eq $report.fredGeorge.live.fredOnline) 'Stale Fred must be unknown, not offline'
    Assert-JoshRS ($null -eq $report.fredGeorge.live.georgeOnline) 'Stale George must be unknown, not offline'

    # Missing code is correctly distinguished from configured flags.
    Remove-Item -LiteralPath (Join-Path $botDir 'FredGeorgeBot.ts')
    $report = (& $tool -RepoRoot $root | Out-String) | ConvertFrom-Json
    Assert-JoshRS ($report.fredGeorge.configured -eq $true) 'Flag must remain enabled'
    Assert-JoshRS ($report.fredGeorge.moduleInstalled -eq $false) 'Missing bot module incorrectly marked installed'
    Write-Host 'PASS: Windows agent inspector is read-only and distinguishes enabled, installed, live and stale.'
} finally {
    if ($listener) { $listener.Stop() }
    if (Test-Path -LiteralPath $root) {
        Remove-Item -LiteralPath $root -Force -Recurse -ErrorAction SilentlyContinue
    }
}
