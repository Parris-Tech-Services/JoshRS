@echo off
setlocal
cd /d "%~dp0"
echo Checking the selected PRIVATE JoshRS revision-377 world...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-Barcrawl377.ps1"
if errorlevel 1 (
  echo PREFLIGHT FAILED: no source files were changed.
  pause
  exit /b 1
)
echo.
echo The game server and ALL players must be stopped before applying.
choice /M "Apply the Barcrawl fixes, backing up and compiling the selected world"
if errorlevel 2 exit /b 0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-Barcrawl377.ps1" -Apply
if errorlevel 1 (
  echo Barcrawl compilation or installation failed. Review the output above.
) else (
  echo Installer finished. Check the actual game before calling the miniquest verified.
)
pause
