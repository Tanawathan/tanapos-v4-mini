-- ====================================
-- TanaPOS V4-Mini 核心資料庫設置
-- 餐廳 POS 系統 - 無 RLS 版本
-- ====================================

-- 清理舊資料（如果存在）
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- ====================================
-- 1. 餐廳基本資訊表
-- ====================================
CREATE TABLE restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_rate DECIMAL(5,4) DEFAULT 0.1000, -- 10% 稅率
    currency VARCHAR(10) DEFAULT 'TWD',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. 產品分類表
-- ====================================
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 藍色
    icon VARCHAR(50) DEFAULT '🍽️',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 3. 產品表
-- ====================================
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE, -- 商品編號
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(10,2) DEFAULT 0 CHECK (cost_price >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 0 CHECK (preparation_time >= 0), -- 製作時間(分鐘)
    calories INTEGER, -- 卡路里
    allergens TEXT[], -- 過敏原陣列
    tags TEXT[], -- 標籤陣列
    sort_order INTEGER DEFAULT 0,
    stock_quantity INTEGER DEFAULT -1, -- -1 表示無限庫存
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 4. 桌位表
-- ====================================
CREATE TABLE tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    table_name VARCHAR(100), -- 例如：VIP包廂A
    capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity > 0),
    location VARCHAR(100), -- 位置描述：一樓、二樓、露台等
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'reserved', 'maintenance')),
    qr_code_url TEXT, -- QR Code 連結
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- ====================================
-- 5. 訂單表
-- ====================================
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    table_number INTEGER, -- 冗余字段，方便查詢
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
    order_type VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    service_charge DECIMAL(10,2) DEFAULT 0 CHECK (service_charge >= 0),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_pay', 'line_pay', 'apple_pay')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255), -- 服務員名稱
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, order_number)
);

-- ====================================
-- 6. 訂單項目表
-- ====================================
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL, -- 冗余字段，記錄下單時的商品名稱
    product_sku VARCHAR(100), -- 冗余字段
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    special_instructions TEXT, -- 特殊要求
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
    prepared_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 建立索引以提升查詢效能
-- ====================================

-- Categories 索引
CREATE INDEX idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Products 索引
CREATE INDEX idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_sort_order ON products(sort_order);

-- Tables 索引
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_table_number ON tables(table_number);

-- Orders 索引
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Order Items 索引
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- ====================================
-- 建立觸發器以自動更新 updated_at 欄位
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有表格建立觸發器
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 插入測試資料
-- ====================================

-- 1. 插入餐廳資訊
INSERT INTO restaurants (name, address, phone, email) VALUES
('TanaPOS 示範餐廳', '台北市信義區信義路五段7號', '02-2345-6789', 'demo@tanapos.com');

-- 取得餐廳 ID
DO $$
DECLARE
    restaurant_uuid UUID;
    cat_hot_drinks UUID;
    cat_cold_drinks UUID;
    cat_snacks UUID;
    cat_main_dishes UUID;
