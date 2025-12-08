@echo off
title Next.js Server - Port 3000
echo ========================================
echo Starting Next.js Development Server
echo ========================================
echo.

cd /d C:\bstweb-50-main

echo Starting server on http://localhost:3000
echo.
echo Please wait for "Ready" message...
echo.

npx next dev -p 3000

pause

