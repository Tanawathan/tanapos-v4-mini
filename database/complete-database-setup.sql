-- ====================================
-- 📋 TanaPOS V4-Mini 完整資料庫結構
-- 🎯 包含 POS系統 + 三層庫存管理 + 桌台管理
-- 🔗 請複製此內容到 Supabase SQL Editor 執行
-- ====================================

-- 🧹 清理舊資料（如果存在）
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- 🧹 清理庫存管理相關表格
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS semi_finished_products CASCADE;
DROP TABLE IF EXISTS raw_materials CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS production_records CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS purchase_records CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;

-- 🧹 清理桌台管理相關表格
DROP TABLE IF EXISTS table_reservations CASCADE;
DROP TABLE IF EXISTS table_sessions CASCADE;

-- ======================================
-- 📊 基礎 POS 系統表格
-- ======================================

-- 餐廳基本資訊表
CREATE TABLE restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_rate DECIMAL(5,4) DEFAULT 0.1000,
    currency VARCHAR(10) DEFAULT 'TWD',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 產品分類表
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT '🍽️',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 產品表 (增強支援庫存管理)
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- 庫存管理欄位
    actual_stock DECIMAL(10,3) DEFAULT 0,
    virtual_stock DECIMAL(10,3) DEFAULT 0,
    total_available DECIMAL(10,3) DEFAULT 0,
    min_stock DECIMAL(10,3) DEFAULT 0,
    preparation_time INTEGER DEFAULT 0, -- 分鐘
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 桌位表 (增強支援桌台管理)
CREATE TABLE tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    name VARCHAR(100),
    capacity INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
    qr_code TEXT,
    
    -- 桌台管理欄位
    position_x DECIMAL(8,2) DEFAULT 0,
    position_y DECIMAL(8,2) DEFAULT 0,
    table_type VARCHAR(20) DEFAULT 'square', -- square, round, booth
    floor_plan VARCHAR(50) DEFAULT 'main',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- 訂單表
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    table_number INTEGER,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
    payment_method VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(255),
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 訂單項目表
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 📦 三層庫存管理系統
-- ======================================

-- 供應商管理
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    payment_terms VARCHAR(100),
    delivery_days VARCHAR(100), -- JSON array of days
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 原物料管理
CREATE TABLE raw_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 肉類、蔬菜、調料等
    unit VARCHAR(50) NOT NULL, -- 公斤、公升、包
    current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    max_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    expiry_date DATE,
    storage_location VARCHAR(255),
    last_restock_date TIMESTAMP WITH TIME ZONE,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 半成品管理
CREATE TABLE semi_finished_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 主料、配菜、醬料等
    unit VARCHAR(50) NOT NULL, -- 份、盤、碗
    
    -- 實際庫存
    actual_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    min_actual_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    
    -- 虛擬庫存 (計算欄位)
    virtual_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    total_available DECIMAL(10,3) NOT NULL DEFAULT 0,
    
    preparation_time INTEGER NOT NULL DEFAULT 0, -- 製作時間(分鐘)
    shelf_life INTEGER NOT NULL DEFAULT 24, -- 保存時間(小時)
    actual_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    virtual_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    auto_restock BOOLEAN DEFAULT false,
    restock_threshold DECIMAL(10,3) DEFAULT 0,
    
    sku VARCHAR(100) UNIQUE,
    recipe_id UUID, -- 關聯到 recipes 表
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 食譜系統
CREATE TABLE recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- raw_to_semi, semi_to_menu, mixed_to_menu
    target_id UUID NOT NULL, -- 目標產品ID (semi_finished_products 或 products)
    target_type VARCHAR(20) NOT NULL, -- semi, menu
    yield_quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    preparation_time INTEGER NOT NULL DEFAULT 0,
    difficulty VARCHAR(20) DEFAULT 'easy', -- easy, medium, hard
    instructions TEXT,
    
    cost_calculation VARCHAR(20) DEFAULT 'auto', -- auto, manual
    manual_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2) DEFAULT 0,
    overhead_cost DECIMAL(10,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 食譜材料
CREATE TABLE recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL,
    ingredient_type VARCHAR(20) NOT NULL, -- raw, semi
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, ingredient_id, ingredient_type)
);

-- 庫存異動記錄
CREATE TABLE stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- raw, semi, menu
    movement_type VARCHAR(20) NOT NULL, -- in, out, adjust, waste, production
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(50), -- order, production, purchase, adjustment
    reference_id UUID,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 生產記錄
CREATE TABLE production_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    produced_item_id UUID NOT NULL,
    produced_item_type VARCHAR(20) NOT NULL, -- semi, menu
    quantity_produced DECIMAL(10,3) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    production_time INTEGER, -- 實際製作時間(分鐘)
    quality_rating INTEGER DEFAULT 5, -- 1-5 星
    notes TEXT,
    produced_by VARCHAR(255),
    produced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 進貨記錄
