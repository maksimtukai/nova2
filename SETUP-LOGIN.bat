@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Nova Studio: настройка входа ===
echo Отредактируйте local-login.json если нужно, затем...
echo.
node setup-login.js
echo.
pause
