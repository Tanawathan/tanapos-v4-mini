# TanaPOS V4-Mini 啟動腳本
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   TanaPOS V4-Mini 啟動腳本" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\TanaPOS\tanapos-v4-mini"

Write-Host "正在檢查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "錯誤: 未安裝 Node.js，請先安裝 Node.js" -ForegroundColor Red
    Read-Host "按 Enter 鍵結束"
    exit 1
}

Write-Host "正在檢查 npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "錯誤: npm 不可用" -ForegroundColor Red
    Read-Host "按 Enter 鍵結束"
    exit 1
}

Write-Host ""
Write-Host "正在安裝依賴套件..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "正在啟動 TanaPOS V4-Mini..." -ForegroundColor Green
Write-Host ""
Write-Host "應用程式將在以下網址啟動:" -ForegroundColor Cyan
Write-Host "- 本地網址: http://localhost:5174" -ForegroundColor White
Write-Host "- 網路網址: http://192.168.1.100:5174" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止伺服器" -ForegroundColor Yellow
Write-Host ""

npm run dev

Read-Host "按 Enter 鍵結束"
