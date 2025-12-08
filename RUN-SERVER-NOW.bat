@echo off
title Next.js Server - Port 3000
cls
echo ========================================
echo   Next.js Development Server
echo ========================================
echo.

cd /d C:\bstweb-50-main

echo Starting server...
echo.
echo IMPORTANT: Wait for "Ready" message before opening browser!
echo.
echo ========================================
echo.

npm.cmd run dev

pause

