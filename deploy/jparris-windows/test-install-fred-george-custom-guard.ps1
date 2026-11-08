# Synthetic Windows PowerShell 5.1 regression; never touches an actual game.
$ErrorActionPreference='Stop'
$tool=Join-Path $PSScriptRoot 'Install-FredGeorgeRelogFix.ps1'
$root=Join-Path ([IO.Path]::GetTempPath()) ('joshrs-custom-guard-'+[guid]::NewGuid().ToString('N'))
$runtime=Join-Path $root 'runtime\jparris-377'
$engine=Join-Path $runtime 'fixture\engine'
$bot=Join-Path $engine 'src\engine\bot\FredGeorgeBot.ts'
$save=Join-Path $engine 'data\players\main\elrothiro.sav'
function Assert([bool]$ok,[string]$why){if(-not $ok){throw $why}}
try {
    foreach($dir in @((Split-Path -Parent $bot),(Split-Path -Parent $save))){
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    @{engine=$engine;gamePort=52402;webPort=8888} | ConvertTo-Json -Compress |
        Set-Content -LiteralPath (Join-Path $runtime 'active.json') -Encoding UTF8
    [IO.File]::WriteAllBytes($save,[byte[]]@(7,11,23,47))
    $saveHash=(Get-FileHash $save -Algorithm SHA256).Hash

    # Matches the exact locally installed one-line fix; deliberate other customisations.
    $safe=@'
export function customFredGeorge() {
    // Important personal custom logic must never be overwritten
    if (!stillInWorld && !world.logoutRequests.has(player?.username ?? name.toLowerCase())) {
        spawnSingleBot(world, name);
    }
}
'@
    [IO.File]::WriteAllText($bot,$safe)
    $safeHash=(Get-FileHash $bot -Algorithm SHA256).Hash
    $dry=(& $tool -RepoRoot $root 6>&1 | Out-String)
    Assert ($dry -match 'TARGETED_FIX_PRESENT_CUSTOM_SOURCE') 'Existing local targeted guard was not recognised'
    Assert ($dry -match 'No full-source replacement needed') 'Custom source not preserved in dry-run messaging'
    Assert ((Get-FileHash $bot -Algorithm SHA256).Hash -eq $safeHash) 'Read-only detection changed custom source'
    $apply=(& $tool -RepoRoot $root -Apply 6>&1 | Out-String)
    Assert ($apply -match 'NO_CHANGE: Targeted relog guard') 'Apply should no-op when targeted fix is already installed'
    Assert ((Get-FileHash $bot -Algorithm SHA256).Hash -eq $safeHash) 'Apply overwrote the customised source'
    Assert ((Get-FileHash $save -Algorithm SHA256).Hash -eq $saveHash) 'Apply changed a player save'

    # A different unknown custom engine must continue to FAIL CLOSED.
    $unknown=$safe.Replace('player?.username ?? name.toLowerCase()','name')
    [IO.File]::WriteAllText($bot,$unknown)
    $unknownHash=(Get-FileHash $bot -Algorithm SHA256).Hash
    $probe=(& $tool -RepoRoot $root 6>&1 | Out-String)
    Assert ($probe -match 'UNKNOWN_LOCAL_CUSTOMISATIONS') 'Unknown source incorrectly approved'
    $blocked=$false
    try { & $tool -RepoRoot $root -Apply 6>&1 | Out-Null } catch { $blocked=$true }
    Assert $blocked 'Unknown custom engine was not rejected'
    Assert ((Get-FileHash $bot -Algorithm SHA256).Hash -eq $unknownHash) 'Rejected update changed custom source'
    Assert ((Get-FileHash $save -Algorithm SHA256).Hash -eq $saveHash) 'Rejected update changed player save'
    Write-Host 'PASS: recognises existing local relog guard; preserves custom source and all saves; refuses unknown source.'
} finally {
    if(Test-Path -LiteralPath $root){Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue}
}
