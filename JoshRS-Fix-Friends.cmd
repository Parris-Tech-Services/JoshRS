@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\jparris-windows\fix-disabled-friends.ps1" -Apply
if errorlevel 1 (
 echo.
 echo Friends service NOT changed. Read the safety message above.
 pause
 exit /b 1
)
echo.
echo Friends configuration staged. Restart normally ONLY when both players are finished.
pause
exit /b 0
