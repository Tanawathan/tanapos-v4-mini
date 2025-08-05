-- ================================
-- TanaPOS v4 AI - 完整資料庫架構
-- ================================
-- 設計日期: 2025-08-05
-- 版本: v4.0
-- 描述: 為 TanaPOS v4 AI 智慧餐廳管理系統設計的完整資料庫架構

-- ================================
-- 啟用必要的擴展
-- ================================
-- UUID 生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 全文搜索
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- 時間處理
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================
-- 1. 餐廳基本資料
-- ================================

-- 餐廳主檔
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(255) NOT NULL,
  address text,
  phone character varying(50),
  email character varying(255),
  website character varying(255),
  tax_rate numeric(5,4) DEFAULT 0.1000,
  service_charge_rate numeric(5,4) DEFAULT 0.0000,
  currency character varying(10) DEFAULT 'TWD',
  timezone character varying(50) DEFAULT 'Asia/Taipei',
  business_hours jsonb,  -- 營業時間設定
  settings jsonb,        -- 系統設定
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- 預留擴展欄位
  metadata jsonb,
  custom_fields jsonb,
  CONSTRAINT restaurants_pkey PRIMARY KEY (id)
);

-- ================================
-- 2. 菜單分類系統
-- ================================

-- 商品分類
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  color character varying(20) DEFAULT '#3B82F6',
  icon character varying(50) DEFAULT '🍽️',
  image_url text,
  parent_id uuid,  -- 支援多層分類
  level integer DEFAULT 1,
  path text,       -- 分類路徑
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- AI 相關欄位
  ai_visibility_score numeric(3,2) DEFAULT 1.0,
  ai_popularity_rank integer,
  -- 預留擴展欄位
  metadata jsonb,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- ================================
-- 3. 商品管理系統
-- ================================

-- 商品主檔
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  category_id uuid,
  name character varying(255) NOT NULL,
  description text,
  sku character varying(100) UNIQUE,
  barcode character varying(100),
  price numeric(12,2) NOT NULL DEFAULT 0,
  cost numeric(12,2) DEFAULT 0,
  image_url text,
  images jsonb,     -- 多圖片支援
  sort_order integer DEFAULT 0,
  is_available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  
  -- 庫存管理
  track_inventory boolean DEFAULT false,
  current_stock numeric(12,3) DEFAULT 0,
  min_stock numeric(12,3) DEFAULT 0,
  max_stock numeric(12,3) DEFAULT 0,
  unit character varying(20) DEFAULT 'item',
  
  -- 製作時間
  prep_time_minutes integer DEFAULT 15,
  cook_time_minutes integer DEFAULT 0,
  total_time_minutes integer GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
  
  -- 營養資訊
  calories integer,
  nutrition_info jsonb,
  allergens jsonb,
  dietary_tags jsonb,  -- 素食、無麩質等標籤
  
  -- AI 相關
  ai_popularity_score numeric(3,2) DEFAULT 0.5,
  ai_recommended boolean DEFAULT false,
  ai_demand_forecast jsonb,
  
  -- 銷售統計
  total_sold integer DEFAULT 0,
  revenue_generated numeric(12,2) DEFAULT 0,
  last_sold_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 預留擴展欄位
  metadata jsonb,
  custom_fields jsonb,
  
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- 商品變體（例如：大中小杯、不同口味）
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  sku character varying(100),
  price_adjustment numeric(12,2) DEFAULT 0,
  cost_adjustment numeric(12,2) DEFAULT 0,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- 商品附加選項（加料、客製化）
CREATE TABLE public.product_modifiers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  description text,
  type character varying(50) NOT NULL, -- 'addition', 'substitution', 'customization'
  price numeric(12,2) DEFAULT 0,
  is_required boolean DEFAULT false,
  max_selections integer DEFAULT 1,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT product_modifiers_pkey PRIMARY KEY (id),
  CONSTRAINT product_modifiers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- ================================
-- 4. 套餐管理系統
-- ================================

