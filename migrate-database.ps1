# TanaPOS 資料庫一鍵轉移工具 (PowerShell 版本)

# 設定控制台編碼
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TanaPOS 資料庫一鍵轉移工具        ║" -ForegroundColor Cyan  
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 錯誤: 未找到 Node.js，請先安裝 Node.js" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

# 檢查腳本文件
if (-not (Test-Path "scripts\migrate-database.mjs")) {
    Write-Host "❌ 錯誤: 找不到遷移腳本文件" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

# 檢查 .env 文件
if (-not (Test-Path ".env")) {
    Write-Host "❌ 錯誤: 找不到 .env 設定文件" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

Write-Host "ℹ 準備執行資料庫遷移..." -ForegroundColor Blue
Write-Host ""
Write-Host "⚠️  注意事項:" -ForegroundColor Yellow
Write-Host "   1. 此操作將備份並覆蓋現有資料" -ForegroundColor Yellow
Write-Host "   2. 請確保已正確設定舊資料庫連接資訊" -ForegroundColor Yellow  
Write-Host "   3. 建議在非營業時間執行" -ForegroundColor Yellow
Write-Host ""

# 檢查是否有舊資料庫設定
if (Test-Path ".env.migration") {
    Write-Host "📄 發現遷移設定文件 (.env.migration)" -ForegroundColor Green
    $content = Get-Content ".env.migration" -Raw
    if ($content -match "OLD_SUPABASE_URL=https://[^/]+\.supabase\.co") {
        Write-Host "✅ 舊資料庫 URL 已設定" -ForegroundColor Green
    } else {
        Write-Host "⚠️  請先設定 .env.migration 文件中的舊資料庫資訊" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  建議創建 .env.migration 文件並設定舊資料庫資訊" -ForegroundColor Yellow
}

Write-Host ""
$choice = Read-Host "是否繼續執行遷移? (y/N)"
if ($choice -ne "y" -and $choice -ne "Y") {
    Write-Host "已取消操作" -ForegroundColor Yellow
    Read-Host "按 Enter 結束"
    exit 0
}

Write-Host ""
Write-Host "🚀 開始執行遷移..." -ForegroundColor Green
Write-Host ""

# 合併環境變數
if (Test-Path ".env.migration") {
    Write-Host "📝 載入遷移設定..." -ForegroundColor Blue
    $migrationEnv = Get-Content ".env.migration"
    $mainEnv = Get-Content ".env"
    $combinedEnv = $mainEnv + $migrationEnv
    $combinedEnv | Out-File ".env.temp" -Encoding UTF8
    
    # 暫時重命名環境變數文件
    Move-Item ".env" ".env.backup"
    Move-Item ".env.temp" ".env"
}

try {
    # 執行遷移腳本
    $process = Start-Process -FilePath "node" -ArgumentList "scripts\migrate-database.mjs" -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ 遷移完成！" -ForegroundColor Green
        Write-Host "📊 請檢查應用程式是否正常運作" -ForegroundColor Blue
    } else {
        Write-Host ""
        Write-Host "❌ 遷移失敗，請檢查錯誤訊息" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 執行失敗: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # 恢復原始環境變數文件
    if (Test-Path ".env.backup") {
        Move-Item ".env.backup" ".env" -Force
    }
}

Write-Host ""
Read-Host "按 Enter 結束"
