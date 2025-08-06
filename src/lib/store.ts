import { create } from 'zustand'
import { supabase } from './supabase'
import type { 
  Restaurant, 
  Category, 
  Product, 
  ComboProduct, 
  Table, 
  Order, 
  OrderItem, 
  CartItem 
} from './types'

// 從環境變數取得餐廳ID，用於模擬資料
const MOCK_RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111'

interface POSStore {
  // 基本資料
  currentRestaurant: Restaurant | null
  categories: Category[]
  products: Product[]
  comboProducts: ComboProduct[]
  tables: Table[]
  
  // 購物車
  cartItems: CartItem[]
  selectedTable: string | null
  
  // 訂單
  currentOrder: Order | null
  orderItems: OrderItem[]
  orders: Order[]
  ordersLoaded: boolean
  tablesLoaded: boolean
  
  // 載入狀態
  loading: boolean
  error: string | null
  
  // Actions
  setCurrentRestaurant: (restaurant: Restaurant) => void
  setSelectedTable: (tableId: string | null) => void
  
  // 資料載入
  loadCategories: () => Promise<void>
  loadProducts: () => Promise<void>
  loadComboProducts: () => Promise<void>
  loadTables: () => Promise<void>
  loadOrders: () => Promise<void>
  
  // 購物車操作
  addToCart: (product: Product | ComboProduct) => void
  updateCartQuantity: (instanceId: string, quantity: number) => void
  updateCartNote: (instanceId: string, note: string) => void
  removeFromCart: (instanceId: string) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
  
