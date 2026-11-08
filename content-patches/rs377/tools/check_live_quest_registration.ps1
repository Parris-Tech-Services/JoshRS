<#
.SYNOPSIS
  Read-only check: which JoshRS patched quests are actually present and
  registered in a live revision-377 content folder.

.DESCRIPTION
  For each of the 25 JoshRS quest folders this reports whether:
    - the quest folder exists in the live content (scripts\quests\quest_*)
    - the quest is registered in the quest list refresh
      (scripts\general\scripts\quests.rs2 send_quest_progress_colour line)
    - a journal button handler exists ([if_button,questlist:<name>])
  Nothing is modified. A quest that is registered here still needs the
  content rebuilt/packed and the server restarted before it shows in game.

.EXAMPLE
  .\check_live_quest_registration.ps1
  .\check_live_quest_registration.ps1 -ContentRoot 'D:\path\to\content'
#>
param(
    [string]$ContentRoot = 'C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\usb-20261030-203927\content'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ContentRoot)) {
    throw "Content folder not found: $ContentRoot"
}
$scripts = Join-Path $ContentRoot 'scripts'
$questsRs2 = Join-Path $scripts 'general\scripts\quests.rs2'
if (-not (Test-Path -LiteralPath $questsRs2)) {
    throw "quests.rs2 not found: $questsRs2"
}

# folder name (after quest_) -> questlist component name
$quests = [ordered]@{
    agrith         = 'agrith'
    deal           = 'deal'
    dwarfrock      = 'dwarfrock'
    elid           = 'elid'
    fenkenstrain   = 'creatureoffenkenstrain'
    feud           = 'feud'
    forget         = 'forget'
    garden         = 'garden'
    giantdwarf     = 'giantdwarf'
    handsand       = 'handsand'
    hauntedmine    = 'hauntedmine'
    ics            = 'ics_little'
    losttribe      = 'lost_tribe'
    makinghistory  = 'makinghistory'
    mdaughter      = 'mdaughter'
    mortton        = 'mortton'
    myreque        = 'routequest'
    osf            = 'onesmallfavour'
    rag            = 'rag'
    soulbane       = 'soulbane'
    swansong       = 'swansong'
    tog            = 'tog'
    twocats        = 'twocats'
    wanted         = 'wanted'
    zogre          = 'zogre'
}

$registry = Get-Content -LiteralPath $questsRs2 -Raw

# One pass over every .rs2 file to find journal button handlers.
Write-Host 'Scanning scripts for journal handlers (can take a minute)...'
$journal = @{}
Get-ChildItem -LiteralPath $scripts -Recurse -File -Filter *.rs2 |
    Select-String -Pattern '^\[if_button,questlist:([A-Za-z0-9_]+)\]' |
    ForEach-Object { $journal[$_.Matches[0].Groups[1].Value] = $true }

$rows = foreach ($folder in $quests.Keys) {
    $key = $quests[$folder]
    $present = Test-Path -LiteralPath (Join-Path $scripts "quests\quest_$folder")
    $needle = [regex]::Escape("send_quest_progress_colour(questlist:$key,")
    $regCount = [regex]::Matches($registry, $needle).Count
    $hasJournal = $journal.ContainsKey($key)

    if (-not $present)        { $status = 'NOT IN LIVE CONTENT' }
    elseif ($regCount -eq 0)  { $status = 'NOT IN QUEST LIST' }
    elseif ($regCount -gt 1)  { $status = 'REGISTERED TWICE' }
    elseif (-not $hasJournal) { $status = 'NO JOURNAL HANDLER' }
    else                      { $status = 'OK' }

    [pscustomobject]@{
        Quest      = $folder
        Folder     = $present
        Registered = $regCount
        Journal    = $hasJournal
        Status     = $status
    }
}

$rows | Format-Table -AutoSize

$bad = @($rows | Where-Object { $_.Status -ne 'OK' })
if ($bad.Count -eq 0) {
    Write-Host 'All 25 quests are present, registered once and have a journal handler.' -ForegroundColor Green
} else {
    Write-Host ("{0} quest(s) need attention:" -f $bad.Count) -ForegroundColor Yellow
    $bad | ForEach-Object { Write-Host ("  {0}: {1}" -f $_.Quest, $_.Status) }
}
Write-Host 'Read-only check. Registered quests still need a rebuild and server restart to show in game.'
