// KDS 系統類型定義 (基於 Supabase Schema)

// 基於 supabase.sql 的訂單狀態 (對應 orders.status)
export enum OrderStatus {
  PENDING = 'pending',       // 待處理
  CONFIRMED = 'confirmed',   // 已確認
  PREPARING = 'preparing',   // 製作中
  READY = 'ready',          // 已完成
  SERVED = 'served',        // 已送出
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled'    // 已取消
}

// 基於 supabase.sql 的餐點狀態 (對應 order_items.status)
export enum MenuItemStatus {
  PENDING = 'pending',       // 待處理
  CONFIRMED = 'confirmed',   // 已確認
  PREPARING = 'preparing',   // 製作中
  READY = 'ready',          // 已完成
  SERVED = 'served',        // 已送出
  CANCELLED = 'cancelled'    // 已取消
}

// 餐點分類 (基於 categories 表結構)
export enum MenuCategory {
  APPETIZERS = 'appetizers',   // 前菜
  MAIN_COURSE = 'main_course', // 主餐
  BEVERAGES = 'beverages',     // 飲品
  A_LA_CARTE = 'a_la_carte',   // 單點
  ADDITIONAL = 'additional',   // 加點
  DESSERTS = 'desserts'        // 甜點
}

// 緊急程度
export type UrgencyLevel = 'low' | 'medium' | 'high';

// KDS 訂單介面 (基於 orders 表 - 已更新至真實結構)
export interface KDSOrder {
  id: string;                       // orders.id
  restaurant_id: string;            // orders.restaurant_id
  table_id?: string;                // orders.table_id
  session_id?: string;              // orders.session_id
  order_number: string;             // orders.order_number
  order_type: string;               // orders.order_type (dine_in, takeout, delivery)
  customer_name?: string;           // orders.customer_name
  customer_phone?: string;          // orders.customer_phone
  customer_email?: string;          // orders.customer_email
  table_number?: number;            // orders.table_number
  party_size: number;               // orders.party_size
  subtotal: number;                 // orders.subtotal
  discount_amount: number;          // orders.discount_amount
  tax_amount: number;               // orders.tax_amount
  service_charge: number;           // orders.service_charge
  total_amount: number;             // orders.total_amount
  status: OrderStatus;              // orders.status
  payment_method?: string;          // orders.payment_method
  payment_status: string;           // orders.payment_status
  
  // 時間追蹤欄位
  ordered_at: string;               // orders.ordered_at
  confirmed_at?: string;            // orders.confirmed_at
  preparation_started_at?: string;  // orders.preparation_started_at
  ready_at?: string;                // orders.ready_at
  served_at?: string;               // orders.served_at
  completed_at?: string;            // orders.completed_at
  
  // 預估時間
  estimated_ready_time?: string;    // orders.estimated_ready_time
  estimated_prep_time?: number;     // orders.estimated_prep_time
  actual_prep_time?: number;        // orders.actual_prep_time
  
  // AI 功能
  ai_optimized: boolean;            // orders.ai_optimized
  ai_estimated_prep_time?: number;  // orders.ai_estimated_prep_time
  ai_recommendations?: any;         // orders.ai_recommendations
  ai_complexity_score?: number;     // orders.ai_complexity_score
  ai_efficiency_score?: number;     // orders.ai_efficiency_score
  
  // 其他欄位
  notes?: string;                   // orders.notes
  special_instructions?: string;    // orders.special_instructions
  source: string;                   // orders.source
  created_by?: string;              // orders.created_by
  updated_by?: string;              // orders.updated_by
  created_at: string;               // orders.created_at
  updated_at: string;               // orders.updated_at
  metadata?: any;                   // orders.metadata
  
  // KDS 計算欄位 (非數據庫欄位)
  menuItems?: KDSMenuItem[];        // 關聯的訂單項目
  isExpanded?: boolean;             // 卡片是否展開
  urgencyLevel?: UrgencyLevel;      // 緊急程度
  totalItems?: number;              // 總項目數
  completedItems?: number;          // 已完成項目數
}

// KDS 餐點介面 (基於 order_items 表 - 已更新至真實結構)
export interface KDSMenuItem {
  id: string;                       // order_items.id
  order_id: string;                 // order_items.order_id
  product_id?: string;              // order_items.product_id
  combo_id?: string;                // order_items.combo_id
  item_type: string;                // order_items.item_type
  product_name: string;             // order_items.product_name
  product_sku?: string;             // order_items.product_sku
  variant_name?: string;            // order_items.variant_name
  quantity: number;                 // order_items.quantity
  unit_price: number;               // order_items.unit_price
  total_price: number;              // order_items.total_price
  cost_price: number;               // order_items.cost_price
  status: MenuItemStatus;           // order_items.status
  
