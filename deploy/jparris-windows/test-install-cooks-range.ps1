# Source-only, no real accounts: test the default Cook installer preflight in a disposable
# synthetic runtime. The apply path is tested by native compile on Linux CI.
$ErrorActionPreference='Stop'
$repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$runtime=Join-Path $repo 'runtime\jparris-377'
$active=Join-Path $runtime 'active.json'
if(Test-Path -LiteralPath $active) { throw 'Refusing to overwrite existing active.json during synthetic test.' }
$fixture=Join-Path $runtime 'ci-cooks-range-fixture'
if(Test-Path -LiteralPath $fixture) { throw 'Refusing to overwrite existing fixture.' }
$contentDir=Join-Path $fixture 'content'
$engine=Join-Path $fixture 'engine'
$quest=Join-Path $contentDir 'scripts\quests\quest_cook\scripts\quest_cook.rs2'
$cooking=Join-Path $contentDir 'scripts\skill_cooking\scripts\cooking.rs2'
New-Item -ItemType Directory -Path (Split-Path -Parent $quest) -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $cooking) -Force | Out-Null
New-Item -ItemType Directory -Path $engine -Force | Out-Null
$original=@'
[oplocu,cooksquestrange]
if (%cookquest < ^cook_complete) {
    return;
} else {
    //TODO 377 enable Lumbridge range after cooking is ported
    //@attempt_cook_item(last_useitem);
}
'@
$generic=@'
[label,attempt_cook_item](obj $uncooked_item)
if (loc_type = cooksquestrange) { mes("Cook success modifier."); }
'@
$installer=Join-Path $PSScriptRoot 'Install-CooksRange377.ps1'
try {
    [IO.File]::WriteAllText($quest,$original,[Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllText($cooking,$generic,[Text.UTF8Encoding]::new($false))
    @{engine=$engine;content=$contentDir;gamePort=52402;webPort=8888} |
        ConvertTo-Json | Set-Content -LiteralPath $active -Encoding UTF8
    $before=(Get-FileHash -LiteralPath $quest -Algorithm SHA256).Hash
    $result=(& $installer | Out-String)
    if($result -notmatch 'RANGE_NEEDS_PATCH: True' -or
       $result -notmatch 'SUPPORT_NPCS_MISSING: 2' -or
       $result -notmatch 'PREFLIGHT_OK: READ ONLY') {
        throw "Unexpected Cook installer preflight: $result"
    }
    $after=(Get-FileHash -LiteralPath $quest -Algorithm SHA256).Hash
    if($after -ne $before) { throw 'Preflight mutated source unexpectedly.' }
    $added=@(Get-ChildItem -LiteralPath $contentDir -Recurse -Filter 'joshrs_cook_*.rs2' -File)
    if($added.Count -ne 0) { throw 'Preflight created NPC scripts without permission.' }
    Write-Host 'COOK_INSTALLER_DISPOSABLE_PREFLIGHT_PASSED'
} finally {
    if(Test-Path -LiteralPath $active) { Remove-Item -LiteralPath $active -Force }
    if(Test-Path -LiteralPath $fixture) { Remove-Item -LiteralPath $fixture -Recurse -Force }
}
