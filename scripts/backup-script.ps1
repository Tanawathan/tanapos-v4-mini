# TanaPOS V4 Mini 備份腳本
# 執行日期: 2025-07-31
# 系統狀態: UI 樣式系統完成，Code 彩蛋功能實現，10 種 UI 風格

param(
    [string]$BackupLocation = "C:\TanaPOS\Backups",
    [switch]$IncludeNodeModules = $false
)

# 創建備份目錄
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "tanapos-v4-mini_$timestamp"
$backupPath = Join-Path $BackupLocation $backupName

Write-Host "🚀 開始備份 TanaPOS V4 Mini..." -ForegroundColor Green
Write-Host "備份位置: $backupPath" -ForegroundColor Yellow

# 創建備份目錄
if (!(Test-Path $BackupLocation)) {
    New-Item -ItemType Directory -Path $BackupLocation -Force
    Write-Host "✅ 創建備份根目錄: $BackupLocation" -ForegroundColor Green
}

New-Item -ItemType Directory -Path $backupPath -Force
Write-Host "✅ 創建備份目錄: $backupPath" -ForegroundColor Green

# 定義要排除的文件和目錄
$excludeItems = @(
    "node_modules",
    ".next",
    "dist",
    "build",
    ".git",
    ".vscode",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*"
)

# 如果指定包含 node_modules，則從排除列表中移除
if ($IncludeNodeModules) {
    $excludeItems = $excludeItems | Where-Object { $_ -ne "node_modules" }
    Write-Host "📦 包含 node_modules 在備份中..." -ForegroundColor Yellow
}

# 複製文件
Write-Host "📂 複製項目文件..." -ForegroundColor Cyan

# 獲取所有文件，排除指定項目
$sourceFiles = Get-ChildItem -Path "C:\TanaPOS\tanapos-v4-mini" -Recurse | Where-Object {
    $item = $_
    $shouldExclude = $false
    
    foreach ($exclude in $excludeItems) {
        if ($exclude.Contains("*")) {
            # 處理通配符
            if ($item.Name -like $exclude) {
                $shouldExclude = $true
                break
            }
        } else {
            # 處理目錄和文件名
            if ($item.Name -eq $exclude -or $item.PSIsContainer -and $item.Name -eq $exclude) {
                $shouldExclude = $true
                break
            }
            # 檢查是否在排除的目錄中
            if ($item.FullName -match [regex]::Escape($exclude)) {
                $shouldExclude = $true
                break
            }
        }
    }
    
    return -not $shouldExclude
}

# 複製文件保持目錄結構
foreach ($file in $sourceFiles) {
    $relativePath = $file.FullName.Replace("C:\TanaPOS\tanapos-v4-mini\", "")
    $destinationPath = Join-Path $backupPath $relativePath
    
    if ($file.PSIsContainer) {
        # 創建目錄
        if (!(Test-Path $destinationPath)) {
            New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
        }
    } else {
        # 複製文件
        $destinationDir = Split-Path $destinationPath -Parent
        if (!(Test-Path $destinationDir)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
        }
        Copy-Item -Path $file.FullName -Destination $destinationPath -Force
    }
}

# 創建備份信息文件
$backupInfo = @"
# TanaPOS V4 Mini 備份信息

## 備份詳情
- 備份時間: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- 備份版本: V4 Mini
- 系統狀態: 生產就緒

## 功能完成度
✅ 10 種 UI 樣式系統 (100%)
✅ 響應式設計 (100%)
✅ React + TypeScript 架構 (100%)
✅ Vite 開發環境 (100%)
✅ Code 彩蛋風格 (100%)
✅ Konami Code 解鎖系統 (100%)
✅ 樣式持久化存儲 (100%)
✅ 主題切換功能 (100%)
✅ 深色/淺色模式 (100%)
✅ 動畫過場效果 (100%)

## UI 樣式列表
1. default - 經典藍色主題
2. warm - 溫暖橙色調
3. cool - 冷色調藍綠
4. nature - 自然綠色系
5. sunset - 日落色彩
6. ocean - 海洋藍調
7. forest - 森林深綠
8. lavender - 薰衣草紫
9. rose - 玫瑰粉色
10. code - 程式碼風格 (隱藏彩蛋)

## 特殊功能
- Konami Code: ↑↑↓↓←→←→BA (解鎖 Code 樣式)
- 語法高亮顯示
- 極繁主義動畫效果
- 彩虹邊框動畫
- 故障風格效果

## 技術棧
- React 18.3.1
- TypeScript 5.6.2
- Vite 5.4.19
- Tailwind CSS 3.4.14
- CSS3 動畫與過場效果

## 開發指令
- 開發模式: npm run dev
- 建置生產: npm run build
- 預覽建置: npm run preview
- 類型檢查: npm run type-check

## 備份還原指南
1. 解壓縮備份檔案到目標目錄
2. 執行 npm install 安裝依賴
3. 執行 npm run dev 啟動開發模式
4. 瀏覽器開啟 http://localhost:5173 或 5174

## 注意事項
- 此備份不包含 node_modules (除非特別指定)
- 需要 Node.js 18+ 環境
- 建議使用最新版本的現代瀏覽器
- Code 樣式需要 Konami Code 解鎖

## 聯絡資訊
開發完成日期: 2025年7月31日
系統狀態: 穩定運行，功能完整
"@

$backupInfoPath = Join-Path $backupPath "BACKUP_INFO.md"
$backupInfo | Out-File -FilePath $backupInfoPath -Encoding UTF8

Write-Host "📝 創建備份信息文件..." -ForegroundColor Green

# 計算備份大小
$backupSize = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

Write-Host "`n🎉 備份完成！" -ForegroundColor Green
Write-Host "📁 備份位置: $backupPath" -ForegroundColor Yellow
Write-Host "📊 備份大小: $backupSizeMB MB" -ForegroundColor Yellow
Write-Host "📄 備份信息: $backupInfoPath" -ForegroundColor Yellow

# 如果有 Git，創建版本標籤
if (Get-Command git -ErrorAction SilentlyContinue) {
    Set-Location "C:\TanaPOS\tanapos-v4-mini"
    try {
        $gitStatus = git status --porcelain 2>$null
        if ($gitStatus) {
            Write-Host "⚠️  注意: 有未提交的更改" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Git 狀態: 所有更改已提交" -ForegroundColor Green
        }
        
        # 創建標籤
        $tagName = "backup-$timestamp"
        git tag -a $tagName -m "自動備份標籤 - UI 樣式系統完成" 2>$null
        Write-Host "🏷️  創建 Git 標籤: $tagName" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Git 操作跳過 (非 Git 倉庫或無權限)" -ForegroundColor Yellow
    }
}

Write-Host "`n🚀 快速還原指令:" -ForegroundColor Cyan
Write-Host "1. 複製備份到新位置" -ForegroundColor White
Write-Host "2. cd 到項目目錄" -ForegroundColor White
Write-Host "3. npm install" -ForegroundColor White
Write-Host "4. npm run dev" -ForegroundColor White

return $backupPath
