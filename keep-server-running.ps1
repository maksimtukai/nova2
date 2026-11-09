# Скрипт для постоянной работы сервера Nova Studio
# Перезапускает сервер при падении

$ErrorActionPreference = "Continue"
$ServerDir = "C:\сервер 2"
$LogFile = Join-Path $ServerDir "server-watchdog.log"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Add-Content -Path $LogFile -Value $logEntry
    Write-Host $logEntry
}

Write-Log "=== Запуск watchdog для сервера ==="

while ($true) {
    try {
        # Проверяем, запущен ли процесс node с server.js
        $process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            try {
                $mainModule = $_.MainModule.FileName
                if ($mainModule) {
                    $processDir = Split-Path $mainModule -Parent
                    # Проверяем, что процесс запущен из нужной директории
                    return $processDir -eq $ServerDir
                }
                return $false
            } catch {
                return $false
            }
        }

        if ($process) {
            Write-Log "Сервер работает (PID: $($process.Id))"
        } else {
            Write-Log "Сервер не работает. Запуск..."
            
            # Запускаем сервер
            $startInfo = New-Object System.Diagnostics.ProcessStartInfo
            $startInfo.FileName = "node"
            $startInfo.Arguments = "server.js"
            $startInfo.WorkingDirectory = $ServerDir
            $startInfo.UseShellExecute = $false
            $startInfo.RedirectStandardOutput = $true
            $startInfo.RedirectStandardError = $true
            $startInfo.CreateNoWindow = $false
            
            $process = New-Object System.Diagnostics.Process
            $process.StartInfo = $startInfo
            $process.Start() | Out-Null
            
            Write-Log "Сервер запущен (PID: $($process.Id))"
            
            # Ждем 5 секунд для инициализации
            Start-Sleep -Seconds 5
        }
        
        # Проверяем каждые 30 секунд
        Start-Sleep -Seconds 30
        
    } catch {
        Write-Log "ОШИБКА: $_"
        Start-Sleep -Seconds 10
    }
}