BEGIN
    -- 取得餐廳 ID
    SELECT id INTO restaurant_uuid FROM restaurants WHERE name = 'TanaPOS 示範餐廳';

    -- 2. 插入產品分類
    INSERT INTO categories (restaurant_id, name, description, sort_order, color, icon) VALUES
    (restaurant_uuid, '熱飲', '各式熱飲咖啡茶類', 1, '#DC2626', '☕'),
    (restaurant_uuid, '冷飲', '各式冷飲果汁汽水', 2, '#2563EB', '🥤'),
    (restaurant_uuid, '小食', '輕食點心甜品', 3, '#16A34A', '🍰'),
    (restaurant_uuid, '主餐', '主要餐點料理', 4, '#EA580C', '🍝')
    RETURNING id;

    -- 取得分類 ID
    SELECT id INTO cat_hot_drinks FROM categories WHERE name = '熱飲' AND restaurant_id = restaurant_uuid;
    SELECT id INTO cat_cold_drinks FROM categories WHERE name = '冷飲' AND restaurant_id = restaurant_uuid;
    SELECT id INTO cat_snacks FROM categories WHERE name = '小食' AND restaurant_id = restaurant_uuid;
    SELECT id INTO cat_main_dishes FROM categories WHERE name = '主餐' AND restaurant_id = restaurant_uuid;

    -- 3. 插入產品
    INSERT INTO products (restaurant_id, category_id, sku, name, description, price, cost_price, preparation_time, is_available) VALUES
    -- 熱飲
    (restaurant_uuid, cat_hot_drinks, 'HOT001', '美式咖啡', '香濃美式咖啡，使用精選咖啡豆', 120, 35, 5, true),
    (restaurant_uuid, cat_hot_drinks, 'HOT002', '拿鐵咖啡', '綿密拿鐵，奶香濃郁', 150, 45, 7, true),
    (restaurant_uuid, cat_hot_drinks, 'HOT003', '卡布奇諾', '經典卡布奇諾，泡沫細緻', 140, 42, 6, true),
    (restaurant_uuid, cat_hot_drinks, 'HOT004', '摩卡咖啡', '巧克力摩卡，甜蜜誘人', 160, 48, 8, true),
    
    -- 冷飲
    (restaurant_uuid, cat_cold_drinks, 'COLD001', '冰美式', '冰涼美式咖啡，清爽不苦澀', 110, 32, 3, true),
    (restaurant_uuid, cat_cold_drinks, 'COLD002', '冰拿鐵', '冰涼拿鐵咖啡，奶香濃郁', 140, 42, 5, true),
    (restaurant_uuid, cat_cold_drinks, 'COLD003', '檸檬汽水', '清爽檸檬汽水，氣泡豐富', 80, 15, 2, true),
    (restaurant_uuid, cat_cold_drinks, 'COLD004', '鮮榨柳橙汁', '100%純鮮榨柳橙汁', 120, 35, 3, true),
    
    -- 小食
    (restaurant_uuid, cat_snacks, 'SNACK001', '鬆餅', '香甜鬆餅，配楓糖漿', 180, 55, 15, true),
    (restaurant_uuid, cat_snacks, 'SNACK002', '三明治', '新鮮三明治，多種口味', 220, 75, 10, true),
    (restaurant_uuid, cat_snacks, 'SNACK003', '起司蛋糕', '濃郁起司蛋糕，入口即化', 150, 45, 5, true),
    (restaurant_uuid, cat_snacks, 'SNACK004', '薯條', '黃金薯條，酥脆可口', 90, 25, 8, true),
    
    -- 主餐
    (restaurant_uuid, cat_main_dishes, 'MAIN001', '義大利麵', '經典義大利麵，濃郁醬汁', 280, 95, 20, true),
    (restaurant_uuid, cat_main_dishes, 'MAIN002', '漢堡套餐', '豐富漢堡套餐，含薯條飲料', 320, 115, 18, true),
    (restaurant_uuid, cat_main_dishes, 'MAIN003', '炸雞套餐', '酥脆炸雞套餐，香嫩多汁', 300, 105, 22, true),
    (restaurant_uuid, cat_main_dishes, 'MAIN004', '牛排套餐', '嫩煎牛排套餐，配菜豐富', 450, 180, 25, true);

    -- 4. 插入桌位
    INSERT INTO tables (restaurant_id, table_number, table_name, capacity, location, status) VALUES
    (restaurant_uuid, 1, '一樓1號桌', 2, '一樓窗邊', 'available'),
    (restaurant_uuid, 2, '一樓2號桌', 4, '一樓中央', 'available'),
    (restaurant_uuid, 3, '一樓3號桌', 4, '一樓角落', 'occupied'),
    (restaurant_uuid, 4, '一樓4號桌', 6, '一樓包廂', 'available'),
    (restaurant_uuid, 5, '二樓5號桌', 2, '二樓靠窗', 'available'),
    (restaurant_uuid, 6, '二樓6號桌', 4, '二樓中央', 'cleaning'),
    (restaurant_uuid, 7, '二樓7號桌', 8, '二樓大桌', 'available'),
    (restaurant_uuid, 8, '二樓8號桌', 4, '二樓包廂', 'available'),
    (restaurant_uuid, 9, '露台9號桌', 2, '露台花園', 'occupied'),
    (restaurant_uuid, 10, '露台10號桌', 6, '露台景觀', 'available'),
    (restaurant_uuid, 11, 'VIP包廂A', 4, 'VIP區域', 'available'),
    (restaurant_uuid, 12, 'VIP包廂B', 2, 'VIP區域', 'available');

END $$;

-- ====================================
-- 建立一些範例訂單（可選）
-- ====================================
DO $$
DECLARE
    restaurant_uuid UUID;
    table_3_id UUID;
    table_9_id UUID;
    order_1_id UUID;
    order_2_id UUID;
    americano_id UUID;
    latte_id UUID;
    sandwich_id UUID;
    pasta_id UUID;
BEGIN
    -- 取得必要的 ID
    SELECT id INTO restaurant_uuid FROM restaurants WHERE name = 'TanaPOS 示範餐廳';
    SELECT id INTO table_3_id FROM tables WHERE table_number = 3 AND restaurant_id = restaurant_uuid;
    SELECT id INTO table_9_id FROM tables WHERE table_number = 9 AND restaurant_id = restaurant_uuid;
    SELECT id INTO americano_id FROM products WHERE sku = 'HOT001' AND restaurant_id = restaurant_uuid;
    SELECT id INTO latte_id FROM products WHERE sku = 'HOT002' AND restaurant_id = restaurant_uuid;
    SELECT id INTO sandwich_id FROM products WHERE sku = 'SNACK002' AND restaurant_id = restaurant_uuid;
    SELECT id INTO pasta_id FROM products WHERE sku = 'MAIN001' AND restaurant_id = restaurant_uuid;

    -- 建立範例訂單1
    INSERT INTO orders (restaurant_id, order_number, table_id, table_number, status, subtotal, tax_amount, total_amount, payment_status, created_by)
    VALUES (restaurant_uuid, 'ORD-001', table_3_id, 3, 'preparing', 270, 27, 297, 'pending', '王小明')
    RETURNING id INTO order_1_id;

    -- 訂單1的項目
    INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) VALUES
    (order_1_id, americano_id, '美式咖啡', 'HOT001', 1, 120, 120, 'ready'),
    (order_1_id, sandwich_id, '三明治', 'SNACK002', 1, 220, 220, 'preparing');

    -- 建立範例訂單2
    INSERT INTO orders (restaurant_id, order_number, table_id, table_number, status, subtotal, tax_amount, total_amount, payment_status, created_by)
    VALUES (restaurant_uuid, 'ORD-002', table_9_id, 9, 'confirmed', 430, 43, 473, 'pending', '李小華')
    RETURNING id INTO order_2_id;

    -- 訂單2的項目
    INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) VALUES
    (order_2_id, latte_id, '拿鐵咖啡', 'HOT002', 1, 150, 150, 'pending'),
    (order_2_id, pasta_id, '義大利麵', 'MAIN001', 1, 280, 280, 'pending');

END $$;

-- ====================================
-- 完成提示
-- ====================================
SELECT 
    'TanaPOS V4-Mini 核心資料庫建立完成！' as message,
    (SELECT COUNT(*) FROM restaurants) as restaurants_count,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM tables) as tables_count,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_items) as order_items_count;
