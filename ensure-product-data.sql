-- 確保套餐產品數據完整性的 SQL 腳本

-- 1. 檢查現有產品和套餐
SELECT 'Current products:' as info;
SELECT id, name, price, category_id FROM products ORDER BY name;

SELECT 'Current combos:' as info;
SELECT id, name, price, category_id FROM combo_products ORDER BY name;

-- 2. 插入套餐到 products 表 (如果不存在)
INSERT INTO products (
    id, 
    name, 
    description, 
    price, 
    category_id, 
    image_url, 
    is_available,
    created_at,
    updated_at
)
SELECT 
    cp.id,
    cp.name,
    cp.description,
    cp.price,
    cp.category_id,
    cp.image_url,
    cp.is_available,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM combo_products cp
WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.id = cp.id
)
ON CONFLICT (id) DO NOTHING;

-- 3. 確保有一些基本產品數據 (如果產品表為空)
INSERT INTO products (id, name, description, price, category_id, is_available) VALUES
('prod-1', '經典漢堡', '牛肉漢堡配生菜番茄', 120, (SELECT id FROM categories WHERE name = '主餐' LIMIT 1), true),
('prod-2', '薯條', '酥脆黃金薯條', 60, (SELECT id FROM categories WHERE name = '配菜' LIMIT 1), true),
('prod-3', '可樂', '冰涼可樂', 35, (SELECT id FROM categories WHERE name = '飲品' LIMIT 1), true),
('prod-4', '雞塊', '酥脆雞塊 6 塊', 80, (SELECT id FROM categories WHERE name = '配菜' LIMIT 1), true),
('prod-5', '沙拉', '新鮮蔬菜沙拉', 90, (SELECT id FROM categories WHERE name = '配菜' LIMIT 1), true)
ON CONFLICT (id) DO NOTHING;

-- 4. 最終檢查
SELECT 'Final check - All products including combos:' as info;
SELECT 
    p.id, 
    p.name, 
    p.price, 
    c.name as category_name,
    CASE WHEN cp.id IS NOT NULL THEN 'Combo' ELSE 'Product' END as type
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN combo_products cp ON p.id = cp.id
ORDER BY type, p.name;
