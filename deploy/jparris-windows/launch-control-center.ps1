[CmdletBinding()]
param(
    [switch]$ValidateLauncher,
    [switch]$SimulateFailure,
    [switch]$NoDialog
)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
try {
    if ($SimulateFailure) { throw 'Synthetic dashboard launch failure for Windows CI verification.' }
    if ($ValidateLauncher) {
        & (Join-Path $PSScriptRoot 'control-center.ps1') -ValidateUi
    } else {
        & (Join-Path $PSScriptRoot 'control-center.ps1')
    }
    if (-not $?) { throw 'The desktop dashboard did not open successfully.' }
} catch {
    # The normal dashboard launcher hides its console. Report failures in a
    # visible dialog and save local details, rather than failing invisibly.
    $detail=$_.Exception.Message
    $logFile=$null
    try {
        . (Join-Path $PSScriptRoot 'support.ps1')
        $logFile=New-JoshRSLaunchLog -RepoRoot $repo -Role 'dashboard'
        @(
            'JoshRS control center launch failed.'
            ('Time: ' + (Get-Date).ToString('o'))
            ('Reason: ' + $detail)
            'Try the jparris-play.cmd terminal launcher if your game is already installed.'
        ) | Set-Content -LiteralPath $logFile -Encoding UTF8
    } catch {
        $logFile=$null
    }
    if (-not $NoDialog) {
        $text='JoshRS could not open its control center.' + [Environment]::NewLine +
            [Environment]::NewLine + $detail + [Environment]::NewLine
        if ($logFile) {
            $text += [Environment]::NewLine + 'Details saved to:' + [Environment]::NewLine + $logFile
        }
        $text += [Environment]::NewLine + [Environment]::NewLine +
            'You can still try jparris-play.cmd or jparris-setup.cmd from this folder.'
        try {
            Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
            [void][System.Windows.Forms.MessageBox]::Show(
                $text, 'JoshRS - Unable to start',
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Error
            )
        } catch {
            # Emergency fallback on hosts that cannot load WinForms.
            Write-Error $text
        }
    }
    exit 1
}
