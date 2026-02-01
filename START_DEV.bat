@echo off
REM WebRTC Video Conference - Development Mode
REM This batch file starts the server with auto-reload for development

echo.
echo ========================================
echo   WebRTC Video Conference (DEV MODE)
echo   Starting server with auto-reload...
echo ========================================
echo.

cd /d "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate"

REM Check if node_modules exists, if not run npm install
if not exist "node_modules\" (
    echo Installing dependencies (first time only)...
    call npm install
    echo.
)

REM Start the server in dev mode
echo Starting server in DEVELOPMENT mode on http://localhost:3000
echo The server will automatically restart when you change files.
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

REM Open browser after a short delay
timeout /t 2 /nobreak > nul
start http://localhost:3000

REM Start the server with nodemon (auto-reload)
npm run dev

pause
