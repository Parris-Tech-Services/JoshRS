@echo off
setlocal
cd /d "%~dp0"
echo ================================================================
echo Demon Slayer - JoshRS revision 377 repair
echo ================================================================
echo Running READ-ONLY preflight checks.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-DemonSlayer377.ps1"
if errorlevel 1 (
  echo PREFLIGHT FAILED. No game files changed.
  pause
  exit /b 1
)
echo.
echo Before installation, ALL players must log out and the game server stop.
echo This fix requires a verified family-save backup and source/pack rollback.
choice /M "Apply Demon Slayer repairs to the selected JoshRS Windows world"
if errorlevel 2 exit /b 0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-DemonSlayer377.ps1" -Apply
if errorlevel 1 (
  echo INSTALL/BUILD FAILED. Read rollback output above.
) else (
  echo Source fix installed. Reopen JoshRS and test all quest stages and relog.
  echo Native build is NOT a completed end-to-end player playtest.
)
pause
