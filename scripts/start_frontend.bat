@echo off
:: KVVA Management System — Frontend Dev Server
:: Starts Vite dev server (development mode)

title KVVA Frontend Dev Server

cd /d %~dp0..\frontend

echo =====================================================
echo   KVVA Frontend — Vite Dev Server
echo   Opens at: http://localhost:5173
echo =====================================================

echo Starting Vite dev server...
npm run dev

pause
