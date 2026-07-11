@echo off
title KVVES Login API Diagnostic Tool

cd /d %~dp0

if exist ..\backend\venv\Scripts\python.exe (
    set PYTHON_EXE=..\backend\venv\Scripts\python.exe
) else (
    set PYTHON_EXE=python
)

%PYTHON_EXE% test_login_api.py
