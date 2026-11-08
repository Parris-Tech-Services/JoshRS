@echo off
setlocal EnableExtensions DisableDelayedExpansion
title JoshRS - Install full pinned RS-SDK
echo ==============================================================
echo   JoshRS - Full original RS-SDK installation (isolated only)
echo   No family game files or player saves are modified.
echo   This window will stay open to show the result.
echo ==============================================================
echo.
set "ROOT=%~dp0"
if not exist "%ROOT%runtime\jparris-377\active.json" set "ROOT=C:\JoshRS-Launcher\JoshRS-main\"
if not exist "%ROOT%runtime\jparris-377\active.json" goto :missingworld
set "SCRIPT=%ROOT%deploy\jparris-windows\Install-RSSDK377.ps1"
echo Existing JoshRS world: %ROOT%
if exist "%SCRIPT%" goto :preflight
echo Installer helper not found in your checkout. Downloading exact reviewed revision.
if not exist "%ROOT%deploy\jparris-windows\" goto :missingfolder
where git.exe >nul 2>&1
if errorlevel 1 goto :missinggit
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/53fdc137e7f9f2fc96ecc5afd659f1b9412fc8e2/deploy/jparris-windows/Install-RSSDK377.ps1' -OutFile '%SCRIPT%.download'"
if errorlevel 1 goto :downloadfailed
if not exist "%SCRIPT%.download" goto :downloadfailed
for /f %%H in ('git hash-object "%SCRIPT%.download"') do set "DOWNLOADED_SHA=%%H"
if /i not "%DOWNLOADED_SHA%"=="a7fcbdfc7736c502bb1fa0fe3fd1afb3c0048678" goto :hashfailed
if exist "%SCRIPT%" goto :race
move "%SCRIPT%.download" "%SCRIPT%" >nul
if errorlevel 1 goto :downloadfailed
echo VERIFIED: pinned PowerShell helper matched exact Git blob.
:preflight
echo.
echo [1/2] Checking SDK installation prerequisites (read-only).
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Root "%ROOT%" -CheckOnly
if errorlevel 1 goto :failed
echo.
echo The complete source is installed separately in a private runtime folder.
echo It will NOT run against Elrothiro or the active family game.
choice /C YN /M "Install pinned original RS-SDK and its dependencies now"
if errorlevel 2 goto :cancelled
echo.
echo [2/2] Installing and checking the complete upstream SDK.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Root "%ROOT%"
if errorlevel 1 goto :failed
echo.
echo SUCCESS: The full RS-SDK dependency is installed.
echo No bot was started. The isolated 377 game adapter must be running first.
set "RESULT=0"
goto :finish
:missingworld
echo ERROR: Existing private JoshRS installation not found.
echo Expected C:\JoshRS-Launcher\JoshRS-main\runtime\jparris-377\active.json
set "RESULT=1"
goto :finish
:missingfolder
echo ERROR: Missing deploy\jparris-windows folder. Full JoshRS installation required.
set "RESULT=1"
goto :finish
:missinggit
echo ERROR: Git for Windows is needed to verify the exact source checksum.
echo No SDK or game files were changed.
set "RESULT=1"
goto :finish
:hashfailed
echo ERROR: Downloaded installer checksum differs from reviewed source.
goto :cleanupfailure
:race
echo ERROR: Installer appeared during download; refusing to overwrite it.
goto :cleanupfailure
:downloadfailed
echo ERROR: Could not download pinned installer; no game files changed.
:cleanupfailure
if exist "%SCRIPT%.download" del /q "%SCRIPT%.download"
set "RESULT=1"
goto :finish
:failed
echo ERROR: Installation stopped. Read details above; preserve the game runtime.
set "RESULT=1"
goto :finish
:cancelled
echo Cancelled; no installation requested.
set "RESULT=0"
:finish
echo.
echo ==============================================================
echo Exit status: %RESULT%
echo Press any key to close this window.
echo ==============================================================
pause >nul
endlocal & exit /b %RESULT%
