@echo off
setlocal
cd /d "%~dp0"
REM Opens the native JoshRS dashboard, without a persistent console window.
start "" powershell.exe -NoProfile -Sta -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\launch-control-center.ps1"