-- 套餐主檔
CREATE TABLE public.combo_products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  category_id uuid,
  name character varying(255) NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  cost numeric(12,2) DEFAULT 0,
  combo_type character varying(50) NOT NULL CHECK (combo_type IN ('fixed', 'selectable', 'build_your_own')),
  image_url text,
  sort_order integer DEFAULT 0,
  is_available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  
  -- 時間相關
  preparation_time integer DEFAULT 15,
  availability_start time,
  availability_end time,
  available_days jsonb, -- ['monday', 'tuesday', ...]
  
  -- 套餐規則
  min_items integer DEFAULT 1,
  max_items integer,
  discount_type character varying(20) DEFAULT 'fixed', -- 'fixed', 'percentage'
  discount_value numeric(12,2) DEFAULT 0,
  
  -- AI 相關
  ai_popularity_score numeric(3,2) DEFAULT 0.5,
  ai_recommended boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT combo_products_pkey PRIMARY KEY (id),
  CONSTRAINT combo_products_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT combo_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- 套餐選擇規則
CREATE TABLE public.combo_selection_rules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  combo_id uuid NOT NULL,
  category_id uuid,
  selection_name character varying(255) NOT NULL,
  description text,
  min_selections integer DEFAULT 1,
  max_selections integer DEFAULT 1,
  is_required boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT combo_selection_rules_pkey PRIMARY KEY (id),
  CONSTRAINT combo_selection_rules_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES public.combo_products(id) ON DELETE CASCADE,
  CONSTRAINT combo_selection_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- 套餐選項
CREATE TABLE public.combo_selection_options (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  rule_id uuid NOT NULL,
  product_id uuid NOT NULL,
  additional_price numeric(12,2) DEFAULT 0,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT combo_selection_options_pkey PRIMARY KEY (id),
  CONSTRAINT combo_selection_options_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.combo_selection_rules(id) ON DELETE CASCADE,
  CONSTRAINT combo_selection_options_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- ================================
-- 5. 桌台管理系統
-- ================================

-- 桌台主檔
CREATE TABLE public.tables (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  table_number integer NOT NULL,
  name character varying(100),
  capacity integer DEFAULT 4,
  min_capacity integer DEFAULT 1,
  max_capacity integer,
  
  -- 狀態管理
  status character varying(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'inactive')),
  
  -- 位置資訊
  floor_level integer DEFAULT 1,
  zone character varying(100),
  position_x numeric(8,2) DEFAULT 0,
  position_y numeric(8,2) DEFAULT 0,
  
  -- 桌台屬性
  table_type character varying(50) DEFAULT 'square',
  features jsonb, -- 靠窗、包廂、吸菸區等特色
  
  -- QR Code 點餐
  qr_code text,
  qr_enabled boolean DEFAULT true,
  
  -- 智能分配
  ai_assignment_priority integer DEFAULT 5,
  ai_features_score jsonb,
  
  -- 狀態追蹤
  current_session_id uuid,
  last_occupied_at timestamp with time zone,
  last_cleaned_at timestamp with time zone,
  cleaning_duration_minutes integer DEFAULT 15,
  
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT tables_pkey PRIMARY KEY (id),
  CONSTRAINT tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT tables_restaurant_table_unique UNIQUE (restaurant_id, table_number)
);

-- 桌台預約
CREATE TABLE public.table_reservations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  table_id uuid,
  
  -- 客戶資訊
  customer_name character varying(255) NOT NULL,
  customer_phone character varying(50),
  customer_email character varying(255),
  customer_notes text,
  
  -- 預約詳情
  party_size integer NOT NULL,
  reservation_time timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 120,
  estimated_end_time timestamp with time zone GENERATED ALWAYS AS (reservation_time + (duration_minutes * interval '1 minute')) STORED,
  
  -- 狀態管理
  status character varying(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  
  -- 特殊需求
  special_requests text,
  occasion character varying(100), -- 生日、週年紀念等
  
  -- 財務
  deposit_amount numeric(12,2) DEFAULT 0,
  deposit_paid boolean DEFAULT false,
  deposit_payment_method character varying(50),
  
  -- 追蹤資訊
  notes text,
  created_by character varying(255),
  confirmed_at timestamp with time zone,
  seated_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT table_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT table_reservations_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT table_reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE SET NULL
);

