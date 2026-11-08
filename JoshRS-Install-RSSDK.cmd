@echo off
setlocal EnableExtensions DisableDelayedExpansion
title JoshRS - Install full pinned RS-SDK
echo ==============================================================
echo  JoshRS - Full original RS-SDK installation (isolated only)
echo  Does NOT replace JoshRS or modify family player saves.
echo ==============================================================
echo.
set "ROOT=%~dp0"
if not exist "%ROOT%runtime\jparris-377\active.json" set "ROOT=C:\JoshRS-Launcher\JoshRS-main\"
if not exist "%ROOT%runtime\jparris-377\active.json" goto :missing
set "SCRIPT=%ROOT%deploy\jparris-windows\Install-RSSDK377.ps1"
if not exist "%SCRIPT%" goto :noscript
echo Checking pinned SDK prerequisites...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Root "%ROOT%" -CheckOnly
if errorlevel 1 goto :failure
echo.
choice /C YN /M "Install complete upstream SDK in an isolated private folder"
if errorlevel 2 goto :cancel
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Root "%ROOT%"
if errorlevel 1 goto :failure
echo.
echo SDK SOURCE INSTALLED. No bot was connected or started.
echo An isolated native-377 gateway must be configured before real bots.
set "RESULT=0"
goto :end
:missing
echo ERROR: JoshRS runtime not found. No changes were made.
set "RESULT=1"
goto :end
:noscript
echo ERROR: JoshRS checkout does not yet contain Install-RSSDK377.ps1.
echo Update the source from GitHub first. Do NOT replace your runtime folder.
set "RESULT=1"
goto :end
:failure
echo ERROR: Setup did not complete. See the details above.
echo Do not delete your JoshRS installation or private runtime.
set "RESULT=1"
goto :end
:cancel
echo Cancelled with no changes.
set "RESULT=0"
:end
echo.
echo Exit status: %RESULT% - Press any key to close.
pause >nul
endlocal & exit /b %RESULT%
