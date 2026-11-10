# Read-only: decode quest progress from COPIES of the active world's player saves.
# Save files are copied to a temp folder first; the originals are never opened for writing.
# Output stays local (temp folder) - do not commit save copies or the CSV of private saves.
param(
    [string]$Root    = 'C:\JoshRS-Launcher\JoshRS-main',
    [string[]]$Players = @('elrothiro', 'sylvie'),
    [string]$Work    = (Join-Path ([IO.Path]::GetTempPath()) 'rs377-save-copies')
)
$active  = Get-Content (Join-Path $Root 'runtime\jparris-377\active.json') -Raw | ConvertFrom-Json
$base    = Split-Path $active.content -Parent
$content = "$base\content"
$work    = $Work
New-Item -ItemType Directory -Force $work | Out-Null
Copy-Item "$base\engine\data\players\main\*.sav" $work -Force

# id <-> name maps
$varpId = @{}; foreach ($l in Get-Content "$content\pack\varp.pack")   { if ($l -match '^(\d+)=(.+)$') { $varpId[$Matches[2]] = [int]$Matches[1] } }
$vbName = @{}; foreach ($l in Get-Content "$content\pack\varbit.pack") { if ($l -match '^(\d+)=(.+)$') { $vbName[$Matches[2]] = [int]$Matches[1] } }

# varbit definitions
$varbit = @{}
foreach ($f in Get-ChildItem "$content\scripts" -Recurse -File -Filter *.varbit) {
    $cur = $null
    foreach ($l in Get-Content $f.FullName) {
        if ($l -match '^\[(.+)\]') { $cur = $Matches[1]; $varbit[$cur] = @{} }
        elseif ($cur -and $l -match '^(basevar|startbit|endbit)=(.+)$') { $varbit[$cur][$Matches[1]] = $Matches[2].Trim() }
    }
}

# constants
$const = @{}
foreach ($f in Get-ChildItem "$content\scripts" -Recurse -File -Filter *.constant) {
    foreach ($l in Get-Content $f.FullName) { if ($l -match '^\^(\w+)\s*=\s*(-?\d+)') { $const[$Matches[1]] = [int]$Matches[2] } }
}

# quest -> (var, completeValue) from send_quest_progress calls
$quest = @{}
foreach ($f in Get-ChildItem "$content\scripts" -Recurse -File -Filter *.rs2) {
    foreach ($m in [regex]::Matches([IO.File]::ReadAllText($f.FullName), 'send_quest_progress\(\s*questlist:(\w+)\s*,\s*%(\w+)\s*,\s*(\^?\w+)\s*\)')) {
        $id = $m.Groups[1].Value
        if ($quest.ContainsKey($id)) { continue }
        $cv = $m.Groups[3].Value
        $val = if ($cv -match '^\^(\w+)') { $const[$Matches[1]] } elseif ($cv -match '^\d+$') { [int]$cv } else { $null }
        $quest[$id] = @{ Var = $m.Groups[2].Value; Complete = $val }
    }
}

function Read-Varps([string]$path) {
    $b = [IO.File]::ReadAllBytes($path)
    $magic = ([int]$b[0] -shl 8) -bor $b[1]; $ver = ([int]$b[2] -shl 8) -bor $b[3]
    if ($magic -ne 0x2004) { throw "bad magic in $path" }
    $p = 4 + 2 + 2 + 1 + 7 + 5 + 1 + 2                  # x,z,level,body,colors,gender,runenergy
    $p += $(if ($ver -ge 2) { 4 } else { 2 })           # playtime
    $p += 21 * 5                                         # stats
    $count = ([int]$b[$p] -shl 8) -bor $b[$p + 1]; $p += 2
    $vars = @{}
    for ($i = 0; $i -lt $count; $i++) {
        if ($ver -ge 7) {
            $id = ([int]$b[$p] -shl 8) -bor $b[$p + 1]; $p += 2
            $byte = [int]$b[$p]; $p++; $res = [int64]0
            while ($byte -band 0x80) { $res = ($res -bor ($byte -band 0x7F)) -shl 7; $byte = [int]$b[$p]; $p++ }
            $vars[$id] = [int64](($res -bor $byte) -band 0xFFFFFFFF)
        } else {
            $vars[$i] = [int64][BitConverter]::ToInt32([byte[]]@($b[$p + 3], $b[$p + 2], $b[$p + 1], $b[$p]), 0); $p += 4
        }
    }
    $vars
}

function Get-VarValue($vars, [string]$name) {
    if ($varpId.ContainsKey($name)) { $v = $vars[$varpId[$name]]; if ($null -eq $v) { 0 } else { $v } }
    elseif ($varbit.ContainsKey($name)) {
        $d = $varbit[$name]; $raw = $vars[$varpId[$d.basevar]]; if ($null -eq $raw) { $raw = 0 }
        $s = [int]$d.startbit; $e = [int]$d.endbit
        ($raw -shr $s) -band ((1 -shl ($e - $s + 1)) - 1)
    } else { $null }
}

$saveFiles = Get-ChildItem $work -Filter *.sav | Where-Object { $_.BaseName -in $Players }
$saves = @{}; foreach ($pl in $saveFiles) { $saves[$pl.BaseName] = Read-Varps $pl.FullName }

$rows = foreach ($id in $quest.Keys | Sort-Object) {
    $o = [ordered]@{ Id = $id; Var = $quest[$id].Var; Complete = $quest[$id].Complete }
    foreach ($pn in $saves.Keys) {
        $v = Get-VarValue $saves[$pn] $quest[$id].Var
        $o[$pn] = if ($null -eq $v) { '?' } elseif ($v -eq 0) { '-' } elseif ($null -ne $quest[$id].Complete -and $v -ge $quest[$id].Complete) { "DONE($v)" } else { "started($v)" }
    }
    [pscustomobject]$o
}
$rows | Export-Csv (Join-Path $work 'quest_saves.csv') -NoTypeInformation
$rows
