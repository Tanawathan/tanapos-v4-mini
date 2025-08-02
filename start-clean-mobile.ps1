# 啟動 TanaPOS V4-Mini 開發伺服器
Write-Host "🚀 啟動 TanaPOS V4-Mini 開發伺服器..." -ForegroundColor Green

# 切換到專案目錄
Set-Location "c:\TanaPOS\tanapos-v4-mini"

# 檢查是否已安裝依賴
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安裝依賴..." -ForegroundColor Yellow
    npm install
}

# 啟動開發伺服器
Write-Host "🌐 啟動 Vite 開發伺服器..." -ForegroundColor Cyan
Write-Host "📱 新的乾淨手機版 POS 可在以下網址測試：" -ForegroundColor Green
Write-Host "   http://localhost:5173/mobile-clean" -ForegroundColor Blue
Write-Host ""

npm run dev
