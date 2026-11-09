# Скрипт для установки сервера как Windows службы
# Требует прав администратора

$ErrorActionPreference = "Stop"

# Проверяем права администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Этот скрипт требует прав администратора." -ForegroundColor Red
    Write-Host "Запустите PowerShell от имени администратора и выполните:"
    Write-Host "powershell -ExecutionPolicy Bypass -File 'C:\сервер 2\install-windows-service.ps1'"
    exit 1
}

$ServiceName = "NovaStudioServer"
$ServerDir = "C:\сервер 2"
$NodeExe = "node"
$ServerScript = "server.js"

Write-Host "Установка службы Windows для Nova Studio..." -ForegroundColor Cyan

# Проверяем, существует ли служба
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Служба $ServiceName уже существует. Удаление..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force
    Start-Sleep -Seconds 2
    Remove-Service -Name $ServiceName
    Start-Sleep -Seconds 2
}

# Создаем службу
Write-Host "Создание службы..." -ForegroundColor Cyan
$servicePath = "$NodeExe $ServerScript"
$service = New-Service -Name $ServiceName `
    -BinaryPathName "$servicePath" `
    -DisplayName "Nova Studio Server" `
    -Description "Сервер Nova Studio - веб-приложение для аналитики" `
    -StartupType Automatic `
    -WorkingDirectory $ServerDir

Write-Host "Служба создана успешно!" -ForegroundColor Green
Write-Host "Запуск службы..." -ForegroundColor Cyan

# Запускаем службу
Start-Service -Name $ServiceName

# Проверяем статус
$serviceStatus = Get-Service -Name $ServiceName
Write-Host "Статус службы: $($serviceStatus.Status)" -ForegroundColor Cyan

if ($serviceStatus.Status -eq 'Running') {
    Write-Host "Служба успешно запущена!" -ForegroundColor Green
    Write-Host "Сервер доступен по адресу: http://localhost:43219" -ForegroundColor Green
} else {
    Write-Host "Ошибка запуска службы. Проверьте логи." -ForegroundColor Red
}

Write-Host ""
Write-Host "Команды управления службой:" -ForegroundColor Cyan
Write-Host "Запуск: Start-Service -Name $ServiceName"
Write-Host "Остановка: Stop-Service -Name $ServiceName"
Write-Host "Перезапуск: Restart-Service -Name $ServiceName"
Write-Host "Статус: Get-Service -Name $ServiceName"
Write-Host "Удаление: Remove-Service -Name $ServiceName"
