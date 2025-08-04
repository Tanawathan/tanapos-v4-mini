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

// KDS 訂單介面 (基於 orders 表)
export interface KDSOrder {
  id: string;                    // orders.id
  orderNumber: string;           // orders.order_number
  tableId?: string;              // orders.table_id
  tableNumber?: number;          // orders.table_number
  customerName?: string;         // orders.customer_name
  customerPhone?: string;        // orders.customer_phone
  customerCount: number;         // orders.customer_count
  subtotal: number;              // orders.subtotal
  taxAmount: number;             // orders.tax_amount
  totalAmount: number;           // orders.total_amount
  status: OrderStatus;           // orders.status
  paymentStatus: string;         // orders.payment_status
  paymentMethod?: string;        // orders.payment_method
  notes?: string;                // orders.notes
  createdBy?: string;            // orders.created_by
  servedAt?: Date;              // orders.served_at
  completedAt?: Date;           // orders.completed_at
  createdAt: Date;              // orders.created_at
  updatedAt: Date;              // orders.updated_at
  
  // KDS 專用欄位
  estimatedPrepTime?: number;    // orders.ai_estimated_prep_time
  aiRecommendations?: any;       // orders.ai_recommendations
  menuItems: KDSMenuItem[];      // 關聯的訂單項目
  
  // KDS 狀態管理
  isExpanded: boolean;           // 卡片是否展開
  urgencyLevel: UrgencyLevel;    // 緊急程度
  totalItems: number;            // 總項目數
  completedItems: number;        // 已完成項目數
}

// KDS 餐點介面 (基於 order_items 表)
export interface KDSMenuItem {
  id: string;                    // order_items.id
  orderId: string;              // order_items.order_id
  productId?: string;           // order_items.product_id
  productName: string;          // order_items.product_name
  productSku?: string;          // order_items.product_sku
  quantity: number;             // order_items.quantity
  unitPrice: number;            // order_items.unit_price
  totalPrice: number;           // order_items.total_price
  specialInstructions?: string; // order_items.special_instructions
  status: MenuItemStatus;       // order_items.status
  createdAt: Date;              // order_items.created_at
  updatedAt: Date;              // order_items.updated_at
  
  // KDS 專用欄位
  category: MenuCategory;        // 從 products.category_id 關聯
  estimatedTime: number;         // 從 products.prep_time_minutes
  actualTime?: number;           // 實際製作時間
  startedAt?: Date;             // 開始製作時間
  completedAt?: Date;           // 完成時間
  
  // 套餐相關 (基於 combo_products 和相關表)
  isComboItem: boolean;          // 是否為套餐項目
  comboId?: string;             // combo_products.id
  comboSelections?: KDSComboSelection[]; // 套餐選擇
  
  // KDS 狀態
  qualityChecked: boolean;       // 品質檢查
  notes?: string;               // 廚房備註
}

// 套餐選擇 (基於 order_combo_selections 表)
export interface KDSComboSelection {
  id: string;                    // order_combo_selections.id
  orderItemId: string;          // order_combo_selections.order_item_id
  ruleId: string;               // order_combo_selections.rule_id
  selectedProductId: string;     // order_combo_selections.selected_product_id
  quantity: number;             // order_combo_selections.quantity
  additionalPrice: number;      // order_combo_selections.additional_price
  productName: string;          // 從 products 表關聯
  status: MenuItemStatus;       // 選擇項目的狀態
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
