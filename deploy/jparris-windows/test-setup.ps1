$ErrorActionPreference = 'Stop'

# Verify setup.ps1 and play.ps1 AST, mutexes, pre-launch save protection, and CheckOnly mode.
$setupOut = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'setup.ps1') -CheckOnly
if ($LASTEXITCODE -ne 0 -or ($setupOut -join "`n") -notmatch 'Upstream source lock: revision 377') {
    throw 'setup.ps1 -CheckOnly failed'
}

$tokens = $null; $errors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'play.ps1'), [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw ($errors | Out-String) }

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'test-bootstrap.ps1')
if ($LASTEXITCODE -ne 0) { throw 'test-bootstrap.ps1 failed' }

Write-Host 'PASS: setup.ps1 CheckOnly, play.ps1 syntax/mutex/save-verification checks, and bootstrap suite passed.'
exit 0
