$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$source = Join-Path $PSScriptRoot 'play.ps1'
$fixer = Join-Path $PSScriptRoot 'fix-java-client-launch.ps1'
$helper = Join-Path $PSScriptRoot 'launch-java-client-safe.ps1'
$fixture = Join-Path $env:TEMP ('joshrs-client-arg-fixture-' + [guid]::NewGuid().ToString('N'))
try {
    $scripts = Join-Path $fixture 'deploy/jparris-windows'
    $runtime = Join-Path $fixture 'runtime/jparris-377'
    $client = Join-Path $fixture 'synthetic client with spaces'
    foreach ($dir in @($scripts,$runtime,$client)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
    Copy-Item -LiteralPath $fixer -Destination $scripts
    Copy-Item -LiteralPath $helper -Destination $scripts
    $bad = [IO.File]::ReadAllText($source)
    $needle = '& (Join-Path $s.client ' + "'gradlew.bat')" + ' run "--args=$clientArguments"'
    if (-not $bad.Contains($needle)) { throw 'Expected base play.ps1 launch anchor missing' }
    $bad = $bad.Replace($needle, @'
            Write-Host "Starting Java client directly without Gradle daemon"
            & java.exe -Djava2d.d3d=false -cp $env:CLASSPATH jagex2.client.Client $clientArguments
'@.TrimEnd([char]13,[char]10))
    $target = Join-Path $scripts 'play.ps1'
    [IO.File]::WriteAllText($target,$bad)
    $active = @{ client = $client; engine = 'do-not-touch'; content = 'do-not-touch'; portOffset=8808 } | ConvertTo-Json
    [IO.File]::WriteAllText((Join-Path $runtime 'active.json'),$active)
    [IO.File]::WriteAllText((Join-Path $client 'gradlew.bat'), ('@echo off' + [Environment]::NewLine + 'exit /b 0' + [Environment]::NewLine))
    [IO.File]::WriteAllText((Join-Path $client 'build.gradle'), 'application { mainClass = "jagex2.client.Client" }')
    $beforeHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    & (Join-Path $scripts 'fix-java-client-launch.ps1')
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $beforeHash) {
        throw 'Read-only preflight modified the original script'
    }
    & (Join-Path $scripts 'fix-java-client-launch.ps1') -Apply
    $after = [IO.File]::ReadAllText($target)
    if ($after -notmatch 'JOSHRS_SAFE_CLIENT_LAUNCH_V1') { throw 'Client block was not replaced' }
    if (-not $after.Contains("if (" + '$Role' + " -eq 'Server')")) { throw 'Server branch was damaged' }
    if ($after -match 'Starting Java client directly without Gradle daemon') { throw 'Old faulty launch survived' }
    $backupFolder = Join-Path $runtime 'launcher-backups'
    $backups = @(Get-ChildItem -LiteralPath $backupFolder -Filter '*.ps1')
    if ($backups.Count -ne 1) { throw 'Original launcher backup missing or duplicated' }
    if ([IO.File]::ReadAllText($backups[0].FullName) -cne $bad) {
        throw 'Original customised Java launcher not preserved exactly'
    }
    $savedAfter = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    & (Join-Path $scripts 'fix-java-client-launch.ps1') -Apply
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $savedAfter) {
        throw 'Repeat repair modified installed script'
    }
    if (@(Get-ChildItem -LiteralPath $backupFolder -Filter '*.ps1').Count -ne 1) {
        throw 'Repeat repair created unnecessary backup'
    }
    foreach ($path in @($target,(Join-Path $scripts 'launch-java-client-safe.ps1'))) {
        $tokens = $null
        $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile($path,[ref]$tokens,[ref]$errors)
        if ($errors.Count) { throw "PowerShell parser found syntax error in $path" }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $runtime 'active.json'))) { throw 'Active config disappeared' }
    Write-Host 'PASS: preflight read-only; launcher branch surgically repaired; user-customized original backed up; server branch unchanged; idempotent; no runtime touched.'
} finally {
    if (Test-Path -LiteralPath $fixture) {
        Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue
    }
}
