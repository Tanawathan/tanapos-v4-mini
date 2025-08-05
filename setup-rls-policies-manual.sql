-- TanaPOS v4 AI - RLS 政策設置
-- 請在 Supabase 儀表板的 SQL 編輯器中執行此腳本

-- 1. 啟用所有表格的 RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. 刪除現有政策（如果存在）
DROP POLICY IF EXISTS "restaurants_select_policy" ON restaurants;
DROP POLICY IF EXISTS "restaurants_insert_policy" ON restaurants;
DROP POLICY IF EXISTS "restaurants_update_policy" ON restaurants;
DROP POLICY IF EXISTS "restaurants_delete_policy" ON restaurants;

DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

DROP POLICY IF EXISTS "tables_select_policy" ON tables;
DROP POLICY IF EXISTS "tables_insert_policy" ON tables;
DROP POLICY IF EXISTS "tables_update_policy" ON tables;
DROP POLICY IF EXISTS "tables_delete_policy" ON tables;

DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON orders;

DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON order_items;

-- 3. 建立餐廳表格政策
CREATE POLICY "restaurants_select_policy" ON restaurants
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "restaurants_insert_policy" ON restaurants
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND auth.jwt() ->> 'role' = 'admin')
);

CREATE POLICY "restaurants_update_policy" ON restaurants
FOR UPDATE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "restaurants_delete_policy" ON restaurants
FOR DELETE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND auth.jwt() ->> 'role' = 'admin')
);

-- 4. 建立分類表格政策
CREATE POLICY "categories_select_policy" ON categories
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "categories_insert_policy" ON categories
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "categories_update_policy" ON categories
FOR UPDATE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "categories_delete_policy" ON categories
FOR DELETE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

-- 5. 建立產品表格政策
CREATE POLICY "products_select_policy" ON products
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "products_insert_policy" ON products
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "products_update_policy" ON products
FOR UPDATE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "products_delete_policy" ON products
FOR DELETE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

-- 6. 建立桌台表格政策
CREATE POLICY "tables_select_policy" ON tables
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "tables_insert_policy" ON tables
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "tables_update_policy" ON tables
FOR UPDATE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "tables_delete_policy" ON tables
FOR DELETE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

-- 7. 建立訂單表格政策
CREATE POLICY "orders_select_policy" ON orders
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "orders_insert_policy" ON orders
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "orders_update_policy" ON orders
FOR UPDATE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
    auth.jwt() ->> 'role' = 'admin'
  ))
);

CREATE POLICY "orders_delete_policy" ON orders
FOR DELETE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND auth.jwt() ->> 'role' = 'admin')
);

-- 8. 建立訂單項目表格政策
CREATE POLICY "order_items_select_policy" ON order_items
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
        auth.jwt() ->> 'role' = 'admin'
      )
    )
  ))
);

CREATE POLICY "order_items_insert_policy" ON order_items
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
        auth.jwt() ->> 'role' = 'admin'
      )
    )
  ))
);

CREATE POLICY "order_items_update_policy" ON order_items
FOR UPDATE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
        auth.jwt() ->> 'role' = 'admin'
      )
    )
  ))
);

CREATE POLICY "order_items_delete_policy" ON order_items
FOR DELETE USING (
  auth.role() = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
        auth.jwt() ->> 'role' = 'admin'
      )
    )
  ))
);

-- 9. 建立輔助函數
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 更新管理者用戶的 metadata（確保包含 restaurant_id）
-- 注意：這需要手動在 Supabase Auth 面板中更新，或使用 Admin API

-- 執行完成提示
SELECT 'RLS 政策設置完成！' as status;
