import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { Product, Category } from '../lib/types'
import { generateTakeawayOrderNumber, generatePickupNumber, generateDineInOrderNumber } from '../utils/orderNumberGenerator'

// 統一的商品項目類型（可以是產品或套餐）
export interface MenuItem extends Omit<Product, 'id'> {
  id: string
  type: 'product' | 'combo'
  combo_type?: 'fixed' | 'selectable' // 只有套餐才有這個欄位
}

// 套餐選項類型
export interface ComboSelectionOption {
  id: string
  rule_id: string
  product_id?: string
  product_name: string  // 商品名稱
  additional_price: number
  is_default: boolean
  sort_order: number
}

// 套餐規則類型
export interface ComboSelectionRule {
  id: string
  combo_id: string
  selection_name: string  // 對應資料庫 combo_selection_rules.selection_name 欄位
  description?: string    // 對應資料庫 combo_selection_rules.description 欄位
  selection_type: 'single' | 'multiple'
  min_selections: number
  max_selections: number
  is_required: boolean
  sort_order: number
  display_order?: number  // 對應資料庫 combo_selection_rules.display_order 欄位
  options: ComboSelectionOption[]
}

// UUID 生成函數（兼容性處理）
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // 後備方案：生成 UUID v4 格式
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 用餐方式類型
export type DiningMode = 'dine_in' | 'takeaway'

// 訂單模式類型（僅限內用）
export type OrderMode = 'new' | 'additional'

// 商品過濾類型
export type ProductFilter = 'all' | 'products' | 'combos'

// 購物車項目類型
export interface MobileCartItem {
  id: string
  instanceId: string
  name: string
  price: number
  quantity: number
  special_instructions?: string
  product_id: string
  type?: 'product' | 'combo'
  combo_selections?: Array<{
    rule_id: string
    selected_product_id: string
    quantity?: number
    additional_price?: number
  }>
}

// 桌台狀態類型
export interface TableStatus {
  tableNumber: string
  existingOrders: string[]
  currentStatus: 'empty' | 'occupied' | 'ready_to_pay' | 'paid'
  canAddItems: boolean
  canCreateAdditionalOrder: boolean
}

// 外帶資訊類型
export interface TakeawayInfo {
  takeawayNumber: string
  pickupNumber: string
  customerName?: string
  customerPhone?: string
}

// 訂單上下文類型
export interface OrderContext {
  diningMode: DiningMode
  orderMode?: OrderMode // 僅限內用
  tableNumber?: string // 僅限內用
  partySize?: number // 僅限內用
  takeawayInfo?: TakeawayInfo // 僅限外帶
  relatedOrders?: string[] // 同桌其他訂單ID（加點時）
  orderSequence?: number // 該桌第幾個訂單
}

// 價格計算結果類型
export interface PriceCalculation {
  subtotal: number
  serviceCharge?: number // 僅限內用
  takeawayBagFee?: number // 僅限外帶
  total: number
}

// 手機點餐狀態介面
interface MobileOrderStore {
  // === 基本資料 ===
  categories: Category[]
  products: MenuItem[]  // 改用 MenuItem 來包含產品和套餐
  tables: Array<{ id: string, table_number: string, status: string }>
  
  // === 訂單上下文 ===
  orderContext: OrderContext
  
  // === 購物車 ===
  cartItems: MobileCartItem[]
  
  // === UI 狀態 ===
  selectedCategory: string | null
  productFilter: ProductFilter // 新增：商品類型過濾器
  isCartOpen: boolean
  isOrderInfoCollapsed: boolean
  isComboSelectorOpen: boolean
  selectedComboForSelection: MenuItem | null
  loading: boolean
  error: string | null
  
