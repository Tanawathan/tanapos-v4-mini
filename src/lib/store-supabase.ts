import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  Product,
  Category,
  Table,
  Order,
  CartItem,
  DashboardStats
} from './types-unified'
import { 
  productsService, 
  categoriesService, 
  tablesService, 
  ordersService
} from './api'

// ============================================================================
// Store 狀態介面定義
// ============================================================================

interface POSState {
  // 基礎數據
  products: Product[]
  categories: Category[]
  tables: Table[]
  orders: Order[]
  cartItems: CartItem[]
  
  // UI 狀態
  loading: boolean
  error: string | null
  selectedTable: string | null
  selectedOrder: string | null
  currentView: string
  
  // 統計數據
  dashboardStats: DashboardStats | null
  
  // ============================================================================
  // 基礎數據操作 (只使用現有API方法)
  // ============================================================================
  
  // 產品操作
  loadProducts: () => Promise<void>
  getProductsByCategory: (categoryId: string) => Promise<void>
  
  // 分類操作
  loadCategories: () => Promise<void>
  
  // 桌位操作
  loadTables: () => Promise<void>
  updateTableStatus: (tableNumber: number, status: Table['status']) => Promise<void>
  
  // 訂單操作
  loadOrders: () => Promise<void>
  createOrder: (orderData: any) => Promise<Order | undefined>
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>
  getOrdersByStatus: (status: Order['status']) => Promise<void>
  getOrdersByTable: (tableId: number) => Promise<void>
  
  // ============================================================================
  // 購物車操作
  // ============================================================================
  
  addToCart: (product: Product, quantity?: number, note?: string) => void
  removeFromCart: (instanceId: string) => void
  updateCartQuantity: (instanceId: string, quantity: number) => void
  updateCartNote: (instanceId: string, note: string) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
  
  // ============================================================================
  // UI 操作
  // ============================================================================
  
  setSelectedTable: (tableId: string | null) => void
  setCurrentView: (view: string) => void
}

// ============================================================================
// Store 實作
// ============================================================================

