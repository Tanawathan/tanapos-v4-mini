# 🔐 TanaPOS v4 AI - Supabase 管理者與 RLS 設置完整指南

## 📋 目前狀況分析

您遇到的 401 錯誤是因為：
1. 前端應用使用 `anon` key 訪問資料
2. RLS（Row Level Security）已啟用但政策設置不完整
3. 需要先登入管理者帳號才能訪問受保護的資料

## 🎯 解決方案步驟

### Step 1: 在 Supabase 儀表板設置 RLS 政策

1. **前往 Supabase 儀表板**
   - 網址：https://supabase.com/dashboard
   - 選擇您的專案：`arksfwmcmwnyxvlcpskm`

2. **執行 RLS 政策 SQL**
   - 點擊左側選單「SQL Editor」
   - 新建查詢並貼上以下文件內容：`setup-rls-policies-manual.sql`
   - 點擊「Run」執行

3. **驗證政策設置**
   - 前往「Authentication」→「Policies」
   - 確認所有表格都有對應的政策

### Step 2: 確認管理者帳號

**管理者登入資訊：**
- **Email**: `admin@tanapos.com`
- **密碼**: `TanaPos2025!`
- **角色**: `admin`
- **餐廳 ID**: `11111111-1111-1111-1111-111111111111`

### Step 3: 前端應用使用

1. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

2. **訪問應用**
   - 開啟瀏覽器：http://localhost:5180
   - 您會看到登入頁面

3. **使用管理者帳號登入**
   - 輸入上述管理者帳號資訊
   - 登入成功後即可正常使用所有功能

## 🔧 測試驗證

### 自動測試腳本
```bash
# 測試 RLS 權限是否正確設置
node test-rls-permissions.js

# 測試各功能頁面
node test-menu-functions.js
node test-table-functions.js
node test-ordering-functions.js
```

### 手動測試步驟
1. **未登入狀態** - 應該只看到登入頁面
2. **登入後** - 可以訪問所有功能頁面
3. **登出後** - 自動返回登入頁面

## 🎛️ RLS 政策說明

### 🔒 安全層級
- **未認證用戶**: 完全無法訪問資料
- **已認證用戶**: 只能訪問所屬餐廳的資料
- **管理者**: 可以跨餐廳訪問（role = 'admin'）
- **Service Role**: 擁有完整權限

### 📊 權限矩陣

| 用戶類型 | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| 未認證   | ❌     | ❌     | ❌     | ❌     |
| 一般用戶 | ✅*    | ✅*    | ✅*    | ❌     |
| 管理者   | ✅     | ✅     | ✅     | ✅     |
| Service  | ✅     | ✅     | ✅     | ✅     |

*僅限所屬餐廳資料

## 🚀 部署注意事項

### 生產環境設置
1. **變更預設密碼**
   ```sql
   -- 在 Supabase SQL Editor 中執行
   UPDATE auth.users 
   SET encrypted_password = crypt('YourSecurePassword', gen_salt('bf'))
   WHERE email = 'admin@tanapos.com';
   ```

2. **環境變數安全**
   - 確保 `.env` 文件不會提交到版本控制
   - 在生產環境使用環境變數管理

3. **RLS 政策優化**
   - 根據實際需求調整權限
   - 定期檢查和更新安全政策

## 🛠️ 故障排除

### 常見問題

**Q: 登入後仍然看到 401 錯誤**
A: 檢查用戶的 `user_metadata` 是否包含正確的 `restaurant_id` 和 `role`

**Q: 無法訪問特定表格**
A: 確認該表格的 RLS 政策已正確設置

**Q: 管理者無法登入**
A: 檢查密碼是否正確，或在 Supabase Auth 面板重設密碼

### 診斷工具
```bash
# 檢查連接狀態
node diagnostic-tools.js

# 驗證資料完整性
node system-ready-check.js

# 測試所有功能
node final-integration-test.js
```

## 📞 技術支援

如果遇到問題，請檢查：
1. Supabase 專案設定
2. 環境變數配置
3. RLS 政策設置
4. 管理者帳號狀態

---

**🎉 完成設置後，您的 TanaPOS v4 AI 系統將具備企業級的安全性和完整的功能！**
