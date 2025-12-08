# Next.js 서버 실행 및 브라우저 열기
Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host ""

# 서버를 백그라운드 작업으로 시작
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npx next dev -p 3000
}

# 서버가 시작될 때까지 대기
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 포트 확인
$portCheck = netstat -ano | Select-String ":3000"
if ($portCheck) {
    Write-Host "Server is running on port 3000!" -ForegroundColor Green
    Start-Process "http://localhost:3000"
    Write-Host "Browser opened!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    # 작업 출력 확인
    Receive-Job $job
    Wait-Job $job
} else {
    Write-Host "Server failed to start. Checking for errors..." -ForegroundColor Red
    Receive-Job $job
    Stop-Job $job
    Remove-Job $job
}

