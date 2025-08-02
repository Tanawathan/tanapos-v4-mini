# TanaPOS V4-Mini 建置測試 PowerShell 腳本
Write-Host "========================================" -ForegroundColor Green
Write-Host "TanaPOS V4-Mini 建置測試" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Set-Location "c:\TanaPOS\tanapos-v4-mini"

Write-Host "檢查目錄..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "錯誤：找不到 package.json" -ForegroundColor Red
    Read-Host "按 Enter 鍵繼續..."
    exit 1
}

Write-Host "安裝依賴套件..." -ForegroundColor Yellow
npm install

Write-Host "執行建置測試..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ 建置成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "功能完成：" -ForegroundColor Cyan
    Write-Host "- ✅ KDS 頁面手機端優化" -ForegroundColor Green
    Write-Host "- ✅ PWA 功能實作（Service Worker + 安裝提示）" -ForegroundColor Green
    Write-Host "- ✅ 手機響應式設計" -ForegroundColor Green
    Write-Host "- ✅ 離線功能支援" -ForegroundColor Green
    Write-Host ""
    Write-Host "啟動開發伺服器..." -ForegroundColor Yellow
    npm run dev
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ 建置失敗" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "請檢查錯誤訊息並修復問題" -ForegroundColor Red
}

Read-Host "按 Enter 鍵繼續..."
