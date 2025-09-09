// ================================
// 庫存管理系統 TypeScript 類型定義
// ================================

// 基礎類型
export type UUID = string;
export type Timestamp = string;

// ================================
// 1. 庫存異動相關類型
// ================================

export type TransactionType = 'in' | 'out' | 'adjust' | 'transfer' | 'count';
export type ReferenceType = 'purchase_order' | 'sales_order' | 'adjustment' | 'count' | 'transfer';

export interface InventoryTransaction {
  id: UUID;
  restaurant_id: UUID;
  product_id?: UUID;
  raw_material_id?: UUID;
  
  // 異動資訊
  transaction_type: TransactionType;
  quantity: number;
  unit: string;
  
  // 原因和參考
  reason: string;
  reference_type?: ReferenceType;
  reference_id?: UUID;
  
  // 異動前後庫存
  stock_before: number;
  stock_after: number;
  
  // 成本資訊
  unit_cost?: number;
  total_cost?: number;
  
  // 位置資訊
  warehouse_location?: string;
  from_location?: string;
  to_location?: string;
  
  // 批次資訊
  batch_number?: string;
  lot_number?: string;
  expiry_date?: string;
  
  // 操作資訊
  created_by?: UUID;
  created_at: Timestamp;
  notes?: string;
  
  // 預留擴展欄位
  metadata?: Record<string, any>;
}

export interface CreateInventoryTransactionRequest {
  product_id?: UUID;
  raw_material_id?: UUID;
  transaction_type: TransactionType;
  quantity: number;
  unit: string;
  reason: string;
  reference_type?: ReferenceType;
  reference_id?: UUID;
  unit_cost?: number;
  warehouse_location?: string;
  from_location?: string;
  to_location?: string;
  batch_number?: string;
  lot_number?: string;
  expiry_date?: string;
  notes?: string;
}

// ================================
// 2. 庫存警示相關類型
// ================================

export type AlertType = 'low_stock' | 'overstock' | 'expired' | 'expiring' | 'out_of_stock';
export type AlertLevel = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface StockAlert {
  id: UUID;
  restaurant_id: UUID;
  product_id?: UUID;
  raw_material_id?: UUID;
  
  // 警示資訊
  alert_type: AlertType;
  alert_level: AlertLevel;
  title: string;
  message: string;
  
  // 庫存資訊
  current_stock?: number;
  threshold_value?: number;
  
  // 狀態
  status: AlertStatus;
  resolved_at?: Timestamp;
  resolved_by?: UUID;
  acknowledged_at?: Timestamp;
  acknowledged_by?: UUID;
  
  // 自動處理
  auto_resolve: boolean;
  auto_resolve_at?: Timestamp;
  
  // 時間
  created_at: Timestamp;
  updated_at: Timestamp;
  
  // 預留擴展欄位
  metadata?: Record<string, any>;
}

export interface CreateStockAlertRequest {
  product_id?: UUID;
  raw_material_id?: UUID;
  alert_type: AlertType;
  alert_level: AlertLevel;
  title: string;
  message: string;
  current_stock?: number;
  threshold_value?: number;
}

// ================================
// 3. 盤點相關類型
// ================================

export type CountType = 'full' | 'partial' | 'cycle' | 'spot' | 'urgent';
export type CountStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled';

export interface InventoryCount {
  id: UUID;
  restaurant_id: UUID;
  
  // 盤點資訊
  count_number: string;
  count_type: CountType;
  count_date: string;
  status: CountStatus;
  
  // 盤點範圍
  location?: string;
  category_filter?: Record<string, any>;
  product_filter?: Record<string, any>;
  
  // 統計資訊
  total_items: number;
  counted_items: number;
  variance_items: number;
  total_variance_value: number;
  
  // 操作資訊
  created_by: UUID;
  approved_by?: UUID;
  cancelled_by?: UUID;
  
  // 時間資訊
  created_at: Timestamp;
  started_at?: Timestamp;
  completed_at?: Timestamp;
  approved_at?: Timestamp;
  cancelled_at?: Timestamp;
  
  // 備註
  notes?: string;
  cancel_reason?: string;
  
  // 預留擴展欄位
  metadata?: Record<string, any>;
}

export interface InventoryCountItem {
  id: UUID;
  count_id: UUID;
  product_id?: UUID;
  raw_material_id?: UUID;
  
  // 盤點數據
  book_quantity: number;
  actual_quantity?: number;
  variance_quantity?: number; // 計算欄位
  
  // 成本影響
  unit_cost: number;
  book_value?: number; // 計算欄位
  actual_value?: number; // 計算欄位
  variance_value?: number; // 計算欄位
  
  // 位置資訊
  warehouse_location?: string;
  
  // 批次資訊
  batch_number?: string;
  lot_number?: string;
  expiry_date?: string;
  
