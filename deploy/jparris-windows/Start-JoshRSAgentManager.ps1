# Start the JoshRS local Agent Manager UI (PowerShell 5.1 compatible).
# Does NOT start/restart any game, change engine flags or touch player saves.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$script = Join-Path $root 'tools\rs377-agent-manager\serve.mjs'
if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
    throw 'Agent Manager source is missing. Update the JoshRS source checkout first.'
}
$node = (Get-Command node.exe -ErrorAction Stop).Source
$versionString = (& $node --version).TrimStart('v')
$major = [int]($versionString.Split('.')[0])
if ($major -lt 24) { throw 'JoshRS Agent Manager requires Node 24 or newer.' }
Write-Host 'JoshRS Agent Manager (local-only): http://127.0.0.1:18886'
Write-Host 'Existing game remains untouched. Only explicit isolated Harness bot logins are permitted.'
Write-Host 'Use Ctrl+C here to close managed bot connections gracefully.'
& $node $script
if ($LASTEXITCODE -ne 0) { throw ('Agent Manager exited with code ' + $LASTEXITCODE) }
