@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════╗
echo ║     TanaPOS 資料庫一鍵轉移工具        ║
echo ╚═══════════════════════════════════════╝
echo.

REM 檢查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 錯誤: 未找到 Node.js，請先安裝 Node.js
    pause
    exit /b 1
)

REM 檢查腳本文件
if not exist "scripts\migrate-database.mjs" (
    echo ❌ 錯誤: 找不到遷移腳本文件
    pause
    exit /b 1
)

REM 檢查 .env 文件
if not exist ".env" (
    echo ❌ 錯誤: 找不到 .env 設定文件
    pause
    exit /b 1
)

echo ℹ 準備執行資料庫遷移...
echo.
echo ⚠️  注意事項:
echo    1. 此操作將備份並覆蓋現有資料
echo    2. 請確保已正確設定舊資料庫連接資訊
echo    3. 建議在非營業時間執行
echo.

set /p choice="是否繼續執行遷移? (y/N): "
if /i "%choice%" NEQ "y" (
    echo 已取消操作
    pause
    exit /b 0
)

echo.
echo 🚀 開始執行遷移...
echo.

REM 執行遷移腳本
node scripts\migrate-database.mjs

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ 遷移完成！
) else (
    echo ❌ 遷移失敗，請檢查錯誤訊息
)

pause
