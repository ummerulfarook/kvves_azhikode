@echo off
:: KVVA Management System — Database Backup Launcher Script
:: Run this to manually perform a database backup.

title KVVA Database Backup Launcher

cd /d %~dp0..\backend

echo Starting database backup process...
python backup.py

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Backup process failed!
    pause
    exit /b 1
)

echo.
echo Database backup process completed successfully.
echo.
pause
