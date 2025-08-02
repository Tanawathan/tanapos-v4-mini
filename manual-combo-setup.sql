-- 手動設定套餐選擇規則的SQL
-- 請先查看您的分類，然後根據實際情況修改

-- 1. 查看現有分類
SELECT id, name FROM categories WHERE is_active = true ORDER BY name;

-- 2. 查看套餐ID
SELECT id, name FROM combo_products WHERE name = '頁日套餐';

-- 3. 手動插入選擇規則（請替換實際的UUID）
-- 範例格式：
/*
INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections) VALUES
('套餐的UUID', '前菜分類的UUID', 1, 1),
('套餐的UUID', '主餐分類的UUID', 1, 1),
('套餐的UUID', '飲品分類的UUID', 1, 1),
('套餐的UUID', '甜點分類的UUID', 1, 1);
*/

-- 4. 驗證結果
SELECT 
    cp.name as 套餐名稱,
    c.name as 分類名稱,
    cc.min_selections || '-' || cc.max_selections as 選擇範圍
FROM combo_choices cc
JOIN combo_products cp ON cc.combo_id = cp.id
JOIN categories c ON cc.category_id = c.id
WHERE cp.name = '頁日套餐'
ORDER BY c.name;
