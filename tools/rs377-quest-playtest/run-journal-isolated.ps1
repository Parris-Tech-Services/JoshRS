$ErrorActionPreference='Stop'
$engine='C:\JoshRS-TestWorlds\family-polish-20261113\engine'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$scenario=Get-Content -LiteralPath (Join-Path $repo 'expansions\joshrs-quests\the-peace-shirt\evidence\playtest_full.json') -Raw | ConvertFrom-Json
$scenario.user='journaltest1'
$messages=@('Speak to','three balls of wool','Return to','Return to','Speak to','Tell','QUEST COMPLETE')
$steps=@(@{cheat='reload'})
foreach($step in $scenario.steps) {
    if ($step.talk -eq 'burgh_vilager_3') {
        $choices=@(1)
        if ($step.PSObject.Properties['choices']) { $choices+=@($step.choices) }
        $step | Add-Member -NotePropertyName choices -NotePropertyValue $choices -Force
    }
    $steps+=,$step
    if ($step.expectSaved -and $step.expectSaved.varp -eq 724) {
        $stage=[int]$step.expectSaved.value
        $steps+=@(@{talk='burgh_vilager_3';choices=@(2)},@{expectInLastTalk=$messages[$stage]},@{expectInLastTalk='Playing together'})
    }
}
$scenario.steps=$steps
$file=Join-Path $engine 'journal-scenario.json'
$scenario | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $file -Encoding ascii
$env:ISO_ENGINE_DIR=$engine; $env:ISO_PORT='60121'; $env:ISO_WEB_PORT='60122'; $env:ISO_PROFILE='family-polish'
$output=Join-Path $engine 'journal-playtest.txt'
& node.exe (Join-Path $PSScriptRoot 'dialogue_test.mjs') $file *> $output
$result=$LASTEXITCODE
Get-Content -LiteralPath $output | Select-String '^PASS|^FAIL|RESULT|EVIDENCE MODE|Error'
exit $result
