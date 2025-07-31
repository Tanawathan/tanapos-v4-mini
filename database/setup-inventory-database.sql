-- TanaPOS V4-Mini 庫存管理系統資料庫結構
-- 三層架構：原物料 → 半成品 → 成品/菜單項目

-- ================================
-- 1. 原物料管理 (Raw Materials)
-- ================================
CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 肉類、蔬菜、調料等
    unit VARCHAR(50) NOT NULL, -- 公斤、公升、包
    current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    max_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(255),
    expiry_date DATE,
    storage_location VARCHAR(255),
    last_restock_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. 半成品管理 (Semi-finished Products)
-- ================================
CREATE TABLE IF NOT EXISTS semi_finished_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 主料、配菜、醬料等
    unit VARCHAR(50) NOT NULL, -- 份、盤、碗
    
    -- 實際庫存 (已製作的半成品)
    actual_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    min_actual_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    
    -- 虛擬庫存計算相關
    virtual_stock DECIMAL(10,3) NOT NULL DEFAULT 0, -- 計算欄位
    total_available DECIMAL(10,3) NOT NULL DEFAULT 0, -- 計算欄位
    
    preparation_time INTEGER NOT NULL DEFAULT 0, -- 製作時間(分鐘)
    shelf_life INTEGER NOT NULL DEFAULT 24, -- 保存時間(小時)
    actual_cost DECIMAL(10,2) NOT NULL DEFAULT 0, -- 實際製作成本
    virtual_cost DECIMAL(10,2) NOT NULL DEFAULT 0, -- 虛擬製作成本
    
    auto_restock BOOLEAN DEFAULT false, -- 是否自動補製
    restock_threshold DECIMAL(10,3) DEFAULT 0, -- 自動補製閾值
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 3. 食譜系統 (Recipes)
-- ================================
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- raw_to_semi, semi_to_menu, mixed_to_menu
    yield_quantity DECIMAL(10,3) NOT NULL DEFAULT 1, -- 產出數量
    preparation_time INTEGER NOT NULL DEFAULT 0, -- 製作時間
    difficulty VARCHAR(20) DEFAULT 'easy', -- easy, medium, hard
    instructions TEXT,
    
    cost_calculation VARCHAR(20) DEFAULT 'auto', -- auto, manual
    manual_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2) DEFAULT 0,
    overhead_cost DECIMAL(10,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 4. 食譜材料 (Recipe Ingredients)
-- ================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL,
    ingredient_type VARCHAR(20) NOT NULL, -- raw, semi
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    is_optional BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(recipe_id, ingredient_id, ingredient_type)
);

-- ================================
-- 5. 更新現有 products 表格支援庫存管理
-- ================================
-- 為 products 表格添加庫存相關欄位
ALTER TABLE products ADD COLUMN IF NOT EXISTS actual_stock DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS virtual_stock DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_available DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS raw_material_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS semi_product_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS margin DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_reason TEXT;

-- ================================
-- 6. 庫存異動記錄 (Stock Movements)
-- ================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- raw, semi, product
    movement_type VARCHAR(20) NOT NULL, -- in, out, adjust, waste
    quantity DECIMAL(10,3) NOT NULL,
    cost DECIMAL(10,2),
    reason VARCHAR(255),
    reference_id UUID, -- 關聯的訂單或製作記錄
    reference_type VARCHAR(50), -- order, production, adjustment
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ================================
-- 7. 半成品製作記錄 (Production Records)
-- ================================
CREATE TABLE IF NOT EXISTS production_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    semi_product_id UUID NOT NULL REFERENCES semi_finished_products(id),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    quantity_produced DECIMAL(10,3) NOT NULL,
    actual_cost DECIMAL(10,2) NOT NULL,
    production_time INTEGER, -- 實際製作時間
    quality_grade VARCHAR(20) DEFAULT 'A', -- A, B, C
    notes TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ================================
-- 8. 供應商管理 (Suppliers)
-- ================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    payment_terms VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5 星評等
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 9. 採購記錄 (Purchase Records)
-- ================================
CREATE TABLE IF NOT EXISTS purchase_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES suppliers(id),
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 10. 採購明細 (Purchase Items)
-- ================================
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES purchase_records(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    expiry_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 索引優化
-- ================================
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);
CREATE INDEX IF NOT EXISTS idx_raw_materials_active ON raw_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_raw_materials_stock ON raw_materials(current_stock);

