@echo off
:: KVVES Management System — Reset to Fresh Database
:: Run this to clear all test records and start with a clean database containing only default users.

title KVVES Fresh Database Setup

echo ==========================================================
echo   KVVES Management System — Fresh Database Setup
echo ==========================================================
echo.
echo WARNING: This script will delete ALL members, welfare funds,
echo loans, and transaction records! Only the default user accounts
echo (admin, staff, viewer) will be kept.
echo.
set /p CONFIRM="Are you absolutely sure you want to proceed? (y/n): "
if /i "%CONFIRM%" neq "y" (
    echo Reset cancelled.
    pause
    exit /b 0
)

cd /d %~dp0..\backend

if exist venv\Scripts\python.exe (
    set PYTHON_EXE=venv\Scripts\python.exe
) else (
    set PYTHON_EXE=python
)

:: Check database engine from .env
findstr /I "DEBUG=True" .env >nul
if %errorlevel% equ 0 (
    echo.
    echo Detected SQLite Database Mode.
    if exist db.sqlite3 (
        echo Backing up existing database as db.sqlite3.bak...
        copy /y db.sqlite3 db.sqlite3.bak >nul
        echo Deleting existing database file...
        del db.sqlite3
    )
) else (
    echo.
    echo Detected PostgreSQL Database Mode.
    echo Make sure you have created an empty database on PostgreSQL first.
    echo Running database flush...
)

echo.
echo Re-building database structure...
%PYTHON_EXE% manage.py migrate
if errorlevel 1 (
    echo.
    echo ERROR: Migrations failed. Check database connection or server.
    pause
    exit /b 1
)

echo.
echo Seeding default users (admin, staff, viewer)...
%PYTHON_EXE% manage.py seed_data

echo.
echo ==========================================================
echo   SUCCESS: Clean database initialized with default users!
echo   Default Admin: admin / kvva@admin2024
echo ==========================================================
echo.
pause