  // === 基本操作 ===
  setDiningMode: (mode: DiningMode) => void
  setOrderMode: (mode: OrderMode) => void
  setTableNumber: (tableNumber: string) => void
  setPartySize: (size: number) => void
  setSelectedCategory: (categoryId: string | null) => void
  setProductFilter: (filter: ProductFilter) => void // 新增：設置商品過濾器
  toggleCart: () => void
  toggleOrderInfoCollapse: () => void
  checkAndAutoCollapse: () => void
  openComboSelector: (combo: MenuItem) => void
  closeComboSelector: () => void
  
  // === 購物車操作 ===
  addToCart: (product: MenuItem, comboSelections?: Array<{ rule_id: string; selected_product_id: string; quantity?: number; additional_price?: number }>, initialQuantity?: number) => void
  updateCartQuantity: (instanceId: string, quantity: number) => void
  updateCartNote: (instanceId: string, note: string) => void
  removeFromCart: (instanceId: string) => void
  clearCart: () => void
  
  // === 計算功能 ===
  getCartItemCount: () => number
  calculatePrice: () => PriceCalculation
  
  // === 資料載入 ===
  loadCategories: () => Promise<void>
  loadProducts: () => Promise<void>
  loadTables: () => Promise<void>
  loadComboRules: (comboId: string) => Promise<ComboSelectionRule[]>
  updateTableStatus: (tableId: string, status: string) => Promise<void>
  
  // === 外帶功能 ===
  generateTakeawayNumber: () => Promise<TakeawayInfo>
  setCustomerInfo: (name?: string, phone?: string) => void
  
  // === 桌況檢查 ===
  checkTableStatus: (tableNumber: string) => Promise<TableStatus>
  
  // === 訂單提交 ===
  submitOrder: () => Promise<string | null>
  
  // === 錯誤處理 ===
  setError: (error: string | null) => void
  clearError: () => void
}

// 獲取環境變數中的餐廳ID
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || '550e8400-e29b-41d4-a716-446655440000'

