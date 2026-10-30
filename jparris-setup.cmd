@echo off
setlocal
cd /d "%~dp0"
echo JoshRS revision 377 - JParris Desktop setup
echo.
if "%~1"=="" (
  powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\setup.ps1" -Interactive
) else (
  powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\setup.ps1" -UsbPath "%~1"
)
if errorlevel 1 (
  echo.
  echo Setup did not finish. Read the error above.
  pause
  exit /b 1
)
echo.
echo To play again, double-click jparris-play.cmd
pause
