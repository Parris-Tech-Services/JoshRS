# Read-only static quest audit of the ACTIVE JoshRS 377 content + compiled server script pack.
# Never writes to the world: it only reads source/pack files and writes the CSV given by -Out.
# A static pass is NOT gameplay proof; combine with quest_saves.ps1 for real player evidence.
param(
    [string]$Root = 'C:\JoshRS-Launcher\JoshRS-main',
    [string]$Out  = (Join-Path ([IO.Path]::GetTempPath()) 'rs377_quest_audit.csv')
)

$active  = Get-Content (Join-Path $Root 'runtime\jparris-377\active.json') -Raw | ConvertFrom-Json
$base    = Split-Path $active.content -Parent
$scripts = "$base\content\scripts"
$queue   = (Get-Content (Join-Path $Root 'research\rs377\QUEST_QUEUE_2026-11-08.json') -Raw | ConvertFrom-Json).quests

# All source text, indexed by file, so cross-folder handlers count too.
$allRs2 = Get-ChildItem $scripts -Recurse -File -Filter *.rs2
$srcText = @{}
foreach ($f in $allRs2) { $srcText[$f.FullName] = [IO.File]::ReadAllText($f.FullName) }
$allSrc = ($srcText.Values -join "`n")

# Compiled server script pack: script names are stored as ASCII; extract printable runs.
$dat = [IO.File]::ReadAllBytes("$base\engine\data\pack\server\script.dat")
$compiled = [Text.Encoding]::ASCII.GetString($dat)

# Definition files (npc / obj / loc) for checking the start NPC is defined.
$npcDefs = (Get-ChildItem $scripts -Recurse -File -Filter *.npc | ForEach-Object { [IO.File]::ReadAllText($_.FullName) }) -join "`n"

$questDirs = Get-ChildItem "$scripts\quests" -Directory
$rows = foreach ($q in $queue) {
    $dir   = if ($q.evidence -and $q.evidence.quest_dir) { Join-Path $scripts ($q.evidence.quest_dir -replace '/', '\') } else { $null }
    if (-not ($dir -and (Test-Path $dir))) {
        # Find the folder whose scripts handle this quest's journal button.
        $dir = $null
        foreach ($d in $questDirs) {
            $hit = Get-ChildItem $d.FullName -Recurse -File -Filter *.rs2 | Where-Object { $srcText[$_.FullName] -match "questlist:$([regex]::Escape($q.quest_id))\b" } | Select-Object -First 1
            if ($hit) { $dir = $d.FullName; break }
        }
    }
    $files = if ($dir -and (Test-Path $dir)) { @(Get-ChildItem $dir -Recurse -File -Filter *.rs2) } else { @() }
    $lines = 0; $qText = ''
    foreach ($f in $files) { $t = $srcText[$f.FullName]; $qText += "`n$t"; $lines += ($t -split "`n").Count }
    $qVars = @([regex]::Matches(($files | ForEach-Object { [IO.File]::ReadAllText($_.FullName) }) -join "`n", 'send_quest_progress\(questlist:\w+,\s*%(\w+)') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)

    # Start NPC(s): queue may list "a / b"; take identifiers only.
    $npcs = @(($q.start_npc -split '[/ ]') | Where-Object { $_ -match '^[a-z0-9_]+$' })
    $npcDefined = $false; $handler = $false; $handlerCompiled = $false
    foreach ($n in $npcs) {
        if ($npcDefs -match "(?m)^\[$([regex]::Escape($n))\]") { $npcDefined = $true }
        if ($allSrc -match "\[opnpc1,$([regex]::Escape($n))\]") { $handler = $true }
        if ($compiled.Contains("[opnpc1,$n]") -or $compiled.Contains("opnpc1,$n")) { $handlerCompiled = $true }
    }

    $varCands = @((($q.varp_or_varbit -split '[/ ]') | Where-Object { $_ -match '^[a-z0-9_]+$' })) + $qVars
    $setsVar  = $false
    foreach ($v in $varCands) { if ($qText -match "%$([regex]::Escape($v))\s*=") { $setsVar = $true } }
    # Generic start: any trigger in the quest folder (npc/loc/obj/item) whose block moves a quest var.
    if (-not $handler -and $files) {
        foreach ($m in [regex]::Matches($qText, '(?ms)^\[(op(?:npc|loc|obj|held)\d|opheld\d|opnpcu|oplocu),([^\]]+)\](.*?)(?=^\[|\z)')) {
            $body = $m.Groups[3].Value
            if ($body -match 'send_quest_progress' -or ($varCands | Where-Object { $body -match "%$([regex]::Escape($_))\s*=" })) {
                $handler = $true
                if ($compiled.Contains("$($m.Groups[1].Value),$($m.Groups[2].Value)")) { $handlerCompiled = $true }
                break
            }
        }
    }
    $completes    = $qText -match 'send_quest_complete|quest_complete'
    $gives        = $qText -match 'inv_add|stat_advance|givexp|~give'
    $todo         = ([regex]::Matches($qText, '(?i)\b(TODO|FIXME|stub|placeholder|not implemented)\b')).Count
    $newest       = if ($files) { ($files | Sort-Object LastWriteTime | Select-Object -Last 1).LastWriteTime } else { $null }

    $verdict =
        if (-not $files)                                   { 'MISSING' }
        elseif (-not $handler)                             { 'BLOCKED (no start handler)' }
        elseif (-not ($setsVar -and $completes))           { 'PARTIAL (no completion path)' }
        elseif ($lines -lt 0.5 * [math]::Max($q.evidence.rs2_lines, 1) -or $todo -gt 0) { 'PARTIAL (thin / TODOs)' }
        else                                               { 'IMPLEMENTED - NOT PLAYTESTED' }

    [pscustomobject]@{
        Order = $q.release_order; Quest = $q.name; Id = $q.quest_id; QueueStatus = $q.status
        Rs2Files = $files.Count; Lines = $lines; StartNpc = ($npcs -join '/'); NpcDefined = $npcDefined
        StartHandler = $handler; HandlerInPack = $handlerCompiled; SetsQuestVar = [bool]$setsVar
        CompletionCall = [bool]$completes; GivesRewards = [bool]$gives; TodoMarkers = $todo
        EditedNov8 = [bool]($newest -and $newest -ge [datetime]'2026-11-08'); Verdict = $verdict
    }
}
$rows | Export-Csv $Out -NoTypeInformation -Encoding UTF8
$rows
