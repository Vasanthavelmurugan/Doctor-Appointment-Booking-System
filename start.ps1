$env:Path = "$env:LOCALAPPDATA\Programs\nodejs;$env:Path"
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting CarePulse Doctor Appointment Booking System" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Set-Location $PSScriptRoot
node backend/src/server.js
