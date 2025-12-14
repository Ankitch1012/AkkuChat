@echo off
echo Finding processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /PID %%a /F
)
if errorlevel 1 (
    echo No process found on port 3000.
) else (
    echo Port 3000 is now free.
)

