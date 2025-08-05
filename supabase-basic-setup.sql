-- ================================
-- TanaPOS v4 AI - 基本權限設置 SQL
-- ================================
-- 用途: 在資料表建立前或後都可以安全執行的基本設置
-- 建議: 先執行 supabase_complete.sql，再執行此檔案

-- ================================
-- 1. 啟用必要的擴展功能
-- ================================

-- UUID 生成擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 全文搜索擴展
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 時間處理擴展
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================
-- 2. 權限設置（安全執行）
-- ================================

-- 為匿名用戶設置基本查詢權限
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 為認證用戶設置完整權限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 為服務角色設置管理權限
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================
-- 3. 序列設置
-- ================================

-- 建立訂單編號序列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'order_number_seq') THEN
    CREATE SEQUENCE order_number_seq START 1;
  END IF;
END $$;

-- ================================
-- 4. 基本自定義函數
-- ================================

-- 取得資料表列表的函數
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE(table_name text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- 檢查資料庫狀態的函數
CREATE OR REPLACE FUNCTION check_database_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  table_count integer;
  has_restaurants boolean := false;
  has_orders boolean := false;
BEGIN
  -- 計算資料表數量
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- 檢查重要資料表是否存在
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'restaurants'
  ) INTO has_restaurants;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) INTO has_orders;
  
  -- 建立狀態報告
  SELECT jsonb_build_object(
    'total_tables', table_count,
    'has_restaurants', has_restaurants,
    'has_orders', has_orders,
    'database_ready', (table_count > 10 AND has_restaurants AND has_orders),
    'status', CASE 
      WHEN table_count > 10 AND has_restaurants AND has_orders THEN 'ready'
      WHEN table_count > 0 THEN 'partial'
      ELSE 'empty'
    END
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ================================
-- 5. 即時訂閱設置（基本）
-- ================================

-- 建立基本的即時訂閱
DO $$
BEGIN
  -- 移除現有的即時訂閱（如果有）
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- 創建新的即時訂閱
  CREATE PUBLICATION supabase_realtime;
END $$;

-- ================================
-- 6. 檢查並執行狀態報告
-- ================================

-- 顯示資料庫狀態
DO $$
DECLARE
  status_info jsonb;
  table_count integer;
BEGIN
  -- 獲取狀態資訊
  SELECT check_database_status() INTO status_info;
  SELECT status_info->>'total_tables' INTO table_count;
  
  RAISE NOTICE '=================================';
  RAISE NOTICE 'TanaPOS v4 AI 基本設置完成！';
  RAISE NOTICE '=================================';
  RAISE NOTICE '📊 資料表數量: %', table_count;
  RAISE NOTICE '🏢 餐廳表存在: %', CASE WHEN (status_info->>'has_restaurants')::boolean THEN '是' ELSE '否' END;
  RAISE NOTICE '📋 訂單表存在: %', CASE WHEN (status_info->>'has_orders')::boolean THEN '是' ELSE '否' END;
  RAISE NOTICE '✅ 權限已設置';
  RAISE NOTICE '✅ 擴展功能已啟用';
  RAISE NOTICE '✅ 基本函數已建立';
  RAISE NOTICE '=================================';
  
  IF (status_info->>'database_ready')::boolean THEN
    RAISE NOTICE '🎉 資料庫已準備就緒！';
    RAISE NOTICE '建議執行: supabase-setup.sql 進行完整設置';
  ELSIF table_count > 0 THEN
    RAISE NOTICE '⚠️  資料庫部分完成';
    RAISE NOTICE '建議: 先執行 supabase_complete.sql 建立完整架構';
  ELSE
    RAISE NOTICE '📝 空資料庫';
    RAISE NOTICE '下一步: 執行 supabase_complete.sql 建立架構';
  END IF;
  
  RAISE NOTICE '=================================';
END $$;

-- 完成
SELECT 'TanaPOS v4 AI 基本設置完成 - 可以安全執行' as status;
