# Triage Dev Server Startup Script
# Automatically clears ports 5001 and 5173 before launching servers

function Kill-Port {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $processIds = $connections.OwningProcess | Sort-Object -Unique
        foreach ($processId in $processIds) {
            try {
                taskkill /F /PID $processId 2>$null | Out-Null
                Write-Host "  Killed PID $processId on port $Port" -ForegroundColor Yellow
            } catch {}
        }
        # Wait for OS to release the socket
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  Port $Port is free" -ForegroundColor Green
    }
}

Write-Host "`n=== Triage Startup ===" -ForegroundColor Cyan

Write-Host "`nClearing ports..." -ForegroundColor Cyan
Kill-Port 5001
Kill-Port 5173

Write-Host "`nStarting ML Backend on port 5001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; uvicorn app:app --host 0.0.0.0 --port 5001" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Frontend on port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev -- --host" -WindowStyle Normal

Write-Host "`n=== Both servers launching ===" -ForegroundColor Green
Write-Host "Frontend : http://$(hostname):5173" -ForegroundColor White
Write-Host "Backend  : http://$(hostname):5001" -ForegroundColor White
Write-Host "`nClose the opened terminal windows to stop the servers.`n" -ForegroundColor DarkGray
