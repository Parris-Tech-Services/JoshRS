@echo off
setlocal
cd /d "%~dp0"
title JoshRS - Compare With Clean Pinned 377 Source
echo Comparing the installed JoshRS game with exact, clean upstream source revisions.
echo This downloads only clean source references to Documents\JoshRS-Exports.
echo Your live game, player saves, SQLite account database and packed world will NOT change.
echo.
where node.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is missing from PATH.
  pause
  exit /b 1
)
where git.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git is not installed or is missing from PATH.
  pause
  exit /b 1
)
node "%~dp0tools\portable-world\compare-pinned.mjs"
if errorlevel 1 (
  echo.
  echo PINNED BASELINE COMPARISON DID NOT COMPLETE. Read the error above.
  pause
  exit /b 1
)
start "" "%USERPROFILE%\Documents\JoshRS-Exports"
echo.
echo Review the newest inventory.json; share that file ONLY in ChatGPT.
pause
