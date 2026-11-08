@echo off
setlocal
cd /d "%~dp0"
title JoshRS - Check My World (READ ONLY)
echo Checking your customised world WITHOUT changing or uploading anything.
echo.
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Run JoshRS.cmd setup first or install Node.js 24+.
  pause
  exit /b 1
)
node "%~dp0tools\portable-world\audit.mjs"
if errorlevel 1 (
  echo.
  echo Inventory FAILED safely. Read the error above.
  pause
  exit /b 1
)
start "" "%USERPROFILE%\Documents\JoshRS-Exports"
echo.
echo Inventory complete. Open the newest folder and share inventory.json ONLY.
pause
