@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\fix-java-client-launch.ps1" -Apply
if errorlevel 1 (
  echo.
  echo Java client launch was NOT repaired. Review the message above.
  pause
  exit /b 1
)
echo.
echo Launcher repaired. Open your existing Play JoshRS desktop shortcut.
pause
exit /b 0
