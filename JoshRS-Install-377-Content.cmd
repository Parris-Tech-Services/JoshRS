@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\install-native377.ps1" -Apply
if errorlevel 1 (
  echo JoshRS content was not installed. Review the error above; backups remain local.
)
pause
