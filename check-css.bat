@echo off
echo 🎨 TanaPOS CSS 載入檢查工具
echo.

cd /d "c:\TanaPOS\tanapos-v4-mini"

echo 📋 檢查 CSS 檔案是否存在:
echo.

echo ✅ 基礎樣式檔案:
if exist "src\index.css" (
    echo    [✓] src\index.css - 已存在
    for %%A in ("src\index.css") do echo    大小: %%~zA bytes
) else (
    echo    [✗] src\index.css - 不存在
)

echo.
echo ✅ UI 風格檔案:
if exist "src\styles\ui-styles.css" (
    echo    [✓] src\styles\ui-styles.css - 已存在
    for %%A in ("src\styles\ui-styles.css") do echo    大小: %%~zA bytes
) else (
    echo    [✗] src\styles\ui-styles.css - 不存在
)

echo.
echo ✅ 新行動POS專用樣式:
if exist "src\styles\new-mobile-pos.css" (
    echo    [✓] src\styles\new-mobile-pos.css - 已存在
    for %%A in ("src\styles\new-mobile-pos.css") do echo    大小: %%~zA bytes
) else (
    echo    [✗] src\styles\new-mobile-pos.css - 不存在
)

echo.
echo 📦 檢查測試檔案:
if exist "src\test-new-mobile.tsx" (
    echo    [✓] src\test-new-mobile.tsx - 已存在
    echo    正在檢查 CSS 匯入...
    findstr /C:"import" "src\test-new-mobile.tsx" | findstr /C:".css"
) else (
    echo    [✗] src\test-new-mobile.tsx - 不存在
)

echo.
echo 🌐 檢查測試頁面:
if exist "public\test-new-mobile.html" (
    echo    [✓] public\test-new-mobile.html - 已存在
) else (
    echo    [✗] public\test-new-mobile.html - 不存在
)

echo.
echo 🔧 建議操作:
echo 1. 確保開發伺服器已啟動: npm run dev
echo 2. 清除瀏覽器快取 (Ctrl+Shift+R)
echo 3. 檢查開發者工具中的網路面板
echo 4. 確認 CSS 檔案正確載入
echo.
pause
