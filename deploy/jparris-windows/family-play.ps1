[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $PSScriptRoot '..\..'),[switch]$StatusOnly,[switch]$NoDialog)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'family-health.ps1')
$launchLock=$null; $held=$false; $log=$null
try {
    $RepoRoot=(Resolve-Path -LiteralPath $RepoRoot).Path
    $health=Get-JoshRSFamilyHealth -RepoRoot $RepoRoot
    if ($StatusOnly) { $health | ConvertTo-Json -Depth 5; return }
    $launchLock=[Threading.Mutex]::new($false,'Local\JoshRS377FamilyLaunch')
    $held=$launchLock.WaitOne(0)
    if (-not $held) { return }
    $log=New-JoshRSLaunchLog -RepoRoot $RepoRoot -Role 'dashboard'
    Start-Transcript -LiteralPath $log | Out-Null
    $script=Join-Path $RepoRoot 'deploy\jparris-windows\play.ps1'
    if (-not (Test-Path -LiteralPath $script)) { throw 'Installed game launcher is missing.' }
    if ($health.State -in @('Failed','Conflict')) { throw $health.Detail }
    if ($health.State -eq 'Stopped') {
        $validator=Join-Path $PSScriptRoot '..\..\tools\rs377-saves\validate-family-world.mjs'
        $null=& node.exe $validator $health.Installation.Engine 2>&1
        if ($LASTEXITCODE -ne 0) { throw 'Character or account database validation failed. The world was not started. Open the recovery tools before proceeding.' }
        if ($health.Installation.SavePresent -or $health.Installation.DatabasePresent) {
            $backup=New-JoshRSLocalBackup -RepoRoot $RepoRoot
            Write-Host "Verified offline backup: $backup"
        }
        Write-Host 'Starting the selected family world...'
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$script+'"'),'-Role','Server') -WorkingDirectory $RepoRoot -WindowStyle Hidden
    }
    $ready=$false
    for ($attempt=0;$attempt -lt 120;$attempt++) {
        $status=Get-JoshRSStatus -RepoRoot $RepoRoot
        if ($status.GamePortOpen -and $status.WebPortOpen) {
            if (-not (Test-JoshRSRuntimeIdentity -Engine $status.Engine)) { throw 'The responding service is not the selected game. No client started.' }
            $ready=$true; break
        }
        Start-Sleep -Seconds 2
    }
    if (-not $ready) { throw 'Server did not become ready in four minutes. Open the latest server log; do not start another world.' }
    Write-Host 'Ready. Opening the Java game client.'
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$script+'"'),'-Role','Client') -WorkingDirectory $RepoRoot -WindowStyle Hidden
} catch {
    $message=$_.Exception.Message
    if ($log) { Add-Content -LiteralPath $log -Value ('FAILED: '+$message) }
    if (-not $NoDialog) {
        Add-Type -AssemblyName System.Windows.Forms
        [void][System.Windows.Forms.MessageBox]::Show(($message+"`r`n`r`nStartup log: "+$log),'JoshRS could not start')
    }
    Write-Error $message
    exit 1
} finally {
    if ($log) { try { Stop-Transcript | Out-Null } catch {} }
    if ($held) { $launchLock.ReleaseMutex() }
    if ($launchLock) { $launchLock.Dispose() }
}
