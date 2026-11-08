@echo off
setlocal
cd /d "%~dp0"
echo Cook's Assistant - revision-377 safe repair preflight
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-CooksRange377.ps1"
if errorlevel 1 (
  echo PRECHECK FAILED. No files were changed.
  pause
  exit /b 1
)
echo.
echo ALL players must log out and the JoshRS game server must be fully stopped.
echo This installer backs up family saves and the native compiled pack first.
choice /M "Apply Cook special range and missing Millie/Gillie guidance to selected private Windows 377 world"
if errorlevel 2 exit /b 0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Install-CooksRange377.ps1" -Apply
if errorlevel 1 (
  echo INSTALL OR BUILD FAILED. Source/pack rollback attempted; read error output.
) else (
  echo Installer finished. Reopen JoshRS and test the range and NPCs.
  echo This does NOT count as a completed real-player quest test.
)
pause
