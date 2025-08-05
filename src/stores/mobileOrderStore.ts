import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { Product, Category } from '../lib/types'

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

// 購物車項目類型
export interface MobileCartItem {
  id: string
  instanceId: string
  name: string
  price: number
  quantity: number
  special_instructions?: string
  product_id: string
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
  products: Product[]
  tables: Array<{ id: string, table_number: string, status: string }>
  
  // === 訂單上下文 ===
  orderContext: OrderContext
  
  // === 購物車 ===
  cartItems: MobileCartItem[]
  
  // === UI 狀態 ===
  selectedCategory: string | null
  isCartOpen: boolean
  isOrderInfoCollapsed: boolean
  loading: boolean
  error: string | null
  
  // === 基本操作 ===
  setDiningMode: (mode: DiningMode) => void
  setOrderMode: (mode: OrderMode) => void
  setTableNumber: (tableNumber: string) => void
  setPartySize: (size: number) => void
  setSelectedCategory: (categoryId: string | null) => void
  toggleCart: () => void
  toggleOrderInfoCollapse: () => void
  checkAndAutoCollapse: () => void
  
  // === 購物車操作 ===
  addToCart: (product: Product) => void
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
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || 'default-restaurant-id'

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
      isCartOpen: false,
      isOrderInfoCollapsed: false,
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

      // === 購物車操作 ===
      addToCart: (product) => {
        const instanceId = `${product.id}_${Date.now()}`
        const newItem: MobileCartItem = {
          id: product.id,
          instanceId,
          name: product.name,
          price: product.price,
          quantity: 1,
          product_id: product.id
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
          const serviceCharge = subtotal * 0.1 // 10% 服務費
          return {
            subtotal,
            serviceCharge,
            total: subtotal + serviceCharge
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
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', RESTAURANT_ID)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (error) throw error

          set({ products: data || [], loading: false })
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

          const takeawayNumber = `TOGO-${nextSequence.toString().padStart(3, '0')}`
          const pickupNumber = `TO-${nextSequence.toString().padStart(3, '0')}`

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
          // 使用時間戳作為後備方案
          const timestamp = Date.now().toString().slice(-3)
          const takeawayInfo: TakeawayInfo = {
            takeawayNumber: `TOGO-${timestamp}`,
            pickupNumber: `TO-${timestamp}`
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
            orderNumber = orderContext.takeawayInfo?.takeawayNumber || `TOGO-${Date.now()}`
          } else {
            const timestamp = Date.now()
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
              orderNumber = `${orderContext.tableNumber}-${timestamp.toString().slice(-3)}-A${sequence}`
            } else {
              orderNumber = `${orderContext.tableNumber}-${timestamp.toString().slice(-3)}`
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
          const orderItems = cartItems.map(item => ({
            id: generateUUID(),
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            special_instructions: item.special_instructions || '',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

          if (itemsError) throw itemsError

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
