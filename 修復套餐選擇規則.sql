-- 快速檢查套餐選擇規則
-- 在 Supabase Dashboard > SQL Editor 中執行

-- 1. 檢查現有套餐和其選擇規則
SELECT 
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    cp.is_available as 是否可用,
    COUNT(cc.id) as 選擇規則數量,
    STRING_AGG(cat.name, ', ') as 可選分類
FROM combo_products cp
LEFT JOIN combo_choices cc ON cp.id = cc.combo_id
LEFT JOIN categories cat ON cc.category_id = cat.id
WHERE cp.is_available = true
GROUP BY cp.id, cp.name, cp.combo_type, cp.is_available
ORDER BY cp.name;

-- 2. 如果沒有選擇規則，為可選套餐添加基本規則
DO $$
DECLARE
    combo_record RECORD;
    appetizer_cat_id UUID;
    main_cat_id UUID;
    drink_cat_id UUID;
    dessert_cat_id UUID;
BEGIN
    -- 獲取基本分類ID
    SELECT id INTO appetizer_cat_id FROM categories WHERE name = '前菜' LIMIT 1;
    SELECT id INTO main_cat_id FROM categories WHERE name = '主餐' LIMIT 1;
    SELECT id INTO drink_cat_id FROM categories WHERE name = '飲品' LIMIT 1;
    SELECT id INTO dessert_cat_id FROM categories WHERE name = '甜點' LIMIT 1;
    
    -- 為每個可選套餐添加基本選擇規則
    FOR combo_record IN 
        SELECT id, name, combo_type 
        FROM combo_products 
        WHERE combo_type = 'selectable' 
        AND is_available = true
        AND NOT EXISTS (SELECT 1 FROM combo_choices WHERE combo_id = combo_products.id)
    LOOP
        RAISE NOTICE '為套餐 % 添加選擇規則', combo_record.name;
        
        -- 添加前菜選擇
        IF appetizer_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order)
            VALUES (combo_record.id, appetizer_cat_id, 1, 1, 1);
        END IF;
        
        -- 添加主餐選擇
        IF main_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order)
            VALUES (combo_record.id, main_cat_id, 1, 1, 2);
        END IF;
        
        -- 添加飲品選擇
        IF drink_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order)
            VALUES (combo_record.id, drink_cat_id, 1, 1, 3);
        END IF;
        
        -- 添加甜點選擇（如果存在）
        IF dessert_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order)
            VALUES (combo_record.id, dessert_cat_id, 0, 1, 4);
        END IF;
        
    END LOOP;
    
    RAISE NOTICE '選擇規則添加完成';
END $$;

-- 3. 再次檢查結果
SELECT 
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    COUNT(cc.id) as 選擇規則數量,
    STRING_AGG(cat.name, ', ') as 可選分類
FROM combo_products cp
LEFT JOIN combo_choices cc ON cp.id = cc.combo_id
LEFT JOIN categories cat ON cc.category_id = cat.id
WHERE cp.is_available = true
GROUP BY cp.id, cp.name, cp.combo_type
ORDER BY cp.name;

-- 完成提示
SELECT '✅ 套餐選擇規則檢查和修復完成！現在可選套餐應該能正常顯示選擇選項。' as 狀態;
