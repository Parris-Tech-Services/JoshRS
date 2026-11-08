@echo off
setlocal EnableExtensions DisableDelayedExpansion
title JoshRS 377 - Barcrawl repair (guarded original checks)
echo ==================================================================
echo   JoshRS 377 Barcrawl repair
echo   This launcher never changes a running game or your player saves.
echo ==================================================================
echo.
set "ROOT=%~dp0"
if not exist "%ROOT%runtime\jparris-377\active.json" set "ROOT=C:\JoshRS-Launcher\JoshRS-main\"
if not exist "%ROOT%runtime\jparris-377\active.json" goto :missingworld
set "INSTALLER=%ROOT%deploy\jparris-windows\Install-Barcrawl377.ps1"
echo Existing world: %ROOT%
echo.
echo Checking whether your separate game server is still running...
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$p=@(Get-NetTCPConnection -State Listen -LocalPort 52402,8888 -ErrorAction SilentlyContinue); if($p.Count) { Write-Host 'SERVER_STILL_RUNNING - stop the separate JoshRS server window using Ctrl+C.'; $p | Select-Object LocalPort,OwningProcess | Format-Table; exit 2 }; Write-Host 'OFFLINE_PORT_CHECK_OK'"
if errorlevel 1 goto :serverrunning
echo.
if not exist "%INSTALLER%" goto :getinstaller
goto :preflight
:getinstaller
echo Installer PowerShell script missing. Downloading pinned original guarded version.
if not exist "%ROOT%deploy\jparris-windows\" goto :missingfolder
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/f5ab3de4447bb4cae7ac7297fcacfad8383da678/deploy/jparris-windows/Install-Barcrawl377.ps1' -OutFile '%INSTALLER%.download'; Move-Item -LiteralPath '%INSTALLER%.download' -Destination '%INSTALLER%' -ErrorAction Stop"
if errorlevel 1 goto :downloadfailed
if not exist "%INSTALLER%" goto :downloadfailed
:preflight
echo [1/2] Checking the exact existing Barcrawl source anchors without changes...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%"
if errorlevel 1 goto :preflightfailed
echo.
echo Read-only preflight passed. Everyone must be logged out and the server OFF.
echo The existing original client CRC rules remain in effect.
echo This launcher does not add a broad NPC checksum bypass.
echo.
choice /C YN /M "Apply Barcrawl patch with verified family backups and native compilation"
if errorlevel 2 goto :cancelled
echo.
echo [2/2] Creating verified backup and compiling the selected custom world...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%" -Apply
if errorlevel 1 goto :applyfailed
echo.
echo INSTALLER RETURNED SUCCESS. Inspect the preceding output.
echo This is not yet an in-game ten-bar/relog playtest.
set "RESULT=0"
goto :finish
:serverrunning
echo.
echo BLOCKED: One or both JoshRS server ports are listening.
echo Find the separate game-server PowerShell or Command Prompt window.
echo Log out players and press Ctrl+C in that server window.
echo Wait for the server to close. Do NOT force-kill Node processes.
echo No installer was run and no files were changed.
set "RESULT=2"
goto :finish
:missingworld
echo ERROR: Private JoshRS runtime not found.
echo Expected C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json
set "RESULT=1"
goto :finish
:missingfolder
echo ERROR: Missing deploy\jparris-windows folder in the installed launcher.
set "RESULT=1"
goto :finish
:downloadfailed
echo ERROR: Unable to obtain the pinned installer file. No game changes made.
set "RESULT=1"
goto :finish
:preflightfailed
echo ERROR: Read-only preflight failed. No content changes made.
set "RESULT=1"
goto :finish
:applyfailed
echo ERROR: Installation or build failed. Inspect rollback status above.
echo If rollback was not confirmed, DO NOT restart JoshRS.
set "RESULT=1"
goto :finish
:cancelled
echo Cancelled. No installation changes made.
set "RESULT=0"
:finish
echo.
echo ==================================================================
echo Exit status: %RESULT%
echo Press any key to CLOSE the window.
echo ==================================================================
pause >nul
endlocal & exit /b %RESULT%