export const useMobileOrderStore = create<MobileOrderStore>()(
  devtools(
    (set, get) => ({
      // === 初始狀態 ===
      categories: [],
      products: [],
      tables: [],
      orderContext: {
        diningMode: 'dine_in',
        orderMode: 'new'
      },
      cartItems: [],
      selectedCategory: null,
      productFilter: 'all', // 新增：預設顯示所有商品
      isCartOpen: false,
      isOrderInfoCollapsed: false,
      isComboSelectorOpen: false,
      selectedComboForSelection: null,
      loading: false,
      error: null,

      // === 基本操作 ===
      setDiningMode: (mode) => {
        set((state) => ({
          orderContext: {
            ...state.orderContext,
            diningMode: mode,
            // 切換到外帶時清除桌台相關資訊
            ...(mode === 'takeaway' && {
              orderMode: undefined,
              tableNumber: undefined,
              partySize: undefined,
              relatedOrders: undefined,
              orderSequence: undefined
            })
          }
        }))
        
        // 如果切換到外帶，自動生成取餐號
        if (mode === 'takeaway') {
          get().generateTakeawayNumber()
        }
      },

      setOrderMode: (mode) => {
        set((state) => ({
          orderContext: {
            ...state.orderContext,
            orderMode: mode
          }
        }))
      },

      setTableNumber: (tableNumber) => {
        set((state) => ({
          orderContext: {
            ...state.orderContext,
            tableNumber
          }
        }))
        
        // 檢查是否需要自動折疊
        setTimeout(() => {
          get().checkAndAutoCollapse()
        }, 100)
      },

      setPartySize: (size) => {
        set((state) => ({
          orderContext: {
            ...state.orderContext,
            partySize: size
          }
        }))
      },

      setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId })
      },

      setProductFilter: (filter) => {
        set({ productFilter: filter })
      },

      toggleCart: () => {
        set((state) => ({
          isCartOpen: !state.isCartOpen
        }))
      },

      toggleOrderInfoCollapse: () => {
        set((state) => ({
          isOrderInfoCollapsed: !state.isOrderInfoCollapsed
        }))
      },

      checkAndAutoCollapse: () => {
        const { orderContext } = get()
        
        // 檢查是否所有必要資訊都已填寫完畢
        let isComplete = false
        
        if (orderContext.diningMode === 'dine_in') {
          // 內用模式：需要桌號
          isComplete = !!orderContext.tableNumber
        } else if (orderContext.diningMode === 'takeaway') {
          // 外帶模式：需要客戶資訊
          isComplete = !!(orderContext.takeawayInfo?.customerName && orderContext.takeawayInfo?.customerPhone)
        }
        
        // 如果資訊完整且未折疊，則自動折疊
        if (isComplete) {
          set({ isOrderInfoCollapsed: true })
        }
      },

      openComboSelector: (combo) => {
        set({
          selectedComboForSelection: combo,
          isComboSelectorOpen: true
        })
      },

      closeComboSelector: () => {
        set({
          selectedComboForSelection: null,
          isComboSelectorOpen: false
        })
      },

      // === 購物車操作 ===
    addToCart: (product, comboSelections, initialQuantity) => {
        const instanceId = `${product.id}_${Date.now()}`
        const newItem: MobileCartItem = {
          id: product.id,
          instanceId,
          name: product.name,
          price: product.price,
      quantity: Math.max(1, Number(initialQuantity) || 1),
          product_id: product.id,
          type: product.type,
          combo_selections: comboSelections
        }

        set((state) => ({
          cartItems: [...state.cartItems, newItem]
        }))
      },

      updateCartQuantity: (instanceId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(instanceId)
        } else {
          set((state) => ({
            cartItems: state.cartItems.map(item =>
              item.instanceId === instanceId ? { ...item, quantity } : item
            )
          }))
        }
      },

      updateCartNote: (instanceId, note) => {
        set((state) => ({
          cartItems: state.cartItems.map(item =>
            item.instanceId === instanceId ? { ...item, special_instructions: note } : item
          )
        }))
      },

      removeFromCart: (instanceId) => {
        set((state) => ({
          cartItems: state.cartItems.filter(item => item.instanceId !== instanceId)
        }))
      },

      clearCart: () => {
        set({ cartItems: [] })
      },

      // === 計算功能 ===
      getCartItemCount: () => {
        const { cartItems } = get()
        return cartItems.reduce((count, item) => count + item.quantity, 0)
      },

      calculatePrice: () => {
        const { cartItems, orderContext } = get()
        const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

        if (orderContext.diningMode === 'dine_in') {
          // 移除自動服務費計算
          return {
            subtotal,
            serviceCharge: 0,
            total: subtotal
          }
        } else {
          const takeawayBagFee = 5 // 外帶袋費 $5
          return {
            subtotal,
            takeawayBagFee,
            total: subtotal + takeawayBagFee
          }
        }
      },

      // === 資料載入 ===
      loadCategories: async () => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('restaurant_id', RESTAURANT_ID)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (error) throw error

          set({ categories: data || [], loading: false })
        } catch (error) {
          console.error('載入分類失敗:', error)
          set({ 
            error: error instanceof Error ? error.message : '載入分類失敗',
            loading: false 
          })
        }
      },

      loadProducts: async () => {
        set({ loading: true, error: null })
        try {
          // 載入普通產品
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', RESTAURANT_ID)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (productsError) throw productsError

          // 載入套餐產品
          const { data: combosData, error: combosError } = await supabase
            .from('combo_products')
            .select('*')
            .eq('restaurant_id', RESTAURANT_ID)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (combosError) throw combosError

          // 轉換產品資料格式
          const menuProducts: MenuItem[] = (productsData || []).map((product: any) => ({
            ...product,
            type: 'product' as const
          }))

          // 轉換套餐資料格式
          const menuCombos: MenuItem[] = (combosData || []).map((combo: any) => ({
            ...combo,
            type: 'combo' as const
          }))

          // 合併並排序所有項目
          const allMenuItems = [...menuProducts, ...menuCombos]
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

          console.log('🍽️ 載入完成:', {
            products: menuProducts.length,
            combos: menuCombos.length,
            total: allMenuItems.length,
            restaurant_id: RESTAURANT_ID
          })

          set({ products: allMenuItems, loading: false })
        } catch (error) {
          console.error('載入商品失敗:', error)
          set({ 
            error: error instanceof Error ? error.message : '載入商品失敗',
            loading: false 
          })
        }
      },

      loadTables: async () => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('tables')
            .select('id, table_number, status')
            .eq('restaurant_id', RESTAURANT_ID)
            .eq('is_active', true)
            .order('table_number', { ascending: true })

          if (error) throw error

          set({ tables: data || [], loading: false })
        } catch (error) {
          console.error('載入桌台失敗:', error)
          set({ 
            error: error instanceof Error ? error.message : '載入桌台失敗',
            loading: false 
          })
        }
      },

      loadComboRules: async (comboId: string): Promise<ComboSelectionRule[]> => {
        try {
          console.log('🔄 載入套餐規則，套餐ID:', comboId)
          
          // 載入套餐規則
          const { data: rulesData, error: rulesError } = await supabase
            .from('combo_selection_rules')
            .select('*')
            .eq('combo_id', comboId)
            .order('display_order', { ascending: true })

          if (rulesError) {
            console.error('載入套餐規則失敗:', rulesError)
            throw rulesError
          }

          const rules: ComboSelectionRule[] = []

          // 為每個規則載入選項
          for (const rule of rulesData || []) {
            const { data: optionsData, error: optionsError } = await supabase
              .from('combo_selection_options')
              .select(`
                id,
                rule_id,
                product_id,
                additional_price,
                is_default,
                sort_order,
                products (
                  id,
                  name,
                  price,
                  description,
                  image_url,
                  is_available
                )
              `)
              .eq('rule_id', rule.id)
              .order('sort_order', { ascending: true })

            if (optionsError) {
              console.error('載入套餐選項失敗:', optionsError)
              throw optionsError
            }

            // 轉換為 ComboSelectionRule 格式
            const convertedRule: ComboSelectionRule = {
              id: rule.id,
              combo_id: rule.combo_id,
              selection_name: rule.selection_name,
              description: rule.description,
              selection_type: rule.max_selections === 1 ? 'single' : 'multiple',
              min_selections: rule.min_selections || 0,
              max_selections: rule.max_selections || 1,
              is_required: rule.is_required || false,
              sort_order: rule.display_order || 0,
              display_order: rule.display_order || 0,
              options: (optionsData || []).map((option: any) => ({
                id: option.id,
                rule_id: option.rule_id,
                product_id: option.product_id,
                product_name: option.products?.name || `商品 ${option.product_id}`,
                additional_price: option.additional_price || 0,
                is_default: option.is_default || false,
                sort_order: option.sort_order || 0
              }))
            }

            rules.push(convertedRule)
          }

          console.log('✅ 套餐規則載入完成:', {
            comboId,
            rulesCount: rules.length,
            totalOptions: rules.reduce((sum, rule) => sum + rule.options.length, 0)
          })

          return rules
        } catch (error) {
          console.error('載入套餐規則失敗:', error)
          throw error
        }
      },

      updateTableStatus: async (tableId, status) => {
        try {
          const now = new Date().toISOString()
          
          // 更新 Supabase 資料庫中的桌台狀態
          const { error } = await supabase
            .from('tables')
            .update({ 
              status,
              updated_at: now
            })
            .eq('id', tableId)

          if (error) throw error

          // 更新本地狀態
          set((state) => ({
            tables: state.tables.map(table => 
              table.id === tableId 
                ? { ...table, status }
                : table
            )
          }))

          console.log(`✅ 桌台狀態已更新: ${tableId} -> ${status}`)
        } catch (error) {
          console.error('更新桌台狀態失敗:', error)
          throw error
        }
      },

      // === 外帶功能 ===
      generateTakeawayNumber: async () => {
        try {
          const today = new Date().toISOString().split('T')[0]
          
          // 查詢今日最後一個外帶號碼
          const { data, error } = await supabase
            .from('takeaway_sequences')
            .select('last_sequence')
            .eq('date', today)
            .single()

          let nextSequence = 1
          if (!error && data) {
            nextSequence = data.last_sequence + 1
          }

          // 更新序列
          await supabase
            .from('takeaway_sequences')
            .upsert({
              date: today,
              last_sequence: nextSequence
            })

          // 使用隨機生成器生成外帶訂單編號和取餐號
          const takeawayNumber = generateTakeawayOrderNumber()
          const pickupNumber = generatePickupNumber()

          const takeawayInfo: TakeawayInfo = {
            takeawayNumber,
            pickupNumber
          }

          set((state) => ({
            orderContext: {
              ...state.orderContext,
              takeawayInfo
            }
          }))

          return takeawayInfo
        } catch (error) {
          console.error('生成取餐號失敗:', error)
          // 使用隨機生成器作為後備方案
          const takeawayInfo: TakeawayInfo = {
            takeawayNumber: generateTakeawayOrderNumber(),
            pickupNumber: generatePickupNumber()
          }

          set((state) => ({
            orderContext: {
              ...state.orderContext,
              takeawayInfo
            }
          }))

          return takeawayInfo
        }
      },

      setCustomerInfo: (name, phone) => {
        set((state) => ({
          orderContext: {
            ...state.orderContext,
            takeawayInfo: {
              ...state.orderContext.takeawayInfo!,
              customerName: name,
              customerPhone: phone
            }
          }
        }))
        
        // 檢查是否需要自動折疊
        setTimeout(() => {
          get().checkAndAutoCollapse()
        }, 100)
      },

      // === 桌況檢查 ===
      checkTableStatus: async (tableNumber) => {
        try {
          // 轉換字符串桌號為數字
          const tableNumberInt = parseInt(tableNumber, 10)
          
          // 查詢該桌台的現有訂單
          const { data: orders, error } = await supabase
            .from('orders')
            .select('id, status, order_number')
            .eq('restaurant_id', RESTAURANT_ID)
            .eq('table_number', tableNumberInt)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready'])

          if (error) throw error

          const existingOrders = orders?.map((o: any) => o.order_number) || []
          const hasActiveOrders = existingOrders.length > 0

          return {
            tableNumber,
            existingOrders,
            currentStatus: hasActiveOrders ? 'occupied' : 'empty',
            canAddItems: false, // 假設不能直接修改現有訂單
            canCreateAdditionalOrder: hasActiveOrders
          }
        } catch (error) {
          console.error('檢查桌況失敗:', error)
          return {
            tableNumber,
            existingOrders: [],
            currentStatus: 'empty',
            canAddItems: false,
            canCreateAdditionalOrder: false
          }
        }
      },

      // === 訂單提交 ===
      submitOrder: async () => {
        const { cartItems, orderContext, calculatePrice, clearCart } = get()
        
        if (cartItems.length === 0) {
          set({ error: '購物車不能為空' })
          return null
        }

        // 內用模式檢查
        if (orderContext.diningMode === 'dine_in' && !orderContext.tableNumber) {
          set({ error: '請選擇桌號' })
          return null
        }

        set({ loading: true, error: null })

        try {
          const pricing = calculatePrice()
          const orderId = generateUUID()
          
          // 生成訂單編號
          let orderNumber: string
          if (orderContext.diningMode === 'takeaway') {
            orderNumber = orderContext.takeawayInfo?.takeawayNumber || generateTakeawayOrderNumber()
          } else {
            if (orderContext.orderMode === 'additional') {
              // 加點訂單：查詢同桌已有訂單數量
              const tableNumberInt = parseInt(orderContext.tableNumber!, 10)
              const { data: existingOrders } = await supabase
                .from('orders')
                .select('id')
                .eq('restaurant_id', RESTAURANT_ID)
                .eq('table_number', tableNumberInt)
                .in('status', ['pending', 'confirmed', 'preparing', 'ready'])

              const sequence = (existingOrders?.length || 0) + 1
              orderNumber = generateDineInOrderNumber(orderContext.tableNumber!, true, sequence)
            } else {
              orderNumber = generateDineInOrderNumber(orderContext.tableNumber!)
            }
          }

          // 準備訂單資料
          const orderData = {
            id: orderId,
            order_number: orderNumber,
            restaurant_id: RESTAURANT_ID,
            order_type: orderContext.diningMode,
            table_number: orderContext.tableNumber ? parseInt(orderContext.tableNumber, 10) : null,
            party_size: orderContext.partySize || null,
            customer_name: orderContext.takeawayInfo?.customerName || '',
            customer_phone: orderContext.takeawayInfo?.customerPhone || '',
            subtotal: pricing.subtotal,
            service_charge: pricing.serviceCharge || 0,
            tax_amount: 0,
            total_amount: pricing.total,
            status: 'pending',
            payment_status: 'unpaid',
            source: 'mobile_pos',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // 插入訂單
          const { error: orderError } = await supabase
            .from('orders')
            .insert(orderData)

          if (orderError) throw orderError

          // 插入訂單項目
          const orderItems = cartItems.map(item => {
            const orderItem: any = {
              id: generateUUID(),
              order_id: orderId,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            // 根據商品類型設置不同的欄位
            if (item.type === 'combo') {
              orderItem.product_id = null // 套餐不引用 products 表
              orderItem.product_name = `[套餐] ${item.name}`
              orderItem.special_instructions = `combo_id:${item.product_id}${item.special_instructions ? ` | ${item.special_instructions}` : ''}`
            } else {
              orderItem.product_id = item.product_id
              orderItem.product_name = item.name
              orderItem.special_instructions = item.special_instructions || ''
            }

            return orderItem
          })

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

          if (itemsError) throw itemsError

          // 處理套餐選擇
          const comboSelections: any[] = []
          cartItems.forEach((item, index) => {
            if (item.combo_selections && item.combo_selections.length > 0) {
              const orderItemId = orderItems[index].id
              item.combo_selections.forEach(selection => {
                comboSelections.push({
                  id: generateUUID(),
                  order_item_id: orderItemId,
                  rule_id: selection.rule_id,
                  selected_product_id: selection.selected_product_id,
                  quantity: selection.quantity || 1,
                  additional_price: selection.additional_price || 0,
                  created_at: new Date().toISOString()
                })
              })
            }
          })

          // 插入套餐選擇資料
          if (comboSelections.length > 0) {
            const { error: comboSelectionsError } = await supabase
              .from('order_combo_selections')
              .insert(comboSelections)

            if (comboSelectionsError) throw comboSelectionsError
          }

          // 如果是內用訂單，更新桌台狀態
          if (orderContext.diningMode === 'dine_in' && orderContext.tableNumber) {
            try {
              // 找到對應的桌台 ID
              const selectedTable = get().tables.find(
                table => table.table_number === orderContext.tableNumber
              )
              
              if (selectedTable) {
                // 根據訂單模式決定桌台狀態
                const newStatus = orderContext.orderMode === 'new' ? 'occupied' : selectedTable.status
                await get().updateTableStatus(selectedTable.id, newStatus)
                console.log(`✅ 桌台 ${orderContext.tableNumber} 狀態已更新為: ${newStatus}`)
              }
            } catch (tableError) {
              console.error('更新桌台狀態失敗:', tableError)
              // 不影響訂單提交，只記錄錯誤
            }
          }

          // 清空購物車
          clearCart()
          
          set({ loading: false })
          return orderNumber

        } catch (error) {
          console.error('提交訂單失敗:', error)
          set({ 
            error: error instanceof Error ? error.message : '提交訂單失敗',
            loading: false 
          })
          return null
        }
      },

      // === 錯誤處理 ===
      setError: (error) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'mobile-order-store'
    }
  )
)
