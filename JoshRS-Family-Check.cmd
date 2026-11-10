@echo off
setlocal
cd /d "%~dp0"
echo JoshRS revision 377: live family status (READ ONLY)
echo No game services, player saves or content will be changed.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Check-Family-Status.ps1"
if errorlevel 1 (
    echo.
    echo Status check failed. The game has not been changed by this command.
    pause
    exit /b 1
)
echo.
pause
