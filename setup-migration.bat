@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: TanaPOS 資料庫遷移快速設定工具
echo.
echo ╔═══════════════════════════════════════╗
echo ║    TanaPOS 資料庫遷移快速設定         ║
echo ╚═══════════════════════════════════════╝
echo.

:: 檢查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 錯誤: 未安裝 Node.js
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

:: 檢查目錄
if not exist "scripts\setup-migration.mjs" (
    echo ❌ 錯誤: 找不到設定腳本
    echo 請確保在正確的專案目錄中執行
    pause
    exit /b 1
)

:: 執行設定
echo ℹ 啟動互動式設定工具...
echo.
node scripts/setup-migration.mjs

if %errorlevel% equ 0 (
    echo.
    echo ✅ 設定完成！
    echo.
    echo 🚀 現在可以執行:
    echo    migrate-database.bat  [執行遷移]
    echo    或
    echo    node scripts/migrate-database.mjs
) else (
    echo.
    echo ❌ 設定失敗
)

echo.
pause
