-- 新增測試套餐資料
INSERT INTO combo_products (
  id,
  restaurant_id,
  category_id,
  name,
  description,
  price,
  combo_type,
  is_available,
  is_active,
  sort_order
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000', -- 使用現有的餐廳 ID
  (SELECT id FROM categories WHERE name LIKE '%主食%' LIMIT 1), -- 選擇主食分類
  '經典套餐',
  '包含主菜、小菜、飲料的超值組合',
  280.00,
  'selectable',
  true,
  true,
  10
), (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM categories WHERE name LIKE '%主食%' LIMIT 1),
  '商務套餐',
  '精選商務人士喜愛的營養均衡套餐',
  350.00,
  'fixed',
  true,
  true,
  11
), (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM categories WHERE name LIKE '%飲料%' LIMIT 1),
  '下午茶套餐',
  '咖啡或茶飲搭配精緻點心',
  120.00,
  'selectable',
  true,
  true,
  12
);
