@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0runtime\jparris-377\active.json" (
  call "%~dp0jparris-setup.cmd"
  exit /b
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\play.ps1"
if errorlevel 1 (
  echo.
  echo Could not open the game. Read the error above.
  pause
  exit /b 1
)
exit /b 0
