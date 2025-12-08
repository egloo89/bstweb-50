@echo off
title Next.js Server
echo ========================================
echo Starting Next.js Development Server
echo ========================================
echo.

cd /d C:\bstweb-50-main

REM Kill any existing Node processes
taskkill /F /IM node.exe >nul 2>&1

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting server on http://localhost:3000
echo Please wait for "Ready" message...
echo.

REM Start server
start "Next.js Server" cmd /k "cd /d C:\bstweb-50-main && npm run dev"

echo.
echo Waiting 25 seconds for server to start...
timeout /t 25 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo Server should be running now!
echo ========================================
echo.
echo If the page doesn't load:
echo 1. Check the "Next.js Server" window for errors
echo 2. Wait a bit longer and refresh the browser
echo 3. Make sure port 3000 is not blocked by firewall
echo.
pause

