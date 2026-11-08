@echo off
setlocal EnableExtensions DisableDelayedExpansion
title JoshRS 377 - Barcrawl repair
color 07
echo ================================================================
echo   JoshRS revision 377 - Alfred Grimhand's Barcrawl repair
 echo   This window will stay open so you can read the result.
echo ================================================================
echo.
set "ROOT=%~dp0"
if not exist "%ROOT%runtime\jparris-377\active.json" set "ROOT=C:\JoshRS-Launcher\JoshRS-main\"
if not exist "%ROOT%runtime\jparris-377\active.json" goto :missingworld
set "INSTALLER=%ROOT%deploy\jparris-windows\Install-Barcrawl377.ps1"
echo JoshRS installation: %ROOT%
echo.
if exist "%INSTALLER%" goto :preflight
echo The installer PowerShell file is missing from your JoshRS folder.
echo I can download that exact file from the JoshRS GitHub repository.
echo No game files or saves will be touched by the download.
echo.
choice /C YN /M "Download the required installer"
if errorlevel 2 goto :cancelled
if not exist "%ROOT%deploy\jparris-windows\" goto :missingfolder
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/f5ab3de4447bb4cae7ac7297fcacfad8383da678/deploy/jparris-windows/Install-Barcrawl377.ps1' -OutFile '%INSTALLER%.download'"
if errorlevel 1 goto :downloadfailed
if not exist "%INSTALLER%.download" goto :downloadfailed
move /Y "%INSTALLER%.download" "%INSTALLER%" >nul
if errorlevel 1 goto :downloadfailed
echo Installer downloaded successfully.
echo.
:preflight
echo [1/2] Running read-only checks. No game files are being changed.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%"
if errorlevel 1 goto :preflightfailed
echo.
echo PREFLIGHT PASSED.
echo Log out every JoshRS player and gracefully stop the game server
 echo before continuing. The installer will refuse to run if its ports are open.
echo.
choice /C YN /M "Apply the repair with verified family-save backups"
if errorlevel 2 goto :cancelled
echo.
echo [2/2] Backing up, applying the patch and compiling the game...
echo Please read any warnings printed here.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%" -Apply
if errorlevel 1 goto :applyfailed
echo.
echo INSTALLER FINISHED SUCCESSFULLY. Read its result above.
echo This does not verify the in-game playthrough; restart and test.
set "RESULT=0"
goto :finish
:missingworld
echo ERROR: Could not find the selected private JoshRS world.
echo Expected: C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json
 echo Put this CMD in your actual JoshRS launcher folder, or run it on
 echo the desktop that contains the existing world. No changes made.
set "RESULT=1"
goto :finish
:missingfolder
echo ERROR: Missing deploy\jparris-windows folder. Please use the full JoshRS launcher.
set "RESULT=1"
goto :finish
:downloadfailed
echo ERROR: Could not download the installer. Check your connection or use the ZIP.
set "RESULT=1"
goto :finish
:preflightfailed
echo ERROR: Read-only preflight failed. See the error above.
echo No game source files were changed by this launcher.
set "RESULT=1"
goto :finish
:applyfailed
echo ERROR: Installer reported failure. Review the error and rollback above.
echo Do not restart the game until the compiled pack is confirmed safe.
set "RESULT=1"
goto :finish
:cancelled
echo Cancelled. No game content changed by this launcher.
set "RESULT=0"
:finish
echo.
echo ================================================================
echo   Exit status: %RESULT%
echo   Press any key to CLOSE this window.
echo ================================================================
pause >nul
endlocal & exit /b %RESULT%
