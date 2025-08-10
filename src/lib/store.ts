import { StateCreator, create } from 'zustand'
import { supabase } from './supabase'
import { generateDineInOrderNumber } from '../utils/orderNumberGenerator'
import type { Restaurant, Product, ComboProduct, Order, OrderItem, CartItem } from './types'
import { createProductsSlice, ProductsSliceState } from './slices/productsSlice'
import { createTablesSlice, TablesSliceState } from './slices/tablesSlice'
import { createOrdersSlice, OrdersSliceState } from './slices/ordersSlice'
import { createReservationsSlice, ReservationsSliceState } from './slices/reservationsSlice'

// 補充共享資料結構
interface OrderingInfo {
  tableNumber: string
  tableName: string
  partySize: number
  customerName?: string
  reservationId?: string
}

interface ExtraState {
  currentRestaurant: Restaurant | null
  cartItems: CartItem[]
  selectedTable: string | null
  orderingInfo: OrderingInfo | null
  currentOrder: Order | null
  loading: boolean
  error: string | null
  setCurrentRestaurant: (r: Restaurant) => void
  setSelectedTable: (id: string | null) => void
  setOrderingInfo: (info: OrderingInfo | null) => void
  addToCart: (p: Product | ComboProduct) => void
  updateCartQuantity: (instanceId: string, quantity: number) => void
  updateCartNote: (instanceId: string, note: string) => void
  removeFromCart: (instanceId: string) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
  createOrder: () => Promise<string | null>
  addOrderItem: (item: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export type POSStore = ProductsSliceState & TablesSliceState & OrdersSliceState & ReservationsSliceState & ExtraState

const createExtraSlice: StateCreator<POSStore, [], [], ExtraState> = (set, get) => ({
  currentRestaurant: null,
  cartItems: [],
  selectedTable: null,
  orderingInfo: null,
  currentOrder: null,
  loading: false,
  error: null,
  setCurrentRestaurant: (r) => set({ currentRestaurant: r }),
  setSelectedTable: (id) => set({ selectedTable: id }),
  setOrderingInfo: (info) => set({ orderingInfo: info }),
  addToCart: (product) => {
    const instanceId = `${product.id}_${Date.now()}`
    const newItem: CartItem = { id: product.id, instanceId, name: product.name, price: product.price, quantity: 1, type: 'combo_type' in product ? 'combo' : 'product' }
    set(state => ({ cartItems: [...state.cartItems, newItem] }))
  },
  updateCartQuantity: (instanceId, quantity) => {
    set(state => ({
      cartItems: quantity <= 0
        ? state.cartItems.filter(i => i.instanceId !== instanceId)
        : state.cartItems.map(i => i.instanceId === instanceId ? { ...i, quantity } : i)
    }))
  },
  updateCartNote: (instanceId, note) => set(state => ({ cartItems: state.cartItems.map(i => i.instanceId === instanceId ? { ...i, special_instructions: note } : i) })),
  removeFromCart: (instanceId) => set(state => ({ cartItems: state.cartItems.filter(i => i.instanceId !== instanceId) })),
  clearCart: () => set({ cartItems: [] }),
  getCartTotal: () => get().cartItems.reduce((t, i) => t + i.price * i.quantity, 0),
  getCartItemCount: () => get().cartItems.reduce((c, i) => c + i.quantity, 0),
  createOrder: async () => {
    const { selectedTable, cartItems, currentRestaurant, tables } = get()
    if (!selectedTable || cartItems.length === 0) { set({ error: '請選擇桌台並添加商品到購物車' }); return null }
    try {
      set({ loading: true, error: null })
      const table = tables.find(t => t.id === selectedTable)
      if (!table) throw new Error('找不到選擇的桌台')
      const orderNumber = generateDineInOrderNumber(String(table.table_number))
      const total = get().getCartTotal()
      const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = { restaurant_id: currentRestaurant?.id, table_id: selectedTable, order_number: orderNumber, table_number: table.table_number, subtotal: total, tax_amount: 0, total_amount: total, status: 'pending', payment_status: 'unpaid' }
      const { data: order, error: orderError } = await supabase.from('orders').insert(orderData).select().single()
      if (orderError) throw orderError
      const orderItems = cartItems.map(item => ({ order_id: order.id, product_id: item.id, product_name: item.name, quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity, special_instructions: item.special_instructions || '', status: 'pending' as const }))
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) { await supabase.from('orders').delete().eq('id', order.id); throw itemsError }
      set({ currentOrder: order, cartItems: [], selectedTable: null })
      return order.id
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '建立訂單失敗' }); return null
    } finally { set({ loading: false }) }
  },
  addOrderItem: async (item) => {
    try { await supabase.from('order_items').insert(item) } catch (e) { set({ error: e instanceof Error ? e.message : '新增訂單項目失敗' }) }
  }
})

export const usePOSStore = create<POSStore>()((...a) => ({
  ...createProductsSlice(...a),
  ...createTablesSlice(...a),
  ...createOrdersSlice(...a),
  ...createReservationsSlice(...a),
  ...createExtraSlice(...a)
}))

export default usePOSStore
