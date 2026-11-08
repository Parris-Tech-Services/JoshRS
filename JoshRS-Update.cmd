@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 (
  echo BLOCKED: Node.js is required. Use JoshRS.cmd to install prerequisites.
  pause
  exit /b 1
)
echo ====================================================
echo JoshRS 377 Unified Updater - Windows private world
echo ====================================================
echo STEP 1: Read-only check - nothing installed.
echo This launcher updates the Windows selected active.json world only.
echo For a specific world use: node tools\rs377-unified-updater\updater.mjs --check --world C:\absolute\world
node.exe tools\rs377-unified-updater\updater.mjs --check
if errorlevel 1 (
  echo.
  echo CHECK BLOCKED. No game files changed.
  pause
  exit /b 1
)
echo.
echo Close EVERY JoshRS client and gracefully STOP the server.
echo The updater will NOT stop services or auto-modify your saves.
choice /M "Is the game server fully stopped, and do you want to apply and build"
if errorlevel 2 exit /b 0
node.exe tools\rs377-unified-updater\updater.mjs --apply --confirm-stopped
if errorlevel 1 (
  echo BLOCKED OR ROLLBACK. Read the above error; do not start another update.
  pause
  exit /b 1
)
echo Update processed. Real NPC/quest playthrough is NOT yet certified.
pause