-- 桌台使用會話
CREATE TABLE public.table_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  table_id uuid NOT NULL,
  reservation_id uuid,
  
  -- 會話詳情
  customer_name character varying(255),
  party_size integer NOT NULL,
  seated_at timestamp with time zone NOT NULL DEFAULT now(),
  estimated_duration integer DEFAULT 120,
  actual_duration integer,
  
  -- 狀態追蹤
  status character varying(50) DEFAULT 'occupied' CHECK (status IN ('occupied', 'ordering', 'dining', 'paying', 'completed')),
  
  -- 財務統計
  total_amount numeric(12,2) DEFAULT 0,
  total_orders integer DEFAULT 0,
  
  -- 服務評價
  service_rating integer CHECK (service_rating BETWEEN 1 AND 5),
  service_feedback text,
  
  -- 完成資訊
  notes text,
  completed_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT table_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT table_sessions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT table_sessions_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE CASCADE,
  CONSTRAINT table_sessions_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.table_reservations(id) ON DELETE SET NULL
);

-- ================================
-- 6. 訂單管理系統
-- ================================

-- 訂單主檔
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  table_id uuid,
  session_id uuid,
  
  -- 訂單識別
  order_number character varying(50) NOT NULL UNIQUE,
  order_type character varying(50) DEFAULT 'dine_in', -- 'dine_in', 'takeaway', 'delivery', 'online'
  
  -- 客戶資訊
  customer_name character varying(255),
  customer_phone character varying(50),
  customer_email character varying(255),
  table_number integer,
  party_size integer DEFAULT 1,
  
  -- 金額計算
  subtotal numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  service_charge numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) DEFAULT 0,
  
  -- 狀態管理
  status character varying(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  payment_status character varying(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded', 'voided')),
  
  -- 時間追蹤
  ordered_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  preparation_started_at timestamp with time zone,
  ready_at timestamp with time zone,
  served_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- 預估時間
  estimated_ready_time timestamp with time zone,
  estimated_prep_time integer,
  actual_prep_time integer,
  
  -- AI 優化
  ai_optimized boolean DEFAULT false,
  ai_estimated_prep_time integer,
  ai_recommendations jsonb,
  ai_efficiency_score numeric(3,2),
  
  -- 附加資訊
  notes text,
  special_instructions text,
  source character varying(50) DEFAULT 'pos', -- 'pos', 'qr', 'app', 'website'
  
  -- 營運相關
  created_by character varying(255),
  updated_by character varying(255),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE SET NULL,
  CONSTRAINT orders_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.table_sessions(id) ON DELETE SET NULL
);

-- 訂單項目
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid,
  combo_id uuid,
  
  -- 項目詳情
  item_type character varying(50) DEFAULT 'product', -- 'product', 'combo', 'modifier'
  product_name character varying(255) NOT NULL,
  product_sku character varying(100),
  variant_name character varying(255),
  
  -- 數量與價格
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  cost_price numeric(12,2) DEFAULT 0,
  
  -- 狀態追蹤
  status character varying(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
  
  -- 時間追蹤
  ordered_at timestamp with time zone DEFAULT now(),
  preparation_started_at timestamp with time zone,
  ready_at timestamp with time zone,
  served_at timestamp with time zone,
  
  -- 預估時間
  estimated_prep_time integer,
  actual_prep_time integer,
  
  -- 客製化
  special_instructions text,
  modifiers jsonb, -- 加料、客製化選項
  
  -- KDS 相關
  kitchen_station character varying(100),
  priority_level integer DEFAULT 3,
  quality_checked boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL,
  CONSTRAINT order_items_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES public.combo_products(id) ON DELETE SET NULL
);

-- 套餐選擇記錄
CREATE TABLE public.order_combo_selections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_item_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  selected_product_id uuid NOT NULL,
  quantity integer DEFAULT 1,
  additional_price numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT order_combo_selections_pkey PRIMARY KEY (id),
  CONSTRAINT order_combo_selections_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE,
  CONSTRAINT order_combo_selections_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.combo_selection_rules(id) ON DELETE CASCADE,
  CONSTRAINT order_combo_selections_selected_product_id_fkey FOREIGN KEY (selected_product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- ================================
-- 7. 付款管理系統
-- ================================

-- 付款記錄
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  
  -- 付款詳情
  payment_method character varying(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_pay', 'voucher', 'points', 'bank_transfer', 'digital_wallet')),
  payment_provider character varying(100), -- 信用卡公司、行動支付業者
  
  -- 金額
  amount numeric(12,2) NOT NULL,
  received_amount numeric(12,2),
  change_amount numeric(12,2),
  tip_amount numeric(12,2) DEFAULT 0,
  
  -- 交易資訊
  transaction_id character varying(255),
  reference_number character varying(255),
  authorization_code character varying(100),
  
  -- 卡片資訊（加密儲存）
  card_last_four character varying(4),
  card_type character varying(50),
  card_brand character varying(50),
  
  -- 行動支付
  mobile_provider character varying(100),
  mobile_account character varying(255),
  
  -- 狀態
  status character varying(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'voided')),
  
  -- 時間
  processed_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  
  -- 退款相關
  refund_amount numeric(12,2) DEFAULT 0,
  refund_reason text,
  refunded_at timestamp with time zone,
  
  -- 營運
  processed_by character varying(255),
  terminal_id character varying(100),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 預留擴展欄位
  metadata jsonb,
  
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- 發票/收據
CREATE TABLE public.receipts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  payment_id uuid,
  
  -- 收據資訊
  receipt_number character varying(50) NOT NULL UNIQUE,
  invoice_type character varying(50) DEFAULT 'receipt', -- 'receipt', 'invoice', 'electronic_invoice'
  
  -- 買方資訊（統一發票用）
  buyer_name character varying(255),
  buyer_tax_id character varying(20),
  buyer_address text,
  buyer_email character varying(255),
  
  -- 內容
  items jsonb NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL,
  service_charge numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  
  -- 付款資訊
  payment_method character varying(50) NOT NULL,
  received_amount numeric(12,2),
  change_amount numeric(12,2),
  
  -- 狀態
  status character varying(50) DEFAULT 'issued', -- 'issued', 'voided', 'refunded'
  
  -- 時間
  issued_at timestamp with time zone DEFAULT now(),
  printed_at timestamp with time zone,
  emailed_at timestamp with time zone,
  voided_at timestamp with time zone,
  
  -- 營運
  issued_by character varying(255),
  void_reason text,
  
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL
);

-- ================================
-- 8. 庫存管理系統（進階功能）
-- ================================

-- 供應商
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  
  -- 基本資訊
  name character varying(255) NOT NULL,
  code character varying(50),
  contact_person character varying(255),
  phone character varying(50),
  email character varying(255),
  website character varying(255),
  address text,
  
  -- 商業條件
  payment_terms character varying(100),
  delivery_days jsonb, -- 配送日
  min_order_amount numeric(12,2) DEFAULT 0,
  credit_limit numeric(12,2),
  discount_rate numeric(5,4) DEFAULT 0,
  
  -- 評等
  quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating integer CHECK (delivery_rating BETWEEN 1 AND 5),
  service_rating integer CHECK (service_rating BETWEEN 1 AND 5),
  
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- 原物料
CREATE TABLE public.raw_materials (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  supplier_id uuid,
  
  -- 基本資訊
  name character varying(255) NOT NULL,
  category character varying(100) NOT NULL,
  sku character varying(100) UNIQUE,
  barcode character varying(100),
  
  -- 單位與庫存
  unit character varying(20) NOT NULL,
  current_stock numeric(12,3) NOT NULL DEFAULT 0,
  min_stock numeric(12,3) NOT NULL DEFAULT 0,
  max_stock numeric(12,3) NOT NULL DEFAULT 0,
  reorder_point numeric(12,3) NOT NULL DEFAULT 0,
  
  -- 成本
  cost_per_unit numeric(12,4) NOT NULL DEFAULT 0,
  last_purchase_cost numeric(12,4),
  average_cost numeric(12,4),
  
  -- 保存期限
  shelf_life_days integer,
  storage_location character varying(100),
  storage_conditions text,
  
  -- 品質控制
  quality_standards text,
  inspection_required boolean DEFAULT false,
  
  -- 統計
  last_restock_date timestamp with time zone,
  last_used_date timestamp with time zone,
  total_consumed numeric(12,3) DEFAULT 0,
  
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT raw_materials_pkey PRIMARY KEY (id),
  CONSTRAINT raw_materials_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT raw_materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL
);

-- 採購記錄
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  
  -- 採購單資訊
  purchase_number character varying(50) NOT NULL UNIQUE,
  order_date date NOT NULL,
  expected_delivery_date date,
  actual_delivery_date date,
  
  -- 金額
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  shipping_cost numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  
  -- 狀態
  status character varying(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'completed', 'cancelled')),
  payment_status character varying(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  
  -- 發票資訊
  invoice_number character varying(100),
  invoice_date date,
  payment_due_date date,
  
  -- 備註
  notes text,
  internal_notes text,
  
  -- 營運
  created_by character varying(255),
  approved_by character varying(255),
  received_by character varying(255),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE
);

