@echo off
setlocal
title JoshRS - Play Elrothiro from Android
echo.
echo JoshRS - free local Android streaming
echo This streams your ORIGINAL Windows game, not a new server or save.
echo No router ports will be forwarded by this script.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\mobile-existing-game.ps1"
if errorlevel 1 (
 echo Elrothiro active-save preflight failed. No streaming software installed.
 pause
 exit /b 1
)
echo.
choice /C YN /M "Install free Sunshine if needed (requires Windows permission)"
if errorlevel 2 goto finish
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\mobile-existing-game.ps1" -InstallSunshine
if errorlevel 1 (
 echo Sunshine installation or game verification failed.
 pause
 exit /b 1
)
:finish
echo.
echo Open https://localhost:47990 on this Windows PC to set up Sunshine.
echo Then pair Moonlight on your Android using the same Wi-Fi.
echo Launch your existing JoshRS Java client, not the Woodlands demo.
echo.
pause
