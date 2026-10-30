$ErrorActionPreference = 'Stop'
# Load real helper definitions without executing installation or showing UI.
$tokens = $null; $errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'setup.ps1'), [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw ($errors | Out-String) }
$functions = $ast.FindAll({ param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] }, $false)
foreach ($function in $functions) {
    . ([scriptblock]::Create($function.Extent.Text))
}
$fixture = Join-Path $env:TEMP ('JoshRS test ' + [guid]::NewGuid())
try {
    $source = Join-Path $fixture 'USB copy\JoshRS\lostcity377'
    foreach ($folder in @('engine\src\engine','engine\data\players\main','content\scripts','engine\node_modules')) {
        New-Item -ItemType Directory -Path (Join-Path $source $folder) -Force | Out-Null
    }
    foreach ($file in @('engine\package.json','engine\src\app.ts','engine\src\engine\World.ts','engine\data\players\main\elrothiro.sav','engine\db.sqlite','engine\db.sqlite-wal')) {
        Set-Content -LiteralPath (Join-Path $source $file) -Value 'synthetic fixture only'
    }
    Set-Content -LiteralPath (Join-Path $source 'engine\node_modules\linux-only.txt') -Value 'excluded'
    $found = Find-UsbGame (Join-Path $fixture 'USB copy')
    if ($found -ne $source) { throw 'Nested USB detection failed' }
    Validate-Game (Join-Path $source 'engine') (Join-Path $source 'content')
    $destination = Join-Path $fixture 'installed copy'
    Copy-UsbFolder $source $destination
    foreach ($file in @('engine\data\players\main\elrothiro.sav','engine\db.sqlite','engine\db.sqlite-wal')) {
        if ((Get-FileHash (Join-Path $source $file)).Hash -ne (Get-FileHash (Join-Path $destination $file)).Hash) { throw "Copy changed $file" }
    }
    if (Test-Path (Join-Path $destination 'engine\node_modules')) { throw 'Linux dependencies copied' }
    Remove-Item -LiteralPath (Join-Path $destination 'engine\src\app.ts')
    $rejected = $false
    try { Validate-Game (Join-Path $destination 'engine') (Join-Path $destination 'content') } catch { $rejected = $true }
    if (-not $rejected) { throw 'Incomplete USB accepted' }
    Write-Host 'PASS: nested folders with spaces, byte-identical save/database copying, dependency exclusion, incomplete-copy rejection.'
} finally { Remove-Item -LiteralPath $fixture -Recurse -Force -ErrorAction SilentlyContinue }
