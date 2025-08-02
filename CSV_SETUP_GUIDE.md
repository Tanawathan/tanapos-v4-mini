# 📊 套餐CSV設定檔案使用指南

## 📁 已創建的檔案

### 1. `combo_rules.csv` - 套餐選擇規則
定義每個套餐可以選擇哪些分類，以及選擇數量限制。

**欄位說明：**
- `combo_name`: 套餐名稱
- `category_name`: 分類名稱
- `min_selections`: 最少選擇數量
- `max_selections`: 最多選擇數量
- `selection_description`: 選擇說明

### 2. `combo_options.csv` - 套餐選項
定義每個分類下可選擇的具體產品和價格。

**欄位說明：**
- `combo_name`: 套餐名稱
- `category_name`: 分類名稱
- `product_name`: 產品名稱
- `additional_price`: 額外加價
- `is_default`: 是否為預設選項
- `product_description`: 產品描述

### 3. `import-combo-data.sql` - 自動匯入SQL
自動將CSV資料匯入到資料庫中。

## 🚀 使用步驟

### 方法一：自動匯入（推薦）

1. **執行SQL腳本**
   - 在 Supabase Dashboard 執行 `import-combo-data.sql`
   - 腳本會自動根據現有分類創建選擇規則

2. **檢查結果**
   - 查看執行結果中的通知訊息
   - 確認套餐選擇規則是否正確創建

### 方法二：手動設定

如果自動匯入失敗，可以手動執行：

```sql
-- 1. 查看您的分類ID
SELECT id, name FROM categories WHERE is_active = true;

-- 2. 查看套餐ID
SELECT id, name FROM combo_products WHERE name = '頁日套餐';

-- 3. 手動插入規則
INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections) VALUES
('您的套餐UUID', '您的分類UUID', 1, 1);
```

## 📝 自訂您的套餐

### 修改 combo_rules.csv
根據您的實際分類名稱修改：
```csv
combo_name,category_name,min_selections,max_selections,selection_description
您的套餐,您的分類,1,1,選擇說明
```

### 修改 combo_options.csv
根據您的實際產品修改：
```csv
combo_name,category_name,product_name,additional_price,is_default,product_description
您的套餐,您的分類,您的產品,0,true,產品說明
```

## 🔧 常見問題

**Q: 為什麼看不到選擇規則？**
A: 檢查分類名稱是否與資料庫中的分類名稱匹配。

**Q: 如何修改選擇數量？**
A: 修改 `min_selections` 和 `max_selections` 欄位。

**Q: 如何添加加價選項？**
A: 在 `additional_price` 欄位設定額外價格。

## 🎯 下一步

1. 執行 `import-combo-data.sql`
2. 重新整理套餐管理頁面
3. 測試「管理選擇規則」功能
4. 在點餐系統中測試套餐選擇器

執行完成後，您的套餐系統就可以正常運作了！
