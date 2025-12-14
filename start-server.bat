@echo off
echo Checking for processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo Starting server...
npm start

