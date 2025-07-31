# 🚀 TanaPOS V4-Mini 部署指南

## 🎯 快速部署步驟

### 1. GitHub 倉庫設置

1. 登入 [GitHub](https://github.com)
2. 創建新倉庫：`tanapos-v4-mini`
3. 設為公開倉庫（或私有，看你的需求）
4. **不要** 初始化 README, .gitignore 或 license（我們已經有了）

### 2. 推送程式碼到 GitHub

```bash
# 在專案目錄中執行
git remote add origin https://github.com/Tanawathan/tanapos-v4-mini.git
git push -u origin main
```

⚡ **建置已成功測試！** 所有 TypeScript 錯誤已修復，Netlify 部署應該會順利進行。

### 3. Netlify 部署設置

1. 登入 [Netlify](https://netlify.com)
2. 點擊 "Import from Git" → "GitHub"
3. 選擇你的 `tanapos-v4-mini` 倉庫
4. 部署設置會自動從 `netlify.toml` 讀取：
   - Build command: `npm run build`
   - Publish directory: `dist`

### 4. 環境變數設置

在 Netlify 專案設置中添加以下環境變數：

```
VITE_SUPABASE_URL=https://peubpisofenlyquqnpan.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg1ODA4OCwiZXhwIjoyMDY5NDM0MDg4fQ.hNSQGdCx9QjJD7S7oaoghEFDrCjdVJKbjUr7c9jtvMA
VITE_APP_NAME=TanaPOS V4-Mini
VITE_APP_VERSION=1.0.0
```

### 5. 部署確認

- ✅ 自動建置應該會成功
- ✅ 應用程式應該在 `https://YOUR_SITE_NAME.netlify.app` 可以存取
- ✅ 資料庫連線應該正常運作
- ✅ 所有功能（POS、庫存、桌位管理）應該可用

## 🔧 疑難排解

### 建置失敗
- 檢查 Node.js 版本是否為 18 或更高
- 確認所有依賴項都在 `package.json` 中

### 資料庫連線問題
- 確認 Supabase URL 和 API Key 正確設置
- 檢查 Supabase 專案是否活躍

### 功能異常
- 確認環境變數設置正確
- 檢查瀏覽器控制台是否有錯誤訊息

## 🌟 功能特色

部署完成後，你的 TanaPOS V4-Mini 將包含：

- 🎨 **10種UI主題**：Modern、Neon、Retro、Minimalist、Gaming、Corporate、Art Deco、Brutalism、Cyberpunk、Nature
- 🏪 **完整POS系統**：點餐、結帳、訂單管理
- 📦 **庫存管理**：三層庫存系統（商品、成分、供應商）
- 🍽️ **桌位管理**：視覺化桌位佈局、計時器功能
- 📊 **管理系統**：包含資料庫編輯器的完整後台
- 📱 **響應式設計**：支援桌面、平板、手機
- 🌐 **即時同步**：Supabase 即時資料庫

## 📞 技術支援

如果遇到任何問題，請檢查：
1. Git 狀態：`git status`
2. 建置狀態：`npm run build`
3. Netlify 部署日誌
4. 瀏覽器開發者工具控制台

---

## 🎉 **部署狀態更新 (2025/7/31)**

✅ **TypeScript 建置錯誤已修復**
- 修復了 App-backup.tsx 中的字串字面量錯誤
- 排除了開發備份檔案避免干擾建置
- 修復了桌位管理中的類型轉換問題
- 添加了資料庫映射的類型註解

✅ **建置測試成功**
- `npm run build` 成功完成
- 生成了優化的生產版本 (673.77 KiB)
- 所有模組正確轉換和打包

**準備好部署了嗎？** 🚀
