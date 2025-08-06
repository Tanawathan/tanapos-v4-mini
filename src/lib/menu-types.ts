// 菜單管理相關類型定義
export interface Category {
  id: string
  restaurant_id: string
  name: string
  description?: string
  sort_order: number
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description?: string
  sku?: string
  price: number
  cost: number
  image_url?: string
  sort_order: number
  is_available: boolean
  is_active: boolean
  actual_stock: number
  virtual_stock: number
  total_available: number
  min_stock: number
  preparation_time: number
  created_at: string
  updated_at: string
  ai_popularity_score: number
  ai_recommended: boolean
  prep_time_minutes: number
  // 關聯資料
  category?: Category
}

export interface ComboProduct {
  id: string
  name: string
  description?: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available: boolean
  preparation_time: number
  created_at: string
  updated_at: string
  category_id?: string
  // 關聯資料
  category?: Category
  selection_rules?: ComboSelectionRule[]
}

export interface ComboSelectionRule {
  id: string
  combo_id: string
  name: string  // 更改為 name 以符合實現
  description?: string  // 新增描述字段
  min_selections: number
  max_selections: number
  is_required: boolean
  sort_order: number  // 更改為 sort_order 以符合實現
  created_at: string
  updated_at?: string
  // 關聯資料
  options?: ComboSelectionOption[]
}

export interface ComboSelectionOption {
  id: string
  rule_id: string
  product_id: string
  additional_price: number
  is_default: boolean
  is_available: boolean  // 新增 is_available 欄位
  sort_order: number  // 新增排序字段
  created_at: string
  // 關聯資料
  product?: Product
}

// DTO 類型
export interface CreateCategoryDto {
  restaurant_id: string
  name: string
  description?: string
  sort_order?: number
  color?: string
  icon?: string
  is_active?: boolean
}

export interface UpdateCategoryDto {
  name?: string
  description?: string
  sort_order?: number
  color?: string
  icon?: string
  is_active?: boolean
}

export interface CreateProductDto {
  restaurant_id: string
  category_id: string
  name: string
  description?: string
  sku?: string
  price: number
  cost?: number
  image_url?: string
  sort_order?: number
  is_available?: boolean
  is_active?: boolean
  preparation_time?: number
  ai_recommended?: boolean
}

export interface UpdateProductDto {
  category_id?: string
  name?: string
  description?: string
  sku?: string
  price?: number
  cost?: number
  image_url?: string
  sort_order?: number
  is_available?: boolean
  is_active?: boolean
  preparation_time?: number
  ai_recommended?: boolean
}

export interface CreateComboDto {
  name: string
  description?: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available?: boolean
  preparation_time?: number
  category_id?: string
}

export interface UpdateComboDto {
  name?: string
  description?: string
  price?: number
  combo_type?: 'fixed' | 'selectable'
  is_available?: boolean
  preparation_time?: number
  category_id?: string
}

export interface CreateComboRuleDto {
  combo_id: string
  category_id: string
  selection_name: string
  min_selections?: number
  max_selections?: number
  is_required?: boolean
  display_order?: number
}

export interface UpdateComboRuleDto {
  category_id?: string
  selection_name?: string
  min_selections?: number
  max_selections?: number
  is_required?: boolean
  display_order?: number
}

// 篩選類型
export interface ProductFilters {
  category_id?: string | null
  availability?: 'all' | 'available' | 'unavailable'
  ai_recommended?: boolean | null
  search_term?: string
  is_active?: boolean | null
}

export interface ProductSorting {
  field: 'name' | 'price' | 'ai_popularity_score' | 'created_at' | 'sort_order'
  order: 'asc' | 'desc'
}

export interface MenuViewMode {
  mode: 'grid' | 'list' | 'table'
}

// 批量操作類型
export interface BatchOperation {
  selected_items: string[]
  operation: 'delete' | 'activate' | 'deactivate' | 'category_change'
  new_category_id?: string
}

// API 響應類型
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  page_size: number
  has_next: boolean
}
