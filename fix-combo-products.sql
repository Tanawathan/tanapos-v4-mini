-- 檢查和修復套餐在 products 表中的問題

-- 1. 首先檢查 combo_products 表中的套餐
SELECT 'combo_products 表中的套餐:' as info;
SELECT id, name, price, category_id FROM combo_products;

-- 2. 檢查這些套餐是否在 products 表中
SELECT 'products 表中的套餐 (應該為空或很少):' as info;
SELECT p.id, p.name, p.price 
FROM products p 
WHERE p.id IN (SELECT id FROM combo_products);

-- 3. 插入缺失的套餐到 products 表
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
    now() as created_at,
    now() as updated_at
FROM combo_products cp
WHERE cp.id NOT IN (SELECT id FROM products WHERE id IS NOT NULL)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    image_url = EXCLUDED.image_url,
    updated_at = now();

-- 4. 確認插入結果
SELECT 'products 表中現在的套餐:' as info;
SELECT p.id, p.name, p.price 
FROM products p 
WHERE p.id IN (SELECT id FROM combo_products);

-- 5. 檢查總數
SELECT 
    (SELECT COUNT(*) FROM combo_products) as combo_products_count,
    (SELECT COUNT(*) FROM products WHERE id IN (SELECT id FROM combo_products)) as combo_in_products_count;