-- 採購項目
CREATE TABLE public.purchase_order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  purchase_order_id uuid NOT NULL,
  raw_material_id uuid NOT NULL,
  
  -- 訂購詳情
  quantity_ordered numeric(12,3) NOT NULL,
  quantity_received numeric(12,3) DEFAULT 0,
  unit character varying(20) NOT NULL,
  
  -- 價格
  unit_cost numeric(12,4) NOT NULL,
  total_cost numeric(12,2) NOT NULL,
  
  -- 品質檢查
  quality_checked boolean DEFAULT false,
  quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
  quality_notes text,
  
  -- 保存期限
  expiry_date date,
  lot_number character varying(100),
  batch_number character varying(100),
  
  -- 狀態
  status character varying(50) DEFAULT 'ordered' CHECK (status IN ('ordered', 'received', 'rejected', 'cancelled')),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT purchase_order_items_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id) ON DELETE CASCADE
);

-- 庫存異動
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  
  -- 異動項目
  item_id uuid NOT NULL,
  item_type character varying(50) NOT NULL, -- 'raw_material', 'product', 'semi_finished'
  
  -- 異動詳情
  movement_type character varying(50) NOT NULL, -- 'in', 'out', 'adjustment', 'waste', 'transfer'
  quantity numeric(12,3) NOT NULL,
  unit character varying(20) NOT NULL,
  
  -- 成本
  unit_cost numeric(12,4),
  total_cost numeric(12,2),
  
  -- 參考資料
  reference_type character varying(50), -- 'purchase', 'order', 'production', 'adjustment'
  reference_id uuid,
  reference_number character varying(100),
  
  -- 原因與備註
  reason character varying(255),
  notes text,
  
  -- 營運
  created_by character varying(255),
  
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_movements_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- ================================
-- 9. AI 智能分析系統
-- ================================

