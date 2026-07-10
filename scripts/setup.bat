@echo off
:: KVVA Management System — First-time Setup Script
:: Run this once after cloning to set up the project

title KVVA Setup

cd /d %~dp0..

echo =====================================================
echo   KVVA Management System — First-time Setup
echo =====================================================

:: ─── Backend ─────────────────────────────────────────────
echo.
echo [1/6] Installing Python dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 ( echo FAILED: pip install && pause && exit /b 1 )

echo.
echo [2/6] Configuring environment...
if not exist .env (
    copy .env.example .env
    echo Created .env — please edit it with your database credentials.
    notepad .env
    echo Press any key after saving .env to continue...
    pause >nul
)

echo [3/6] Running Django migrations...
findstr /I "DEBUG=True" .env >nul
if %errorlevel% equ 0 (
    set DJANGO_SETTINGS_MODULE=core.settings.development
    echo Running migrations in DEVELOPMENT mode with SQLite...
) else (
    set DJANGO_SETTINGS_MODULE=core.settings.production
    echo Running migrations in PRODUCTION mode with PostgreSQL...
)
python manage.py migrate
if errorlevel 1 ( echo FAILED: migrate && pause && exit /b 1 )

echo.
echo [4/6] Creating initial admin user...
python manage.py seed_data

echo.
echo [5/6] Collecting static files...
python manage.py collectstatic --noinput

:: ─── Frontend ────────────────────────────────────────────
echo.
echo [6/6] Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 ( echo FAILED: npm install && pause && exit /b 1 )

echo.
echo =====================================================
echo   Setup Complete!
echo =====================================================
echo.
echo  To start development:
echo    scripts\start_backend.bat  (Terminal 1)
echo    scripts\start_frontend.bat (Terminal 2)
echo.
echo  Default credentials:
echo    admin  / kvva@admin2024  (Admin)
echo    staff  / kvva@staff2024  (Staff)
echo    viewer / kvva@view2024   (Viewer)
echo.
echo  Open: http://localhost:5173
echo.
pause
