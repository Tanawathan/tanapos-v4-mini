# 🚀 套餐設定快速指南

## 📋 立即設定步驟

### 1️⃣ 執行資料庫升級
請在 Supabase Dashboard 的 SQL Editor 中執行以下SQL：

```sql
-- 為現有套餐添加類型欄位
ALTER TABLE combo_products ADD COLUMN IF NOT EXISTS combo_type VARCHAR(50) DEFAULT 'fixed';

-- 更新現有套餐為固定套餐
UPDATE combo_products SET combo_type = 'fixed' WHERE combo_type IS NULL;

-- 創建可選擇套餐的選擇規則表
CREATE TABLE IF NOT EXISTS combo_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_combo_choices_combo ON combo_choices(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_choices_category ON combo_choices(category_id);

-- 創建示例可選擇套餐
INSERT INTO combo_products (name, description, price, combo_type, preparation_time, is_available) VALUES
('夏日特色套餐', '可選擇前菜、主餐、飲品、甜點的夏日套餐', 280.00, 'selectable', 25, true),
('經典商務套餐', '精選商務套餐，可自選搭配', 380.00, 'selectable', 30, true)
ON CONFLICT DO NOTHING;

-- 為示例套餐添加選擇規則 (需要實際的category_id)
-- 注意：請將 'category_uuid_here' 替換為實際的分類 ID
-- 
-- 示例：
-- INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections) 
-- SELECT cp.id, c.id, 1, 1 
-- FROM combo_products cp, categories c 
-- WHERE cp.name = '夏日特色套餐' AND c.name = '前菜';
```

### 2️⃣ 在管理系統中設定套餐

1. **進入管理系統**
   - 點擊「管理系統」
   - 選擇「🍽️ 套餐管理」標籤頁

2. **創建或編輯套餐**
   - 點擊「新增套餐」
   - 設定套餐名稱、價格、描述
   - **重要**：選擇套餐類型為「可選擇套餐」

3. **設定套餐選擇規則**
   - 選擇套餐後點擊「編輯項目」
   - 添加可選擇的分類和產品

### 3️⃣ 驗證套餐功能

1. **檢查點餐介面**
   - 進入 SimplePOS 點餐系統
   - 查看是否出現「🍽️ 套餐組合」按鈕

2. **測試套餐選擇**
   - 點擊切換到套餐模式
   - 選擇可選擇套餐
   - 確認選擇器正常開啟

## 🔧 如果仍然看不到套餐選項

### 檢查清單：
- [ ] 資料庫 SQL 已執行完成
- [ ] combo_products 表格有資料
- [ ] 套餐的 is_available = true
- [ ] 瀏覽器已重新整理

### 手動檢查方法：
執行以下指令檢查套餐狀態：
```bash
node quick-check.js
```

如果出現錯誤，請提供錯誤訊息，我會協助您解決！

---

**📞 需要協助時：**
1. 截圖顯示管理系統中的套餐管理頁面
2. 提供任何錯誤訊息
3. 確認是否已執行 SQL 升級
