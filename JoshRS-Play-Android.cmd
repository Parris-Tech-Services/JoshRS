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
 echo Existing Elrothiro save/account preflight failed. No streaming software installed.
echo Open your normal JoshRS game locally and check the active world first.
echo Do not install a clean world or overwrite saves to repair streaming.
 pause
 exit /b 1
)
echo.
choice /C YN /M "Install free Sunshine if needed (requires Windows permission)"
if errorlevel 2 goto finish
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\mobile-existing-game.ps1" -InstallSunshine
if errorlevel 1 (
 echo Sunshine installation or game verification failed.
echo Manual installer (official): https://github.com/LizardByte/Sunshine/releases
 pause
 exit /b 1
)
:finish
echo.
echo 1. On this Windows PC open https://localhost:47990 to configure Sunshine.
echo 2. Install Moonlight from Google Play on your Android phone:
echo    https://play.google.com/store/apps/details?id=com.limelight
echo 3. Connect phone and Windows PC to the SAME private local network.
echo 4. In Moonlight select the PC. The phone shows a PIN.
echo 5. In Sunshine's PIN tab on the Windows PC, enter the phone's PIN.
echo 6. Back on the phone launch Desktop and play the EXISTING JoshRS Java client.
echo If PC discovery fails, type ipconfig on Windows and use its local IPv4 address.
echo.
echo Help: deploy\jparris-windows\ANDROID_QUICK_START.md
choice /C YN /M "Open the Sunshine setup page on this Windows PC now"
if errorlevel 2 goto finishbrowser
start "" "https://localhost:47990"
:finishbrowser
echo End Moonlight only after logging out safely inside JoshRS.
echo Note: No real Android gameplay is verified by this setup script.
echo.
pause
