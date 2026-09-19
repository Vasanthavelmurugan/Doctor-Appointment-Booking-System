@echo off
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
echo ===================================================
echo Starting CarePulse Doctor Appointment Booking System
echo ===================================================
cd /d "%~dp0"
node backend/src/server.js
pause
