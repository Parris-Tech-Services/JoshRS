@echo off
setlocal EnableExtensions DisableDelayedExpansion
title JoshRS 377 - Barcrawl repair (custom NPC-safe)
echo ==================================================================
echo   JoshRS 377 Barcrawl repair - custom NPC-aware build
echo   The window will stay open so you can read the full result.
echo ==================================================================
echo.
set "ROOT=%~dp0"
if not exist "%ROOT%runtime\jparris-377\active.json" set "ROOT=C:\JoshRS-Launcher\JoshRS-main\"
if not exist "%ROOT%runtime\jparris-377\active.json" goto :missingworld
set "DIR=%ROOT%deploy\jparris-windows\"
set "INSTALLER=%DIR%Install-Barcrawl377-NpcSafe.ps1"
set "NPC_CORE=%DIR%custom-npc-core.ps1"
echo Existing world: %ROOT%
if not exist "%DIR%" goto :missingfolder
echo.
echo Checking for the revised guarded installer and exact NPC helper...
if not exist "%INSTALLER%" powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/6c6af3656d34860a9d38e5d2e214b58a2bea4ebf/deploy/jparris-windows/Install-Barcrawl377-NpcSafe.ps1' -OutFile '%INSTALLER%.download'; Move-Item -LiteralPath '%INSTALLER%.download' -Destination '%INSTALLER%' -ErrorAction Stop"
if not exist "%INSTALLER%" goto :downloadfailed
if not exist "%NPC_CORE%" powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/6c6af3656d34860a9d38e5d2e214b58a2bea4ebf/deploy/jparris-windows/custom-npc-core.ps1' -OutFile '%NPC_CORE%.download'; Move-Item -LiteralPath '%NPC_CORE%.download' -Destination '%NPC_CORE%' -ErrorAction Stop"
if not exist "%NPC_CORE%" goto :downloadfailed
echo.
echo [1/2] Read-only source and custom NPC verification checks.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%"
if errorlevel 1 goto :preflightfailed
echo.
echo Preflight completed. Log out every player and stop the server gracefully.
echo This repair backs up family saves, original game content and compiled data.
echo It only exempts the legacy original NPC checksum in this imported world.
echo All other BUILD_VERIFY checks stay enabled.
echo.
choice /C YN /M "Apply guarded NPC-safe Barcrawl repair now"
if errorlevel 2 goto :cancelled
echo.
echo [2/2] Verify player backup, repair customised packer, compile Barcrawl.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%" -Apply
if errorlevel 1 goto :applyfailed
echo.
echo INSTALLER RETURNED SUCCESS. Review the output above.
echo Run the actual game and relog to validate your quest and saves.
set "RESULT=0"
goto :finish
:missingworld
echo ERROR: Existing JoshRS world not found.
echo Expected C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json
echo Nothing was changed.
set "RESULT=1"
goto :finish
:missingfolder
echo ERROR: deploy\jparris-windows folder missing. Use your existing full launcher.
set "RESULT=1"
goto :finish
:downloadfailed
echo ERROR: Could not download the revised helper. Check network and try again.
echo Original game, saves and installed old Barcrawl helper were not changed.
set "RESULT=1"
goto :finish
:preflightfailed
echo ERROR: Read-only preflight failed. See the detail above.
set "RESULT=1"
goto :finish
:applyfailed
echo ERROR: NPC-aware Barcrawl installation/build failed. Read details above.
echo If the installer reports rollback failed, DO NOT start JoshRS.
echo Keep all backups and send the exact failed checksum or build message.
set "RESULT=1"
goto :finish
:cancelled
echo Cancelled. No game changes requested.
set "RESULT=0"
:finish
echo.
echo ==================================================================
echo Exit status: %RESULT%
echo Press any key to close this window.
echo ==================================================================
pause >nul
endlocal & exit /b %RESULT%
