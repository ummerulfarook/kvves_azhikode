@echo off
:: KVVES Management System — Auto-Startup Scheduler Setup
:: Run this script as Administrator to configure the backend to start automatically on system boot.

title KVVES Auto-Startup Scheduler Setup

echo ==========================================================
echo   KVVES Management System — Auto-Startup Scheduler Setup
echo ==========================================================
echo.
echo This script will register a task in Windows Task Scheduler
echo to start the Django/Waitress backend server automatically
echo in the background whenever the computer starts and a user logs on.
echo.
echo NOTE: Please run this batch file as Administrator.
echo.

:: Setup paths
set VBS_SCRIPT=%~dp0start_backend_hidden.vbs

echo Registering task "KVVES_Backend_Startup" using Windows Task Scheduler...
echo Command target: %VBS_SCRIPT%
echo.

:: Create the scheduled task
schtasks /create /tn "KVVES_Backend_Startup" /tr "wscript.exe \"%VBS_SCRIPT%\"" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
    echo.
    echo ==========================================================
    echo   SUCCESS: KVVES Backend is scheduled to start on logon!
    echo   It will run silently in the background.
    echo ==========================================================
) else (
    echo.
    echo ==========================================================
    echo   ERROR: Task scheduling failed.
    echo   Please run this batch file as Administrator!
    echo   Right-click on the file and choose "Run as administrator".
    echo ==========================================================
)

echo.
pause
