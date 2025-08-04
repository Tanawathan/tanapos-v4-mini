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
  updateTableStatus: (tableId: string, status: Table['status'], metadata?: any) => void
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
  loading: false,
  error: null,

  // 基本設定
  setCurrentRestaurant: (restaurant) => set({ currentRestaurant: restaurant }),
  setSelectedTable: (tableId) => set({ selectedTable: tableId }),

  // 載入分類
  loadCategories: async () => {
    set({ loading: true, error: null })
    try {
      // 暫時使用模擬資料，稍後連接真實資料庫
      const mockCategories: Category[] = [
        {
          id: '1',
          restaurant_id: '1',
          name: '主餐',
          description: '各式主餐料理',
          sort_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          restaurant_id: '1',
          name: '飲品',
          description: '各式飲品',
          sort_order: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          restaurant_id: '1',
          name: '甜點',
          description: '各式甜點',
          sort_order: 3,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setTimeout(() => {
        set({ categories: mockCategories, loading: false })
      }, 500) // 模擬網路延遲
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  // 載入產品
  loadProducts: async () => {
    set({ loading: true, error: null })
    try {
      // 暫時使用模擬資料
      const mockProducts: Product[] = [
        {
          id: '1',
          restaurant_id: '1',
          category_id: '1',
          name: '牛肉漢堡',
          description: '新鮮牛肉搭配生菜、番茄',
          price: 180,
          cost: 80,
          image_url: '',
          is_available: true,
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          restaurant_id: '1',
          category_id: '1',
          name: '雞肉義大利麵',
          description: '白醬雞肉義大利麵',
          price: 220,
          cost: 100,
          image_url: '',
          is_available: true,
          is_active: true,
          sort_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          restaurant_id: '1',
          category_id: '1',
          name: '鮭魚排',
          description: '烤鮭魚排佐檸檬奶油醬',
          price: 320,
          cost: 150,
          image_url: '',
          is_available: true,
          is_active: true,
          sort_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          restaurant_id: '1',
          category_id: '2',
          name: '美式咖啡',
          description: '香濃美式咖啡',
          price: 120,
          cost: 30,
          image_url: '',
          is_available: true,
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          restaurant_id: '1',
          category_id: '2',
          name: '檸檬汽水',
          description: '清爽檸檬汽水',
          price: 80,
          cost: 25,
          image_url: '',
          is_available: true,
          is_active: true,
          sort_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          restaurant_id: '1',
          category_id: '3',
          name: '提拉米蘇',
          description: '經典義式提拉米蘇',
          price: 150,
          cost: 60,
          image_url: '',
          is_available: true,
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setTimeout(() => {
        set({ products: mockProducts, loading: false })
      }, 600) // 模擬網路延遲
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
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
    set({ loading: true, error: null })
    try {
      // 暫時使用模擬資料
      const mockTables: Table[] = [
        {
          id: '1',
          restaurant_id: '1',
          table_number: 1,
          name: 'A01',
          capacity: 2,
          status: 'available',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          restaurant_id: '1',
          table_number: 2,
          name: 'A02',
          capacity: 4,
          status: 'available',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          restaurant_id: '1',
          table_number: 3,
          name: 'A03',
          capacity: 6,
          status: 'occupied',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          restaurant_id: '1',
          table_number: 4,
          name: 'B01',
          capacity: 2,
          status: 'available',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          restaurant_id: '1',
          table_number: 5,
          name: 'B02',
          capacity: 4,
          status: 'cleaning',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          restaurant_id: '1',
          table_number: 6,
          name: 'B03',
          capacity: 8,
          status: 'available',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7',
          restaurant_id: '1',
          table_number: 7,
          name: 'C01',
          capacity: 2,
          status: 'occupied',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '8',
          restaurant_id: '1',
          table_number: 8,
          name: 'C02',
          capacity: 6,
          status: 'available',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '9',
          restaurant_id: '1',
          table_number: 9,
          name: 'C03',
          capacity: 4,
          status: 'reserved',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '10',
          restaurant_id: '1',
          table_number: 10,
          name: 'D01',
          capacity: 2,
          status: 'maintenance',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '11',
          restaurant_id: '1',
          table_number: 11,
          name: 'D02',
          capacity: 6,
          status: 'occupied',
          seated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分鐘前入座
          customer_count: 4,
          orderId: 'ord_001',
          order_number: 'ORD-1733292000001',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '12',
          restaurant_id: '1',
          table_number: 12,
          name: 'D03',
          capacity: 8,
          status: 'cleaning',
          cleaning_started: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10分鐘前開始清潔
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setTimeout(() => {
        set({ tables: mockTables, loading: false })
      }, 300) // 模擬網路延遲
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  // 載入訂單
  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      // 暫時使用模擬資料，稍後連接真實資料庫
      const mockOrders: Order[] = [
        {
          id: '1',
          restaurant_id: '1',
          table_id: '1',
          order_number: 'ORD-001',
          table_number: 1,
          customer_name: '王小明',
          customer_phone: '0912345678',
          subtotal: 320,
          tax_amount: 32,
          total_amount: 352,
          status: 'preparing',
          payment_status: 'unpaid',
          payment_method: 'cash',
          notes: '不要洋蔥',
          customer_count: 2,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分鐘前
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          restaurant_id: '1',
          table_id: '3',
          order_number: 'ORD-002',
          table_number: 3,
          customer_name: '李小華',
          customer_phone: '0987654321',
          subtotal: 580,
          tax_amount: 58,
          total_amount: 638,
          status: 'ready',
          payment_status: 'paid',
          payment_method: 'card',
          customer_count: 4,
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45分鐘前
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          restaurant_id: '1',
          table_id: '5',
          order_number: 'ORD-003',
          table_number: 5,
          customer_name: '張大偉',
          customer_phone: '0923456789',
          subtotal: 1200,
          tax_amount: 120,
          total_amount: 1320,
          status: 'completed',
          payment_status: 'paid',
          payment_method: 'mobile',
          notes: '慶生聚餐',
          customer_count: 8,
          served_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90分鐘前
          updated_at: new Date().toISOString()
        },
        {
          id: 'ord_001',
          restaurant_id: '1',
          table_id: '11',
          order_number: 'ORD-1733292000001',
          table_number: 11,
          customer_name: '陳美玲',
          customer_phone: '0934567890',
          subtotal: 605,
          tax_amount: 61,
          total_amount: 666,
          status: 'served',
          payment_status: 'unpaid',
          payment_method: 'cash',
          notes: '慶祝生日，請準備蠟燭',
          customer_count: 4,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分鐘前
          updated_at: new Date().toISOString()
        }
      ]

      const mockOrderItems: OrderItem[] = [
        {
          id: '1',
          order_id: '1',
          product_id: '1',
          product_name: '牛肉麵',
          quantity: 1,
          unit_price: 180,
          total_price: 180,
          status: 'preparing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          order_id: '1',
          product_id: '2',
          product_name: '滷肉飯',
          quantity: 1,
          unit_price: 120,
          total_price: 120,
          special_instructions: '不要洋蔥',
          status: 'preparing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          order_id: '1',
          product_id: '7',
          product_name: '可樂',
          quantity: 2,
          unit_price: 10,
          total_price: 20,
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          order_id: '2',
          product_id: '1',
          product_name: '牛肉麵',
          quantity: 2,
          unit_price: 180,
          total_price: 360,
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          order_id: '2',
          product_id: '3',
          product_name: '雞肉飯',
          quantity: 2,
          unit_price: 110,
          total_price: 220,
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          order_id: 'ord_001',
          product_id: '1',
          product_name: '牛肉漢堡',
          quantity: 2,
          unit_price: 280,
          total_price: 560,
          special_instructions: '不要洋蔥',
          status: 'served',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7',
          order_id: 'ord_001',
          product_id: '7',
          product_name: '可樂',
          quantity: 1,
          unit_price: 45,
          total_price: 45,
          status: 'served',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      set({ orders: mockOrders, orderItems: mockOrderItems })
    } catch (error) {
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
        tax_amount: total * (currentRestaurant?.tax_rate || 0.1),
        total_amount: total + (total * (currentRestaurant?.tax_rate || 0.1)),
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
      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('id', orderId)

      if (error) throw error

      // 更新本地狀態
      set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { 
            ...order, 
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : order.completed_at
          } : order
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, status }
          : state.currentOrder
      }))
    } catch (error) {
      set({ error: (error as Error).message })
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
      
      // 更新訂單為已完成並記錄支付資訊
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_at: now,
          payment_method: paymentData.payment_method,
          received_amount: paymentData.received_amount,
          change_amount: paymentData.change_amount,
          updated_at: now
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // 更新桌台狀態為清潔中
      const { error: tableError } = await supabase
        .from('tables')
        .update({ 
          status: 'cleaning',
          cleaning_started: now,
          checkout_completed: now,
          last_order_id: orderId,
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
            payment_method: paymentData.payment_method,
            received_amount: paymentData.received_amount,
            change_amount: paymentData.change_amount
          } : order
        ),
        tables: state.tables.map(table =>
          table.id === tableId ? {
            ...table,
            status: 'cleaning' as const,
            cleaning_started: now,
            checkout_completed: now,
            last_order_id: orderId
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
  updateTableStatus: (tableId, status, metadata = {}) => {
    set((state) => ({
      tables: state.tables.map(table => 
        table.id === tableId 
          ? { 
              ...table, 
              status,
              ...metadata // 可以包含訂單ID、開始時間等
            }
          : table
      )
    }))
  },

  // 創建訂單並更新桌況
  createOrderWithTableUpdate: async (orderData) => {
    const { updateTableStatus, clearCart, setSelectedTable } = get()
    
    try {
      set({ loading: true, error: null })
      
      // 1. 準備完整的訂單資料
      const newOrder: Order = {
        id: crypto.randomUUID(),
        order_number: `ORD-${Date.now()}`,
        restaurant_id: orderData.restaurant_id,
        table_id: orderData.table_id,
        customer_name: orderData.customer_name || '',
        customer_phone: orderData.customer_phone || '',
        customer_count: orderData.customer_count || 1,
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax_amount,
        total_amount: orderData.total_amount,
        status: 'pending',
        payment_status: 'unpaid',
        notes: orderData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // 2. 更新本地訂單狀態
      set((state) => ({
        orders: [...state.orders, newOrder]
      }))
      
      // 3. 更新桌台狀態為佔用
      updateTableStatus(orderData.table_id, 'occupied', {
        orderId: newOrder.id,
        customer_count: orderData.customer_count || 1,
        seated_at: new Date().toISOString(),
        order_number: newOrder.order_number
      })
      
      // 4. 這裡可以調用實際的 Supabase API 保存訂單
      // const { error } = await supabase.from('orders').insert([newOrder])
      // if (error) throw error
      
      // 5. 處理訂單項目（實際環境中也需要保存到資料庫）
      console.log('📋 訂單項目將保存:', orderData.items)
      
      // 6. 清空購物車和重置桌台選擇
      clearCart()
      setSelectedTable(null)
      
      // 7. 輸出完整訂單資訊
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
