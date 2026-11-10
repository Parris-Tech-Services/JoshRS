# Read-only survey: every ladder/staircase (any loc with a "Climb" op) placed on the map,
# and whether the running world has a script for that op at that spot.
param(
    [string]$Root = 'C:\JoshRS-Launcher\JoshRS-main',
    [string]$Out  = (Join-Path $PSScriptRoot 'climb_survey.csv')
)
$active  = Get-Content (Join-Path $Root 'runtime\jparris-377\active.json') -Raw | ConvertFrom-Json
$base    = Split-Path $active.content -Parent
$content = "$base\content"

# loc id -> name
$locName = @{}
foreach ($l in [IO.File]::ReadAllLines("$content\pack\loc.pack")) { if ($l -match '^(\d+)=(.+)$') { $locName[[int]$Matches[1]] = $Matches[2] } }

# loc definitions: ops + category (later files override earlier ones)
$def = @{}
foreach ($f in Get-ChildItem "$content\scripts" -Recurse -File -Filter *.loc) {
    $cur = $null
    foreach ($l in [IO.File]::ReadAllLines($f.FullName)) {
        if ($l -match '^\[(.+)\]$') { $cur = $Matches[1]; if (-not $def[$cur]) { $def[$cur] = @{ ops = @{}; category = $null; name = $null } } }
        elseif ($cur -and $l -match '^op([1-5])=(.+)$') { $def[$cur].ops[[int]$Matches[1]] = $Matches[2].Trim() }
        elseif ($cur -and $l -match '^category=(.+)$') { $def[$cur].category = $Matches[1].Trim() }
        elseif ($cur -and $l -match '^name=(.+)$') { $def[$cur].name = $Matches[1].Trim() }
    }
}

# source handlers (to read switch_coord cases) and compiled script names
$src = (Get-ChildItem "$content\scripts" -Recurse -File -Filter *.rs2 | ForEach-Object { [IO.File]::ReadAllText($_.FullName) }) -join "`n"
$compiled = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes("$base\engine\data\pack\server\script.dat"))
$handlerBody = @{}
foreach ($m in [regex]::Matches($src, '(?ms)^\[(oploc[1-5]),([^\]]+)\](.*?)(?=^\[|\z)')) { $handlerBody["$($m.Groups[1].Value),$($m.Groups[2].Value)"] = $m.Groups[3].Value }

function Get-Status([string]$name, [int]$op, [string]$coordKey) {
    $cat = $def[$name].category
    $keys = @("oploc$op,$name"); if ($cat) { $keys += "oploc$op,_$cat" }
    foreach ($k in $keys) {
        if (-not $compiled.Contains($k)) { continue }
        $body = $handlerBody[$k]
        if ($body -and $body -match 'case default\s*:\s*@unhandled_(stairs|ladder)') {
            if ($body.Contains("case $coordKey")) { return 'handled' } else { return 'default-unhandled' }
        }
        return 'handled'
    }
    'NO HANDLER'
}

$rows = foreach ($f in Get-ChildItem "$content\maps" -File -Filter *.jm2) {
    if ($f.BaseName -notmatch '^m(\d+)_(\d+)$') { continue }
    $mx = [int]$Matches[1]; $mz = [int]$Matches[2]
    $inLoc = $false
    foreach ($l in [IO.File]::ReadAllLines($f.FullName)) {
        if ($l -match '^==== (\w+)') { $inLoc = ($Matches[1] -eq 'LOC'); continue }
        if (-not $inLoc -or $l -notmatch '^(\d+) (\d+) (\d+): (\d+)') { continue }
        $lvl = [int]$Matches[1]; $lx = [int]$Matches[2]; $lz = [int]$Matches[3]; $id = [int]$Matches[4]
        $name = $locName[$id]; if (-not $name -or -not $def[$name]) { continue }
        foreach ($op in $def[$name].ops.Keys) {
            $label = $def[$name].ops[$op]
            if ($label -notmatch '(?i)climb') { continue }
            $key = "{0}_{1}_{2}_{3}_{4}" -f $lvl, $mx, $mz, $lx, $lz
            [pscustomobject]@{
                X = $mx * 64 + $lx; Z = $mz * 64 + $lz; Level = $lvl; Coord = $key
                Loc = $name; Display = $def[$name].name; Op = "op$op $label"
                Status = Get-Status $name $op $key
            }
        }
    }
}
$rows | Export-Csv $Out -NoTypeInformation
$rows
