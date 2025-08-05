# 🚀 TanaPOS v4 AI Supabase 設置指南

## 📋 設置檔案說明

我們為您提供了四個不同的SQL設置檔案：

### 1. `supabase_complete.sql` - 完整資料庫架構 ⭐
- **用途**: 建立完整的35+資料表架構
- **大小**: ~41KB
- **適合**: 生產環境或完整功能測試
- **執行順序**: 第一個執行

### 2. `supabase-setup.sql` - 進階設置
- **用途**: 權限配置、安全設置、測試資料
- **功能**: RLS政策、即時訂閱、自定義函數
- **適合**: 完整的開發環境設置
- **執行順序**: 在 supabase_complete.sql 之後執行

### 3. `supabase-basic-setup.sql` - 基本設置 (新增)
- **用途**: 基本權限、安全執行
- **功能**: 可在任何時候安全執行
- **適合**: 快速權限設置或故障排除
- **執行順序**: 可隨時執行

### 4. `supabase-quick-setup.sql` - 快速設置
- **用途**: 最基本的權限和測試資料
- **適合**: 快速測試和開發
- **執行順序**: 在架構建立後執行

## 🔧 部署步驟

### 方法一：使用 Supabase Dashboard (推薦)

1. **開啟 Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/arksfwmcmwnyxvlcpskm
   ```

2. **進入 SQL Editor**
   - 點選左側選單的 "SQL Editor"
   - 點選 "New query"

3. **執行設置 (正確順序很重要！)**

   **方法A：完整設置 (推薦)**
   ```sql
   -- 第一步：建立資料庫架構
   -- 複製並執行 supabase_complete.sql 的內容
   
   -- 第二步：進階設置
   -- 複製並執行 supabase-setup.sql 的內容
   ```

   **方法B：快速設置 (開發測試)**
   ```sql
   -- 第一步：建立資料庫架構
   -- 複製並執行 supabase_complete.sql 的內容
   
   -- 第二步：快速設置
   -- 複製並執行 supabase-quick-setup.sql 的內容
   ```

   **方法C：基本設置 (故障排除)**
   ```sql
   -- 如果遇到錯誤，可先執行基本設置
   -- 複製並執行 supabase-basic-setup.sql 的內容
   
   -- 然後再執行其他設置檔案
   ```

4. **驗證設置**
   ```sql
   -- 檢查資料表
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;

   -- 檢查測試資料
   SELECT * FROM restaurants;
   SELECT COUNT(*) FROM categories;
   SELECT COUNT(*) FROM tables;
   ```

### 方法二：使用 psql 命令列

```bash
# 連線到 Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.arksfwmcmwnyxvlcpskm.supabase.co:5432/postgres"

# 執行完整架構
\i supabase_complete.sql

# 執行設置
\i supabase-setup.sql
```

### 方法三：快速設置（開發測試）

如果只是要快速測試，可以只執行：
```sql
-- 在 Supabase SQL Editor 中執行 supabase-quick-setup.sql
```

## 🎯 設置後驗證

### 1. 檢查基本功能
```javascript
// 在瀏覽器控制台或 Node.js 中測試
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://arksfwmcmwnyxvlcpskm.supabase.co',
  'your-anon-key'
)

// 測試餐廳查詢
const { data: restaurants } = await supabase
  .from('restaurants')
  .select('*')
console.log('餐廳資料:', restaurants)

// 測試分類查詢
const { data: categories } = await supabase
  .from('categories')
  .select('*')
console.log('分類數量:', categories?.length)
```

### 2. 檢查權限設置
```sql
-- 檢查資料表權限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated');
```

### 3. 檢查即時訂閱
```sql
-- 檢查即時訂閱設置
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## 🔒 安全性設置

### 生產環境建議
```sql
-- 啟用行級安全
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 建立安全政策
CREATE POLICY "restaurant_access" ON public.restaurants
FOR ALL USING (auth.jwt() ->> 'restaurant_id' = id::text);
```

### 開發環境設置
```sql
-- 暫時關閉 RLS 以便開發
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
```

## 🛠️ 疑難排解

### 常見問題與解決方案

**1. 錯誤: relation "public.restaurants" does not exist**
```
原因: 在執行設置腳本時，資料表尚未建立
解決方案: 
1. 先執行 supabase_complete.sql 建立資料表
2. 或執行 supabase-basic-setup.sql 進行安全設置
```

**2. 權限不足錯誤**
```sql
-- 解決方案：重新設置權限
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

**3. 資料表不存在**
```sql
-- 檢查是否已執行完整架構
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- 應該返回 35+ 個資料表
```

**4. 即時訂閱無效**
```sql
-- 重新設置即時訂閱
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

**5. 政策創建失敗**
```
原因: 嘗試在不存在的資料表上創建政策
解決方案: 使用修正後的 supabase-setup.sql 或先執行 supabase-basic-setup.sql
```

### 診斷指令

**檢查資料庫狀態:**
```sql
SELECT check_database_status();
```

**檢查資料表:**
```sql
SELECT get_tables();
```

**檢查權限:**
```sql
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated');
```

## 📊 設置完成檢查清單

- [ ] ✅ 35+ 資料表已建立
- [ ] ✅ 權限已正確設置
- [ ] ✅ 測試餐廳資料已載入
- [ ] ✅ 分類和商品資料存在
- [ ] ✅ 桌台資料已設置
- [ ] ✅ 即時訂閱功能運作
- [ ] ✅ 前端應用可以連線
- [ ] ✅ 基本查詢功能正常

## 🚀 下一步

設置完成後，您可以：

1. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

2. **執行測試**
   ```bash
   npm run test
   npm run test:e2e
   ```

3. **載入更多測試資料**
   ```bash
   node setup-test-data.js
   ```

## 📞 支援

如果遇到問題，請檢查：
- Supabase 專案是否正常運行
- 網路連線是否正常
- API 金鑰是否正確
- 資料庫連線字串是否正確

---

**TanaPOS v4 AI 開發團隊**  
最後更新：2025-08-05
