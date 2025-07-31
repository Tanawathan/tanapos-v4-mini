-- ====================================
-- 📋 TanaPOS V4-Mini 一鍵執行 SQL
-- 🎯 請直接複製此檔案內容到 Supabase SQL Editor 執行
-- 🔗 前往: https://peubpisofenlyquqnpan.supabase.co/project/default/sql
-- ====================================

-- 🧹 清理舊資料（如果存在）
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- 📊 建立餐廳基本資訊表
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

-- 🗂️ 建立產品分類表
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

-- 🍕 建立產品表
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🪑 建立桌位表
CREATE TABLE tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    name VARCHAR(100),
    capacity INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
    qr_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- 📋 建立訂單表
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

-- 🛒 建立訂單項目表
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

-- 🚀 建立索引優化查詢性能
CREATE INDEX idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_sort_order ON products(sort_order);
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_table_number ON tables(table_number);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- ⏰ 建立自動更新時間戳記的函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 🔧 建立觸發器自動更新時間戳記
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🏢 插入示範餐廳資料
INSERT INTO restaurants (name, address, phone, email) VALUES 
('TanaPOS 示範餐廳', '台北市信義區信義路五段7號', '02-2345-6789', 'demo@tanapos.com');

-- 🏷️ 插入產品分類
INSERT INTO categories (restaurant_id, name, description, sort_order, color, icon) 
SELECT r.id, '熱飲', '各式熱飲咖啡茶品', 1, '#E53E3E', '☕'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO categories (restaurant_id, name, description, sort_order, color, icon) 
SELECT r.id, '冷飲', '各式冰飲果汁', 2, '#3182CE', '🥤'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO categories (restaurant_id, name, description, sort_order, color, icon) 
SELECT r.id, '小食', '輕食點心', 3, '#38A169', '🍰'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO categories (restaurant_id, name, description, sort_order, color, icon) 
SELECT r.id, '主餐', '正餐主食', 4, '#D69E2E', '🍝'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

-- 🍕 插入示範產品
INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '美式咖啡', '經典美式黑咖啡', 'HOT001', 120, 1
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '熱飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '拿鐵咖啡', '香濃牛奶拿鐵', 'HOT002', 150, 2
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '熱飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '卡布奇諾', '經典義式卡布奇諾', 'HOT003', 160, 3
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '熱飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '摩卡咖啡', '巧克力摩卡', 'HOT004', 170, 4
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '熱飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '冰美式', '冰鎮美式咖啡', 'COLD001', 130, 1
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '冷飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '冰拿鐵', '冰涼拿鐵咖啡', 'COLD002', 160, 2
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '冷飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '檸檬汽水', '清爽檸檬汽水', 'COLD003', 100, 3
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '冷飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '芒果汁', '新鮮芒果汁', 'COLD004', 120, 4
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '冷飲' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '起司蛋糕', '紐約起司蛋糕', 'SNACK001', 180, 1
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '小食' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '火腿三明治', '經典火腿起司三明治', 'SNACK002', 220, 2
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '小食' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '薯條', '酥脆薯條', 'SNACK003', 120, 3
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '小食' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '雞翅', '香烤雞翅 6 隻', 'SNACK004', 250, 4
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '小食' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '義大利麵', '奶油培根義大利麵', 'MAIN001', 320, 1
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '主餐' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '燉飯', '松露野菇燉飯', 'MAIN002', 380, 2
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '主餐' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '牛排', '8oz 肋眼牛排', 'MAIN003', 680, 3
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '主餐' AND c.restaurant_id = r.id;

INSERT INTO products (restaurant_id, category_id, name, description, sku, price, sort_order) 
SELECT r.id, c.id, '披薩', '瑪格麗特披薩', 'MAIN004', 420, 4
FROM restaurants r, categories c 
WHERE r.name = 'TanaPOS 示範餐廳' AND c.name = '主餐' AND c.restaurant_id = r.id;