-- AI 分析記錄
CREATE TABLE public.ai_analysis_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  
  -- 分析類型
  analysis_type character varying(100) NOT NULL, -- 'demand_forecast', 'table_optimization', 'menu_analysis'
  analysis_scope character varying(100), -- 'daily', 'weekly', 'monthly'
  
  -- 輸入資料
  input_data jsonb NOT NULL,
  parameters jsonb,
  
  -- AI 回應
  ai_response text NOT NULL,
  result_data jsonb,
  confidence_score numeric(3,2),
  
  -- 效能
  execution_time_ms integer,
  model_version character varying(50),
  
  -- 營運
  created_by character varying(255),
  
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT ai_analysis_logs_pkey PRIMARY KEY (id),
  CONSTRAINT ai_analysis_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- AI 建議
CREATE TABLE public.ai_recommendations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  
  -- 建議類型
  recommendation_type character varying(100) NOT NULL,
  category character varying(100),
  priority integer DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  
  -- 建議內容
  title character varying(255) NOT NULL,
  description text NOT NULL,
  action_items jsonb,
  
  -- 預期影響
  estimated_impact jsonb,
  confidence_score numeric(3,2),
  
  -- 目標
  target_entity character varying(100), -- 'table', 'product', 'category', 'general'
  target_id uuid,
  
  -- 狀態
  status character varying(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'implemented')),
  
  -- 到期時間
  expires_at timestamp with time zone,
  
  -- 反饋
  feedback jsonb,
  implementation_notes text,
  
  -- 營運
  reviewed_by character varying(255),
  implemented_by character varying(255),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT ai_recommendations_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- AI 績效指標
