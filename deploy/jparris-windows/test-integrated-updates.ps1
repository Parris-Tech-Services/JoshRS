# Disposable synthetic Windows world. Never reads or writes user saves.
$ErrorActionPreference='Stop'
$repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$runtime=Join-Path $repo 'runtime/jparris-377'
$active=Join-Path $runtime 'active.json'
if(Test-Path -LiteralPath $active -PathType Leaf) {
    throw 'Refusing synthetic integrated-update tests: active user world already exists.'
}
$fixture=Join-Path $runtime ('integration-test-' + [guid]::NewGuid().ToString('N'))
$engine=Join-Path $fixture 'engine'
$contentDir=Join-Path $fixture 'content'
try {
    foreach($path in @((Join-Path $engine 'src'),(Join-Path $contentDir 'scripts'))) {
        $null=New-Item -ItemType Directory -Force -Path $path
    }
    [IO.File]::WriteAllText((Join-Path $engine 'src/app.ts'),'// SYNTHETIC TEST ENGINE')
    $activeState=@{
        engine=$engine; content=$contentDir; client=(Join-Path $fixture 'client-java');
        gamePort=52402; webPort=8888; source='synthetic-test'
    }
    $activeState | ConvertTo-Json | Set-Content -LiteralPath $active -Encoding UTF8
    $tool=Join-Path $PSScriptRoot 'Apply-WindowsGameUpdates.ps1'
    $before=(Get-FileHash -LiteralPath $active -Algorithm SHA256).Hash

    # Missing quest source and unsupported environment must not invent or edit
    # gameplay, saves, SQLite or private .env on a new/unknown fixture.
    $readOnly=@(& $tool *>&1) -join [Environment]::NewLine
    if($readOnly -notmatch 'WINDOWS_GAME_UPDATES_PREFLIGHT_COMPLETE' -or
       $readOnly -notmatch 'BARCRAWL: NOT_INCLUDED' -or
       $readOnly -notmatch 'LUNA_PLAYTIME: NOT_INCLUDED'){
        throw "Read-only integrated status failed: $readOnly"
    }
    if((Get-FileHash -LiteralPath $active -Algorithm SHA256).Hash -ne $before){
        throw 'Read-only check changed active.json.'
    }
    $originalContent=@(Get-ChildItem -LiteralPath $contentDir -Recurse -File).Count
    if($originalContent -ne 0){throw 'Read-only check created content files.'}

    $apply=@(& $tool -Apply *>&1) -join [Environment]::NewLine
    if($apply -notmatch 'WINDOWS_GAME_UPDATES_COMPLETE' -or
       $apply -notmatch 'BARCRAWL: NOT_INCLUDED') {
        throw "Synthetic apply was not fail-closed: $apply"
    }
    if((Get-FileHash -LiteralPath $active -Algorithm SHA256).Hash -ne $before){
        throw 'Integrated update changed selected world identity.'
    }
    if(@(Get-ChildItem -LiteralPath $fixture -Recurse -File).Count -ne 1){
        throw 'Integrated update wrote into an unknown custom world.'
    }

    # A live port MUST block every auto-update before touching code or .env.
    $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,52402)
    try {
        $listener.Start()
        $blocked=$false
        try { & $tool -Apply | Out-Null } catch {
            if($_.Exception.Message -match 'service port is listening'){$blocked=$true}
        }
        if(-not $blocked){throw 'Live port did not block integrated update.'}
    } finally { $listener.Stop() }

    # Confirm setup and Control Center call the integrated flow rather than
    # handing users a list of separate repair scripts.
    $setup=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'setup.ps1') -Raw
    $ui=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'control-center.ps1') -Raw
    if($setup -notmatch [regex]::Escape("Apply-WindowsGameUpdates.ps1") -or
       $ui -notmatch 'UPDATE GAME / REPAIR'){
        throw 'One-click setup/UI is no longer wired to the integrated updater.'
    }
    Write-Host 'PASS: read-only status, absent-content refusal, no synthetic mutation, active-port block and one-click setup/UI wiring.'
} finally {
    Remove-Item -LiteralPath $active -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue
}
