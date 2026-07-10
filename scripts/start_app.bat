@echo off
:: KVVA Management System — Unified Launcher
:: Double-click this to start both backend and frontend servers.

title KVVA Management System Launcher

echo ==========================================================
echo   KVVA Management System — Launcher
echo ==========================================================
echo.
echo Starting Backend Server...
start "KVVA Backend Server" cmd /k "call %~dp0start_backend.bat"

echo Starting Frontend Server...
start "KVVA Frontend Server" cmd /k "call %~dp0start_frontend.bat"

echo.
echo ==========================================================
echo   Servers are starting in separate windows.
echo   - Backend API:  http://localhost:8000
echo   - Frontend App: http://localhost:5173
echo.
echo   Please keep this window and the server windows open
echo   while using the application.
echo ==========================================================
echo.

timeout /t 8
