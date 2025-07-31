# TanaPOS V4-Mini Supabase 設置指南

## 🚀 快速開始

### 步驟 1: 設置 Supabase 專案

1. 前往 [Supabase](https://supabase.com/)
2. 建立新專案
3. 取得專案 URL 和 API Key

### 步驟 2: 設定環境變數

在專案根目錄建立 `.env` 檔案：

```bash
# 替換為您的實際 Supabase 憑證
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 開發設定
NODE_ENV=development
VITE_APP_TITLE=TanaPOS V4-Mini
```

### 步驟 3: 執行資料庫設置

1. 前往 Supabase 專案的 SQL Editor
2. 複製並執行 `setup-database.sql` 內容

### 步驟 4: 啟動開發伺服器

```bash
cd c:\TanaPOS\tanapos-v4-mini
npm install
npm run dev
```

### 步驟 5: 存取應用程式

開啟瀏覽器前往 `http://localhost:5173`

## 📱 功能特色

- ✅ 產品管理
- ✅ 購物車
- ✅ 訂單管理
- ✅ KDS (廚房顯示系統)
- ✅ 桌位管理
- ✅ 即時資料同步
- ✅ PWA 支援

## 🔄 即時功能

系統使用 Supabase Realtime 提供即時資料同步：

- 新訂單即時出現在 KDS
- 訂單狀態即時更新
- 桌位狀態即時同步

## 📊 資料結構

- **Categories**: 產品分類
- **Products**: 產品資訊
- **Tables**: 桌位管理
- **Orders**: 訂單及項目

## 🛠️ 開發注意事項

1. 確保 Supabase 憑證正確設定
2. 執行資料庫設置腳本
3. 查看控制台是否有連線錯誤
4. 檢查 RLS 政策是否正確套用

## 🚨 常見問題

**Q: 無法連接資料庫？**
A: 檢查 `.env` 檔案中的 URL 和 API Key

**Q: 資料無法載入？**
A: 確認已執行 `setup-database.sql` 腳本

**Q: 即時功能無法運作？**
A: 檢查 Supabase Realtime 是否已啟用
