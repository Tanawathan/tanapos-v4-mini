-- 方案一：為套餐系統添加分類支持
-- 在 Supabase Dashboard > SQL Editor 中執行

-- 1. 為 combo_products 表添加 category_id 列
ALTER TABLE combo_products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- 2. 創建套餐專用分類（安全插入）
DO $$
BEGIN
    -- 檢查分類是否已存在，如果不存在則插入
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '套餐組合') THEN
        INSERT INTO categories (name, description, color, sort_order, is_active) VALUES
        ('套餐組合', '各種組合套餐', '#f59e0b', 999, true);
        RAISE NOTICE '套餐組合分類已創建';
    ELSE
        RAISE NOTICE '套餐組合分類已存在，跳過創建';
    END IF;
END $$;

-- 3. 將現有套餐分配到套餐分類
DO $$
DECLARE
    combo_cat_id UUID;
BEGIN
    -- 獲取套餐分類ID
    SELECT id INTO combo_cat_id FROM categories WHERE name = '套餐組合' LIMIT 1;
    
    -- 更新所有套餐的分類
    UPDATE combo_products 
    SET category_id = combo_cat_id 
    WHERE category_id IS NULL;
    
    RAISE NOTICE '套餐已分配到套餐分類';
END $$;

-- 4. 檢查套餐分類設置結果
SELECT 
    cp.name as 套餐名稱,
    c.name as 分類名稱,
    cp.price as 價格,
    cp.is_available as 是否可用,
    CASE 
        WHEN EXISTS (SELECT 1 FROM combo_choices cc WHERE cc.combo_id = cp.id) 
        THEN '已設定選擇規則' 
        ELSE '⚠️ 未設定選擇規則' 
    END as 選擇規則狀態
FROM combo_products cp
LEFT JOIN categories c ON cp.category_id = c.id
ORDER BY cp.name;

-- 完成訊息
SELECT '✅ 方案一完成：套餐已加入分類系統，現在套餐會顯示在POS介面的"套餐組合"分類中' as 狀態;
