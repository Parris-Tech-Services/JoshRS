@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\install-yrsa377.ps1" -Apply
if errorlevel 1 (
  echo Yrsa shop patch was NOT installed. Review the error above.
)
pause
