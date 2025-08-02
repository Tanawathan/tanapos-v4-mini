-- 修復套餐產品問題
-- 將套餐產品插入到 products 表中以滿足外鍵約束

-- 首先，讓我們看看現有的套餐
SELECT 'Current combo products:' as message;
SELECT id, name, price, category_id FROM combo_products;

-- 檢查這些套餐是否已經在 products 表中
SELECT 'Combos already in products table:' as message;
SELECT p.id, p.name, p.price 
FROM products p 
WHERE EXISTS (SELECT 1 FROM combo_products cp WHERE cp.id = p.id);

-- 插入缺失的套餐到 products 表
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
    true as is_available,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM combo_products cp
WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.id = cp.id
);

-- 確認結果
SELECT 'After insertion - combos in products table:' as message;
SELECT p.id, p.name, p.price 
FROM products p 
WHERE EXISTS (SELECT 1 FROM combo_products cp WHERE cp.id = p.id);

-- 檢查總數統計
SELECT 
    'Summary:' as message,
    (SELECT COUNT(*) FROM combo_products) as total_combos,
    (SELECT COUNT(*) FROM products WHERE EXISTS (SELECT 1 FROM combo_products cp WHERE cp.id = products.id)) as combos_in_products;
