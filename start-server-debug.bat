@echo off
echo ========================================
echo Starting Next.js Server (Debug Mode)
echo ========================================
echo.

cd /d C:\bstweb-50-main

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server on port 3000...
echo.
echo If you see any errors below, please share them.
echo.
npx next dev -p 3000

pause

