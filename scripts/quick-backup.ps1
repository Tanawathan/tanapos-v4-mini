# TanaPOS V4 Mini 簡化備份腳本
# 執行日期: 2025-07-31

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "tanapos-v4-mini_$timestamp"
$backupLocation = "C:\TanaPOS\Backups"
$backupPath = Join-Path $backupLocation $backupName

Write-Host "🚀 開始備份 TanaPOS V4 Mini..." -ForegroundColor Green

# 創建備份目錄
if (!(Test-Path $backupLocation)) {
    New-Item -ItemType Directory -Path $backupLocation -Force | Out-Null
}
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

Write-Host "📂 複製項目文件到: $backupPath" -ForegroundColor Yellow

# 使用 Robocopy 進行高效複製，排除不必要的文件
robocopy "C:\TanaPOS\tanapos-v4-mini" $backupPath /E /XD node_modules .git .next dist build .vscode /XF *.log npm-debug.log* yarn-debug.log* yarn-error.log* /NDL /NJH /NJS

# 創建備份信息
$backupInfo = @"
# TanaPOS V4 Mini 備份
備份時間: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
版本: V4 Mini
狀態: UI 樣式系統完成，包含 10 種樣式和 Code 彩蛋功能

## 還原步驟:
1. npm install
2. npm run dev
3. 瀏覽器開啟 http://localhost:5173 或 5174

## 特殊功能:
- Konami Code: ↑↑↓↓←→←→BA (解鎖 Code 樣式)
- 10 種 UI 樣式可選
- 響應式設計完整
"@

$backupInfo | Out-File -FilePath (Join-Path $backupPath "README_BACKUP.md") -Encoding UTF8

Write-Host "✅ 備份完成！" -ForegroundColor Green
Write-Host "📁 備份位置: $backupPath" -ForegroundColor Cyan
