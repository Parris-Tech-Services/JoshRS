# Patch only Luna's native playtime restore in the custom JParrisDesktop engine.
# Default: read-only. -Apply requires a stopped world and verified offline save+DB backup.
[CmdletBinding()]
param([string]$RepoRoot='C:\JoshRS-Launcher\JoshRS-main',[switch]$Apply)
$ErrorActionPreference='Stop'

function Get-SourceState([string]$Text) {
    if (-not $Text.Contains('class BotPlayer extends Player') -or
        -not $Text.Contains('constructor(username: string, username37: bigint, hash64: bigint, saved?: Player')) {
        return 'UNKNOWN_LOCAL_SOURCE'
    }
    $start=$Text.IndexOf('constructor(username: string, username37: bigint, hash64: bigint, saved?: Player')
    $end=$Text.IndexOf('this.ensureCompanionSupplies();',$start)
    if($end -le $start){return 'UNKNOWN_LOCAL_SOURCE'}
    $ctor=$Text.Substring($start,$end-$start)
    if([regex]::IsMatch($ctor,'(?m)^[ \t]*this\.playtime\s*=\s*saved\.playtime;[ \t]*$')){
        return 'ALREADY_PATCHED'
    }
    $anchor='(?m)^(?<indent>[ \t]*)if \(saved\) \{\r?\n(?<inner>[ \t]*)this\.stats\.set\(saved\.stats\);[ \t]*$'
    if([regex]::Matches($ctor,$anchor).Count -eq 1 -and
       [regex]::Matches($Text,$anchor).Count -eq 1) {return 'PATCHABLE'}
    return 'UNKNOWN_LOCAL_SOURCE'
}

function Test-Port([int]$Port){
    if($Port -lt 1 -or $Port -gt 65535){throw 'Invalid game port in configuration'}
    $client=New-Object Net.Sockets.TcpClient
    try {
        $request=$client.BeginConnect('127.0.0.1',$Port,$null,$null)
        if(-not $request.AsyncWaitHandle.WaitOne(350)){return $false}
        $client.EndConnect($request)
        return $true
    } catch {return $false} finally {$client.Dispose()}
}
function Assert-Stopped([string]$Engine,[int[]]$Ports){
    foreach($port in $Ports){
        if(Test-Port $port){throw "World port $port is still responding. Log out and stop the JoshRS server first. No files changed."}
    }
    $processes=@(Get-CimInstance Win32_Process -ErrorAction Stop |
      Where-Object {
        $_.Name -eq 'node.exe' -and $_.CommandLine -and
        $_.CommandLine.IndexOf($Engine,[StringComparison]::OrdinalIgnoreCase) -ge 0
      })
    if($processes.Count){throw 'Engine Node.js process is still running. No files changed.'}
}
function Read-Source([string]$Path){
    $raw=[IO.File]::ReadAllBytes($Path)
    $bom=$raw.Length -ge 3 -and $raw[0] -eq 239 -and $raw[1] -eq 187 -and $raw[2] -eq 191
    $offset=if($bom){3}else{0}
    $encoding=[System.Text.UTF8Encoding]::new($false,$true)
    $text=$encoding.GetString($raw,$offset,$raw.Length-$offset)
    return [pscustomobject]@{Text=$text;Bom=$bom}
}
function Write-Source([string]$Path,[string]$Text,[bool]$Bom){
    $encoding=[System.Text.UTF8Encoding]::new($Bom)
    [IO.File]::WriteAllText($Path,$Text,$encoding)
}

