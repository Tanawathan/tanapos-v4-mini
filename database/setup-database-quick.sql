-- TanaPOS V4-Mini 快速設置腳本
-- 在 Supabase SQL Editor 中執行

-- 1. 清理舊資料（如果存在）
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;

-- 2. 建立 Categories 表
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 建立 Products 表
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 建立 Tables 表
CREATE TABLE tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 建立 Orders 表
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    table_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 插入分類測試資料
INSERT INTO categories (name, description, sort_order) VALUES
('熱飲', '各式熱飲', 1),
('冷飲', '各式冷飲', 2),
('小食', '輕食點心', 3),
('主餐', '主要餐點', 4);

-- 7. 插入產品測試資料
INSERT INTO products (name, description, price, category_id, is_available, preparation_time) VALUES
('美式咖啡', '香濃美式咖啡', 120, (SELECT id FROM categories WHERE name = '熱飲'), true, 5),
('拿鐵咖啡', '綿密拿鐵', 150, (SELECT id FROM categories WHERE name = '熱飲'), true, 7),
('卡布奇諾', '經典卡布奇諾', 140, (SELECT id FROM categories WHERE name = '熱飲'), true, 6),
('冰美式', '冰涼美式咖啡', 110, (SELECT id FROM categories WHERE name = '冷飲'), true, 3),
('冰拿鐵', '冰涼拿鐵咖啡', 140, (SELECT id FROM categories WHERE name = '冷飲'), true, 5),
('檸檬汽水', '清爽檸檬汽水', 80, (SELECT id FROM categories WHERE name = '冷飲'), true, 2),
('鬆餅', '香甜鬆餅', 180, (SELECT id FROM categories WHERE name = '小食'), true, 15),
('三明治', '新鮮三明治', 220, (SELECT id FROM categories WHERE name = '小食'), true, 10),
('義大利麵', '經典義大利麵', 280, (SELECT id FROM categories WHERE name = '主餐'), true, 20),
('漢堡套餐', '豐富漢堡套餐', 320, (SELECT id FROM categories WHERE name = '主餐'), true, 18);

-- 8. 插入桌位測試資料
INSERT INTO tables (table_number, capacity, status) VALUES
(1, 2, 'available'),
(2, 4, 'available'),
(3, 4, 'occupied'),
(4, 6, 'available'),
(5, 2, 'available'),
(6, 4, 'cleaning'),
(7, 8, 'available'),
(8, 4, 'available'),
(9, 2, 'occupied'),
(10, 6, 'available'),
(11, 4, 'available'),
(12, 2, 'available');

-- 9. 啟用 Row Level Security（可選）
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 10. 建立允許所有操作的政策（開發用）
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON tables FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);

-- 完成！您的 TanaPOS V4-Mini 資料庫已準備就緒