  // 盤點狀態
  counted: boolean;
  counted_by?: UUID;
  counted_at?: Timestamp;
  verified: boolean;
  verified_by?: UUID;
  verified_at?: Timestamp;
  
  // 差異處理
  variance_approved: boolean;
  variance_approved_by?: UUID;
  variance_approved_at?: Timestamp;
  adjustment_created: boolean;
  
  // 備註
  notes?: string;
  variance_reason?: string;
  
  // 預留擴展欄位
  metadata?: Record<string, any>;
}

export interface CreateInventoryCountRequest {
  count_number: string;
  count_type: CountType;
  count_date: string;
  location?: string;
  category_filter?: Record<string, any>;
  product_filter?: Record<string, any>;
  notes?: string;
}

export interface UpdateInventoryCountItemRequest {
  actual_quantity: number;
  warehouse_location?: string;
  batch_number?: string;
  lot_number?: string;
  expiry_date?: string;
  notes?: string;
  variance_reason?: string;
}

// ================================
// 4. 商品庫存相關類型（擴展現有類型）
// ================================

export interface ProductStock {
  id: UUID;
  restaurant_id: UUID;
  category_id?: UUID;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost: number;
  
  // 庫存管理
  track_inventory: boolean;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  
  // 計算欄位
  stock_status: 'normal' | 'low' | 'out' | 'over';
  stock_value: number;
  
  // 統計資訊
  total_in: number;
  total_out: number;
  last_transaction_at?: Timestamp;
  
  is_available: boolean;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface RawMaterialStock {
  id: UUID;
  restaurant_id: UUID;
  supplier_id?: UUID;
  name: string;
  category: string;
  sku?: string;
  barcode?: string;
  
  // 單位與庫存
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  
  // 成本
  cost_per_unit: number;
  last_purchase_cost?: number;
  
  // 計算欄位
  stock_status: 'normal' | 'low' | 'out' | 'over';
  stock_value: number;
  
  // 效期
  shelf_life_days?: number;
  expiry_date?: string;
  
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ================================
// 5. 搜索和篩選類型
// ================================

export interface InventorySearchFilters {
  search?: string;
  restaurant_id?: UUID;
  category_id?: UUID;
  supplier_id?: UUID;
  stock_status?: 'normal' | 'low' | 'out' | 'over';
  location?: string;
  date_from?: string;
  date_to?: string;
}

export interface TransactionSearchFilters {
  search?: string;
  transaction_type?: TransactionType;
  date_from?: string;
  date_to?: string;
  reference_type?: ReferenceType;
  created_by?: UUID;
  restaurant_id?: UUID;
}

export interface AlertSearchFilters {
  alert_type?: AlertType;
  alert_level?: AlertLevel;
  status?: AlertStatus;
  date_from?: string;
  date_to?: string;
}

// ================================
// 6. API 回應類型
// ================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface InventoryStats {
  total_products: number;
  total_raw_materials: number;
  low_stock_alerts: number;
  total_stock_value: number;
  recent_transactions: number;
  pending_counts: number;
}

// ================================
// 7. UI 狀態類型
// ================================

export interface InventoryState {
  // 資料
  products: ProductStock[];
  rawMaterials: RawMaterialStock[];
  transactions: InventoryTransaction[];
  alerts: StockAlert[];
  counts: InventoryCount[];
  
  // 載入狀態
  loading: {
    products: boolean;
    rawMaterials: boolean;
    transactions: boolean;
    alerts: boolean;
    counts: boolean;
  };
  
  // 錯誤狀態
  errors: {
    products?: string;
    rawMaterials?: string;
    transactions?: string;
    alerts?: string;
    counts?: string;
  };
  
  // 篩選器
  filters: {
    products: InventorySearchFilters;
    transactions: TransactionSearchFilters;
    alerts: AlertSearchFilters;
  };
  
  // 統計資料
  stats: InventoryStats;
  
  // UI 狀態
  selectedItems: UUID[];
  currentPage: number;
  itemsPerPage: number;
}

// ================================
// 8. 表單類型
// ================================

export interface StockAdjustmentForm {
  items: Array<{
    product_id?: UUID;
    raw_material_id?: UUID;
    adjustment_quantity: number;
    reason: string;
    notes?: string;
  }>;
  adjustment_date: string;
  reference_number?: string;
  notes?: string;
}

export interface StockTransferForm {
  items: Array<{
    product_id?: UUID;
    raw_material_id?: UUID;
    quantity: number;
  }>;
  from_location: string;
  to_location: string;
  transfer_date: string;
  notes?: string;
}

export interface QuickCountForm {
  items: Array<{
    product_id?: UUID;
    raw_material_id?: UUID;
    counted_quantity: number;
    location?: string;
    notes?: string;
  }>;
  count_date: string;
  notes?: string;
}

// ================================
// 9. 導出類型
// ================================

export * from './index';
