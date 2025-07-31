-- TanaPOS V4-Mini Database Setup
-- Execute this in Supabase SQL Editor

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 0, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tables Table
CREATE TABLE IF NOT EXISTS tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available', -- available, occupied, cleaning, reserved
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    table_id INTEGER REFERENCES tables(table_number),
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
    items JSONB NOT NULL, -- Array of order items
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert Sample Categories
INSERT INTO categories (name, description, sort_order) VALUES
    ('主餐', '主要餐點和套餐', 1),
    ('飲品', '各式飲品', 2),
    ('甜點', '甜點和小食', 3),
    ('開胃菜', '開胃菜和小菜', 4)
ON CONFLICT DO NOTHING;

-- 6. Insert Sample Products
WITH category_ids AS (
    SELECT id, name FROM categories
)
INSERT INTO products (name, description, price, category_id, is_available) VALUES
    -- 主餐
    ('紅燒牛肉麵', '經典台式牛肉麵，湯頭濃郁', 280, (SELECT id FROM category_ids WHERE name = '主餐'), true),
    ('宮保雞丁', '川式經典，香辣下飯', 250, (SELECT id FROM category_ids WHERE name = '主餐'), true),
    ('蚵仔煎', '台灣小吃經典', 120, (SELECT id FROM category_ids WHERE name = '主餐'), true),
    ('義大利肉醬麵', '經典義式料理', 220, (SELECT id FROM category_ids WHERE name = '主餐'), true),
    ('日式豬排飯', '酥脆豬排配白飯', 280, (SELECT id FROM category_ids WHERE name = '主餐'), true),
    
    -- 飲品
    ('珍珠奶茶', '台灣經典飲品', 60, (SELECT id FROM category_ids WHERE name = '飲品'), true),
    ('鮮榨柳橙汁', '新鮮現榨', 80, (SELECT id FROM category_ids WHERE name = '飲品'), true),
    ('美式咖啡', '香濃美式咖啡', 90, (SELECT id FROM category_ids WHERE name = '飲品'), true),
    ('拿鐵咖啡', '綿密拿鐵', 120, (SELECT id FROM category_ids WHERE name = '飲品'), true),
    ('檸檬汽水', '清爽檸檬汽水', 50, (SELECT id FROM category_ids WHERE name = '飲品'), true),
    
    -- 甜點
    ('提拉米蘇', '義式經典甜點', 150, (SELECT id FROM category_ids WHERE name = '甜點'), true),
    ('鬆餅', '香甜鬆餅', 180, (SELECT id FROM category_ids WHERE name = '甜點'), true),
    ('巧克力蛋糕', '濃郁巧克力', 160, (SELECT id FROM category_ids WHERE name = '甜點'), true),
    ('芒果布丁', '新鮮芒果製作', 120, (SELECT id FROM category_ids WHERE name = '甜點'), true),
    
    -- 開胃菜
    ('涼拌海帶絲', '清爽開胃', 80, (SELECT id FROM category_ids WHERE name = '開胃菜'), true),
    ('炸雞翅', '酥脆多汁', 160, (SELECT id FROM category_ids WHERE name = '開胃菜'), true),
    ('蒜泥白肉', '經典川菜', 180, (SELECT id FROM category_ids WHERE name = '開胃菜'), true),
    ('花生米', '下酒好菜', 60, (SELECT id FROM category_ids WHERE name = '開胃菜'), true)
ON CONFLICT DO NOTHING;

-- 7. Insert Sample Tables
INSERT INTO tables (table_number, capacity, status) VALUES
    (1, 2, 'available'),
    (2, 2, 'available'),
    (3, 4, 'available'),
    (4, 4, 'available'),
    (5, 4, 'available'),
    (6, 6, 'available'),
    (7, 6, 'available'),
    (8, 8, 'available'),
    (9, 4, 'available'),
    (10, 4, 'available'),
    (11, 2, 'available'),
    (12, 2, 'available')
ON CONFLICT DO NOTHING;

-- 8. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies (Allow all operations for now - adjust for production)
CREATE POLICY "Enable all operations for categories" ON categories FOR ALL USING (true);
CREATE POLICY "Enable all operations for products" ON products FOR ALL USING (true);
CREATE POLICY "Enable all operations for tables" ON tables FOR ALL USING (true);
CREATE POLICY "Enable all operations for orders" ON orders FOR ALL USING (true);

-- 11. Create Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
