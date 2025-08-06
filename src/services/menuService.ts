import { supabase } from '../lib/supabase'
import type {
  Category,
  Product,
  ComboProduct,
  ComboSelectionRule,
  ComboSelectionOption,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  CreateComboDto,
  UpdateComboDto,
  CreateComboRuleDto,
  UpdateComboRuleDto,
  ProductFilters,
  ProductSorting,
  ApiResponse,
  PaginatedResponse
} from '../lib/menu-types'

export class MenuService {
  private static instance: MenuService
  private restaurantId: string = import.meta.env.VITE_RESTAURANT_ID || '550e8400-e29b-41d4-a716-446655440000' // 從環境變數取得餐廳ID

  static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService()
    }
    return MenuService.instance
  }

  setRestaurantId(restaurantId: string) {
    this.restaurantId = restaurantId
  }

  // === 分類管理 ===
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', this.restaurantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('獲取分類失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('restaurant_id', this.restaurantId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('獲取分類失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async createCategory(category: CreateCategoryDto): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          restaurant_id: this.restaurantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('建立分類失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async updateCategory(id: string, category: UpdateCategoryDto): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('restaurant_id', this.restaurantId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('更新分類失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    try {
      // 檢查是否有商品使用此分類
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1)

      if (products && products.length > 0) {
        return { data: null, error: '此分類下仍有商品，無法刪除' }
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', this.restaurantId)

      if (error) throw error

      return { data: null, error: null }
    } catch (error) {
      console.error('刪除分類失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // === 商品管理 ===
  async getProducts(
    filters: ProductFilters = {},
    sorting: ProductSorting = { field: 'sort_order', order: 'asc' },
    page: number = 0,
    pageSize: number = 100 // 增加預設分頁大小以顯示更多商品
  ): Promise<PaginatedResponse<Product>> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `, { count: 'exact' })
        .eq('restaurant_id', this.restaurantId)

      // 應用篩選
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      if (filters.availability === 'available') {
        query = query.eq('is_available', true)
      } else if (filters.availability === 'unavailable') {
        query = query.eq('is_available', false)
      }

      if (filters.ai_recommended !== null && filters.ai_recommended !== undefined) {
        query = query.eq('ai_recommended', filters.ai_recommended)
      }

      if (filters.is_active !== null && filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters.search_term) {
        query = query.or(`name.ilike.%${filters.search_term}%,description.ilike.%${filters.search_term}%,sku.ilike.%${filters.search_term}%`)
      }

      // 應用排序
      query = query.order(sorting.field, { ascending: sorting.order === 'asc' })

      // 應用分頁
      const from = page * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        count: count || 0,
        page,
        page_size: pageSize,
        has_next: (count || 0) > (page + 1) * pageSize
      }
    } catch (error) {
      console.error('獲取商品失敗:', error)
      return {
        data: [],
        count: 0,
        page,
        page_size: pageSize,
        has_next: false
      }
    }
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .eq('restaurant_id', this.restaurantId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('獲取商品失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async createProduct(product: CreateProductDto): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          restaurant_id: this.restaurantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('建立商品失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async updateProduct(id: string, product: UpdateProductDto): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...product,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('restaurant_id', this.restaurantId)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('更新商品失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', this.restaurantId)

      if (error) throw error

      return { data: null, error: null }
    } catch (error) {
      console.error('刪除商品失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // === 套餐管理 ===
  async getCombos(): Promise<ApiResponse<ComboProduct[]>> {
    try {
      console.log('🔍 MenuService 載入套餐，restaurant_id:', this.restaurantId)
      
      const { data, error } = await supabase
        .from('combo_products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('restaurant_id', this.restaurantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📋 MenuService 套餐載入結果:', data?.length || 0, '筆')
      return { data: data || [], error: null }
    } catch (error) {
      console.error('獲取套餐失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async getComboById(id: string): Promise<ApiResponse<ComboProduct>> {
    try {
      const { data, error } = await supabase
        .from('combo_products')
        .select(`
          *,
          category:categories(*),
          selection_rules:combo_selection_rules(
            *,
            category:categories(*),
            options:combo_selection_options(
              *,
              product:products(*)
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('獲取套餐失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async createCombo(combo: CreateComboDto): Promise<ApiResponse<ComboProduct>> {
    try {
      const { data, error } = await supabase
        .from('combo_products')
        .insert({
          ...combo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('建立套餐失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async updateCombo(id: string, combo: UpdateComboDto): Promise<ApiResponse<ComboProduct>> {
    try {
      const { data, error } = await supabase
        .from('combo_products')
        .update({
          ...combo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('更新套餐失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async deleteCombo(id: string): Promise<ApiResponse<null>> {
    try {
      // 先獲取相關的規則ID
      const { data: rules } = await supabase
        .from('combo_selection_rules')
        .select('id')
        .eq('combo_id', id)

      if (rules && rules.length > 0) {
        const ruleIds = rules.map((rule: any) => rule.id)
        
        // 刪除相關的選擇選項
        await supabase
          .from('combo_selection_options')
          .delete()
          .in('rule_id', ruleIds)

        // 刪除相關的選擇規則
        await supabase
          .from('combo_selection_rules')
          .delete()
          .eq('combo_id', id)
      }

      // 刪除套餐本身
      const { error } = await supabase
        .from('combo_products')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { data: null, error: null }
    } catch (error) {
      console.error('刪除套餐失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // === 套餐規則管理 ===
  async getComboRules(comboId: string): Promise<ApiResponse<ComboSelectionRule[]>> {
    try {
      const { data, error } = await supabase
        .from('combo_selection_rules')
        .select(`
          *,
          category:categories(*),
          options:combo_selection_options(
            *,
            product:products(*)
          )
        `)
        .eq('combo_id', comboId)
        .order('display_order', { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('獲取套餐規則失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async createComboRule(rule: CreateComboRuleDto): Promise<ApiResponse<ComboSelectionRule>> {
    try {
      const { data, error } = await supabase
        .from('combo_selection_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('建立套餐規則失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async updateComboRule(id: string, rule: UpdateComboRuleDto): Promise<ApiResponse<ComboSelectionRule>> {
    try {
      const { data, error } = await supabase
        .from('combo_selection_rules')
        .update({
          ...rule,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('更新套餐規則失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async deleteComboRule(id: string): Promise<ApiResponse<null>> {
    try {
      // 先刪除相關的選項
      await supabase
        .from('combo_selection_options')
        .delete()
        .eq('rule_id', id)

      const { error } = await supabase
        .from('combo_selection_rules')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { data: null, error: null }
    } catch (error) {
      console.error('刪除套餐規則失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // === 套餐選項管理 ===
  async createComboOption(ruleId: string, productId: string, additionalPrice: number = 0, isDefault: boolean = false): Promise<ApiResponse<ComboSelectionOption>> {
    try {
      const { data, error } = await supabase
        .from('combo_selection_options')
        .insert({
          rule_id: ruleId,
          product_id: productId,
          additional_price: additionalPrice,
          is_default: isDefault,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          product:products(*)
        `)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('建立套餐選項失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async deleteComboOption(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('combo_selection_options')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { data: null, error: null }
    } catch (error) {
      console.error('刪除套餐選項失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // === 套餐規則與選項批量操作 ===
  async saveComboRules(comboId: string, rules: any[]): Promise<ApiResponse<any[]>> {
    try {
      // 使用事務處理批量保存規則和選項
      const savedRules = []
      
      for (const rule of rules) {
        // 保存或更新規則
        const ruleData = {
          combo_id: comboId,
          rule_name: rule.name,
          min_selections: rule.min_selections,
          max_selections: rule.max_selections,
          is_required: rule.is_required,
          sort_order: rule.sort_order
        }

        let savedRule
        if (rule.id && !rule.id.startsWith('temp_')) {
          // 更新現有規則
          const { data, error } = await supabase
            .from('combo_selection_rules')
            .update(ruleData)
            .eq('id', rule.id)
            .select()
            .single()
          
          if (error) throw error
          savedRule = data
        } else {
          // 新增規則
          const { data, error } = await supabase
            .from('combo_selection_rules')
            .insert(ruleData)
            .select()
            .single()
          
          if (error) throw error
          savedRule = data
        }

        // 保存規則選項
        if (rule.options && rule.options.length > 0) {
          // 先刪除舊的選項
          await supabase
            .from('combo_selection_options')
            .delete()
            .eq('rule_id', savedRule.id)

          // 新增選項
          const optionsData = rule.options.map((option: any) => ({
            rule_id: savedRule.id,
            product_id: option.product_id,
            additional_price: option.additional_price,
            is_default: option.is_default,
            is_available: option.is_available
          }))

          const { error: optionsError } = await supabase
            .from('combo_selection_options')
            .insert(optionsData)

          if (optionsError) throw optionsError
        }

        savedRules.push(savedRule)
      }

      return { data: savedRules, error: null }
    } catch (error) {
      console.error('保存套餐規則失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async getComboWithRules(comboId: string): Promise<ApiResponse<any>> {
    try {
      // 獲取套餐基本資訊
      const { data: combo, error: comboError } = await supabase
        .from('combo_products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', comboId)
        .single()

      if (comboError) throw comboError

      // 獲取套餐規則和選項
      const { data: rules, error: rulesError } = await supabase
        .from('combo_selection_rules')
        .select(`
          id,
          combo_id,
          selection_name,
          description,
          min_selections,
          max_selections,
          is_required,
          display_order,
          created_at,
          updated_at,
          options:combo_selection_options(
            id,
            rule_id,
            product_id,
            additional_price,
            is_default,
            sort_order,
            created_at,
            product:products(id, name, price)
          )
        `)
        .eq('combo_id', comboId)
        .order('display_order', { ascending: true })

      if (rulesError) throw rulesError

      // 轉換資料庫欄位名稱為前端期待的名稱
      const transformedRules: ComboSelectionRule[] = rules?.map((rule: any) => ({
        ...rule,
        name: rule.selection_name,
        sort_order: rule.display_order,
        options: rule.options?.map((option: any) => ({
          ...option,
          is_available: option.is_available ?? true // 如果資料庫沒有這個欄位，預設為 true
        }))
      })) || []

      return { data: { ...combo, rules: transformedRules }, error: null }
    } catch (error) {
      console.error('獲取套餐規則失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // === 批量操作 ===
  async batchUpdateProducts(productIds: string[], updates: Partial<UpdateProductDto>): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', productIds)
        .eq('restaurant_id', this.restaurantId)
        .select(`
          *,
          category:categories(*)
        `)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('批量更新商品失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  async batchDeleteProducts(productIds: string[]): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', productIds)
        .eq('restaurant_id', this.restaurantId)

      if (error) throw error

      return { data: null, error: null }
    } catch (error) {
      console.error('批量刪除商品失敗:', error)
      return { data: null, error: (error as Error).message }
    }
  }
}

// 匯出單例實例
export const menuService = MenuService.getInstance()