CREATE TABLE purchase_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_number VARCHAR(100) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue
    payment_method VARCHAR(50),
    invoice_number VARCHAR(100),
    notes TEXT,
    received_by VARCHAR(255),
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 進貨項目
CREATE TABLE purchase_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID REFERENCES purchase_records(id) ON DELETE CASCADE,
    raw_material_id UUID REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    expiry_date DATE,
    lot_number VARCHAR(100),
    quality_check BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 🪑 桌台管理擴展
-- ======================================

-- 桌位預約
CREATE TABLE table_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    party_size INTEGER NOT NULL,
    reservation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 120,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    special_requests TEXT,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT false,
    notes TEXT,
    created_by VARCHAR(255),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    seated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 桌位使用記錄
CREATE TABLE table_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES table_reservations(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    party_size INTEGER NOT NULL,
    seated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    estimated_duration INTEGER DEFAULT 120, -- 預估用餐時間(分鐘)
    actual_duration INTEGER, -- 實際用餐時間(分鐘)
    status VARCHAR(20) DEFAULT 'occupied' CHECK (status IN ('occupied', 'ordering', 'dining', 'paying', 'completed')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    service_rating INTEGER, -- 1-5 星
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 🚀 索引優化
-- ======================================

-- 基礎表格索引
CREATE INDEX idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 庫存管理索引
CREATE INDEX idx_raw_materials_restaurant_id ON raw_materials(restaurant_id);
CREATE INDEX idx_raw_materials_category ON raw_materials(category);
CREATE INDEX idx_semi_finished_products_restaurant_id ON semi_finished_products(restaurant_id);
CREATE INDEX idx_recipes_restaurant_id ON recipes(restaurant_id);
CREATE INDEX idx_recipes_target ON recipes(target_id, target_type);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id, item_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_production_records_restaurant_id ON production_records(restaurant_id);
CREATE INDEX idx_purchase_records_restaurant_id ON purchase_records(restaurant_id);

-- 桌台管理索引
CREATE INDEX idx_table_reservations_restaurant_id ON table_reservations(restaurant_id);
CREATE INDEX idx_table_reservations_table_id ON table_reservations(table_id);
CREATE INDEX idx_table_reservations_time ON table_reservations(reservation_time);
CREATE INDEX idx_table_sessions_restaurant_id ON table_sessions(restaurant_id);
CREATE INDEX idx_table_sessions_table_id ON table_sessions(table_id);

-- ======================================
-- ⏰ 自動時間戳記
-- ======================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 觸發器
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_semi_finished_products_updated_at BEFORE UPDATE ON semi_finished_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_records_updated_at BEFORE UPDATE ON purchase_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_table_reservations_updated_at BEFORE UPDATE ON table_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_table_sessions_updated_at BEFORE UPDATE ON table_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- 📊 示範資料插入
-- ======================================

-- 餐廳資料
INSERT INTO restaurants (name, address, phone, email) VALUES 
('TanaPOS 示範餐廳', '台北市信義區信義路五段7號', '02-2345-6789', 'demo@tanapos.com');

-- 取得餐廳ID用於後續插入
DO $$ 
DECLARE 
    restaurant_uuid UUID;
BEGIN
    SELECT id INTO restaurant_uuid FROM restaurants WHERE name = 'TanaPOS 示範餐廳';
    
    -- 產品分類
    INSERT INTO categories (restaurant_id, name, description, sort_order, color, icon) VALUES 
    (restaurant_uuid, '熱飲', '各式熱飲咖啡茶品', 1, '#E53E3E', '☕'),
    (restaurant_uuid, '冷飲', '各式冰飲果汁', 2, '#3182CE', '🥤'),
    (restaurant_uuid, '小食', '輕食點心', 3, '#38A169', '🍰'),
    (restaurant_uuid, '主餐', '正餐主食', 4, '#D69E2E', '🍝');
    
    -- 產品項目 (熱飲)
    INSERT INTO products (restaurant_id, category_id, name, description, sku, price, cost, sort_order, preparation_time) 
    SELECT restaurant_uuid, c.id, '美式咖啡', '經典美式黑咖啡', 'HOT001', 120, 50, 1, 5
    FROM categories c WHERE c.name = '熱飲' AND c.restaurant_id = restaurant_uuid;
    
    INSERT INTO products (restaurant_id, category_id, name, description, sku, price, cost, sort_order, preparation_time) 
    SELECT restaurant_uuid, c.id, '拿鐵咖啡', '香濃牛奶拿鐵', 'HOT002', 150, 65, 2, 8
    FROM categories c WHERE c.name = '熱飲' AND c.restaurant_id = restaurant_uuid;
    
    -- 產品項目 (冷飲)
    INSERT INTO products (restaurant_id, category_id, name, description, sku, price, cost, sort_order, preparation_time) 
    SELECT restaurant_uuid, c.id, '冰美式', '冰鎮美式咖啡', 'COLD001', 130, 55, 1, 6
    FROM categories c WHERE c.name = '冷飲' AND c.restaurant_id = restaurant_uuid;
    
    -- 產品項目 (小食)
    INSERT INTO products (restaurant_id, category_id, name, description, sku, price, cost, sort_order, preparation_time) 
    SELECT restaurant_uuid, c.id, '起司蛋糕', '紐約起司蛋糕', 'SNACK001', 180, 85, 1, 3
    FROM categories c WHERE c.name = '小食' AND c.restaurant_id = restaurant_uuid;
    
    -- 產品項目 (主餐)
    INSERT INTO products (restaurant_id, category_id, name, description, sku, price, cost, sort_order, preparation_time) 
    SELECT restaurant_uuid, c.id, '義大利麵', '奶油培根義大利麵', 'MAIN001', 320, 145, 1, 25
    FROM categories c WHERE c.name = '主餐' AND c.restaurant_id = restaurant_uuid;
    
    -- 桌位資料
    INSERT INTO tables (restaurant_id, table_number, name, capacity, status, position_x, position_y, table_type) VALUES 
    (restaurant_uuid, 1, '1號桌', 2, 'available', 100, 100, 'square'),
    (restaurant_uuid, 2, '2號桌', 4, 'available', 300, 100, 'square'),
    (restaurant_uuid, 3, '3號桌', 4, 'occupied', 500, 100, 'round'),
    (restaurant_uuid, 4, '4號桌', 6, 'available', 100, 300, 'square'),
    (restaurant_uuid, 5, '5號桌', 4, 'available', 300, 300, 'square'),
    (restaurant_uuid, 6, '6號桌', 2, 'reserved', 500, 300, 'square');
    
    -- 供應商資料
    INSERT INTO suppliers (restaurant_id, name, contact_person, phone, email, address) VALUES 
    (restaurant_uuid, '優質肉品供應商', '李經理', '02-1234-5678', 'meat@supplier.com', '台北市中山區'),
    (restaurant_uuid, '新鮮蔬果', '王先生', '02-8765-4321', 'veggie@fresh.com', '台北市內湖區'),
    (restaurant_uuid, '調味專家', '陳小姐', '02-5555-6666', 'spice@expert.com', '台北市士林區');
    
    -- 原物料資料
    INSERT INTO raw_materials (restaurant_id, supplier_id, name, category, unit, current_stock, min_stock, max_stock, cost, sku) 
    SELECT restaurant_uuid, s.id, '雞胸肉', '肉類', '公斤', 15.5, 5, 50, 180, 'RAW001'
    FROM suppliers s WHERE s.name = '優質肉品供應商' AND s.restaurant_id = restaurant_uuid;
    
    INSERT INTO raw_materials (restaurant_id, supplier_id, name, category, unit, current_stock, min_stock, max_stock, cost, sku) 
    SELECT restaurant_uuid, s.id, '洋蔥', '蔬菜', '公斤', 8.2, 3, 20, 35, 'RAW002'
    FROM suppliers s WHERE s.name = '新鮮蔬果' AND s.restaurant_id = restaurant_uuid;
    
    INSERT INTO raw_materials (restaurant_id, supplier_id, name, category, unit, current_stock, min_stock, max_stock, cost, sku) 
    SELECT restaurant_uuid, s.id, '醬油', '調料', '瓶', 2, 5, 20, 45, 'RAW003'
    FROM suppliers s WHERE s.name = '調味專家' AND s.restaurant_id = restaurant_uuid;
    
    -- 半成品資料
    INSERT INTO semi_finished_products (restaurant_id, name, category, unit, actual_stock, min_actual_stock, preparation_time, shelf_life, actual_cost, sku) VALUES 
    (restaurant_uuid, '炒雞肉絲', '主料', '份', 12, 5, 15, 4, 85, 'SEMI001'),
    (restaurant_uuid, '爆炒洋蔥', '配菜', '份', 8, 3, 10, 6, 25, 'SEMI002');
    
END $$;

-- ✅ 完成提示
SELECT 
    'TanaPOS V4-Mini 完整資料庫設置完成！' as message,
    (SELECT COUNT(*) FROM restaurants) as restaurants_count,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM tables) as tables_count,
    (SELECT COUNT(*) FROM suppliers) as suppliers_count,
    (SELECT COUNT(*) FROM raw_materials) as raw_materials_count,
    (SELECT COUNT(*) FROM semi_finished_products) as semi_products_count;
