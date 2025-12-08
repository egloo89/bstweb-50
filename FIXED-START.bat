@echo off
cls
echo ========================================
echo   Next.js Server - FIXED VERSION
echo ========================================
echo.

cd /d C:\bstweb-50-main

echo [1/4] Stopping any existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done.
echo.

echo [2/4] Checking dependencies...
if not exist "node_modules\next" (
    echo Installing dependencies...
    call npm install
    echo.
) else (
    echo Dependencies OK.
    echo.
)

echo [3/4] Starting Next.js server...
echo Server will start in a new window.
echo Please wait for "Ready" message in that window.
echo.
start "Next.js Server - DO NOT CLOSE" cmd /k "cd /d C:\bstweb-50-main && npm run dev"

echo [4/4] Waiting 30 seconds for server to start...
echo.
for /L %%i in (30,-1,1) do (
    echo Waiting %%i seconds...
    timeout /t 1 /nobreak >nul
)

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo The server is running in a separate window.
echo Check that window for "Ready" message.
echo.
echo If page doesn't load:
echo - Wait 10 more seconds and refresh browser
echo - Check the server window for any errors
echo - Make sure firewall allows port 3000
echo.
echo Press any key to exit this window...
pause >nul

