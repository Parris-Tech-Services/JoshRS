# Fast, non-destructive detection of plausible Fedora JoshRS copies on removable
# Windows volumes. This does not recurse or open unrelated personal files.
function Get-JoshRSUsbCandidates {
    [CmdletBinding()]
    param(
        # Explicit roots permit deterministic tests and manually mounted drives.
        [string[]]$Roots = @()
    )
    if ($Roots.Count -eq 0) {
        $Roots = @(
            Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=2' -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty DeviceID
        )
    }
    $found = New-Object System.Collections.ArrayList
    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($root in $Roots) {
        if (-not $root -or -not (Test-Path -LiteralPath $root -PathType Container)) { continue }
        # Examine only known directory layouts. An exhaustive USB scan could take
        # minutes and would unnecessarily access unrelated personal material.
        foreach ($relative in @('JoshRS\lostcity377','lostcity377','JoshRS','')) {
            $path = if ($relative) { Join-Path $root $relative } else { $root }
            if (-not (Test-Path -LiteralPath $path -PathType Container)) { continue }
            $engine = Join-Path $path 'engine'
            $content = Join-Path $path 'content'
            $required = @(
                (Join-Path $engine 'package.json'),
                (Join-Path $engine 'src\app.ts'),
                (Join-Path $engine 'src\engine\World.ts'),
                (Join-Path $content 'scripts')
            )
            $valid = $true
            foreach ($target in $required) {
                if (-not (Test-Path -LiteralPath $target)) { $valid = $false; break }
            }
            if (-not $valid) { continue }
            $fullPath = (Resolve-Path -LiteralPath $path).Path
            if (-not $seen.Add($fullPath)) { continue }
            $save = Join-Path $engine 'data\players\main\elrothiro.sav'
            $db = Join-Path $engine 'db.sqlite'
            $client = (Test-Path -LiteralPath (Join-Path $path 'client-java\gradlew.bat') -PathType Leaf)
            [void]$found.Add([pscustomobject]@{
                Path = $fullPath
                HasElrothiroSave = (Test-Path -LiteralPath $save -PathType Leaf)
                HasDatabase = (Test-Path -LiteralPath $db -PathType Leaf)
                HasClient = $client
            })
        }
    }
    return @($found.ToArray())
}
