@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Start-JoshRSAgentManager.ps1"
exit /b %ERRORLEVEL%