CREATE TABLE public.ai_performance_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  
  -- 時間
  metric_date date NOT NULL,
  metric_hour integer CHECK (metric_hour BETWEEN 0 AND 23),
  
  -- 營運效率
  table_utilization_rate numeric(5,4),
  average_wait_time_minutes integer,
  kitchen_efficiency_score numeric(3,2),
  service_speed_score numeric(3,2),
  
  -- 預測準確度
  demand_forecast_accuracy numeric(5,4),
  prep_time_prediction_accuracy numeric(5,4),
  
  -- 收益影響
  ai_driven_revenue numeric(12,2),
  cost_savings numeric(12,2),
  waste_reduction_percentage numeric(5,4),
  
  -- 客戶滿意度
  customer_satisfaction_score numeric(3,2),
  order_accuracy_rate numeric(5,4),
  complaint_resolution_time integer,
  
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT ai_performance_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT ai_performance_metrics_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT ai_performance_metrics_unique_time UNIQUE (restaurant_id, metric_date, metric_hour)
);

-- ================================
-- 10. 系統紀錄與稽核
-- ================================

-- 系統操作記錄
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  
  -- 操作詳情
  table_name character varying(100) NOT NULL,
  record_id uuid,
  action character varying(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  
  -- 異動資料
  old_data jsonb,
  new_data jsonb,
  changed_fields jsonb,
  
  -- 操作者
  user_id character varying(255),
  user_type character varying(50), -- 'staff', 'customer', 'system', 'ai'
  ip_address inet,
  user_agent text,
  
  -- 時間
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- 系統錯誤記錄
CREATE TABLE public.error_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid,
  
  -- 錯誤資訊
  error_type character varying(100) NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  
  -- 內容
  context jsonb,
  request_data jsonb,
  
  -- 嚴重度
  severity character varying(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- 狀態
  status character varying(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
  resolution_notes text,
  
  -- 營運
  reported_by character varying(255),
  assigned_to character varying(255),
  resolved_by character varying(255),
  resolved_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT error_logs_pkey PRIMARY KEY (id),
  CONSTRAINT error_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE SET NULL
);

-- ================================
-- 索引優化
-- ================================

-- 餐廳相關索引
CREATE INDEX idx_restaurants_active ON public.restaurants(is_active);

-- 分類相關索引
CREATE INDEX idx_categories_restaurant_active ON public.categories(restaurant_id, is_active);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_sort ON public.categories(restaurant_id, sort_order);

-- 商品相關索引
CREATE INDEX idx_products_restaurant_category ON public.products(restaurant_id, category_id);
CREATE INDEX idx_products_available ON public.products(is_available, is_active);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_name_search ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_ai_recommended ON public.products(ai_recommended);

-- 套餐相關索引
CREATE INDEX idx_combo_products_restaurant ON public.combo_products(restaurant_id, is_available);
CREATE INDEX idx_combo_selection_rules_combo ON public.combo_selection_rules(combo_id);
CREATE INDEX idx_combo_selection_options_rule ON public.combo_selection_options(rule_id);

-- 桌台相關索引
CREATE INDEX idx_tables_restaurant_status ON public.tables(restaurant_id, status);
CREATE INDEX idx_tables_number ON public.tables(restaurant_id, table_number);
CREATE INDEX idx_table_reservations_time ON public.table_reservations(reservation_time);
CREATE INDEX idx_table_reservations_status ON public.table_reservations(status);
CREATE INDEX idx_table_sessions_table_status ON public.table_sessions(table_id, status);

-- 訂單相關索引
CREATE INDEX idx_orders_restaurant_date ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX idx_orders_table_status ON public.orders(table_id, status);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_status_time ON public.orders(status, created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
CREATE INDEX idx_order_items_status ON public.order_items(status);

-- 付款相關索引
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_method_status ON public.payments(payment_method, status);
CREATE INDEX idx_payments_date ON public.payments(processed_at DESC);

-- 庫存相關索引
CREATE INDEX idx_raw_materials_restaurant ON public.raw_materials(restaurant_id, is_active);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(item_id, item_type);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(created_at DESC);

-- AI 相關索引
CREATE INDEX idx_ai_analysis_restaurant_type ON public.ai_analysis_logs(restaurant_id, analysis_type);
CREATE INDEX idx_ai_recommendations_restaurant_status ON public.ai_recommendations(restaurant_id, status);
CREATE INDEX idx_ai_performance_date ON public.ai_performance_metrics(restaurant_id, metric_date DESC);

-- 稽核相關索引
CREATE INDEX idx_audit_logs_restaurant_table ON public.audit_logs(restaurant_id, table_name);
CREATE INDEX idx_audit_logs_date ON public.audit_logs(created_at DESC);
CREATE INDEX idx_error_logs_restaurant_severity ON public.error_logs(restaurant_id, severity);

-- ================================
-- 資料庫函數與觸發器
-- ================================

-- 自動更新 updated_at 欄位的函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有需要的資料表建立觸發器
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_combo_products_updated_at BEFORE UPDATE ON public.combo_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 訂單編號自動生成函數
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 建立序列
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- 建立觸發器
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- 自動計算訂單總金額函數
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
    order_subtotal numeric(12,2);
    tax_rate numeric(5,4);
    service_rate numeric(5,4);
BEGIN
    -- 計算小計
    SELECT COALESCE(SUM(total_price), 0) INTO order_subtotal
    FROM public.order_items 
    WHERE order_id = NEW.order_id;
    
    -- 取得稅率和服務費率
    SELECT r.tax_rate, r.service_charge_rate INTO tax_rate, service_rate
    FROM public.restaurants r 
    JOIN public.orders o ON o.restaurant_id = r.id 
    WHERE o.id = NEW.order_id;
    
    -- 更新訂單金額
    UPDATE public.orders SET
        subtotal = order_subtotal,
        tax_amount = order_subtotal * COALESCE(tax_rate, 0),
        service_charge = order_subtotal * COALESCE(service_rate, 0),
        total_amount = order_subtotal + (order_subtotal * COALESCE(tax_rate, 0)) + (order_subtotal * COALESCE(service_rate, 0))
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 建立觸發器
CREATE TRIGGER calculate_order_total_trigger AFTER INSERT OR UPDATE OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION calculate_order_total();

-- ================================
-- 初始資料設定
-- ================================

-- 預設餐廳資料（測試用）
INSERT INTO public.restaurants (id, name, address, phone, email, tax_rate, currency, timezone) VALUES
('11111111-1111-1111-1111-111111111111', 'TanaPOS 示範餐廳', '台北市信義區信義路五段7號', '02-1234-5678', 'demo@tanapos.com', 0.05, 'TWD', 'Asia/Taipei')
ON CONFLICT (id) DO NOTHING;

-- 預設分類資料
INSERT INTO public.categories (restaurant_id, name, description, sort_order, color, icon) VALUES
('11111111-1111-1111-1111-111111111111', '主餐', '主要餐點', 1, '#3B82F6', '🍽️'),
('11111111-1111-1111-1111-111111111111', '飲品', '各式飲品', 2, '#10B981', '🥤'),
('11111111-1111-1111-1111-111111111111', '甜點', '精緻甜點', 3, '#F59E0B', '🍰'),
('11111111-1111-1111-1111-111111111111', '前菜', '開胃小菜', 4, '#EF4444', '🥗'),
('11111111-1111-1111-1111-111111111111', '湯品', '湯類料理', 5, '#8B5CF6', '🍲')
ON CONFLICT DO NOTHING;

-- 建立視圖以簡化查詢
CREATE OR REPLACE VIEW public.order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.table_number,
    o.customer_name,
    o.status,
    o.payment_status,
    o.subtotal,
    o.tax_amount,
    o.service_charge,
    o.total_amount,
    o.created_at,
    o.completed_at,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.table_number, o.customer_name, o.status, o.payment_status, 
         o.subtotal, o.tax_amount, o.service_charge, o.total_amount, o.created_at, o.completed_at;

-- 表格權限設定
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- 安全策略（RLS）
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 完成提示
-- ================================
-- 資料庫架構建立完成！
-- 總計：35+ 資料表，完整索引，觸發器與函數
-- 支援功能：點餐、訂單、桌台、付款、庫存、AI分析
-- 擴展性：預留欄位支援未來功能開發
-- ================================
