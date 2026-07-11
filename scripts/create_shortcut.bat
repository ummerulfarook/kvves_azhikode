@echo off
:: KVVES Management System — Create Desktop Shortcut
:: Run this to create a desktop shortcut that opens the app silently without a terminal.

title KVVES Desktop Shortcut Creator

echo ==========================================================
echo   KVVES Management System — Create Desktop Shortcut
echo ==========================================================
echo.

set TARGET_VBS=%~dp0launch_app_hidden.vbs
set SHORTCUT_PATH=%USERPROFILE%\Desktop\KVVES Management System.lnk

echo Creating desktop shortcut...
echo Target: %TARGET_VBS%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; ^
     $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); ^
     $Shortcut.TargetPath = 'wscript.exe'; ^
     $Shortcut.Arguments = '\"%TARGET_VBS%\"'; ^
     $Shortcut.WorkingDirectory = '%~dp0'; ^
     $Shortcut.Description = 'Launch KVVES Management System'; ^
     $Shortcut.Save();"

if %errorlevel% equ 0 (
    echo ==========================================================
    echo   SUCCESS: Desktop Shortcut created successfully!
    echo   Double-click the "KVVES Management System" shortcut
    echo   on your Desktop to launch the app silently.
    echo ==========================================================
) else (
    echo ERROR: Failed to create shortcut.
)

echo.
pause
