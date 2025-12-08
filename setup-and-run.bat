@echo off
echo ========================================
echo Setting up and starting the server...
echo ========================================
echo.

cd /d C:\bstweb-50-main

echo [1/4] Installing dependencies...
call npm install
echo.

echo [2/4] Fixing localhost port issues...
node fix-localhost.js
echo.

echo [3/4] Starting Next.js development server...
start "Next.js Server" cmd /k "npx next dev -p 3000"
echo.

echo [4/4] Waiting for server to start...
timeout /t 15 /nobreak >nul

echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo Server is running at http://localhost:3000
echo The server window is open separately.
echo Press Ctrl+C in the server window to stop.
echo.
pause

