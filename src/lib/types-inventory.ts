// TanaPOS V4-Mini 庫存管理系統類型定義
// 支援三層架構：原物料 → 半成品 → 成品

// ================================
// 1. 原物料類型 (Raw Materials)
// ================================
export interface RawMaterial {
  id: string
  name: string                    // 食材名稱
  category: string               // 分類 (肉類、蔬菜、調料等)
  unit: string                   // 單位 (公斤、公升、包)
  currentStock: number           // 當前庫存
  minStock: number              // 最低庫存警戒線
  maxStock: number              // 最大庫存
  cost: number                  // 成本價格
  supplier?: string             // 供應商
  expiryDate?: string           // 保存期限
  storageLocation?: string      // 儲存位置
  lastRestockDate?: string      // 上次進貨日期
  isActive: boolean             // 是否啟用
  createdAt: string
  updatedAt: string
}

// ================================
// 2. 半成品類型 (Semi-finished Products)
// ================================
export interface SemiFinishedProduct {
  id: string
  name: string                   // 半成品名稱
  category: string              // 分類 (主料、配菜、醬料等)
  unit: string                  // 單位 (份、盤、碗)
  
  // 實際庫存 (已製作的半成品)
  actualStock: number           // 實際庫存數量
  minActualStock: number       // 最低實際庫存
  
  // 虛擬庫存 (從原料計算可製作的數量)
  virtualStock: number         // 可製作數量 (自動計算)
  totalAvailable: number       // 總可用數量 (實際+虛擬)
  
  preparationTime: number      // 製作時間 (分鐘)
  shelfLife: number           // 保存時間 (小時)
  actualCost: number          // 實際製作成本 (已製作的)
  virtualCost: number         // 虛擬製作成本 (從原料計算)
  
  autoRestock: boolean        // 是否自動補製
  restockThreshold: number    // 自動補製閾值
  
  recipeId?: string           // 關聯的食譜ID
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ================================
// 3. 成品/菜單項目增強類型
// ================================
export interface MenuItemEnhanced {
  id: string
  name: string                  // 菜品名稱
  description?: string
  category: string             // 分類 (主餐、小食、飲品)
  price: number               // 售價
  
  // 成本計算 (動態計算)
  totalCost: number           // 總成本 (自動計算)
  rawMaterialCost: number     // 原料成本
  semiProductCost: number     // 半成品成本
  margin: number              // 利潤率 (%)
  
  // 庫存與可用性
  actualStock: number         // 實際庫存 (預製成品)
  virtualStock: number        // 虛擬庫存 (可從材料製作的數量)
  totalAvailable: number      // 總可供應數量
  
  preparationTime: number     // 出餐時間 (分鐘)
  recipeId?: string           // 組合食譜ID
  isAvailable: boolean        // 是否可供應 (自動計算)
  availabilityReason?: string // 不可供應原因
  
  imageUrl?: string
  categoryId?: string
  createdAt: string
  updatedAt: string
}

// ================================
// 4. 食譜系統類型 (Recipe System)
// ================================
export interface Recipe {
  id: string
  name: string                 // 食譜名稱
  type: RecipeType             // 食譜類型
  yieldQuantity: number        // 產出數量
  preparationTime: number      // 製作時間 (分鐘)
  difficulty: RecipeDifficulty // 難度等級
  instructions?: string        // 製作步驟
  
  // 成本計算相關
  costCalculation: 'auto' | 'manual'    // 成本計算方式
  manualCost?: number                   // 手動設定成本
  laborCost?: number                    // 人工成本
  overheadCost?: number                 // 間接成本
  
  ingredients: RecipeIngredient[]       // 所需材料
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type RecipeType = 'raw_to_semi' | 'semi_to_menu' | 'mixed_to_menu'
export type RecipeDifficulty = 'easy' | 'medium' | 'hard'

export interface RecipeIngredient {
  id: string                   // 唯一ID
  recipeId: string            // 食譜ID
  ingredientId: string        // 材料ID
  ingredientType: 'raw' | 'semi'  // 材料類型
  quantity: number            // 所需數量
  unit: string               // 單位
  notes?: string             // 備註 (如: 切片、調味等)
  isOptional: boolean        // 是否為可選材料
  createdAt: string
}

// ================================
// 5. 庫存異動記錄類型
// ================================
export interface StockMovement {
  id: string
  itemId: string              // 物料ID
  itemType: 'raw' | 'semi' | 'product'  // 物料類型
  movementType: StockMovementType        // 異動類型
  quantity: number            // 異動數量
  cost?: number              // 成本
  reason?: string            // 異動原因
  referenceId?: string       // 關聯ID (訂單、製作記錄等)
  referenceType?: string     // 關聯類型
  createdAt: string
  createdBy?: string
}

export type StockMovementType = 'in' | 'out' | 'adjust' | 'waste'

// ================================
// 6. 製作記錄類型
// ================================
export interface ProductionRecord {
  id: string
  semiProductId: string       // 半成品ID
  recipeId: string           // 使用的食譜ID
  quantityProduced: number   // 生產數量
  actualCost: number         // 實際成本
  productionTime?: number    // 實際製作時間
  qualityGrade: 'A' | 'B' | 'C'  // 品質等級
  notes?: string             // 備註
  
