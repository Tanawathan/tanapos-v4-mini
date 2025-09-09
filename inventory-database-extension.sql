-- ================================
-- TanaPOS v4 AI - 庫存管理系統擴展資料表
-- ================================
-- 設計日期: 2025-09-09
-- 版本: v1.0
-- 用途: 擴展現有資料庫以支援完整的庫存管理功能

-- ================================
-- 1. 庫存異動記錄表
-- ================================

CREATE TABLE public.inventory_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  product_id uuid,
  raw_material_id uuid,
  
  -- 異動資訊
  transaction_type character varying(50) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjust', 'transfer', 'count')),
  quantity numeric(12,3) NOT NULL,
  unit character varying(20) NOT NULL,
  
  -- 原因和參考
  reason character varying(100) NOT NULL,
  reference_type character varying(50), -- 'purchase_order', 'sales_order', 'adjustment', 'count', 'transfer'
  reference_id uuid,
  
  -- 異動前後庫存
  stock_before numeric(12,3) NOT NULL DEFAULT 0,
  stock_after numeric(12,3) NOT NULL DEFAULT 0,
  
  -- 成本資訊
  unit_cost numeric(12,4),
  total_cost numeric(12,2),
  
  -- 位置資訊
  warehouse_location character varying(255),
  from_location character varying(255), -- 調撥來源位置
  to_location character varying(255),   -- 調撥目的位置
  
  -- 批次資訊
  batch_number character varying(100),
  lot_number character varying(100),
  expiry_date date,
  
  -- 操作資訊
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  notes text,
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_transactions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT inventory_transactions_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  
  -- 確保 product_id 和 raw_material_id 至少有一個不為空
  CONSTRAINT inventory_transactions_item_check CHECK (
    (product_id IS NOT NULL AND raw_material_id IS NULL) OR 
    (product_id IS NULL AND raw_material_id IS NOT NULL)
  )
);

-- 為庫存異動記錄表建立索引
CREATE INDEX inventory_transactions_restaurant_id_idx ON public.inventory_transactions(restaurant_id);
CREATE INDEX inventory_transactions_product_id_idx ON public.inventory_transactions(product_id);
CREATE INDEX inventory_transactions_raw_material_id_idx ON public.inventory_transactions(raw_material_id);
CREATE INDEX inventory_transactions_created_at_idx ON public.inventory_transactions(created_at);
CREATE INDEX inventory_transactions_type_idx ON public.inventory_transactions(transaction_type);

-- ================================
-- 2. 庫存警示表
-- ================================

CREATE TABLE public.stock_alerts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  product_id uuid,
  raw_material_id uuid,
  
  -- 警示資訊
  alert_type character varying(50) NOT NULL CHECK (alert_type IN ('low_stock', 'overstock', 'expired', 'expiring', 'out_of_stock')),
  alert_level character varying(20) DEFAULT 'warning' CHECK (alert_level IN ('info', 'warning', 'critical')),
  title character varying(255) NOT NULL,
  message text NOT NULL,
  
  -- 庫存資訊
  current_stock numeric(12,3),
  threshold_value numeric(12,3),
  
  -- 狀態
  status character varying(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  
  -- 自動處理
  auto_resolve boolean DEFAULT false,
  auto_resolve_at timestamp with time zone,
  
  -- 時間
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT stock_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT stock_alerts_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT stock_alerts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT stock_alerts_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  
  -- 確保 product_id 和 raw_material_id 至少有一個不為空
  CONSTRAINT stock_alerts_item_check CHECK (
    (product_id IS NOT NULL AND raw_material_id IS NULL) OR 
    (product_id IS NULL AND raw_material_id IS NOT NULL)
  )
);

-- 為庫存警示表建立索引
CREATE INDEX stock_alerts_restaurant_id_idx ON public.stock_alerts(restaurant_id);
CREATE INDEX stock_alerts_status_idx ON public.stock_alerts(status);
CREATE INDEX stock_alerts_alert_type_idx ON public.stock_alerts(alert_type);
CREATE INDEX stock_alerts_created_at_idx ON public.stock_alerts(created_at);

-- ================================
-- 3. 盤點記錄表
-- ================================

