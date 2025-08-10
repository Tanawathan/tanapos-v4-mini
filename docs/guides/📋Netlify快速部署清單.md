# 📋 Netlify 快速部署清單

## ⚡ 立即部署步驟

### 1. 前往 Netlify 控制台
🔗 **連結**: https://netlify.com
- 使用 GitHub 帳號登入
- 點擊 "Add new site" → "Import an existing project"

### 2. 連接 GitHub 儲存庫
- 選擇 GitHub
- 授權 Netlify 存取
- 選擇 `Tanawathan/tanapos-v4-mini`

### 3. 部署設定 (自動偵測)
```
Build command: npm ci && npm run build
Publish directory: dist
Production branch: main
```

### 4. 環境變數設定 (重要!)
在 Site settings → Environment variables 添加：

```bash
VITE_SUPABASE_URL=https://arksfwmcmwnyxvlcpskm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU
VITE_RESTAURANT_ID=your_restaurant_id
VITE_APP_ENV=production
```

### 5. 點擊 "Deploy site"

## ✅ 部署成功檢查

### 立即測試功能：
- [ ] 首頁載入正常
- [ ] 手機點餐系統可存取
- [ ] 路由導航功能正常
- [ ] 下單功能無重複編號錯誤

## 🎯 關鍵修復已完成

- ✅ **訂單編號重複問題已修復**
- ✅ **React Router 路由系統已建立** 
- ✅ **預約系統 Supabase 整合完成**
- ✅ **構建優化和性能提升**

## 🚨 重要提醒

1. **必須設定環境變數** - 沒有環境變數應用程式無法運行
2. **等待構建完成** - 首次部署需要 3-5 分鐘
3. **檢查構建日誌** - 如有錯誤檢查 Functions 標籤

---

**🎉 準備完成！您的系統已 100% 準備好部署到 Netlify！**
