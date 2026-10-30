@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\play.ps1"
if errorlevel 1 (
  echo.
  echo Could not open the game. Read the error above.
  pause
  exit /b 1
)
echo Client and server windows opened, or existing world detected.
pause
