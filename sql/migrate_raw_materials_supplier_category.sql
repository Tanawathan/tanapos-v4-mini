-- 將 raw_materials.category 中的廠商名稱搬移到 suppliers/supplier_id，並補上「原料種類」
-- 請先確認無重複或錯誤資料，再在 Supabase SQL Editor 執行。
-- 可調整條件中的 RESTAURANT_ID 為你的餐廳 ID，或移除條件以套用到所有餐廳。

-- 1) 建立缺少的供應商（以目前 category 當作供應商名稱）
INSERT INTO public.suppliers (restaurant_id, name)
SELECT DISTINCT rm.restaurant_id, rm.category
FROM public.raw_materials rm
WHERE rm.category IS NOT NULL AND trim(rm.category) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.suppliers s
    WHERE s.restaurant_id = rm.restaurant_id
      AND s.name = rm.category
  );

-- 2) 將供應商關聯寫回 raw_materials.supplier_id
UPDATE public.raw_materials rm
SET supplier_id = s.id
FROM public.suppliers s
WHERE s.restaurant_id = rm.restaurant_id
  AND s.name = rm.category
  AND (rm.supplier_id IS NULL OR rm.supplier_id <> s.id);

-- 3) 依「原料名稱」以規則推斷原料種類（category）
-- 僅在原本 category 可能是廠商名稱、或為空值時才覆蓋
UPDATE public.raw_materials rm
SET category = CASE
  WHEN rm.name ~ N'(雞|牛|豬|羊|鴨|魚|蝦|蟹|蛤|透抽|鱸|肉)' THEN '肉類/海鮮'
  WHEN rm.name ~ N'(油|橄欖油|沙拉油|耐炸油)' THEN '油品'
  WHEN rm.name ~ N'(糖|鹽|粉|粉條|澱粉|辣椒|胡椒|咖哩|醬|醋|蠔油|魚露|醬油)' THEN '調味料'
  WHEN rm.name ~ N'(菜|蔥|蒜|薑|番茄|地瓜|洋蔥|高麗|黃瓜|韭|香菜|彩椒|木耳|菇|竹筍|豆芽|芋|九層塔|薄荷|生菜)'
    THEN '蔬菜'
  WHEN rm.name ~ N'(米|粉|河粉|春捲皮|澱粉|麵|麵粉|餅皮)' THEN '穀物/粉類'
  WHEN rm.name ~ N'(奶|乳|奶水|煉乳|椰奶)' THEN '乳製品'
  WHEN rm.name ~ N'(啤酒|酒|茶|咖啡)' THEN '飲品'
  ELSE '未分類'
END
WHERE (
  rm.category IS NULL OR rm.category = '' OR
  EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.restaurant_id = rm.restaurant_id AND s.name = rm.category
  )
);

-- 4) 將仍是供應商名稱的 category 改為『未分類』（保底）
UPDATE public.raw_materials rm
SET category = '未分類'
WHERE EXISTS (
  SELECT 1 FROM public.suppliers s
  WHERE s.restaurant_id = rm.restaurant_id AND s.name = rm.category
);

-- 完成
