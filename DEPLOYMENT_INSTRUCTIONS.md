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
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
VITE_APP_NAME=TanaPOS V4-Mini
VITE_APP_VERSION=1.0.0
```

**重要：** 請將上述佔位符替換為您的實際 Supabase 憑證，這些憑證可以從您的 Supabase 專案設置中獲取。

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

✅ **建置腳本簡化修復**
- 創建了簡化的 vite.config.debug.ts（暫時禁用 PWA 插件）
- 添加了 build:simple 腳本用於調試和部署
- 更新 Netlify 配置使用簡化建置避免退出代碼 2 錯誤
- 添加 .nvmrc 明確指定 Node.js 版本
- 移除可能有問題的 NODE_OPTIONS 環境變數

✅ **TypeScript 執行錯誤修復**
- 修復了 Netlify 中 'tsc: not found' 錯誤（退出代碼 127）
- 將所有 tsc 命令改為 npx tsc 確保 TypeScript 可被找到
- 更新 Netlify 建置命令明確運行 npm install
- 確保 devDependencies 在建置環境中正確安裝

✅ **PWA 資源配置修復**
- 修復了 vite.config.ts 中 PWA 圖示引用錯誤
- 更新圖示路徑從 pwa-*.png 到實際存在的 favicon-*.png
- 修復了 includeAssets 配置以引用正確的檔案
- 解決了 Netlify 建置中的靜默失敗問題

✅ **建置腳本優化**
- 改進建置腳本使用 `npx tsc --noEmit` 避免產生不必要檔案
- 添加了調試建置腳本以便故障排除
- 增強 Netlify 環境變數以提供更好的日誌記錄

✅ **Node.js 版本兼容性修復**
- 更新 Netlify 建置環境從 Node.js 18 到 Node.js 20
- 添加了 package.json engines 欄位確保版本兼容性
- 修復了 Netlify 不支援的 Node.js 版本問題

✅ **TypeScript 建置錯誤已修復**
- 修復了 App-backup.tsx 中的字串字面量錯誤
- 排除了開發備份檔案避免干擾建置
- 修復了桌位管理中的類型轉換問題
- 添加了資料庫映射的類型註解

✅ **建置測試成功**
- `npm run build:simple` 成功完成（簡化版本，無 PWA）
- `npm run type-check` TypeScript 檢查通過
- 生成了優化的生產版本 (547.82 KiB)
- 所有模組正確轉換和打包
- Node.js 20 兼容性確認

**準備好部署了嗎？** 🚀

**注意：** 當前使用簡化建置（暫時禁用 PWA）以確保 Netlify 部署成功。PWA 功能將在部署成功後重新啟用。
