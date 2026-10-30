# Selects JDK 21 for this JoshRS PowerShell process and all child processes.
# Does not modify the system-wide Java configuration or remove JDK 17.

function Test-JoshRSJdk21 {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Home)
    if (-not $Home -or -not (Test-Path -LiteralPath (Join-Path $Home 'bin\javac.exe') -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path $Home 'bin\java.exe') -PathType Leaf)) {
        return $false
    }
    try {
        $compiler=Join-Path $Home 'bin\javac.exe'
        $version=(& $compiler -version 2>&1 | Out-String).Trim()
        return ($LASTEXITCODE -eq 0 -and $version -match '^javac 21(?:[.\s]|$)')
    } catch { return $false }
}

function Find-JoshRSJdk21 {
    [CmdletBinding()]
    param([string[]]$AdditionalHomes=@())
    $candidates=New-Object 'System.Collections.Generic.List[string]'
    foreach ($item in $AdditionalHomes) { if ($item) { $candidates.Add($item) } }
    if ($env:JAVA_HOME) { $candidates.Add($env:JAVA_HOME) }

    $compiler=Get-Command 'javac.exe' -ErrorAction SilentlyContinue
    if ($compiler -and $compiler.Source) {
        # javac lives at JDK-home\bin\javac.exe.
        $candidates.Add((Split-Path -Parent (Split-Path -Parent $compiler.Source)))
    }

    $installBases=@($env:ProgramFiles,[Environment]::GetEnvironmentVariable('ProgramFiles(x86)'),
        (Join-Path $env:LOCALAPPDATA 'Programs')) | Where-Object { $_ }
    foreach ($base in $installBases) {
        foreach ($vendor in @('Eclipse Adoptium','Java','Microsoft','Amazon Corretto')) {
            $parent=Join-Path $base $vendor
            if (-not (Test-Path -LiteralPath $parent -PathType Container)) { continue }
            foreach ($directory in @(Get-ChildItem -LiteralPath $parent -Directory -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -match '^(?:jdk[-_]?21|microsoft-jdk-21)(?:[._+\-]|$)' } |
                Sort-Object LastWriteTime -Descending)) {
                $candidates.Add($directory.FullName)
            }
        }
    }
    $seen=New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($candidate in $candidates) {
        if (-not $seen.Add($candidate)) { continue }
        if (Test-JoshRSJdk21 -Home $candidate) { return $candidate }
    }
    return $null
}

function Set-JoshRSJdk21 {
    [CmdletBinding()]
    param([switch]$InstallIfMissing,[string[]]$AdditionalHomes=@())
    $home=Find-JoshRSJdk21 -AdditionalHomes $AdditionalHomes
    if (-not $home -and $InstallIfMissing) {
        if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
            throw 'JDK 21 was not found. Install Eclipse Temurin JDK 21; Windows Package Manager (winget) is unavailable.'
        }
        Write-Host 'JDK 21 is not installed. Installing the free Eclipse Temurin JDK 21 (existing Java 17 is preserved)...'
        & winget.exe install --exact --id EclipseAdoptium.Temurin.21.JDK --source winget --accept-package-agreements --accept-source-agreements
        $exitCode=$LASTEXITCODE
        $home=Find-JoshRSJdk21 -AdditionalHomes $AdditionalHomes
        if (-not $home) {
            throw "JDK 21 could not be found after its installer returned $exitCode. Open a new PowerShell window or check the Eclipse Adoptium installation."
        }
    }
    if (-not $home) {
        throw 'JDK 21 not found. Install Eclipse Temurin JDK 21 and rerun JoshRS setup.'
    }
    $env:JAVA_HOME=$home
    $bin=Join-Path $home 'bin'
    $env:Path=$bin + ';' + $env:Path
    $version=(& javac.exe -version 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $version -notmatch '^javac 21(?:[.\s]|$)') {
        throw "JDK 21 selection failed: $version"
    }
    Write-Host "Using JDK 21: $home (only in this JoshRS setup session)"
    return $home
}