CREATE TABLE public.inventory_counts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  
  -- 盤點資訊
  count_number character varying(50) NOT NULL UNIQUE,
  count_type character varying(50) NOT NULL CHECK (count_type IN ('full', 'partial', 'cycle', 'spot', 'urgent')),
  count_date date NOT NULL,
  status character varying(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved', 'cancelled')),
  
  -- 盤點範圍
  location character varying(255),
  category_filter jsonb, -- 分類篩選條件
  product_filter jsonb,  -- 商品篩選條件
  
  -- 統計資訊
  total_items integer DEFAULT 0,
  counted_items integer DEFAULT 0,
  variance_items integer DEFAULT 0, -- 有差異的項目數
  total_variance_value numeric(12,2) DEFAULT 0, -- 總差異金額
  
  -- 操作資訊
  created_by uuid NOT NULL,
  approved_by uuid,
  cancelled_by uuid,
  
  -- 時間資訊
  created_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  approved_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  
  -- 備註
  notes text,
  cancel_reason text,
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT inventory_counts_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_counts_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- 為盤點記錄表建立索引
CREATE INDEX inventory_counts_restaurant_id_idx ON public.inventory_counts(restaurant_id);
CREATE INDEX inventory_counts_status_idx ON public.inventory_counts(status);
CREATE INDEX inventory_counts_count_date_idx ON public.inventory_counts(count_date);
CREATE INDEX inventory_counts_created_at_idx ON public.inventory_counts(created_at);

-- ================================
-- 4. 盤點明細表
-- ================================

CREATE TABLE public.inventory_count_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  count_id uuid NOT NULL,
  product_id uuid,
  raw_material_id uuid,
  
  -- 盤點數據
  book_quantity numeric(12,3) NOT NULL DEFAULT 0, -- 帳面數量
  actual_quantity numeric(12,3), -- 實際數量
  variance_quantity numeric(12,3) GENERATED ALWAYS AS (actual_quantity - book_quantity) STORED, -- 差異數量
  
  -- 成本影響
  unit_cost numeric(12,4) NOT NULL DEFAULT 0,
  book_value numeric(12,2) GENERATED ALWAYS AS (book_quantity * unit_cost) STORED, -- 帳面價值
  actual_value numeric(12,2) GENERATED ALWAYS AS (COALESCE(actual_quantity, 0) * unit_cost) STORED, -- 實際價值
  variance_value numeric(12,2) GENERATED ALWAYS AS ((COALESCE(actual_quantity, 0) - book_quantity) * unit_cost) STORED, -- 差異金額
  
  -- 位置資訊
  warehouse_location character varying(255),
  
  -- 批次資訊
  batch_number character varying(100),
  lot_number character varying(100),
  expiry_date date,
  
  -- 盤點狀態
  counted boolean DEFAULT false,
  counted_by uuid,
  counted_at timestamp with time zone,
  verified boolean DEFAULT false,
  verified_by uuid,
  verified_at timestamp with time zone,
  
  -- 差異處理
  variance_approved boolean DEFAULT false,
  variance_approved_by uuid,
  variance_approved_at timestamp with time zone,
  adjustment_created boolean DEFAULT false, -- 是否已建立調整單
  
  -- 備註
  notes text,
  variance_reason text,
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT inventory_count_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_count_items_count_id_fkey FOREIGN KEY (count_id) REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  CONSTRAINT inventory_count_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT inventory_count_items_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  
  -- 確保 product_id 和 raw_material_id 至少有一個不為空
  CONSTRAINT inventory_count_items_item_check CHECK (
    (product_id IS NOT NULL AND raw_material_id IS NULL) OR 
    (product_id IS NULL AND raw_material_id IS NOT NULL)
  ),
  
  -- 確保每個盤點中的商品不重複
  CONSTRAINT inventory_count_items_unique_product UNIQUE (count_id, product_id, warehouse_location, batch_number),
  CONSTRAINT inventory_count_items_unique_raw_material UNIQUE (count_id, raw_material_id, warehouse_location, batch_number)
);

-- 為盤點明細表建立索引
CREATE INDEX inventory_count_items_count_id_idx ON public.inventory_count_items(count_id);
CREATE INDEX inventory_count_items_product_id_idx ON public.inventory_count_items(product_id);
CREATE INDEX inventory_count_items_raw_material_id_idx ON public.inventory_count_items(raw_material_id);
CREATE INDEX inventory_count_items_counted_idx ON public.inventory_count_items(counted);
CREATE INDEX inventory_count_items_variance_idx ON public.inventory_count_items(variance_quantity) WHERE variance_quantity != 0;

-- ================================
-- 5. 觸發器和函數
-- ================================

-- 更新 updated_at 欄位的通用函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要的表格加入 updated_at 觸發器
CREATE TRIGGER update_stock_alerts_updated_at 
    BEFORE UPDATE ON public.stock_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 庫存警示自動生成函數
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS void AS $$
DECLARE
    product_record RECORD;
    raw_material_record RECORD;
    alert_exists boolean;
