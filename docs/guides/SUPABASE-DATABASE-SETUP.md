# TanaPOS V4 AI - Supabase 資料庫建立指南

## 📋 前置準備

### 1. 建立 Supabase 專案
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 點擊 "New Project"
3. 選擇組織並填寫專案資訊：
   - **Project Name**: TanaPOS-V4-AI
   - **Database Password**: 設定一個強密碼（請記住）
   - **Region**: 選擇最接近的區域（建議：Singapore）
4. 點擊 "Create New Project"
5. 等待專案建立完成（約2-3分鐘）

### 2. 取得專案資訊
建立完成後，前往專案設定頁面：
1. 點擊左側選單的 "Settings" → "API"
2. 複製以下資訊：
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon/public key**: `eyJ...` (很長的字串)

## 🗄️ 資料庫架構部署

### 方案一：使用 SQL Editor（推薦）

1. **前往 SQL Editor**
   - 在 Supabase Dashboard 左側選單點擊 "SQL Editor"

2. **執行資料庫架構**
   - 點擊 "New Query"
   - 複製 `supabase_complete.sql` 的所有內容
   - 貼上到編輯器中
   - 點擊 "Run" 執行

3. **驗證建立結果**
   - 前往 "Table Editor" 查看資料表
   - 應該看到 26 個資料表

### 方案二：使用本地部署腳本

1. **更新環境變數**
   編輯 `.env` 檔案，更新為您的專案資訊：
   ```env
   VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
   VITE_SUPABASE_ANON_KEY=[your-anon-key]
   ```

2. **執行部署腳本**
   ```bash
   node deploy-database.js
   ```

## 📊 測試資料載入

### 1. 載入基礎測試資料
在 SQL Editor 中執行以下 SQL：

```sql
-- 建立測試餐廳
INSERT INTO restaurants (name, address, phone, email, owner_name) VALUES
('TanaPOS 示範餐廳', '台北市信義區信義路五段7號', '02-1234-5678', 'demo@tanapos.com', '示範老闆');

-- 取得餐廳ID
-- 請記住這個ID，後續會用到
SELECT id, name FROM restaurants WHERE name = 'TanaPOS 示範餐廳';
```

### 2. 載入菜單分類
```sql
-- 請將 'restaurant-id' 替換為上一步取得的餐廳ID
INSERT INTO categories (restaurant_id, name, description, sort_order) VALUES
('restaurant-id', '主餐', '各式主餐料理', 1),
('restaurant-id', '飲品', '各式飲料', 2),
('restaurant-id', '甜點', '美味甜點', 3);
```

### 3. 載入範例產品
```sql
-- 請將 'restaurant-id' 和 'category-id' 替換為實際ID
INSERT INTO products (restaurant_id, category_id, name, description, price, is_available) VALUES
('restaurant-id', 'category-id', '招牌牛肉麵', '經典台式牛肉麵', 180, true),
('restaurant-id', 'category-id', '紅茶', '古早味紅茶', 30, true),
('restaurant-id', 'category-id', '巧克力蛋糕', '濃郁巧克力蛋糕', 120, true);
```

### 4. 建立桌台
```sql
-- 請將 'restaurant-id' 替換為實際餐廳ID
INSERT INTO tables (restaurant_id, table_number, capacity, status) VALUES
('restaurant-id', 1, 4, 'available'),
('restaurant-id', 2, 6, 'available'),
('restaurant-id', 3, 2, 'occupied'),
('restaurant-id', 4, 8, 'available');
```

## 🔧 權限設定

### 1. 啟用 Row Level Security (RLS)
在 SQL Editor 中執行：

```sql
-- 為所有主要資料表啟用 RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 建立基本讀取權限（允許匿名讀取）
CREATE POLICY "Enable read access for all users" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tables FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true);

-- 建立寫入權限（允許匿名寫入，實際應用中應該有適當的驗證）
CREATE POLICY "Enable insert access for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert access for all users" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable update access for all users" ON tables FOR UPDATE USING (true);
```

### 2. 啟用即時訂閱
```sql
-- 為訂單相關資料表啟用即時更新
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
```

## ✅ 驗證部署結果

### 1. 檢查資料表
在 Supabase Dashboard 的 "Table Editor" 中應該看到：
- ✅ restaurants (餐廳)
- ✅ categories (分類)
- ✅ products (產品)
- ✅ tables (桌台)
- ✅ orders (訂單)
- ✅ order_items (訂單項目)
- ✅ 其他 30+ 個支援資料表

### 2. 測試 API 連線
執行測試腳本：
```bash
node test-api.js
```

預期結果：
```
🚀 TanaPOS v4 AI - API功能測試
✅ 餐廳資料正常 (1 筆)
✅ 分類資料正常 (3 筆)  
✅ 產品資料正常 (3 筆)
✅ 桌台資料正常 (4 筆)
✅ 訂單資料正常 (0 筆)
✅ 即時連線正常
🎉 所有API測試通過！資料庫運作正常
```

### 3. 啟動應用程式測試
```bash
npm run dev
```

訪問 `http://localhost:5177` 並檢查：
- ✅ 菜單管理頁面顯示分類和產品
- ✅ 桌台管理頁面顯示桌台狀態
- ✅ 點餐頁面可以選擇產品
- ✅ 主題切換功能正常

## 🚨 常見問題解決

### 問題1：找不到資料表
**解決方案**：確認 `supabase_complete.sql` 已完整執行

### 問題2：權限錯誤
**解決方案**：檢查 RLS 政策是否正確建立

### 問題3：API 連線失敗
**解決方案**：
1. 確認 `.env` 檔案中的 URL 和 Key 正確
2. 檢查 Supabase 專案是否正常運行

### 問題4：即時功能無法使用
**解決方案**：確認已執行即時訂閱設定的 SQL

## 📞 技術支援

如果遇到問題，可以：
1. 檢查 Supabase Dashboard 的 "Logs" 頁面
2. 使用 `node check-database.js` 檢查連線狀態
3. 查看瀏覽器開發者工具的 Console 錯誤訊息

---

## 🎯 下一步

資料庫建立完成後，您可以：
1. 自訂餐廳資訊和菜單
2. 測試完整的點餐流程
3. 設定員工帳號和權限
4. 部署到正式環境

**記住**：這是開發環境設定，正式環境需要加強安全性設定！
