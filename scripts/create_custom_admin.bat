@echo off
:: KVVES Management System — Create Custom Admin User
:: Run this to create a new custom administrator account or reset a password.

title KVVES Create Custom Admin

cd /d %~dp0..\backend

if exist venv\Scripts\python.exe (
    set PYTHON_EXE=venv\Scripts\python.exe
) else (
    set PYTHON_EXE=python
)

%PYTHON_EXE% create_admin_user.py

echo.
pause
