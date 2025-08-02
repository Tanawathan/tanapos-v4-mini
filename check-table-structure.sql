-- 修正版套餐系統檢查和修復腳本
-- 請在 Supabase Dashboard > SQL Editor 中執行

-- 1. 檢查現有表結構
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('combo_products', 'combo_choices')
ORDER BY table_name, ordinal_position;