BEGIN
    -- 檢查商品庫存
    FOR product_record IN 
        SELECT p.id, p.restaurant_id, p.name, p.current_stock, p.min_stock, p.max_stock
        FROM public.products p
        WHERE p.is_active = true AND p.track_inventory = true
    LOOP
        -- 檢查低庫存
        IF product_record.current_stock <= product_record.min_stock THEN
            SELECT EXISTS(
                SELECT 1 FROM public.stock_alerts 
                WHERE product_id = product_record.id 
                AND alert_type = 'low_stock' 
                AND status = 'active'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.stock_alerts (
                    restaurant_id, product_id, alert_type, alert_level, 
                    title, message, current_stock, threshold_value
                ) VALUES (
                    product_record.restaurant_id, product_record.id, 'low_stock',
                    CASE WHEN product_record.current_stock = 0 THEN 'critical' ELSE 'warning' END,
                    '商品庫存不足', 
                    '商品 ' || product_record.name || ' 庫存已低於安全庫存',
                    product_record.current_stock, product_record.min_stock
                );
            END IF;
        END IF;
        
        -- 檢查庫存過量
        IF product_record.max_stock > 0 AND product_record.current_stock >= product_record.max_stock THEN
            SELECT EXISTS(
                SELECT 1 FROM public.stock_alerts 
                WHERE product_id = product_record.id 
                AND alert_type = 'overstock' 
                AND status = 'active'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.stock_alerts (
                    restaurant_id, product_id, alert_type, alert_level,
                    title, message, current_stock, threshold_value
                ) VALUES (
                    product_record.restaurant_id, product_record.id, 'overstock', 'info',
                    '商品庫存過量', 
                    '商品 ' || product_record.name || ' 庫存已超過最大庫存',
                    product_record.current_stock, product_record.max_stock
                );
            END IF;
        END IF;
    END LOOP;
    
    -- 檢查原物料庫存（類似邏輯）
    FOR raw_material_record IN 
        SELECT rm.id, rm.restaurant_id, rm.name, rm.current_stock, rm.min_stock, rm.max_stock
        FROM public.raw_materials rm
        WHERE rm.is_active = true
    LOOP
        -- 檢查低庫存
        IF raw_material_record.current_stock <= raw_material_record.min_stock THEN
            SELECT EXISTS(
                SELECT 1 FROM public.stock_alerts 
                WHERE raw_material_id = raw_material_record.id 
                AND alert_type = 'low_stock' 
                AND status = 'active'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.stock_alerts (
                    restaurant_id, raw_material_id, alert_type, alert_level,
                    title, message, current_stock, threshold_value
                ) VALUES (
                    raw_material_record.restaurant_id, raw_material_record.id, 'low_stock',
                    CASE WHEN raw_material_record.current_stock = 0 THEN 'critical' ELSE 'warning' END,
                    '原物料庫存不足', 
                    '原物料 ' || raw_material_record.name || ' 庫存已低於安全庫存',
                    raw_material_record.current_stock, raw_material_record.min_stock
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 6. 權限設置
-- ================================

-- 為 authenticated 用戶設置基本權限
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_counts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_count_items TO authenticated;

-- 為 anon 用戶設置查詢權限（如果需要）
GRANT SELECT ON public.inventory_transactions TO anon;
GRANT SELECT ON public.stock_alerts TO anon;
GRANT SELECT ON public.inventory_counts TO anon;
GRANT SELECT ON public.inventory_count_items TO anon;

-- ================================
-- 7. 初始化資料和測試
-- ================================

-- 執行一次庫存檢查以產生初始警示
SELECT check_stock_levels();

-- 建立測試資料的函數
CREATE OR REPLACE FUNCTION create_inventory_test_data()
RETURNS void AS $$
DECLARE
    test_restaurant_id uuid := '11111111-1111-1111-1111-111111111111';
    test_product_id uuid;
    test_raw_material_id uuid;
BEGIN
    -- 獲取測試商品 ID
    SELECT id INTO test_product_id FROM public.products WHERE restaurant_id = test_restaurant_id LIMIT 1;
    SELECT id INTO test_raw_material_id FROM public.raw_materials WHERE restaurant_id = test_restaurant_id LIMIT 1;
    
    -- 如果找到測試商品，建立一些測試異動記錄
    IF test_product_id IS NOT NULL THEN
        INSERT INTO public.inventory_transactions (
            restaurant_id, product_id, transaction_type, quantity, unit,
            reason, stock_before, stock_after, unit_cost
        ) VALUES 
        (test_restaurant_id, test_product_id, 'in', 100, 'pcs', '期初庫存', 0, 100, 10.00),
        (test_restaurant_id, test_product_id, 'out', 20, 'pcs', '銷售出庫', 100, 80, 10.00),
        (test_restaurant_id, test_product_id, 'adjust', -5, 'pcs', '盤點調整', 80, 75, 10.00);
    END IF;
    
    -- 建立測試盤點記錄
    INSERT INTO public.inventory_counts (
        restaurant_id, count_number, count_type, count_date, status, created_by
    ) VALUES (
        test_restaurant_id, 'COUNT-2025-001', 'full', CURRENT_DATE, 'draft', 
        (SELECT auth.uid())
    );
    
    RAISE NOTICE '庫存管理測試資料已建立完成！';
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 8. 完成訊息
-- ================================

DO $$
BEGIN
    RAISE NOTICE '=================================';
    RAISE NOTICE '🎉 庫存管理系統資料表建立完成！';
    RAISE NOTICE '=================================';
    RAISE NOTICE '✅ inventory_transactions - 庫存異動記錄表';
    RAISE NOTICE '✅ stock_alerts - 庫存警示表';
    RAISE NOTICE '✅ inventory_counts - 盤點記錄表';
    RAISE NOTICE '✅ inventory_count_items - 盤點明細表';
    RAISE NOTICE '✅ 相關函數和觸發器已建立';
    RAISE NOTICE '✅ 權限設置已完成';
    RAISE NOTICE '=================================';
    RAISE NOTICE '🚀 可以開始執行測試資料建立：';
    RAISE NOTICE 'SELECT create_inventory_test_data();';
    RAISE NOTICE '=================================';
END $$;
