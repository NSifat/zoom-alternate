@echo off
REM WebRTC Video Conference - Quick Start
REM This batch file starts the server and opens the app in your default browser

echo.
echo ========================================
echo   WebRTC Video Conference
echo   Starting server...
echo ========================================
echo.

cd /d "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate"

REM Check if node_modules exists, if not run npm install
if not exist "node_modules\" (
    echo Installing dependencies (first time only)...
    call npm install
    echo.
)

REM Start the server
echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

REM Open browser after a short delay
timeout /t 2 /nobreak > nul
start http://localhost:3000

REM Start the server
npm start

pause
