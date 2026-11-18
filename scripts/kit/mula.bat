@echo off
rem Degup laptop kit launcher for Windows.
rem Checks that Node.js 20 or newer is installed, runs "npm ci" once, then starts the app with "npm start".
rem Your Presage API key is NOT in this kit. Paste it in Settings inside the app.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto tiada_node

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODE_MAJOR=%%v
if "%NODE_MAJOR%"=="" goto tiada_node
if %NODE_MAJOR% LSS 20 goto node_lama

if exist "node_modules\.degup-ci-ok" goto mula
echo Installing dependencies. First run only, this takes a few minutes.
call npm ci
if errorlevel 1 goto ci_gagal
echo ok>"node_modules\.degup-ci-ok"

:mula
echo Starting Degup.
call npm start
if errorlevel 1 pause
exit /b 0

:tiada_node
echo Node.js was not found.
echo Install the LTS version from https://nodejs.org/ then run mula.bat again.
start "" "https://nodejs.org/"
pause
exit /b 1

:node_lama
echo This kit needs Node.js 20 or newer. You have version %NODE_MAJOR%.
echo Install the LTS version from https://nodejs.org/ then run mula.bat again.
start "" "https://nodejs.org/"
pause
exit /b 1

:ci_gagal
echo "npm ci" failed. Check the internet connection, then run mula.bat again.
echo If it fails again, take a screenshot of this window and upload it.
pause
exit /b 1
