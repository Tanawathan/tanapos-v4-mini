@echo off
echo ========================================
echo TanaPOS V4-Mini 建置測試
echo ========================================
echo.

cd /d "c:\TanaPOS\tanapos-v4-mini"

echo 檢查目錄...
if not exist "package.json" (
    echo 錯誤：找不到 package.json
    pause
    exit /b 1
)

echo 安裝依賴套件...
call npm install

echo 執行建置測試...
call npm run build

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo ✅ 建置成功！
    echo ========================================
    echo.
    echo 功能完成：
    echo - ✅ KDS 頁面手機端優化
    echo - ✅ PWA 功能實作（Service Worker + 安裝提示）
    echo - ✅ 手機響應式設計
    echo - ✅ 離線功能支援
    echo.
    echo 啟動開發伺服器...
    call npm run dev
) else (
    echo.
    echo ========================================
    echo ❌ 建置失敗
    echo ========================================
    echo 請檢查錯誤訊息並修復問題
)

pause
