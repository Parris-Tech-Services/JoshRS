@echo off
setlocal
title JoshRS - Protect Elrothiro
echo.
echo JoshRS verified character backup
echo Gracefully close the game before starting.
echo No existing saves or account databases are overwritten.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\Protect-Elrothiro.ps1" -CreateBackup
if errorlevel 1 (
  echo.
  echo BACKUP NOT VERIFIED. Review the error above. No restore was attempted.
  pause
  exit /b 1
)
echo.
echo Backup verified. Keep a separate private copy off this computer.
pause
