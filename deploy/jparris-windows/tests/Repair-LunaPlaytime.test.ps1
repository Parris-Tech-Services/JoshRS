$ErrorActionPreference='Stop'
$script=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\Repair-LunaPlaytime.ps1')).Path
$tokens=$null;$errors=$null
[Management.Automation.Language.Parser]::ParseFile($script,[ref]$tokens,[ref]$errors)|Out-Null
if($errors.Count){throw "PowerShell 5.1 parse failed: $($errors[0])"}
$contents=Get-Content -LiteralPath $script -Raw
foreach($guard in @('Assert-Stopped','Protect-Elrothiro.ps1','inspect-save.mjs','[IO.File]::Replace','Get-SourceState','Luna.sav','PATCHABLE','UNKNOWN_LOCAL_SOURCE')){
    if(-not $contents.Contains($guard)){throw "Missing safety guard: $guard"}
}
$root=Join-Path ([IO.Path]::GetTempPath()) ('joshrs-luna-fixture-'+[guid]::NewGuid().ToString('n'))
$engine=Join-Path $root 'runtime\jparris-377\usb-fixture\engine'
$bot=Join-Path $engine 'src\engine\entity\BotPlayer.ts'
$statePath=Join-Path $root 'runtime\jparris-377\active.json'
$source=@'
export default class BotPlayer extends Player {
    constructor(username: string, username37: bigint, hash64: bigint, saved?: Player, customMemoryPath?: string) {
        super(username, username37, hash64);
        if (saved) {
            this.stats.set(saved.stats);
        }
        this.ensureCompanionSupplies();
    }
}
'@
try{
    New-Item -ItemType Directory -Path (Split-Path $bot) -Force|Out-Null
    [IO.File]::WriteAllText($bot,$source,[Text.UTF8Encoding]::new($false))
    @{engine=$engine;gamePort=52402;webPort=8888}|ConvertTo-Json|Set-Content -LiteralPath $statePath -Encoding UTF8
    $before=(Get-FileHash -LiteralPath $bot -Algorithm SHA256).Hash
    $status=(& $script -RepoRoot $root 6>&1 2>&1 | Out-String)
    if($status -notmatch 'Status: PATCHABLE'){throw "Existing Luna missing line not recognised: $status"}
    if((Get-FileHash -LiteralPath $bot -Algorithm SHA256).Hash -ne $before){throw 'Read-only preflight modified source'}
    $failed=$false
    try{& $script -RepoRoot $root -Apply 6>&1 | Out-Null}catch{$failed=$true}
    if(-not $failed){throw 'Applied without a real Luna save and verified private backup!'}
    if((Get-FileHash -LiteralPath $bot -Algorithm SHA256).Hash -ne $before){throw 'Applied to source despite missing backup'}
    if(Test-Path -LiteralPath (Join-Path $root 'runtime\jparris-377\source-recovery')){throw 'Source recovery created despite preflight failure'}
    $patched=$source.Replace('            this.stats.set(saved.stats);',
          '            this.playtime = saved.playtime;' + [Environment]::NewLine + '            this.stats.set(saved.stats);')
    [IO.File]::WriteAllText($bot,$patched,[Text.UTF8Encoding]::new($false))
    $ready=(Get-FileHash -LiteralPath $bot -Algorithm SHA256).Hash
    $status=(& $script -RepoRoot $root 6>&1 2>&1 | Out-String)
    if($status -notmatch 'Status: ALREADY_PATCHED'){throw "Previously repaired Luna not recognised: $status"}
    & $script -RepoRoot $root -Apply 6>&1 | Out-Null
    if((Get-FileHash -LiteralPath $bot -Algorithm SHA256).Hash -ne $ready){throw 'Already patched path rewrote bot source'}
    [IO.File]::WriteAllText($bot,'// private custom BotPlayer source',[Text.UTF8Encoding]::new($false))
    $unknownHash=(Get-FileHash -LiteralPath $bot -Algorithm SHA256).Hash
    $status=(& $script -RepoRoot $root 6>&1 2>&1 | Out-String)
    if($status -notmatch 'UNKNOWN_LOCAL_SOURCE'){throw "Unknown custom source not reported: $status"}
    $failed=$false
    try{& $script -RepoRoot $root -Apply 6>&1 | Out-Null}catch{$failed=$true}
    if(-not $failed){throw 'Unknown custom source should fail closed'}
    if((Get-FileHash -LiteralPath $bot -Algorithm SHA256).Hash -ne $unknownHash){throw 'Unknown custom source was overwritten'}
    Write-Output 'PASS: Windows 5.1 Luna preflight, patched/no-op, offline guard, unknown-source refusal; no family files changed'
}finally{
    if(Test-Path -LiteralPath $root){Remove-Item -LiteralPath $root -Recurse -Force}
}