CREATE INDEX IF NOT EXISTS idx_semi_products_category ON semi_finished_products(category);
CREATE INDEX IF NOT EXISTS idx_semi_products_active ON semi_finished_products(is_active);
CREATE INDEX IF NOT EXISTS idx_semi_products_stock ON semi_finished_products(actual_stock, virtual_stock);

CREATE INDEX IF NOT EXISTS idx_recipes_type ON recipes(type);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id, ingredient_type);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

CREATE INDEX IF NOT EXISTS idx_production_records_semi ON production_records(semi_product_id);
CREATE INDEX IF NOT EXISTS idx_production_records_date ON production_records(created_at);

-- ================================
-- 觸發器：自動更新時間戳
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要的表格創建更新觸發器
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semi_products_updated_at BEFORE UPDATE ON semi_finished_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_records_updated_at BEFORE UPDATE ON purchase_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 初始化測試資料
-- ================================

-- 插入原物料分類測試資料
INSERT INTO raw_materials (name, category, unit, current_stock, min_stock, max_stock, cost, supplier, storage_location) VALUES
('豬肉片', '肉類', '公斤', 5.0, 1.0, 10.0, 280.00, '新鮮肉品公司', '冷藏區A'),
('九層塔', '香料', '公斤', 0.5, 0.1, 2.0, 150.00, '有機農場', '冷藏區B'),
('米', '穀類', '公斤', 20.0, 5.0, 50.0, 45.00, '優質米商', '乾貨區'),
('雞蛋', '蛋類', '顆', 50, 10, 100, 8.00, '養雞場', '冷藏區C'),
('小黃瓜', '蔬菜', '條', 20, 5, 30, 12.00, '有機農場', '冷藏區B'),
('番茄', '蔬菜', '顆', 30, 5, 50, 15.00, '有機農場', '冷藏區B')
ON CONFLICT DO NOTHING;

-- 插入半成品測試資料
INSERT INTO semi_finished_products (name, category, unit, actual_stock, min_actual_stock, preparation_time, shelf_life) VALUES
('打拋豬', '主料', '份', 2.0, 1.0, 15, 4),
('白飯', '主食', '份', 10.0, 5.0, 30, 6),
('荷包蛋', '配菜', '份', 3.0, 2.0, 5, 2),
('蔬菜盤', '配菜', '份', 0.0, 1.0, 10, 3)
ON CONFLICT DO NOTHING;

-- 插入食譜測試資料
INSERT INTO recipes (name, type, yield_quantity, preparation_time, instructions) VALUES
('打拋豬製作', 'raw_to_semi', 4.0, 15, '1. 熱鍋下油 2. 爆香九層塔 3. 下豬肉片炒熟 4. 調味起鍋'),
('白飯製作', 'raw_to_semi', 10.0, 30, '1. 洗米 2. 加水 3. 電鍋蒸煮'),
('荷包蛋製作', 'raw_to_semi', 5.0, 5, '1. 熱鍋下油 2. 打蛋入鍋 3. 煎至半熟'),
('蔬菜盤製作', 'raw_to_semi', 5.0, 10, '1. 洗淨蔬菜 2. 切片擺盤'),
('打拋豬飯組合', 'mixed_to_menu', 1.0, 5, '1. 準備白飯 2. 加入打拋豬 3. 配上荷包蛋和蔬菜')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE raw_materials IS '原物料庫存管理';
COMMENT ON TABLE semi_finished_products IS '半成品庫存管理，支援實際庫存+虛擬庫存';
COMMENT ON TABLE recipes IS '食譜系統，支援多層級製作';
COMMENT ON TABLE recipe_ingredients IS '食譜所需材料明細';
COMMENT ON TABLE stock_movements IS '庫存異動記錄';
COMMENT ON TABLE production_records IS '半成品製作記錄';
COMMENT ON TABLE suppliers IS '供應商管理';
COMMENT ON TABLE purchase_records IS '採購記錄';
COMMENT ON TABLE purchase_items IS '採購明細';