  // 訂單操作
  createOrder: () => Promise<string | null>
  addOrderItem: (item: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  processCheckout: (tableId: string, orderId: string, paymentData: {
    payment_method: string
    received_amount?: number
    change_amount?: number
  }) => Promise<void>
  
  // 桌況管理
  updateTableStatus: (tableId: string, status: Table['status'], metadata?: any) => Promise<void>
  createOrderWithTableUpdate: (orderData: any) => Promise<Order | null>
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // 初始狀態
  currentRestaurant: null,
  categories: [],
  products: [],
  comboProducts: [],
  tables: [],
  cartItems: [],
  selectedTable: null,
  currentOrder: null,
  orderItems: [],
  orders: [],
  ordersLoaded: false,
  tablesLoaded: false,
  loading: false,
  error: null,

  // 基本設定
  setCurrentRestaurant: (restaurant) => set({ currentRestaurant: restaurant }),
  setSelectedTable: (tableId) => set({ selectedTable: tableId }),

  // 載入分類
  loadCategories: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', MOCK_RESTAURANT_ID)
        .order('sort_order', { ascending: true })

      if (error) throw error

      set({ 
        categories: data || [],
        loading: false
      })
    } catch (error) {
      console.error('載入分類失敗:', error)
      set({ 
        error: error instanceof Error ? error.message : '載入分類失敗',
        loading: false 
      })
    }
  },

  // 載入產品
  loadProducts: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', MOCK_RESTAURANT_ID)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      set({ 
        products: data || [],
        loading: false
      })
    } catch (error) {
      console.error('載入產品失敗:', error)
      set({ 
        error: error instanceof Error ? error.message : '載入產品失敗',
        loading: false 
      })
    }
  },

  // 載入套餐產品
  loadComboProducts: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('combo_products')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true })

      if (error) throw error
      set({ comboProducts: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  // 載入桌台
  loadTables: async () => {
    const state = get()
    
    // 檢查是否已經載入過，避免重複載入
    if (state.tablesLoaded && state.tables.length > 0) {
      console.log('✅ 桌台已載入，跳過重複載入')
      return
    }
    
    set({ loading: true, error: null })
    try {
      // 獲取當前登入的使用者
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.log('⚠️ 使用者未登入，使用預設餐廳 ID')
      }

      // 優先使用使用者的餐廳 ID，否則使用預設值
      let restaurantId = MOCK_RESTAURANT_ID
      
      if (user?.user_metadata?.restaurant_id) {
        restaurantId = user.user_metadata.restaurant_id
        console.log('✅ 使用登入使用者的餐廳 ID:', restaurantId)
      } else if (user?.email) {
        // 如果使用者有 email，嘗試從 profiles 或 staff 表查找餐廳關聯
        const { data: profileData } = await supabase
          .from('staff')
          .select('restaurant_id')
          .eq('email', user.email)
          .single()
          
        if (profileData?.restaurant_id) {
          restaurantId = profileData.restaurant_id
          console.log('✅ 從職員表找到餐廳 ID:', restaurantId)
        }
      }

      console.log('🏪 載入餐廳桌台:', restaurantId)

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('table_number', { ascending: true })

      if (error) throw error

      console.log('✅ 成功載入桌台:', data?.length || 0, '筆')

      set({ 
        tables: data || [],
        tablesLoaded: true,
        loading: false
      })
    } catch (error) {
      console.error('載入桌台失敗:', error)
      set({ 
        error: error instanceof Error ? error.message : '載入桌台失敗',
        loading: false 
      })
    }
  },

  // 載入訂單
  loadOrders: async () => {
    const state = get()
    
    // 檢查是否已經載入過，避免重複載入
    if (state.ordersLoaded && state.orders.length > 0) {
      console.log('✅ 訂單已載入，跳過重複載入')
      return
    }
    
    set({ loading: true, error: null })
    try {
      // 獲取當前登入的使用者
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.log('⚠️ 使用者未登入，使用預設餐廳 ID')
      }

      // 優先使用使用者的餐廳 ID，否則使用預設值
      let restaurantId = MOCK_RESTAURANT_ID
      
      if (user?.user_metadata?.restaurant_id) {
        restaurantId = user.user_metadata.restaurant_id
        console.log('✅ 使用登入使用者的餐廳 ID:', restaurantId)
      } else if (user?.email) {
        // 如果使用者有 email，嘗試從 staff 表查找餐廳關聯
        const { data: profileData } = await supabase
          .from('staff')
          .select('restaurant_id')
          .eq('email', user.email)
          .single()
          
        if (profileData?.restaurant_id) {
          restaurantId = profileData.restaurant_id
          console.log('✅ 從職員表找到餐廳 ID:', restaurantId)
        }
      }

      console.log('🏪 從資料庫載入訂單資料...', restaurantId)

      // 載入訂單資料
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: false })

      if (ordersError) {
        throw new Error(`載入訂單失敗: ${ordersError.message}`)
      }

      // 載入訂單項目資料
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (name, sku),
          order_combo_selections (
            id,
            rule_id,
            selected_product_id,
            quantity,
            additional_price,
            combo_selection_rules (
              selection_name,
              description
            ),
            products:selected_product_id (
              name,
              price
            )
          )
        `)
        .in('order_id', (ordersData || []).map((order: any) => order.id))

      if (orderItemsError) {
        throw new Error(`載入訂單項目失敗: ${orderItemsError.message}`)
      }

      // 處理訂單項目資料，確保有商品名稱
      const processedOrderItems: OrderItem[] = (orderItemsData || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        product_name: item.products?.name || item.product_name || '未知商品',
        product_sku: item.products?.sku || item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        special_instructions: item.special_instructions,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        combo_selections: item.order_combo_selections || []
      }))

      // 載入桌台資料以獲取桌台號碼
      const { data: tablesData } = await supabase
        .from('tables')
        .select('id, table_number')
        .eq('restaurant_id', restaurantId)

      const tableMap = new Map((tablesData || []).map((table: any) => [table.id, table.table_number]))

      // 處理訂單資料，確保有桌台號碼
      const processedOrders: Order[] = (ordersData || []).map((order: any) => ({
        ...order,
        table_number: tableMap.get(order.table_id) || order.table_number || 0
      }))

      console.log('✅ 成功載入訂單:', processedOrders.length, '筆')
      console.log('✅ 成功載入訂單項目:', processedOrderItems.length, '筆')

      set({ 
        orders: processedOrders, 
        orderItems: processedOrderItems,
        ordersLoaded: true 
      })
    } catch (error) {
      console.error('❌ 載入訂單失敗:', error)
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  // 加入購物車
  addToCart: (product) => {
    const instanceId = `${product.id}_${Date.now()}`
    const newItem: CartItem = {
      id: product.id,
      instanceId,
      name: product.name,
      price: product.price,
      quantity: 1,
      type: 'combo_type' in product ? 'combo' : 'product'
    }

    set((state) => ({
      cartItems: [...state.cartItems, newItem]
    }))
  },

  // 更新購物車數量
  updateCartQuantity: (instanceId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({
        cartItems: state.cartItems.filter(item => item.instanceId !== instanceId)
      }))
    } else {
      set((state) => ({
        cartItems: state.cartItems.map(item =>
          item.instanceId === instanceId ? { ...item, quantity } : item
        )
      }))
    }
  },

  // 更新購物車備註
  updateCartNote: (instanceId, note) => {
    set((state) => ({
      cartItems: state.cartItems.map(item =>
        item.instanceId === instanceId ? { ...item, special_instructions: note } : item
      )
    }))
  },

  // 從購物車移除
  removeFromCart: (instanceId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(item => item.instanceId !== instanceId)
    }))
  },

  // 清空購物車
  clearCart: () => set({ cartItems: [] }),

  // 計算總金額
  getCartTotal: () => {
    const { cartItems } = get()
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  },

  // 計算購物車項目數量
  getCartItemCount: () => {
    const { cartItems } = get()
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  },

  // 建立訂單
  createOrder: async () => {
    const { selectedTable, cartItems, currentRestaurant } = get()
    
    if (!selectedTable || cartItems.length === 0) {
      set({ error: '請選擇桌台並添加商品到購物車' })
      return null
    }

    set({ loading: true, error: null })
    
    try {
      const table = get().tables.find(t => t.id === selectedTable)
      if (!table) throw new Error('找不到選擇的桌台')

      const orderNumber = `ORD-${Date.now()}`
      const total = get().getCartTotal()

      const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        restaurant_id: currentRestaurant?.id,
        table_id: selectedTable,
        order_number: orderNumber,
        table_number: table.table_number,
        subtotal: total,
        tax_amount: total * (currentRestaurant?.tax_rate || 0),
        total_amount: total + (total * (currentRestaurant?.tax_rate || 0)),
        status: 'pending',
        payment_status: 'unpaid'
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      // 建立訂單項目
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.special_instructions || '',
        status: 'pending' as const
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        // 如果建立訂單項目失敗，刪除已建立的訂單
        await supabase.from('orders').delete().eq('id', order.id)
        throw itemsError
      }

      set({ 
        currentOrder: order, 
        cartItems: [], 
        selectedTable: null 
      })

      return order.id
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    } finally {
      set({ loading: false })
    }
  },

  // 新增訂單項目
  addOrderItem: async (item) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('order_items')
        .insert(item)

      if (error) throw error
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  // 更新訂單狀態
  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null })
    try {
      const updates: any = {
        status, 
        updated_at: new Date().toISOString()
      }

      // 根據狀態添加相應的時間戳
      switch (status) {
        case 'confirmed':
          updates.confirmed_at = new Date().toISOString()
          break
        case 'preparing':
          updates.preparation_started_at = new Date().toISOString()
          break
        case 'ready':
          updates.ready_at = new Date().toISOString()
          break
        case 'served':
          updates.served_at = new Date().toISOString()
          break
        case 'completed':
          updates.completed_at = new Date().toISOString()
          break
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) throw error

      console.log('✅ 訂單狀態更新成功:', orderId, status)

      // 更新本地狀態
      set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { 
            ...order, 
            ...updates
          } : order
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, ...updates }
          : state.currentOrder
      }))
    } catch (error) {
      console.error('❌ 訂單狀態更新失敗:', error)
      set({ error: (error as Error).message })
      throw error // 重新拋出錯誤，讓調用方能處理
    } finally {
      set({ loading: false })
    }
  },

  // 結帳處理
  processCheckout: async (tableId: string, orderId: string, paymentData: {
    payment_method: string
    received_amount?: number
    change_amount?: number
  }) => {
    set({ loading: true, error: null })
    try {
      const now = new Date().toISOString()
      
      // 更新訂單為已完成並記錄支付方式
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_at: now,
          payment_status: 'paid',
          updated_at: now
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // 創建付款記錄 - 首先獲取訂單總金額
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('id', orderId)
        .single()

      if (fetchError) throw fetchError

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_method: paymentData.payment_method,
          amount: orderData.total_amount || 0,
          received_amount: paymentData.received_amount,
          change_amount: paymentData.change_amount,
          status: 'completed',
          processed_at: now,
          confirmed_at: now
        })

      if (paymentError) throw paymentError

      // 更新桌台狀態為清潔中
      const { error: tableError } = await supabase
        .from('tables')
        .update({ 
          status: 'cleaning',
          last_cleaned_at: now,
          current_session_id: null, // 清除當前會話
          updated_at: now
        })
        .eq('id', tableId)

      if (tableError) throw tableError

      // 更新本地狀態
      set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { 
            ...order, 
            status: 'completed' as const,
            completed_at: now,
            payment_status: 'paid' as const
          } : order
        ),
        tables: state.tables.map(table =>
          table.id === tableId ? {
            ...table,
            status: 'cleaning' as const,
            last_cleaned_at: now,
            current_session_id: undefined
          } : table
        )
      }))

      console.log('✅ 結帳處理完成', { tableId, orderId, paymentData })
    } catch (error) {
      console.error('❌ 結帳處理失敗:', error)
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // 更新桌台狀態
  updateTableStatus: async (tableId, status, metadata = {}) => {
    set({ loading: true, error: null })
    
    try {
      const now = new Date().toISOString()
      
      // 準備更新數據
      const updateData: any = {
        status,
        updated_at: now
      }
      
      // 根據狀態添加相應的時間戳和資訊
      switch (status) {
        case 'available':
          updateData.last_cleaned_at = now
          updateData.current_session_id = null
          updateData.last_occupied_at = null
          break
        case 'occupied':
          updateData.last_occupied_at = now
          if (metadata.sessionId) {
            updateData.current_session_id = metadata.sessionId
          }
          break
        case 'cleaning':
          updateData.last_cleaned_at = now
          updateData.current_session_id = null
          break
        case 'maintenance':
          updateData.current_session_id = null
          break
        case 'reserved':
          // 預約狀態的處理
          break
      }

      // 同步到 Supabase 數據庫
      const { error: dbError } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', tableId)

      if (dbError) {
        throw new Error(`更新桌台狀態失敗: ${dbError.message}`)
      }

      // 更新本地狀態
      set((state) => ({
        tables: state.tables.map(table => 
          table.id === tableId 
            ? { 
                ...table, 
                status,
                updated_at: now,
                ...updateData,
                ...metadata
              }
            : table
        ),
        loading: false
      }))

      console.log(`✅ 桌台 ${tableId} 狀態已更新為 ${status}`)
      
    } catch (error) {
      console.error('❌ 更新桌台狀態失敗:', error)
      set({ 
        error: error instanceof Error ? error.message : '更新桌台狀態失敗',
        loading: false 
      })
      throw error
    }
  },

  // 創建訂單並更新桌況
  createOrderWithTableUpdate: async (orderData) => {
    const { updateTableStatus, clearCart, setSelectedTable } = get()
    
    try {
      set({ loading: true, error: null })
      
      // 1. 準備完整的訂單資料（匹配實際資料庫結構）
      const newOrder: Order = {
        id: crypto.randomUUID(),
        order_number: `ORD-${Date.now()}`,
        restaurant_id: orderData.restaurant_id,
        table_id: orderData.table_id,
        session_id: null,
        order_type: 'dine_in',
        customer_name: orderData.customer_name || '',
        customer_phone: orderData.customer_phone || '',
        customer_email: null,
        table_number: orderData.table_number || null,
        party_size: orderData.party_size || 1,
        subtotal: orderData.subtotal,
        discount_amount: 0,
        tax_amount: orderData.tax_amount,
        service_charge: 0,
        total_amount: orderData.total_amount,
        status: 'pending',
        payment_status: 'unpaid',
        ordered_at: new Date().toISOString(),
        confirmed_at: undefined,
        preparation_started_at: undefined,
        ready_at: undefined,
        served_at: undefined,
        completed_at: undefined,
        estimated_ready_time: undefined,
        estimated_prep_time: undefined,
        actual_prep_time: undefined,
        ai_optimized: false,
        ai_estimated_prep_time: undefined,
        ai_recommendations: undefined,
        ai_efficiency_score: undefined,
        notes: orderData.notes || '',
        special_instructions: undefined,
        source: 'pos',
        created_by: undefined,
        updated_by: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: null
      }
      
      // 2. 更新本地訂單狀態
      set((state) => ({
        orders: [...state.orders, newOrder]
      }))
      
      // 3. 更新桌台狀態為佔用
      updateTableStatus(orderData.table_id, 'occupied', {
        orderId: newOrder.id,
        customer_count: orderData.party_size || 1,
        seated_at: new Date().toISOString(),
        order_number: newOrder.order_number
      })
      
      // 4. 保存訂單到 Supabase 資料庫
      console.log('💾 正在保存訂單到資料庫...')
      const { error: orderError } = await supabase
        .from('orders')
        .insert([newOrder])
      
      if (orderError) {
        console.error('❌ 訂單保存失敗:', orderError)
        throw new Error(`訂單保存失敗: ${orderError.message}`)
      }
      
      console.log('✅ 訂單已保存到資料庫')
      
      // 5. 保存訂單項目到 order_items 資料表
      if (orderData.items && orderData.items.length > 0) {
        console.log('� 正在保存訂單項目...')
        const orderItems = orderData.items.map((item: any) => ({
          id: crypto.randomUUID(),
          order_id: newOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          special_instructions: item.special_instructions || '',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)
        
        if (itemsError) {
          console.error('❌ 訂單項目保存失敗:', itemsError)
          // 即使項目保存失敗，訂單仍然有效，所以不拋出錯誤
          console.warn('⚠️ 訂單已保存但項目保存失敗，請手動檢查')
        } else {
          console.log(`✅ ${orderItems.length} 個訂單項目已保存到資料庫`)
        }
      }
      
      // 6. 更新桌台狀態到資料庫
      console.log('💾 正在更新桌台狀態...')
      const { error: tableError } = await supabase
        .from('tables')
        .update({ 
          status: 'occupied',
          current_session_id: null, // 暫時設為 null 避免外鍵約束問題
          last_occupied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderData.table_id)
      
      if (tableError) {
        console.error('❌ 桌台狀態更新失敗:', tableError)
        // 桌台狀態更新失敗不影響訂單建立
        console.warn('⚠️ 訂單已建立但桌台狀態更新失敗')
      } else {
        console.log('✅ 桌台狀態已更新為佔用')
      }
      
      // 7. 清空購物車和重置桌台選擇
      clearCart()
      setSelectedTable(null)
      
      // 8. 輸出完整訂單資訊
      console.log('🍽️ 新訂單已建立並更新桌況：', newOrder)
      console.log('🪑 桌台狀態已更新為佔用')
      console.log('📋 訂單摘要：')
      console.log(`- 訂單編號：${newOrder.order_number}`)
      console.log(`- 桌號：${orderData.table_number}`)
      console.log(`- 項目數量：${orderData.items.length}`)
      console.log(`- 總計：NT$ ${(newOrder.total_amount || 0).toLocaleString()}`)
      
      set({ loading: false })
      return newOrder
      
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      console.error('❌ 訂單建立失敗:', error)
      return null
    }
  }
}))

export default usePOSStore
