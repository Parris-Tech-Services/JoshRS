@echo off
setlocal
cd /d "%~dp0"
echo JoshRS Windows 377 — bundled updates for your existing game
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Apply-WindowsGameUpdates.ps1"
if errorlevel 1 (
  echo Update preflight could not finish. Nothing has been changed.
  pause
  exit /b 1
)
echo.
choice /M "Install compatible updates in this local game (all players MUST have logged out)"
if errorlevel 2 exit /b 0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Apply-WindowsGameUpdates.ps1" -Apply
if errorlevel 1 (
  echo One or more updates failed. Do not start the game until reviewed.
  pause
  exit /b 1
)
echo.
echo Update checks finished. See BLOCKED warnings for any custom scripts needing review.
echo Start JoshRS normally and verify gameplay in the real Java client.
pause
