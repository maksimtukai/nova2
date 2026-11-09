@echo off
title Nova Studio Watchdog
echo Запуск watchdog для постоянной работы сервера...
echo.
echo Сервер будет автоматически перезапускаться при падении.
echo Для остановки закрой это окно.
echo.
powershell -ExecutionPolicy Bypass -File "C:\сервер 2\keep-server-running.ps1"
pause
