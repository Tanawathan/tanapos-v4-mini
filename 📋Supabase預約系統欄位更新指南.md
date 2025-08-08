# 📋 Supabase 預約系統欄位手動更新指南

## 🎯 需要在 Supabase 控制台中手動添加的欄位

### 1. 登入 Supabase 控制台
- 前往：https://supabase.com/dashboard
- 選擇專案：`arksfwmcmwnyxvlcpskm`

### 2. 編輯 `table_reservations` 表

#### 新增欄位：

1. **customer_gender** (性別)
   - Type: `text`
   - Default value: `NULL`
   - Allow nullable: `✅ Yes`
   - 用途：記錄顾客性別 (male, female, other)

2. **customer_last_name** (姓氏)
   - Type: `text`
   - Default value: `NULL`
   - Allow nullable: `✅ Yes`
   - 用途：快速識別顧客姓氏

3. **is_walk_in** (是否現場顾客)
   - Type: `boolean`
   - Default value: `false`
   - Allow nullable: `✅ Yes`
   - 用途：標記現場顧客（無預約直接到店）

4. **arrival_time** (實際到店時間)
   - Type: `timestamp with time zone`
   - Default value: `NULL`
   - Allow nullable: `✅ Yes`
   - 用途：記錄顧客實際到店時間

5. **reservation_type** (預約類型)
   - Type: `text`
   - Default value: `advance`
   - Allow nullable: `✅ Yes`
   - 用途：區分預約類型 (advance, same_day, walk_in)

## 🚀 更新步驟

### Step 1: 進入表編輯器
1. 在 Supabase 控制台左側選擇 "Table Editor"
2. 找到並點擊 `table_reservations` 表
3. 點擊 "Add Column" 按鈕

### Step 2: 逐一添加欄位
按照上面的規格，依次添加 5 個新欄位。

### Step 3: 驗證欄位
添加完成後，檢查表結構是否包含所有新欄位。

## 📊 SQL 方式（替代方法）

如果偏好使用 SQL，可以在 Supabase SQL Editor 中執行：

```sql
-- 添加性別欄位
ALTER TABLE public.table_reservations 
ADD COLUMN customer_gender TEXT CHECK (customer_gender IN ('male', 'female', 'other'));

-- 添加姓氏欄位
ALTER TABLE public.table_reservations 
ADD COLUMN customer_last_name TEXT;

-- 添加現場顧客標記
ALTER TABLE public.table_reservations 
ADD COLUMN is_walk_in BOOLEAN DEFAULT FALSE;

-- 添加實際到店時間
ALTER TABLE public.table_reservations 
ADD COLUMN arrival_time TIMESTAMPTZ;

-- 添加預約類型
ALTER TABLE public.table_reservations 
ADD COLUMN reservation_type TEXT DEFAULT 'advance' 
CHECK (reservation_type IN ('advance', 'same_day', 'walk_in'));
```

## ✅ 驗證步驟

更新完成後，運行測試腳本驗證：

```bash
node simple-reservation-update.js
```

預期看到：
- ✅ 新欄位存在確認
- ✅ 測試資料插入成功
- ✅ 預約統計正常顯示

## 🎉 功能介紹

更新完成後，系統將支援：

### 1. 當日預約
- 客戶可以當天預約
- 預約類型自動標記為 `same_day`
- 即時查看可用時段

### 2. 現場顧客登記
- 快速登記現場顾客
- 記錄姓氏和性別便於識別
- 自動標記為 `walk_in` 類型

### 3. 完整的預約管理
- 統一的預約管理界面
- 按類型篩選和搜尋
- 實時統計資料

---

**📞 如需協助，請聯絡技術支援**

更新完成後，請測試所有功能確保運作正常！
