[CmdletBinding()]
param([Parameter(Mandatory)][string]$RepoRoot)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'family-health.ps1')
$status=Get-JoshRSStatus -RepoRoot $RepoRoot
if (-not ($status.GamePortOpen -or $status.WebPortOpen)) { Write-Host 'Selected game services are already stopped.'; return }
if (-not (Test-JoshRSRuntimeIdentity -Engine $status.Engine)) { throw 'Cannot identify the selected engine. No shutdown requested.' }
& node.exe (Join-Path $PSScriptRoot '..\..\tools\rs377-saves\graceful-node-stop.mjs') $status.Engine
if ($LASTEXITCODE -ne 0) { throw 'Graceful shutdown failed. No forced termination, backup or deployment performed.' }
if ((Test-JoshRSLocalPort -Port $status.GamePort) -or (Test-JoshRSLocalPort -Port $status.WebPort)) { throw 'The game services are still responding. Deployment remains blocked.' }
