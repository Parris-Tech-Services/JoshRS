# Repairs a known Fedora-to-Windows HTTP port mismatch only in a private
# runtime copy. The original .env is saved beside it and never overwritten.
function Repair-JoshRSLocalWebPort {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$EnvFile,
        [Parameter(Mandatory)][int]$GamePort
    )
    if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw "Missing environment file: $EnvFile" }
    $expected=$GamePort - 43594 + 80
    if ($expected -lt 1 -or $expected -gt 65535) { throw "Invalid Java update port $expected for game $GamePort" }
    $original=[System.IO.File]::ReadAllText($EnvFile)
    $matches=[regex]::Matches($original, '(?m)^[ \t]*WEB_PORT[ \t]*=[ \t]*([0-9]+)[ \t]*(?:#.*)?\r?$')
    if ($matches.Count -gt 1) { throw 'Multiple WEB_PORT settings detected; refusing to guess which to change.' }
    $current=if($matches.Count -eq 1){ [int]$matches[0].Groups[1].Value } else { 80 }
    if ($current -eq $expected) { return [pscustomobject]@{Updated=$false;WebPort=$expected;BackupPath=''} }
    if ($current -ne 80) { throw "Custom WEB_PORT=$current differs from required $expected. No configuration changed." }
    $backupFile=Join-Path (Split-Path -Parent $EnvFile) ('.env.before-joshrs-windows-port-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fffffff') + '.bak')
    [System.IO.File]::Copy($EnvFile,$backupFile,$false)
    if ($matches.Count -eq 1) {
        $fixed=$original.Replace($matches[0].Value,"WEB_PORT=$expected")
    } else {
        $fixed=$original.TrimEnd([char[]]@([char]13,[char]10)) + [Environment]::NewLine + "WEB_PORT=$expected" + [Environment]::NewLine
    }
    [System.IO.File]::WriteAllText($EnvFile,$fixed,[System.Text.UTF8Encoding]::new($false))
    return [pscustomobject]@{Updated=$true;WebPort=$expected;BackupPath=$backupFile}
}
