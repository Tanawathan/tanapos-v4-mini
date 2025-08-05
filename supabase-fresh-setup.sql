-- TanaPOS V4 AI - 全新 Supabase 資料庫架構
-- 適用於全新建立的 Supabase 專案
-- 建議分段執行，每次執行一個區塊

-- =============================================
-- 第一步：啟用擴充功能
-- =============================================

-- 啟用 UUID 擴充功能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 啟用全文搜尋擴充功能
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 啟用 GIN 索引擴充功能
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================
-- 第二步：建立核心資料表
-- =============================================

-- 餐廳基本資訊表
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name varchar(255) NOT NULL,
  address text,
  phone varchar(50),
  email varchar(255),
  owner_name varchar(255),
  business_hours jsonb DEFAULT '{"monday":{"open":"09:00","close":"22:00","closed":false},"tuesday":{"open":"09:00","close":"22:00","closed":false},"wednesday":{"open":"09:00","close":"22:00","closed":false},"thursday":{"open":"09:00","close":"22:00","closed":false},"friday":{"open":"09:00","close":"22:00","closed":false},"saturday":{"open":"09:00","close":"22:00","closed":false},"sunday":{"open":"09:00","close":"22:00","closed":false}}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 菜單分類表
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  image_url text,
  color varchar(7) DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 產品資料表
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  cost_price decimal(10,2) DEFAULT 0,
  image_url text,
  barcode varchar(255),
  sku varchar(255),
  prep_time_minutes integer DEFAULT 10,
  cook_time_minutes integer DEFAULT 5,
  total_time_minutes integer DEFAULT 15,
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  allergens text[],
  nutritional_info jsonb DEFAULT '{}'::jsonb,
  variants jsonb DEFAULT '[]'::jsonb,
  tags text[],
  sort_order integer DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  track_inventory boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 桌台管理表
CREATE TABLE IF NOT EXISTS tables (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number integer NOT NULL,
  name varchar(255),
  capacity integer NOT NULL DEFAULT 4,
  location varchar(255),
  qr_code varchar(255),
  status varchar(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'out_of_order')),
  current_order_id uuid,
  last_cleaned_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(restaurant_id, table_number)
);

-- 訂單主表
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  order_number varchar(50) NOT NULL,
  customer_name varchar(255),
  customer_phone varchar(50),
  order_type varchar(50) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  subtotal decimal(10,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  tip_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) DEFAULT 0,
  payment_status varchar(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded')),
  payment_method varchar(50),
  notes text,
  special_requests text,
  estimated_completion_time timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 訂單項目表
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name varchar(255) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  modifications jsonb DEFAULT '[]'::jsonb,
  special_instructions text,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 第三步：建立索引以提升效能
-- =============================================

-- 餐廳相關索引
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(is_active);

-- 分類相關索引
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(restaurant_id, sort_order);

-- 產品相關索引
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(name gin_trgm_ops);

-- 桌台相關索引
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_number ON tables(restaurant_id, table_number);

-- 訂單相關索引
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- 訂單項目相關索引
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- =============================================
-- 第四步：建立觸發器函數
-- =============================================

-- 更新 updated_at 欄位的函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有主要資料表建立 updated_at 觸發器
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 計算訂單總額的函數
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新訂單的小計
    UPDATE orders 
    SET subtotal = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM order_items 
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    total_amount = subtotal + tax_amount - discount_amount + tip_amount
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 為訂單項目建立計算總額的觸發器
CREATE TRIGGER trigger_calculate_order_totals 
    AFTER INSERT OR UPDATE OR DELETE ON order_items 
    FOR EACH ROW EXECUTE PROCEDURE calculate_order_totals();

-- =============================================
-- 第五步：啟用 Row Level Security (RLS)
-- =============================================

-- 為所有主要資料表啟用 RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 建立基本讀取權限（開發階段允許所有讀取）
CREATE POLICY "Enable read access for all users" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tables FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true);

-- 建立寫入權限（開發階段允許所有寫入）
CREATE POLICY "Enable insert access for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert access for all users" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable update access for all users" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Enable update access for all users" ON tables FOR UPDATE USING (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable update access for all users" ON categories FOR UPDATE USING (true);
CREATE POLICY "Enable update access for all users" ON restaurants FOR UPDATE USING (true);

-- 建立刪除權限（謹慎使用）
CREATE POLICY "Enable delete access for all users" ON order_items FOR DELETE USING (true);

-- =============================================
-- 第六步：啟用即時訂閱
-- =============================================

-- 為重要資料表啟用即時更新
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;

-- =============================================
-- 第七步：插入範例資料
-- =============================================

-- 插入示範餐廳
INSERT INTO restaurants (id, name, address, phone, email, owner_name) 
VALUES (
  'demo-restaurant-uuid-001',
  'TanaPOS 示範餐廳',
  '台北市信義區信義路五段7號',
  '02-1234-5678',
  'demo@tanapos.com',
  '示範老闆'
) ON CONFLICT (id) DO NOTHING;

-- 插入菜單分類
INSERT INTO categories (id, restaurant_id, name, description, sort_order) VALUES
('demo-category-uuid-001', 'demo-restaurant-uuid-001', '主餐', '各式主餐料理', 1),
('demo-category-uuid-002', 'demo-restaurant-uuid-001', '飲品', '各式飲料', 2),
('demo-category-uuid-003', 'demo-restaurant-uuid-001', '甜點', '美味甜點', 3)
ON CONFLICT (id) DO NOTHING;

-- 插入範例產品
INSERT INTO products (id, restaurant_id, category_id, name, description, price, is_available) VALUES
('demo-product-uuid-001', 'demo-restaurant-uuid-001', 'demo-category-uuid-001', '招牌牛肉麵', '經典台式牛肉麵，湯頭濃郁', 180.00, true),
('demo-product-uuid-002', 'demo-restaurant-uuid-001', 'demo-category-uuid-001', '滷肉飯', '傳統台式滷肉飯', 80.00, true),
('demo-product-uuid-003', 'demo-restaurant-uuid-001', 'demo-category-uuid-002', '古早味紅茶', '香濃古早味紅茶', 30.00, true),
('demo-product-uuid-004', 'demo-restaurant-uuid-001', 'demo-category-uuid-002', '檸檬汽水', '清爽檸檬汽水', 40.00, true),
('demo-product-uuid-005', 'demo-restaurant-uuid-001', 'demo-category-uuid-003', '巧克力蛋糕', '濃郁巧克力蛋糕', 120.00, true)
ON CONFLICT (id) DO NOTHING;

-- 插入桌台
INSERT INTO tables (id, restaurant_id, table_number, capacity, status) VALUES
('demo-table-uuid-001', 'demo-restaurant-uuid-001', 1, 4, 'available'),
('demo-table-uuid-002', 'demo-restaurant-uuid-001', 2, 6, 'available'),
('demo-table-uuid-003', 'demo-restaurant-uuid-001', 3, 2, 'occupied'),
('demo-table-uuid-004', 'demo-restaurant-uuid-001', 4, 8, 'available')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 完成提示
-- =============================================

-- 顯示建立結果
SELECT 
  'TanaPOS V4 AI 資料庫架構建立完成！' as message,
  (SELECT COUNT(*) FROM restaurants) as restaurants_count,
  (SELECT COUNT(*) FROM categories) as categories_count,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM tables) as tables_count;
