@echo off
title Next.js Server - FINAL
cls
color 0A
echo ========================================
echo   FINAL SERVER START - Watch for errors
echo ========================================
echo.

cd /d C:\bstweb-50-main

echo [Step 1] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done.
echo.

echo [Step 2] Checking dependencies...
if not exist "node_modules\next" (
    echo ERROR: Dependencies not installed!
    echo Installing now...
    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
    echo.
) else (
    echo Dependencies OK.
    echo.
)

echo [Step 3] Starting Next.js server...
echo.
echo ========================================
echo   SERVER OUTPUT (Watch for errors):
echo ========================================
echo.

npm.cmd run dev

echo.
echo ========================================
echo Server stopped or crashed.
echo ========================================
pause

