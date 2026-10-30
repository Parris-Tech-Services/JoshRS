$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'support.ps1')
function Assert([bool]$value,[string]$message) {
    if (-not $value) { throw "Launcher recovery regression: $message" }
}
$root=Join-Path $env:TEMP ('joshrs-recovery-' + [guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    Assert (-not (Get-JoshRSRecentLogFile -RepoRoot $root)) 'empty world should not report a log'
    $first=New-JoshRSLaunchLog -RepoRoot $root -Role 'server'
    Assert ($first -match 'server-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}\.log$') 'server log must be timestamped'
    'TEST first log only' | Set-Content -LiteralPath $first
    $discovered=Get-JoshRSRecentLogFile -RepoRoot $root
    # GitHub runners sometimes expose the same TEMP folder via Windows short names (RUNNER~1).
    # Compare canonical file names rather than different textual aliases for the same directory.
    Assert ([IO.Path]::GetFileName($discovered) -eq [IO.Path]::GetFileName($first)) 'latest existing log should be discoverable'
    for ($i=0;$i -lt 29;$i++) {
        $file=New-JoshRSLaunchLog -RepoRoot $root -Role 'client'
        ('TEST record ' + $i) | Set-Content -LiteralPath $file
    }
    $folder=Join-Path $root 'runtime\jparris-377\logs'
    $count=@(Get-ChildItem -LiteralPath $folder -File).Count
    Assert ($count -le 25) "log retention should cap at 25; found $count"
    $latest=Get-JoshRSRecentLogFile -RepoRoot $root
    Assert ((Test-Path -LiteralPath $latest -PathType Leaf)) 'latest log file missing'
    'ignore this text file' | Set-Content -LiteralPath (Join-Path $folder 'unrelated.txt')
    Assert ((Get-JoshRSRecentLogFile -RepoRoot $root) -eq $latest) 'unrelated files must never be opened by dashboard'
    Write-Host 'PASS: log naming, discoverability, unrelated-file rejection and 25-log retention'
} finally {
    if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
}
# Confirm a broken hidden launcher emits a local error log and fails with
# a nonzero exit code; suppress the modal dialog during CI only.
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$logFolder=Join-Path $repo 'runtime\jparris-377\logs'
$previous=@(Get-ChildItem -LiteralPath $logFolder -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
& powershell.exe -NoProfile -Sta -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'launch-control-center.ps1') -SimulateFailure -NoDialog
Assert ($LASTEXITCODE -eq 1) 'a launcher failure must have an unsuccessful exit code'
$added=@(Get-ChildItem -LiteralPath $logFolder -Filter 'dashboard-*.log' -File -ErrorAction SilentlyContinue |
    Where-Object { $previous -notcontains $_.FullName })
Assert ($added.Count -eq 1) 'a launcher failure must produce one diagnostic log'
Assert ((Get-Content -LiteralPath $added[0].FullName -Raw) -like '*Synthetic dashboard launch failure*') 'failure reason missing'
Remove-Item -LiteralPath $added[0].FullName -Force
Write-Host 'PASS: hidden dashboard failure emits a discoverable diagnostic log and a nonzero exit code'
