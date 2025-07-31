@echo off
echo.
echo ============================================
echo   TanaPOS V4-Mini 啟動腳本
echo ============================================
echo.

cd /d "c:\TanaPOS\tanapos-v4-mini"

echo 正在檢查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤: 未安裝 Node.js，請先安裝 Node.js
    pause
    exit /b 1
)

echo 正在檢查 npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤: npm 不可用
    pause
    exit /b 1
)

echo.
echo 正在安裝依賴套件...
npm install

echo.
echo 正在啟動 TanaPOS V4-Mini...
echo.
echo 應用程式將在以下網址啟動:
echo - 本地網址: http://localhost:5174
echo - 網路網址: http://192.168.1.100:5174
echo.
echo 按 Ctrl+C 停止伺服器
echo.

npm run dev

pause
