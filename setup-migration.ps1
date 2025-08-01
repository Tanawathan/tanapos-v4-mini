# PowerShell 版本的遷移設定工具
# TanaPOS Database Migration Setup Tool

# 設置控制台編碼為 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    TanaPOS 資料庫遷移快速設定         ║" -ForegroundColor Cyan  
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 錯誤: 未安裝 Node.js" -ForegroundColor Red
    Write-Host "請先安裝 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按任意鍵退出"
    exit 1
}

# 檢查目錄和文件
if (-not (Test-Path "scripts\setup-migration.mjs")) {
    Write-Host "❌ 錯誤: 找不到設定腳本" -ForegroundColor Red
    Write-Host "請確保在正確的專案目錄中執行" -ForegroundColor Yellow
    Read-Host "按任意鍵退出"
    exit 1
}

# 檢查依賴
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️ 警告: 未找到 node_modules，嘗試安裝依賴..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
        Read-Host "按任意鍵退出"
        exit 1
    }
}

Write-Host ""
Write-Host "ℹ 啟動互動式設定工具..." -ForegroundColor Blue
Write-Host ""

# 執行設定腳本
try {
    node scripts/setup-migration.mjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 設定完成！" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 現在可以執行:" -ForegroundColor Cyan
        Write-Host "   .\migrate-database.ps1   [執行遷移]" -ForegroundColor White
        Write-Host "   或" -ForegroundColor Gray
        Write-Host "   node scripts/migrate-database.mjs" -ForegroundColor White
        Write-Host ""
        
        # 詢問是否立即執行遷移
        $choice = Read-Host "是否要立即執行資料庫遷移? (y/N)"
        if ($choice -eq "y" -or $choice -eq "Y") {
            Write-Host ""
            Write-Host "🔄 啟動資料庫遷移..." -ForegroundColor Yellow
            & ".\migrate-database.ps1"
        }
    } else {
        Write-Host ""
        Write-Host "❌ 設定失敗" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ 執行錯誤: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "按任意鍵退出"
