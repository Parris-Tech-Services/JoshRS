# Share only the ACTIVE customised Java client with a running VirtualBox guest.
# Uses a read-only, transient VirtualBox share; never shares saves/accounts/engine.
[CmdletBinding()]
param(
    [string]$VMName = 'Windows 11',
    [string]$ActiveStatePath = 'C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ActiveStatePath -PathType Leaf)) {
    throw "JoshRS active.json not found: $ActiveStatePath. Supply -ActiveStatePath using the location of JParris Desktop's running launcher."
}
$state = Get-Content -LiteralPath $ActiveStatePath -Raw | ConvertFrom-Json
if (-not $state.client) { throw "active.json has no client property; refusing to guess a source directory." }
$client = [System.IO.Path]::GetFullPath([string]$state.client)
foreach ($file in @('gradlew.bat','build.gradle','src\main\java\jagex2\client\Client.java')) {
    if (-not (Test-Path -LiteralPath (Join-Path $client $file) -PathType Leaf)) {
        throw "Active client folder missing $file : $client. No share has been created."
    }
}
$vbox = Join-Path $env:ProgramFiles 'Oracle\VirtualBox\VBoxManage.exe'
if (-not (Test-Path -LiteralPath $vbox -PathType Leaf)) {
    $found = Get-Command VBoxManage.exe -ErrorAction SilentlyContinue
    if (-not $found) { throw 'VBoxManage.exe not found on JParris Desktop. Is VirtualBox installed on this computer?' }
    $vbox = $found.Source
}
$runningVms = (& $vbox list runningvms) -join [Environment]::NewLine
if ($LASTEXITCODE -ne 0) { throw 'Cannot read running VirtualBox VMs.' }
$pattern = '(?m)^"' + [regex]::Escape($VMName) + '"\s+\{[0-9a-f-]+\}'
if ($runningVms -notmatch $pattern) {
    throw ("VM '$VMName' is not running. Running VMs: " + [Environment]::NewLine + $runningVms)
}
$details = (& $vbox showvminfo $VMName --machinereadable) -join [Environment]::NewLine
if ($LASTEXITCODE -ne 0) { throw "Could not inspect VirtualBox VM '$VMName'." }
if ($details -match '(?im)^SharedFolderNameMachineMapping\d+="JoshRSClient"' -or
    $details -match '(?im)^SharedFolderNameTransientMapping\d+="JoshRSClient"') {
    Write-Host 'JoshRSClient VirtualBox share already exists. Not replacing it.'
} else {
    Write-Host "Sharing active custom Java client as READ-ONLY and TRANSIENT with VM '$VMName':"
    Write-Host $client
    & $vbox sharedfolder add $VMName --name JoshRSClient --hostpath $client --readonly --transient
    if ($LASTEXITCODE -ne 0) {
        throw 'VirtualBox refused the share. You can add it in VM Devices > Shared Folders; set name JoshRSClient and READ-ONLY.'
    }
}
Write-Host 'Host custom Java client is now offered to VM as \\VBOXSVR\JoshRSClient.'
Write-Host 'Inside the VM: Test-Path "\\VBOXSVR\JoshRSClient\gradlew.bat"'
Write-Host 'If False, VirtualBox Guest Additions are required in the VM.'
Write-Host 'No game server or character files were modified.'
