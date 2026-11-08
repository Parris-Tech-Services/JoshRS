@echo off
setlocal
cd /d "%~dp0"
echo ================================================================
echo Romeo & Juliet - JoshRS revision 377 repair
echo ================================================================
echo Running READ-ONLY preflight checks.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-RomeoJuliet377.ps1"
if errorlevel 1 (
  echo PREFLIGHT FAILED. No game files changed.
  pause
  exit /b 1
)
echo.
echo Before installation, ALL players must log out and the game server stop.
echo This fix requires a verified family-save backup and source/pack rollback.
choice /M "Apply Romeo & Juliet repairs to the selected JoshRS Windows world"
if errorlevel 2 exit /b 0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-RomeoJuliet377.ps1" -Apply
if errorlevel 1 (
  echo INSTALL/BUILD FAILED. Read rollback output above.
) else (
  echo Source fix installed. Reopen JoshRS and test Romeo, Juliet, quest items and relog.
  echo Native build is NOT a completed end-to-end player playtest.
)
pause