  startedAt?: string         // 開始時間
  completedAt?: string       // 完成時間
  createdAt: string
  createdBy?: string
}

// ================================
// 7. 供應商管理類型
// ================================
export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  paymentTerms?: string
  rating: number             // 0-5 星評等
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ================================
// 8. 採購記錄類型
// ================================
export interface PurchaseRecord {
  id: string
  supplierId?: string
  purchaseDate: string
  totalAmount: number
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
  items: PurchaseItem[]      // 採購明細
  createdAt: string
  updatedAt: string
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  rawMaterialId: string
  quantity: number
  unitCost: number
  totalCost: number
  expiryDate?: string
  createdAt: string
}

// ================================
// 9. 庫存計算服務介面
// ================================
export interface StockCalculationService {
  // 計算半成品虛擬庫存
  calculateSemiVirtualStock(semiId: string): Promise<number>
  
  // 計算成品虛擬庫存
  calculateMenuVirtualStock(menuId: string): Promise<number>
  
  // 計算製作成本
  calculateRecipeCost(recipeId: string): Promise<{
    rawMaterialCost: number
    semiProductCost: number
    totalCost: number
  }>
  
  // 檢查是否可製作
  canMake(itemId: string, quantity: number, itemType: 'semi' | 'menu'): Promise<{
    canMake: boolean
    missingIngredients: Array<{
      id: string
      name: string
      type: 'raw' | 'semi'
      required: number
      available: number
      shortfall: number
    }>
  }>
  
  // 更新虛擬庫存
  updateVirtualStock(itemId: string, itemType: 'semi' | 'menu'): Promise<void>
  
  // 批量更新所有虛擬庫存
  updateAllVirtualStock(): Promise<void>
}

// ================================
// 10. 庫存管理操作介面
// ================================
export interface InventoryService {
  // 原物料操作
  getRawMaterials(): Promise<RawMaterial[]>
  getRawMaterial(id: string): Promise<RawMaterial | null>
  createRawMaterial(data: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<RawMaterial>
  updateRawMaterial(id: string, data: Partial<RawMaterial>): Promise<RawMaterial>
  deleteRawMaterial(id: string): Promise<void>
  
  // 半成品操作
  getSemiProducts(): Promise<SemiFinishedProduct[]>
  getSemiProduct(id: string): Promise<SemiFinishedProduct | null>
  createSemiProduct(data: Omit<SemiFinishedProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<SemiFinishedProduct>
  updateSemiProduct(id: string, data: Partial<SemiFinishedProduct>): Promise<SemiFinishedProduct>
  deleteSemiProduct(id: string): Promise<void>
  
  // 食譜操作
  getRecipes(): Promise<Recipe[]>
  getRecipe(id: string): Promise<Recipe | null>
  createRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe>
  updateRecipe(id: string, data: Partial<Recipe>): Promise<Recipe>
  deleteRecipe(id: string): Promise<void>
  
  // 庫存異動
  recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement>
  getStockMovements(itemId?: string, itemType?: string): Promise<StockMovement[]>
  
  // 製作記錄
  createProductionRecord(record: Omit<ProductionRecord, 'id' | 'createdAt'>): Promise<ProductionRecord>
  getProductionRecords(semiProductId?: string): Promise<ProductionRecord[]>
}

// ================================
// 11. 響應類型和錯誤處理
// ================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface InventoryAlert {
  id: string
  type: 'low_stock' | 'expiry_warning' | 'out_of_stock' | 'production_needed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  itemId: string
  itemName: string
  itemType: 'raw' | 'semi' | 'product'
  message: string
  currentStock?: number
  requiredStock?: number
  expiryDate?: string
  createdAt: string
}

export interface StockSummary {
  totalRawMaterials: number
  totalSemiProducts: number
  totalMenuItems: number
  lowStockItems: number
  expiringItems: number
  totalValue: number
  alerts: InventoryAlert[]
}

// ================================
// 12. 表單和輸入類型
// ================================
export interface RawMaterialForm {
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  cost: number
  supplier?: string
  expiryDate?: string
  storageLocation?: string
}

export interface SemiProductForm {
  name: string
  category: string
  unit: string
  actualStock: number
  minActualStock: number
  preparationTime: number
  shelfLife: number
  autoRestock: boolean
  restockThreshold: number
}

export interface RecipeForm {
  name: string
  type: RecipeType
  yieldQuantity: number
  preparationTime: number
  difficulty: RecipeDifficulty
  instructions?: string
  costCalculation: 'auto' | 'manual'
  manualCost?: number
  laborCost?: number
  overheadCost?: number
  ingredients: Array<{
    ingredientId: string
    ingredientType: 'raw' | 'semi'
    quantity: number
    unit: string
    notes?: string
    isOptional: boolean
  }>
}

// ================================
// 13. 搜尋和篩選類型
// ================================
export interface InventoryFilter {
  category?: string
  supplier?: string
  lowStock?: boolean
  expired?: boolean
  available?: boolean
  search?: string
}

export interface InventorySearchResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ================================
// 14. 報表和統計類型
// ================================
export interface StockReport {
  period: {
    start: string
    end: string
  }
  summary: {
    totalItems: number
    totalValue: number
    movements: number
    productions: number
  }
  categories: Array<{
    name: string
    itemCount: number
    totalValue: number
    lowStockCount: number
  }>
  movements: StockMovement[]
  topUsedItems: Array<{
    id: string
    name: string
    type: 'raw' | 'semi' | 'product'
    totalUsed: number
    totalValue: number
  }>
}

export interface CostAnalysis {
  itemId: string
  itemName: string
  itemType: 'semi' | 'product'
  actualCost: number
  virtualCost: number
  costDifference: number
  costPercentage: number
  recommendation: string
}

// ================================
// 15. 實用工具類型
// ================================
export type CreateType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateType<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
