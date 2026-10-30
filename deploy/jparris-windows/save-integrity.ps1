# Source this file from protect-save.ps1 or a regression test. No side effects at import.
function Get-JoshRSBackupFiles {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Folder)
    $root=(Resolve-Path -LiteralPath $Folder -ErrorAction Stop).Path
    $list=@(Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction Stop |
        Where-Object { $_.Name -ne 'backup-info.json' -and $_.Name -ne 'integrity.json' } |
        Sort-Object FullName)
    foreach ($item in $list) {
        $relative=$item.FullName.Substring($root.Length).TrimStart([char[]]@([char]'\',[char]'/')).Replace('\','/')
        if ($relative.Contains('..') -or -not (
          $relative.StartsWith('players/') -or $relative -in @('db.sqlite','db.sqlite-wal','db.sqlite-shm')
        )) { throw 'Unexpected backup file path. Refusing to trust this snapshot.' }
        [pscustomobject]@{
            relativePath=$relative
            bytes=[long]$item.Length
            sha256=(Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256 -ErrorAction Stop).Hash
        }
    }
}
function Write-JoshRSBackupIntegrity {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$BackupPath,[Parameter(Mandatory)][string]$Engine)
    $directory=(Resolve-Path -LiteralPath $BackupPath).Path
    $target=Join-Path $directory 'integrity.json'
    if (Test-Path -LiteralPath $target) { throw 'An integrity manifest already exists. Refusing overwrite.' }
    $items=@(Get-JoshRSBackupFiles -Folder $directory)
    if ($items.Count -eq 0) { throw 'Backup contains no save files or database.' }
    $players=Join-Path $Engine 'data\players'
    foreach ($item in $items) {
        $source=if ($item.relativePath.StartsWith('players/')) {
            Join-Path $players ($item.relativePath.Substring(8).Replace('/','\'))
        } else { Join-Path $Engine $item.relativePath }
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'A source file vanished during backup; snapshot is unverified.' }
        $original=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
        if ($original -ne $item.sha256) { throw 'Backup changed during copying. Do not restore this snapshot.' }
    }
    $manifest=[ordered]@{
        version=1
        created=(Get-Date).ToUniversalTime().ToString('o')
        purpose='Private offline JoshRS 377 save snapshot; NEVER publish'
        files=@($items)
    }
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $target -Encoding UTF8
    return (Test-JoshRSBackupIntegrity -BackupPath $directory)
}
function Test-JoshRSBackupIntegrity {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$BackupPath)
    $root=(Resolve-Path -LiteralPath $BackupPath -ErrorAction Stop).Path
    $path=Join-Path $root 'integrity.json'
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw 'Backup lacks SHA-256 integrity manifest; legacy backup remains unverified.'
    }
    $manifest=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json -ErrorAction Stop
    if ($manifest.version -ne 1) { throw 'Unsupported backup integrity format.' }
    $expected=@($manifest.files)
    $actual=@(Get-JoshRSBackupFiles -Folder $root)
    if ($expected.Count -ne $actual.Count -or $expected.Count -eq 0) { throw 'Backup file count does not match manifest.' }
    $actualByPath=@{}
    foreach ($file in $actual) {
        if ($actualByPath.ContainsKey($file.relativePath)) { throw 'Duplicate backup file path.' }
        $actualByPath[$file.relativePath]=$file
    }
    foreach ($item in $expected) {
        $name=[string]$item.relativePath
        if ($name.Contains('..') -or $name.Contains(':') -or $name.StartsWith('/') -or -not $actualByPath.ContainsKey($name)) {
            throw 'Backup manifest contains unknown or unsafe file.'
        }
        $file=$actualByPath[$name]
        if ([long]$item.bytes -ne [long]$file.bytes -or [string]$item.sha256 -ne [string]$file.sha256) {
            throw 'Backup hash or size mismatch. Do not restore this snapshot.'
        }
    }
    return [pscustomobject]@{Verified=$true;FileCount=$actual.Count;ContainsElrothiro=([bool](@($actual | Where-Object {$_.relativePath -ieq 'players/main/elrothiro.sav'}).Count))}
}
