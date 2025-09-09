-- 建立 raw_materials 的唯一鍵，支援應用程式端的 ON CONFLICT upsert
-- 使用 (restaurant_id, name) 保證每間餐廳的原物料名稱唯一

ALTER TABLE public.raw_materials
  ADD CONSTRAINT raw_materials_restaurant_id_name_key
  UNIQUE (restaurant_id, name);

-- 建議建立索引以優化查詢
CREATE INDEX IF NOT EXISTS idx_raw_materials_restaurant_name
  ON public.raw_materials(restaurant_id, name);
