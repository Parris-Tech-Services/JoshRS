$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'discovery.ps1')
function Assert([bool]$test, [string]$message) {
    if (-not $test) { throw "JoshRS USB discovery test failed: $message" }
}
$fixture=Join-Path $env:TEMP ('JoshRS USB detection ' + [guid]::NewGuid().ToString('N'))
try {
    $usb=Join-Path $fixture 'Removable Drive 1'
    $chosen=Join-Path $usb 'JoshRS\lostcity377'
    $engine=Join-Path $chosen 'engine'
    $content=Join-Path $chosen 'content'
    foreach($folder in @((Join-Path $engine 'src\engine'),(Join-Path $engine 'data\players\main'),(Join-Path $content 'scripts'),(Join-Path $chosen 'client-java'))) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    foreach($file in @((Join-Path $engine 'package.json'),(Join-Path $engine 'src\app.ts'),(Join-Path $engine 'src\engine\World.ts'),
       (Join-Path $engine 'data\players\main\elrothiro.sav'),(Join-Path $engine 'db.sqlite'),(Join-Path $chosen 'client-java\gradlew.bat'))) {
        Set-Content -LiteralPath $file -Value 'test fixture'
    }
    $found=@(Get-JoshRSUsbCandidates -Roots @($usb))
    Assert ($found.Count -eq 1) 'a valid nested JoshRS source must be found once'
    Assert ($found[0].Path -eq $chosen) 'choose the dedicated lostcity377 copy, not a parent'
    Assert $found[0].HasElrothiroSave 'Elrothiro progress should be noted'
    Assert $found[0].HasDatabase 'local account database should be noted'
    Assert $found[0].HasClient 'custom client presence should be noted'
    $second=Join-Path $fixture 'Removable Drive 2'
    $other=Join-Path $second 'lostcity377'
    foreach($folder in @((Join-Path $other 'engine\src\engine'),(Join-Path $other 'content\scripts'))) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    foreach($file in @('engine\package.json','engine\src\app.ts','engine\src\engine\World.ts')) {
        Set-Content -LiteralPath (Join-Path $other $file) -Value 'test fixture'
    }
    $found=@(Get-JoshRSUsbCandidates -Roots @($usb,$second))
    Assert ($found.Count -eq 2) 'multiple valid copies must remain distinguishable'
    $otherResult=@($found | Where-Object { $_.Path -eq $other })
    Assert ($otherResult.Count -eq 1) 'the second game should be found'
    Assert (-not $otherResult[0].HasElrothiroSave) 'never invent missing saves'
    Assert (-not $otherResult[0].HasClient) 'never invent missing Java client'
    Remove-Item -LiteralPath (Join-Path $other 'engine\src\app.ts')
    $found=@(Get-JoshRSUsbCandidates -Roots @($second))
    Assert ($found.Count -eq 0) 'incomplete games must be excluded'
    $found=@(Get-JoshRSUsbCandidates -Roots @((Join-Path $fixture 'nonexistent')))
    Assert ($found.Count -eq 0) 'missing drives should not throw or create content'
    Write-Host 'PASS: valid nested USB, complete source validation, missing save awareness, multiple games, and empty drive.'
} finally {
    if(Test-Path -LiteralPath $fixture){Remove-Item -LiteralPath $fixture -Recurse -Force}
}
