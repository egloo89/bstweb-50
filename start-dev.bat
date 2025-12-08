@echo off
echo Starting Next.js development server on port 3000...
echo.
cd /d %~dp0

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start server in new window
start "Next.js Server" cmd /k "npx next dev -p 3000"

REM Wait for server to start
echo Waiting for server to start...
timeout /t 15 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo Server is running at http://localhost:3000
echo ========================================
echo.
echo The server window is open separately.
echo Press Ctrl+C in the server window to stop.
echo.
pause

