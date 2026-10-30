[CmdletBinding()]
param([switch]$ValidateUi)

$ErrorActionPreference='Stop'
$script:RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
. (Join-Path $PSScriptRoot 'support.ps1')
. (Join-Path $PSScriptRoot 'discovery.ps1')

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

function Color([string]$hex) {
    return [System.Drawing.ColorTranslator]::FromHtml($hex)
}
function Add-Text($parent,[string]$text,[int]$x,[int]$y,[int]$w,[int]$h,[float]$size=11,
                  [bool]$heavy=$false,[string]$colour='#DFE7F5') {
    $label=[System.Windows.Forms.Label]::new()
    $label.Text=$text
    $label.Location=[System.Drawing.Point]::new($x,$y)
    $label.Size=[System.Drawing.Size]::new($w,$h)
    $label.ForeColor=Color $colour
    $style=if($heavy){[System.Drawing.FontStyle]::Bold}else{[System.Drawing.FontStyle]::Regular}
    $label.Font=[System.Drawing.Font]::new('Segoe UI',$size,$style)
    $label.AutoEllipsis=$true
    $parent.Controls.Add($label)
    return $label
}
function Add-Action($parent,[string]$text,[int]$x,[int]$y,[int]$w,[int]$h,
                    [string]$background='#24354D',[string]$foreground='#F5F9FF') {
    $button=[System.Windows.Forms.Button]::new()
    $button.Text=$text
    $button.FlatStyle=[System.Windows.Forms.FlatStyle]::Flat
    $button.FlatAppearance.BorderSize=0
    $button.Location=[System.Drawing.Point]::new($x,$y)
    $button.Size=[System.Drawing.Size]::new($w,$h)
    $button.BackColor=Color $background
    $button.ForeColor=Color $foreground
    $button.Font=[System.Drawing.Font]::new('Segoe UI',11,[System.Drawing.FontStyle]::Bold)
    $button.UseVisualStyleBackColor=$false
    $button.Cursor=[System.Windows.Forms.Cursors]::Hand
    $parent.Controls.Add($button)
    return $button
}
function Show-Note([string]$message,[string]$heading='JoshRS') {
    [void][System.Windows.Forms.MessageBox]::Show($script:Form,$message,$heading,
        [System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Information)
}
function Show-Problem([string]$message) {
    [void][System.Windows.Forms.MessageBox]::Show($script:Form,$message,'JoshRS - Action not completed',
        [System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Warning)
}
function Ask-Yes([string]$message,[string]$heading='Please confirm') {
    $answer=[System.Windows.Forms.MessageBox]::Show($script:Form,$message,$heading,
        [System.Windows.Forms.MessageBoxButtons]::YesNo,[System.Windows.Forms.MessageBoxIcon]::Question,
        [System.Windows.Forms.MessageBoxDefaultButton]::Button2)
    return ($answer -eq [System.Windows.Forms.DialogResult]::Yes)
}
function Start-GameTask([string]$file,[string]$path='') {
    $extra=if($path){' -UsbPath "'+$path+'"'}else{''}
    $arguments='-NoProfile -NoExit -ExecutionPolicy Bypass -File "'+$file+'"'+$extra
    Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WorkingDirectory $script:RepoRoot
    $script:Hint.Text='A separate Windows terminal was opened. Setup and game output appear there.'
}
function Choose-UsbGameFolder {
    $picker=[System.Windows.Forms.FolderBrowserDialog]::new()
    try {
        $picker.Description='Choose the JoshRS folder on your USB drive (or the folder containing lostcity377)'
        $picker.ShowNewFolderButton=$false
        if ($picker.ShowDialog($script:Form) -eq [System.Windows.Forms.DialogResult]::OK) {
            return $picker.SelectedPath
        }
        return ''
    } finally { $picker.Dispose() }
}
function Start-FirstRun {
    $candidates=@(Get-JoshRSUsbCandidates)
    $choice=''
    if ($candidates.Count -eq 1) {
        $candidate=$candidates[0]
        $saveStatus=if($candidate.HasElrothiroSave){'Elrothiro save found'}else{'Elrothiro save NOT found'}
        $dbStatus=if($candidate.HasDatabase){'account database found'}else{'account database NOT found'}
        $clientStatus=if($candidate.HasClient){'Java client found'}else{'an upstream Java client will be downloaded'}
        $message="Found a complete revision-377 source on a removable drive:" +
            [Environment]::NewLine + [Environment]::NewLine + $candidate.Path +
            [Environment]::NewLine + [Environment]::NewLine + $saveStatus + '; ' + $dbStatus + '; ' + $clientStatus +
            [Environment]::NewLine + [Environment]::NewLine +
            'Copy this Fedora game and set it up? The USB will not be changed.'
        if (-not (Ask-Yes $message 'Found your Fedora game')) { return }
        $choice=$candidate.Path
    } else {
        if ($candidates.Count -gt 1) {
            Show-Note 'Multiple complete game copies were found. Choose the one you want to restore in the folder picker.' 'Choose your Fedora game'
        } else {
            Show-Note 'No complete JoshRS source was found automatically on removable drives. Choose your USB backup folder manually. The clean-world installer remains a separate option.' 'Locate your Fedora game'
        }
        $choice=Choose-UsbGameFolder
    }
    if ($choice) { Start-GameTask (Join-Path $PSScriptRoot 'setup.ps1') $choice }
}
function Update-Dashboard {
    $s=Get-JoshRSStatus -RepoRoot $script:RepoRoot
    $script:Current=$s
    $ready=$s.Configured
    $running=($s.GamePortOpen -and $s.WebPortOpen)
    if (-not $ready) {
        $script:StateLabel.Text='SETUP REQUIRED'
        $script:StateLabel.ForeColor=Color '#FBC976'
        $script:DetailLabel.Text=if($s.Problem){$s.Problem}else{'Restore your Fedora USB copy or install a clean revision-377 world.'}
    } elseif($running) {
        $script:StateLabel.Text='SERVER PORTS RESPONDING'
        $script:StateLabel.ForeColor=Color '#8DE6BD'
        $script:DetailLabel.Text="Game TCP $($s.GamePort) and update HTTP $($s.WebPort) are listening locally. This does not confirm an in-game login."
    } elseif($s.GamePortOpen -or $s.WebPortOpen) {
        $script:StateLabel.Text='PARTIAL / PORT CONFLICT'
        $script:StateLabel.ForeColor=Color '#FBC976'
        $script:DetailLabel.Text="Only one expected port is responding. Check server logs before launching another world."
    } else {
        $script:StateLabel.Text='READY TO LAUNCH'
        $script:StateLabel.ForeColor=Color '#8DE6BD'
        $script:DetailLabel.Text="Installed: $($s.Source). Game $($s.GamePort), HTTP $($s.WebPort)."
    }
    $script:SaveLabel.Text="Player save files: $($s.SaveCount)    Account database: $(if($s.DatabasePresent){'found'}else{'not found'})"
    $script:StartButton.Enabled=$true
    $script:StartButton.Text=if($ready){'PLAY JOSHRS'}else{'SET UP AND PLAY'}
    $script:BackupButton.Enabled=($ready -and -not $s.GamePortOpen -and -not $s.WebPortOpen -and
        ($s.SavePresent -or $s.DatabasePresent))
    $script:CleanButton.Enabled= -not $ready
    $script:ImportButton.Enabled= -not ($s.GamePortOpen -or $s.WebPortOpen)
}

$script:Form=[System.Windows.Forms.Form]::new()
$script:Form.Text='JoshRS | JParris Desktop'
$script:Form.ClientSize=[System.Drawing.Size]::new(850,640)
$script:Form.StartPosition=[System.Windows.Forms.FormStartPosition]::CenterScreen
$script:Form.FormBorderStyle=[System.Windows.Forms.FormBorderStyle]::FixedSingle
$script:Form.MaximizeBox=$false
$script:Form.BackColor=Color '#101827'
$script:Form.ForeColor=Color '#F5F9FF'
$script:Form.Font=[System.Drawing.Font]::new('Segoe UI',10)
$script:Form.AutoScaleMode=[System.Windows.Forms.AutoScaleMode]::Dpi

[void](Add-Text $script:Form 'JoshRS' 34 23 300 48 25 $true '#F5F9FF')
[void](Add-Text $script:Form 'Your revision-377 game, on your own Windows computer' 36 74 780 28 12 $false '#A7B8D1')

$panel=[System.Windows.Forms.Panel]::new()
$panel.Location=[System.Drawing.Point]::new(34,125)
$panel.Size=[System.Drawing.Size]::new(780,125)
$panel.BackColor=Color '#1B2A40'
$script:Form.Controls.Add($panel)
[void](Add-Text $panel 'LOCAL WORLD STATUS' 18 12 300 20 9 $true '#96AFC9')
$script:StateLabel=Add-Text $panel 'CHECKING...' 18 37 730 31 17 $true '#DFE7F5'
$script:DetailLabel=Add-Text $panel '' 18 81 745 33 10 $false '#C0D1E5'

[void](Add-Text $script:Form 'GAME ACTIONS' 36 268 300 23 10 $true '#A9BBD2')
$script:StartButton=Add-Action $script:Form 'PLAY JOSHRS' 34 300 376 64 '#137B70' '#FFFFFF'
$script:ImportButton=Add-Action $script:Form 'RESTORE MY FEDORA USB GAME' 428 300 386 64 '#324764' '#FFFFFF'
$script:CleanButton=Add-Action $script:Form 'INSTALL A CLEAN 377 WORLD' 34 376 376 60 '#273D58' '#FFFFFF'
$script:BackupButton=Add-Action $script:Form 'BACK UP MY PLAYER SAVES' 428 376 386 60 '#273D58' '#FFFFFF'

[void](Add-Text $script:Form 'TOOLS & SUPPORT' 36 460 300 24 10 $true '#A9BBD2')
$refresh=Add-Action $script:Form 'Refresh status' 34 492 183 47
$diagnostics=Add-Action $script:Form 'Diagnostics' 226 492 184 47
$openFiles=Add-Action $script:Form 'Game files' 420 492 191 47
$openBackups=Add-Action $script:Form 'Backups' 620 492 194 47

$script:SaveLabel=Add-Text $script:Form '' 36 552 775 23 10 $false '#BECFE3'
$script:Hint=Add-Text $script:Form 'First run: Play looks for your Fedora USB copy. No paid hosting or WSL needed.' 36 582 779 32 10 $false '#96AFC9'

$script:StartButton.Add_Click({
    try {
        $s=Get-JoshRSStatus -RepoRoot $script:RepoRoot
        if (-not $s.Configured) {
            Start-FirstRun
        } else {
            Start-GameTask (Join-Path $PSScriptRoot 'play.ps1')
        }
    } catch { Show-Problem $_.Exception.Message }
})
$script:ImportButton.Add_Click({
    try {
        $s=Get-JoshRSStatus -RepoRoot $script:RepoRoot
        if ($s.GamePortOpen -or $s.WebPortOpen) {
            throw 'The server appears active. Gracefully stop it first, then restore your USB game.'
        }
        $path=Choose-UsbGameFolder
        if (-not $path) { return }
        $question=if($s.Configured){
            'This will install a new snapshot of your USB world and switch the active installation after setup succeeds. Existing saved worlds are kept. Continue?'
        }else{
            'Copy your Fedora JoshRS server, content, Java client and saves into a private local folder? The USB original will be kept.'
        }
        if (-not (Ask-Yes $question 'Restore Fedora world')) { return }
        Start-GameTask (Join-Path $PSScriptRoot 'setup.ps1') $path
    } catch { Show-Problem $_.Exception.Message }
})
$script:CleanButton.Add_Click({
    try {
        if (-not (Ask-Yes 'Install a NEW, clean revision-377 world? This will NOT contain your Fedora modifications or original Elrothiro progress.' 'Install clean world')) { return }
        Start-GameTask (Join-Path $PSScriptRoot 'setup.ps1')
    } catch { Show-Problem $_.Exception.Message }
})
$script:BackupButton.Add_Click({
    try {
        $folder=New-JoshRSLocalBackup -RepoRoot $script:RepoRoot
        $message='Player data has been copied to a private folder:' + [Environment]::NewLine + [Environment]::NewLine + $folder +
            [Environment]::NewLine + [Environment]::NewLine + 'Your live game files were not changed.'
        Show-Note $message 'Backup created'
        Update-Dashboard
    } catch { Show-Problem $_.Exception.Message }
})
$refresh.Add_Click({ Update-Dashboard; $script:Hint.Text='Updated from the actual local files and network listeners.' })
$diagnostics.Add_Click({
    try {
        $details=Get-JoshRSSafeDiagnostics -RepoRoot $script:RepoRoot
        [System.Windows.Forms.Clipboard]::SetText($details)
        $message='Safe diagnostics copied to clipboard (no passwords).' + [Environment]::NewLine + [Environment]::NewLine + $details
        Show-Note $message 'JoshRS diagnostics'
    } catch { Show-Problem $_.Exception.Message }
})
$openFiles.Add_Click({
    try {
        $s=Get-JoshRSStatus -RepoRoot $script:RepoRoot
        $path=if($s.Configured){$s.Engine}else{$script:RepoRoot}
        Start-Process -FilePath 'explorer.exe' -ArgumentList ('"'+$path+'"')
    } catch { Show-Problem $_.Exception.Message }
})
$openBackups.Add_Click({
    try {
        $s=Get-JoshRSStatus -RepoRoot $script:RepoRoot
        if (-not (Test-Path -LiteralPath $s.BackupRoot)) { New-Item -ItemType Directory -Path $s.BackupRoot -Force | Out-Null }
        Start-Process -FilePath 'explorer.exe' -ArgumentList ('"'+$s.BackupRoot+'"')
    } catch { Show-Problem $_.Exception.Message }
})

Update-Dashboard
if ($ValidateUi) {
    if ($script:Form.Controls.Count -lt 12) { throw 'Control center failed to create its controls.' }
    if ($script:StartButton.Text -notin @('PLAY JOSHRS','SET UP AND PLAY')) { throw 'Primary action is missing.' }
    Write-Host 'JoshRS native Windows UI constructed; primary controls present.'
    $script:Form.Dispose()
    return
}
$timer=[System.Windows.Forms.Timer]::new()
$timer.Interval=4000
$timer.Add_Tick({ Update-Dashboard })
$timer.Start()
try { [void]$script:Form.ShowDialog() }
finally { $timer.Stop(); $timer.Dispose(); $script:Form.Dispose() }
