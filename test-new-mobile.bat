@echo off
echo 🚀 啟動 TanaPOS 新行動POS測試環境
echo.
echo 📋 啟動步驟:
echo 1. 啟動開發伺服器
echo 2. 開啟新行動POS測試頁面
echo.

cd /d "c:\TanaPOS\tanapos-v4-mini"

echo 🔄 啟動 Vite 開發伺服器...
start "TanaPOS Dev Server" cmd /k "npm run dev"

echo ⏳ 等待伺服器啟動...
timeout /t 5 /nobreak >nul

echo 🌐 開啟新行動POS測試頁面...
start http://localhost:5173/test-new-mobile.html

echo.
echo ✅ 測試環境已啟動！
echo 📱 新行動POS介面: http://localhost:5173/test-new-mobile.html
echo 🖥️  桌面版POS: http://localhost:5173/pos-simple
echo.
echo 🎯 測試重點:
echo - 加入商品到購物車
echo - 選擇桌號
echo - 送出訂單 (檢查是否有商品明細)
echo - 對比桌面版POS的運作
echo.
pause
