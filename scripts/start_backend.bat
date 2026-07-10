@echo off
:: KVVA Management System — Backend Startup Script
:: Run this to start the Django/Waitress backend server

title KVVA Backend Server

cd /d %~dp0..\backend

echo =====================================================
echo   KVVA Management System — Backend Server
echo =====================================================

:: Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

findstr /I "DEBUG=True" .env >nul
if %errorlevel% equ 0 (
    set DJANGO_SETTINGS_MODULE=core.settings.development
    echo Running in DEVELOPMENT mode with SQLite...
) else (
    set DJANGO_SETTINGS_MODULE=core.settings.production
    echo Running in PRODUCTION mode with PostgreSQL...
)

echo Starting server on http://0.0.0.0:8000 ...
echo Press Ctrl+C to stop.
echo.

python serve.py

pause
