-- 套餐問題診斷腳本
-- 在 Supabase Dashboard > SQL Editor 中執行

-- 1. 檢查 combo_products 表是否存在和內容
SELECT '🔍 檢查 combo_products 表' as 步驟;

SELECT 
    COUNT(*) as 套餐總數,
    COUNT(CASE WHEN is_available = true THEN 1 END) as 可用套餐數,
    COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as 有分類的套餐數
FROM combo_products;

-- 2. 檢查套餐詳細內容
SELECT '📋 套餐詳細列表' as 步驟;

SELECT 
    cp.id,
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    cp.price as 價格,
    cp.is_available as 是否可用,
    cp.category_id as 分類ID,
    c.name as 分類名稱
FROM combo_products cp
LEFT JOIN categories c ON cp.category_id = c.id
ORDER BY cp.name;

-- 3. 檢查 combo_choices 選擇規則
SELECT '⚙️ 檢查選擇規則' as 步驟;

SELECT 
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    COUNT(cc.id) as 選擇規則數量,
    STRING_AGG(cat.name, ', ') as 可選分類
FROM combo_products cp
LEFT JOIN combo_choices cc ON cp.id = cc.combo_id
LEFT JOIN categories cat ON cc.category_id = cat.id
GROUP BY cp.id, cp.name, cp.combo_type
ORDER BY cp.name;

-- 4. 檢查分類系統
SELECT '📂 檢查分類系統' as 步驟;

SELECT 
    c.id,
    c.name as 分類名稱,
    c.is_active as 是否啟用,
    c.sort_order as 排序,
    COUNT(p.id) as 一般產品數量,
    COUNT(cp.id) as 套餐數量
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_available = true
LEFT JOIN combo_products cp ON c.id = cp.category_id AND cp.is_available = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.is_active, c.sort_order
ORDER BY c.sort_order, c.name;

-- 5. 檢查可能的問題
SELECT '⚠️ 問題診斷' as 步驟;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM combo_products) = 0 THEN '❌ 沒有套餐資料'
        WHEN (SELECT COUNT(*) FROM combo_products WHERE is_available = true) = 0 THEN '❌ 沒有可用的套餐'
        WHEN (SELECT COUNT(*) FROM combo_products WHERE category_id IS NOT NULL) = 0 THEN '❌ 套餐沒有分配到分類'
        WHEN (SELECT COUNT(*) FROM categories WHERE name = '套餐組合' AND is_active = true) = 0 THEN '❌ 套餐組合分類不存在或未啟用'
        WHEN (SELECT COUNT(*) FROM combo_products cp JOIN categories c ON cp.category_id = c.id WHERE c.name = '套餐組合' AND cp.is_available = true) = 0 THEN '❌ 套餐組合分類中沒有可用套餐'
        ELSE '✅ 資料結構看起來正常'
    END as 診斷結果;

-- 6. 建議修復方案
SELECT '💡 修復建議' as 步驟;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM combo_products) = 0 THEN 
            '請執行 setup-combo-system-with-examples.sql 創建範例套餐'
        WHEN (SELECT COUNT(*) FROM combo_products WHERE is_available = true) = 0 THEN 
            '請將套餐設為可用狀態: UPDATE combo_products SET is_available = true;'
        WHEN (SELECT COUNT(*) FROM combo_products WHERE category_id IS NOT NULL) = 0 THEN 
            '請執行此腳本的第3部分來分配套餐到分類'
        WHEN (SELECT COUNT(*) FROM categories WHERE name = '套餐組合' AND is_active = true) = 0 THEN 
            '請執行此腳本的第2部分來創建套餐分類'
        ELSE '資料正常，請檢查前端程式碼載入邏輯'
    END as 建議方案;

-- 7. 一鍵修復（如果需要）
SELECT '🔧 一鍵修復腳本' as 步驟;

-- 如果套餐存在但沒有分類，執行以下修復
DO $$
DECLARE
    combo_cat_id UUID;
    combo_count INTEGER;
BEGIN
    -- 檢查是否有套餐需要修復
    SELECT COUNT(*) INTO combo_count FROM combo_products WHERE category_id IS NULL;
    
    IF combo_count > 0 THEN
        -- 確保套餐分類存在
        IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '套餐組合') THEN
            INSERT INTO categories (name, description, color, sort_order, is_active) VALUES
            ('套餐組合', '各種組合套餐', '#f59e0b', 999, true);
        END IF;
        
        -- 獲取套餐分類ID
        SELECT id INTO combo_cat_id FROM categories WHERE name = '套餐組合' LIMIT 1;
        
        -- 分配所有無分類的套餐
        UPDATE combo_products 
        SET category_id = combo_cat_id 
        WHERE category_id IS NULL;
        
        RAISE NOTICE '已修復 % 個套餐的分類設定', combo_count;
    ELSE
        RAISE NOTICE '沒有需要修復的套餐';
    END IF;
END $$;