export const usePOSStore = create<POSState>()(
  subscribeWithSelector((set, get) => ({
    // 初始狀態
    products: [],
    categories: [],
    tables: [],
    orders: [],
    cartItems: [],
    loading: false,
    error: null,
    selectedTable: null,
    selectedOrder: null,
    currentView: 'dashboard',
    dashboardStats: null,

    // ============================================================================
    // 產品操作實作
    // ============================================================================

    loadProducts: async () => {
      set({ loading: true, error: null })
      try {
        const products = await productsService.getAll()
        set({ products, loading: false })
      } catch (error) {
        console.error('Error loading products:', error)
        set({ error: '載入產品失敗', loading: false })
      }
    },

    getProductsByCategory: async (categoryId: string) => {
      set({ loading: true, error: null })
      try {
        const products = await productsService.getByCategory(categoryId)
        set({ products, loading: false })
      } catch (error) {
        console.error('Error loading products by category:', error)
        set({ error: '載入分類產品失敗', loading: false })
      }
    },

    // ============================================================================
    // 分類操作實作  
    // ============================================================================

    loadCategories: async () => {
      set({ loading: true, error: null })
      try {
        const categories = await categoriesService.getAll()
        set({ categories, loading: false })
      } catch (error) {
        console.error('Error loading categories:', error)
        set({ error: '載入分類失敗', loading: false })
      }
    },

    // ============================================================================
    // 桌位操作實作
    // ============================================================================

    loadTables: async () => {
      set({ loading: true, error: null })
      try {
        const tables = await tablesService.getAll()
        set({ tables, loading: false })
      } catch (error) {
        console.error('Error loading tables:', error)
        set({ error: '載入桌位失敗', loading: false })
      }
    },

    updateTableStatus: async (tableNumber: number, status: 'available' | 'occupied') => {
      try {
        const success = await tablesService.updateStatus(tableNumber, status)
        if (success) {
          set(state => ({
            tables: state.tables.map(t => 
              t.table_number === tableNumber ? { ...t, status } : t
            )
          }))
        }
      } catch (error) {
        console.error('Error updating table status:', error)
        set({ error: '更新桌位狀態失敗' })
      }
    },

    // ============================================================================
    // 訂單操作實作
    // ============================================================================

    loadOrders: async () => {
      set({ loading: true, error: null })
      try {
        const orders = await ordersService.getAll()
        set({ orders, loading: false })
      } catch (error) {
        console.error('Error loading orders:', error)
        set({ error: '載入訂單失敗', loading: false })
      }
    },

    createOrder: async (orderData) => {
      set({ loading: true, error: null })
      try {
        const newOrder = await ordersService.create(orderData)
        if (newOrder) {
          set(state => ({
            orders: [...state.orders, newOrder],
            loading: false
          }))
          return newOrder
        }
      } catch (error) {
        console.error('Error creating order:', error)
        set({ error: '建立訂單失敗', loading: false })
        throw error
      }
    },

    updateOrderStatus: async (id: string, status: Order['status']) => {
      try {
        const success = await ordersService.updateStatus(id, status)
        if (success) {
          set(state => ({
            orders: state.orders.map(o => 
              o.id === id ? { ...o, status } : o
            )
          }))
        }
      } catch (error) {
        console.error('Error updating order status:', error)
        set({ error: '更新訂單狀態失敗' })
      }
    },

    getOrdersByStatus: async (status: Order['status']) => {
      set({ loading: true, error: null })
      try {
        const orders = await ordersService.getByStatus(status)
        set({ orders, loading: false })
      } catch (error) {
        console.error('Error loading orders by status:', error)
        set({ error: '載入狀態訂單失敗', loading: false })
      }
    },

    getOrdersByTable: async (tableId: number) => {
      set({ loading: true, error: null })
      try {
        const orders = await ordersService.getByTable(tableId)
        set({ orders, loading: false })
      } catch (error) {
        console.error('Error loading orders by table:', error)
        set({ error: '載入桌位訂單失敗', loading: false })
      }
    },

    // ============================================================================
    // 購物車操作實作 (使用正確的CartItem類型)
    // ============================================================================

    addToCart: (product, quantity = 1, note = '') => {
      set(state => {
        // 為每個新的購物車項目創建唯一的實例ID
        const instanceId = `${product.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        
        // 如果有相同商品且相同備註的項目，增加數量
        const existingItemIndex = state.cartItems.findIndex(item => 
          item.id === product.id && item.note === note
        )
        
        if (existingItemIndex >= 0) {
          return {
            cartItems: state.cartItems.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          }
        } else {
          // 創建新的購物車項目實例
          const newItem: CartItem = {
            id: product.id,
            instanceId,
            name: product.name,
            price: product.price,
            quantity,
            note
          }
          return {
            cartItems: [...state.cartItems, newItem]
          }
        }
      })
    },

    removeFromCart: (instanceId) => {
      set(state => ({
        cartItems: state.cartItems.filter(item => item.instanceId !== instanceId)
      }))
    },

    updateCartQuantity: (instanceId, quantity) => {
      if (quantity <= 0) {
        get().removeFromCart(instanceId)
        return
      }
      
      set(state => ({
        cartItems: state.cartItems.map(item =>
          item.instanceId === instanceId
            ? { ...item, quantity }
            : item
        )
      }))
    },

    updateCartNote: (instanceId, note) => {
      set(state => ({
        cartItems: state.cartItems.map(item =>
          item.instanceId === instanceId
            ? { ...item, note }
            : item
        )
      }))
    },

    clearCart: () => {
      set({ cartItems: [] })
    },

    getCartTotal: () => {
      const { cartItems } = get()
      return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    },

    getCartItemCount: () => {
      const { cartItems } = get()
      return cartItems.reduce((total, item) => total + item.quantity, 0)
    },

    // ============================================================================
    // UI 操作實作
    // ============================================================================

    setSelectedTable: (tableId) => {
      set({ selectedTable: tableId })
    },

    setCurrentView: (view) => {
      set({ currentView: view })
    }
  }))
)
