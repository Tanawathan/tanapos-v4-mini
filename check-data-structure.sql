-- 檢查套餐相關資料
SELECT 'combo_products' as table_name, count(*) as count FROM combo_products
UNION ALL
SELECT 'products' as table_name, count(*) as count FROM products
UNION ALL  
SELECT 'categories' as table_name, count(*) as count FROM categories;

-- 顯示所有套餐
SELECT 
  cp.name,
  cp.price,
  cp.combo_type,
  cp.is_available,
  cp.is_active,
  c.name as category_name
FROM combo_products cp
LEFT JOIN categories c ON cp.category_id = c.id
WHERE cp.restaurant_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY cp.sort_order;

-- 顯示所有產品
SELECT 
  p.name,
  p.price,
  p.is_available,
  p.is_active,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.restaurant_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY p.sort_order
LIMIT 5;