$root=(Resolve-Path -LiteralPath $RepoRoot -ErrorAction Stop).Path
$runtime=(Resolve-Path -LiteralPath (Join-Path $root 'runtime\jparris-377') -ErrorAction Stop).Path
$state=Get-Content -LiteralPath (Join-Path $runtime 'active.json') -Raw | ConvertFrom-Json
$engine=(Resolve-Path -LiteralPath ([string]$state.engine) -ErrorAction Stop).Path
if(-not $engine.StartsWith($runtime+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){
    throw 'Active engine is outside private runtime. No changes made.'
}
$target=Join-Path $engine 'src\engine\entity\BotPlayer.ts'
if(-not (Test-Path -LiteralPath $target -PathType Leaf)){throw 'Local Luna bot source not found.'}
$oldHash=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
$source=Read-Source $target
$status=Get-SourceState $source.Text
Write-Host "Luna source: $target"
Write-Host "SHA-256: $oldHash"
Write-Host "Status: $status"
if(-not $Apply){
    Write-Host 'READ_ONLY: No account, save, world, bot or source changed.'
    if($status -eq 'PATCHABLE'){Write-Host 'Eligible for one-line patch after graceful server shutdown and verified cold backup.'}
    if($status -eq 'UNKNOWN_LOCAL_SOURCE'){Write-Warning 'Custom source differs from the guarded pattern. Refusing automatic source edits.'}
    return
}
if($status -eq 'ALREADY_PATCHED'){Write-Host 'ALREADY_PATCHED: No files changed.';return}
if($status -ne 'PATCHABLE'){throw 'BLOCKED: Unknown local source. No files changed.'}
$ports=@([int]$state.gamePort,[int]$state.webPort,43500,43501,45099)
Assert-Stopped $engine $ports
$save=Join-Path $engine 'data\players\main\Luna.sav'
$validator=Join-Path $root 'tools\rs377-saves\inspect-save.mjs'
if(-not (Test-Path -LiteralPath $save -PathType Leaf) -or
   -not (Test-Path -LiteralPath $validator -PathType Leaf)){
    throw 'Cannot find Luna native save or CRC verifier; refusing source update.'
}
$saveHash=(Get-FileHash -LiteralPath $save -Algorithm SHA256).Hash
$validText=(& node.exe $validator $save) -join [Environment]::NewLine
if($LASTEXITCODE -ne 0){throw 'Luna save CRC validation failed; refusing source update.'}
$valid=$validText | ConvertFrom-Json
if(-not $valid.valid -or $valid.version -ne 7 -or $valid.sha256 -ne $saveHash){
    throw 'Luna save validation mismatch. No source changed.'
}
Write-Host "Luna save verified: version $($valid.version), playtime $($valid.playtimeTicks) ticks."
$protector=Join-Path $root 'deploy\jparris-windows\Protect-Elrothiro.ps1'
if(-not (Test-Path -LiteralPath $protector -PathType Leaf)){throw 'Verified offline backup helper unavailable.'}
& $protector -RepoRoot $root -CreateBackup
if((Get-FileHash -LiteralPath $save -Algorithm SHA256).Hash -ne $saveHash){
    throw 'Luna save changed while backing up. Refusing source edit.'
}
Assert-Stopped $engine $ports
if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $oldHash){
    throw 'Bot source changed during backup. Refusing source edit.'
}
$pattern='(?m)^(?<indent>[ \t]*)if \(saved\) \{(?<nl>\r?\n)(?<inner>[ \t]*)this\.stats\.set\(saved\.stats\);[ \t]*$'
$matches=[regex]::Matches($source.Text,$pattern)
if($matches.Count -ne 1){throw 'Bot source changed or unexpected saved constructor. Refusing edit.'}
$match=$matches[0]
$nl=$match.Groups['nl'].Value
$inner=$match.Groups['inner'].Value
$replacement=$match.Value.Replace($inner+'this.stats.set(saved.stats);',
    $inner+'this.playtime = saved.playtime;'+$nl+$inner+'this.stats.set(saved.stats);')
$patched=$source.Text.Substring(0,$match.Index)+$replacement+$source.Text.Substring($match.Index+$match.Length)
if((Get-SourceState $patched) -ne 'ALREADY_PATCHED'){throw 'Patch verification failed. No source changed.'}
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss-fffffff'
$recovery=Join-Path $runtime ('source-recovery\luna-'+$stamp)
New-Item -ItemType Directory -Path $recovery -Force -ErrorAction Stop | Out-Null
$previous=Join-Path $recovery 'BotPlayer.previous.ts'
$stage=Join-Path $recovery 'BotPlayer.patched.ts'
Copy-Item -LiteralPath $target -Destination $previous -ErrorAction Stop
Write-Source $stage $patched $source.Bom
if((Get-FileHash -LiteralPath $previous -Algorithm SHA256).Hash -ne $oldHash -or
   (Get-SourceState (Read-Source $stage).Text) -ne 'ALREADY_PATCHED'){
    throw 'Staged source or rollback backup invalid. No engine source changed.'
}
Assert-Stopped $engine $ports
if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $oldHash){
    throw 'Bot source changed after staging. No engine source changed.'
}
$swapBackup=Join-Path $recovery 'BotPlayer.atomic-previous.ts'
[IO.File]::Replace($stage,$target,$swapBackup)
if((Get-SourceState (Read-Source $target).Text) -ne 'ALREADY_PATCHED'){
    throw "Post-install source verification failed. Original backed up at $previous. Do not start server."
}
Write-Host 'PATCHED_SOURCE: Luna native playtime restoration present.'
Write-Host "ROLLBACK_SOURCE: $previous"
Write-Host 'All player/account files preserved in the verified offline backup. No server started.'
Write-Host 'Restart normally, then verify Luna autosaves persist without a new warning.'