-- 🪑 插入示範桌位
INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 1, '1號桌', 2, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 2, '2號桌', 4, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 3, '3號桌', 4, 'occupied'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 4, '4號桌', 6, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 5, '5號桌', 4, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 6, '6號桌', 2, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 7, '7號桌', 4, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 8, '8號桌', 6, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 9, '9號桌', 4, 'occupied'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 10, '10號桌', 8, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 11, '11號桌', 4, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

INSERT INTO tables (restaurant_id, table_number, name, capacity, status) 
SELECT r.id, 12, '12號桌', 2, 'available'
FROM restaurants r WHERE r.name = 'TanaPOS 示範餐廳';

-- 📋 插入示範訂單
INSERT INTO orders (restaurant_id, table_id, order_number, table_number, customer_name, subtotal, tax_amount, total_amount, status, payment_status, created_by) 
SELECT r.id, t.id, 'ORD-20250730-001', 3, '張先生', 470, 47, 517, 'preparing', 'unpaid', '服務員A'
FROM restaurants r, tables t 
WHERE r.name = 'TanaPOS 示範餐廳' AND t.table_number = 3 AND t.restaurant_id = r.id;

INSERT INTO orders (restaurant_id, table_id, order_number, table_number, customer_name, subtotal, tax_amount, total_amount, status, payment_status, created_by) 
SELECT r.id, t.id, 'ORD-20250730-002', 9, '李小姐', 680, 68, 748, 'ready', 'unpaid', '服務員B'
FROM restaurants r, tables t 
WHERE r.name = 'TanaPOS 示範餐廳' AND t.table_number = 9 AND t.restaurant_id = r.id;

-- 🛒 插入示範訂單項目
INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) 
SELECT o.id, p.id, p.name, p.sku, 2, p.price, p.price * 2, 'preparing'
FROM orders o, products p, restaurants r
WHERE o.order_number = 'ORD-20250730-001' AND p.sku = 'HOT001' AND p.restaurant_id = r.id AND r.name = 'TanaPOS 示範餐廳';

INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) 
SELECT o.id, p.id, p.name, p.sku, 1, p.price, p.price * 1, 'preparing'
FROM orders o, products p, restaurants r
WHERE o.order_number = 'ORD-20250730-001' AND p.sku = 'HOT002' AND p.restaurant_id = r.id AND r.name = 'TanaPOS 示範餐廳';

INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) 
SELECT o.id, p.id, p.name, p.sku, 1, p.price, p.price * 1, 'preparing'
FROM orders o, products p, restaurants r
WHERE o.order_number = 'ORD-20250730-001' AND p.sku = 'SNACK002' AND p.restaurant_id = r.id AND r.name = 'TanaPOS 示範餐廳';

INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) 
SELECT o.id, p.id, p.name, p.sku, 1, p.price, p.price * 1, 'ready'
FROM orders o, products p, restaurants r
WHERE o.order_number = 'ORD-20250730-002' AND p.sku = 'MAIN001' AND p.restaurant_id = r.id AND r.name = 'TanaPOS 示範餐廳';

INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) 
SELECT o.id, p.id, p.name, p.sku, 2, p.price, p.price * 2, 'ready'
FROM orders o, products p, restaurants r
WHERE o.order_number = 'ORD-20250730-002' AND p.sku = 'COLD001' AND p.restaurant_id = r.id AND r.name = 'TanaPOS 示範餐廳';

INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, status) 
SELECT o.id, p.id, p.name, p.sku, 1, p.price, p.price * 1, 'ready'
FROM orders o, products p, restaurants r
WHERE o.order_number = 'ORD-20250730-002' AND p.sku = 'SNACK001' AND p.restaurant_id = r.id AND r.name = 'TanaPOS 示範餐廳';

-- ✅ 設置完成提示
SELECT 
    'TanaPOS V4-Mini 資料庫設置完成！' as message,
    (SELECT COUNT(*) FROM restaurants) as restaurants_count,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM tables) as tables_count,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_items) as order_items_count;