  // 時間追蹤欄位
  ordered_at: string;               // order_items.ordered_at
  preparation_started_at?: string;  // order_items.preparation_started_at
  ready_at?: string;                // order_items.ready_at
  served_at?: string;               // order_items.served_at
  estimated_prep_time?: number;     // order_items.estimated_prep_time
  actual_prep_time?: number;        // order_items.actual_prep_time
  
  // 廚房管理欄位
  special_instructions?: string;    // order_items.special_instructions
  modifiers?: any;                  // order_items.modifiers
  kitchen_station?: string;         // order_items.kitchen_station
  priority_level: number;           // order_items.priority_level
  quality_checked: boolean;         // order_items.quality_checked
  
  created_at: string;               // order_items.created_at
  updated_at: string;               // order_items.updated_at
  
  // KDS 計算欄位
  category?: MenuCategory;          // 從 products.category_id 關聯
  urgencyLevel?: UrgencyLevel;      // 基於時間計算
  
  // 套餐選擇資料
  combo_selections?: KDSComboSelection[];
  
  // 套餐組件相關字段
  isComboComponent?: boolean;       // 是否為套餐組件
  parentComboId?: string;           // 父套餐訂單項目ID
  componentIndex?: number;          // 在套餐中的組件索引
}

// 套餐選擇 (基於 order_combo_selections 表)
export interface KDSComboSelection {
  id: string;                       // order_combo_selections.id
  order_item_id: string;           // order_combo_selections.order_item_id
  rule_id: string;                 // order_combo_selections.rule_id
  selected_product_id: string;     // order_combo_selections.selected_product_id
  quantity?: number;               // order_combo_selections.quantity
  additional_price?: number;       // order_combo_selections.additional_price
  created_at?: string;
  // 關聯資料
  combo_selection_rules?: {
    selection_name: string;
    description?: string;
  };
  products?: {
    name: string;
    price: number;
  };
}

// 餐點分組 (用於 KDS 顯示)
export interface MenuItemGroup {
  category: MenuCategory;
  categoryName: string;
  categoryIcon: string;
  items: KDSMenuItem[];
  totalItems: number;
  completedItems: number;
  isExpanded: boolean;
  estimatedTime: number;        // 該分類預估完成時間
}

// KDS 統計資料
export interface KDSStats {
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  averagePrepTime: number;
  overdueOrders: number;
  totalOrdersToday: number;
  kitchenEfficiency: number;    // 百分比
}

// KDS 設定
export interface KDSSettings {
  autoRefreshInterval: number;   // 自動刷新間隔 (秒)
  soundEnabled: boolean;        // 聲音提醒
  displayMode: 'compact' | 'detailed'; // 顯示模式
  defaultSort: 'time' | 'priority' | 'table'; // 預設排序
  categoriesVisible: MenuCategory[]; // 顯示的分類
  estimatedTimes: Record<MenuCategory, number>; // 各分類預估時間
  // 實驗/顯示旗標（不影響既有功能，預設關閉）
  mobileLandscapeMode?: boolean; // 行動裝置橫向優先佈局
  longPressQuickActions?: boolean; // 長按顯示快速操作
}

// KDS 篩選條件
export interface KDSFilter {
  status?: OrderStatus[];
  categories?: MenuCategory[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  tableNumbers?: number[];
  urgencyLevel?: UrgencyLevel[];
}

// 排序選項
export type SortOption = 'time' | 'priority' | 'table' | 'status';
export type SortDirection = 'asc' | 'desc';

// 快速操作類型
export type QuickActionType = 'start' | 'pause' | 'complete' | 'report_issue' | 'add_note';

// 分類圖標對應
export const CATEGORY_ICONS: Record<MenuCategory, string> = {
  [MenuCategory.APPETIZERS]: '🥗',
  [MenuCategory.MAIN_COURSE]: '🍖',
  [MenuCategory.BEVERAGES]: '🥤',
  [MenuCategory.A_LA_CARTE]: '🍽️',
  [MenuCategory.ADDITIONAL]: '➕',
  [MenuCategory.DESSERTS]: '🧁'
};

// 分類名稱對應
export const CATEGORY_NAMES: Record<MenuCategory, string> = {
  [MenuCategory.APPETIZERS]: '前菜',
  [MenuCategory.MAIN_COURSE]: '主餐',
  [MenuCategory.BEVERAGES]: '飲品',
  [MenuCategory.A_LA_CARTE]: '單點',
  [MenuCategory.ADDITIONAL]: '加點',
  [MenuCategory.DESSERTS]: '甜點'
};

// 狀態顏色對應
export const STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.PREPARING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.READY]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.SERVED]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.COMPLETED]: 'bg-gray-100 text-gray-800 border-gray-200',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200'
};

// 緊急程度顏色
export const URGENCY_COLORS = {
  low: 'border-l-green-400 bg-green-50',
  medium: 'border-l-yellow-400 bg-yellow-50',
  high: 'border-l-red-400 bg-red-50'
};
