import { StateCreator, create } from 'zustand'
import { supabase } from './supabase'
import { generateDineInOrderNumber } from '../utils/orderNumberGenerator'
import type { Restaurant, Order, OrderItem } from './types'
import { createProductsSlice, ProductsSliceState } from './slices/productsSlice'
import { createTablesSlice, TablesSliceState } from './slices/tablesSlice'
import { createOrdersSlice, OrdersSliceState } from './slices/ordersSlice'
import { createReservationsSlice, ReservationsSliceState } from './slices/reservationsSlice'
import { createCartSlice, CartSliceState } from './slices/cartSlice'

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
  selectedTable: string | null
  orderingInfo: OrderingInfo | null
  currentOrder: Order | null
  loading: boolean
  error: string | null
  setCurrentRestaurant: (r: Restaurant) => void
  setSelectedTable: (id: string | null) => void
  setOrderingInfo: (info: OrderingInfo | null) => void
  createOrder: () => Promise<string | null>
  addOrderItem: (item: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export type POSStore = ProductsSliceState & TablesSliceState & OrdersSliceState & ReservationsSliceState & CartSliceState & ExtraState

const createExtraSlice: StateCreator<POSStore, [], [], ExtraState> = (set, get) => ({
  currentRestaurant: null,
  selectedTable: null,
  orderingInfo: null,
  currentOrder: null,
  loading: false,
  error: null,
  setCurrentRestaurant: (r) => set({ currentRestaurant: r }),
  setSelectedTable: (id) => set({ selectedTable: id }),
  setOrderingInfo: (info) => set({ orderingInfo: info }),
  createOrder: async () => {
  const { selectedTable, cartItems, currentRestaurant, tables } = get() as any
  if (!selectedTable || (cartItems?.length || 0) === 0) { set({ error: '請選擇桌台並添加商品到購物車' }); return null }
    try {
      set({ loading: true, error: null })
  const table = (tables as Array<{ id: string; table_number: number }>).find((t) => t.id === selectedTable)
      if (!table) throw new Error('找不到選擇的桌台')
      const orderNumber = generateDineInOrderNumber(String(table.table_number))
      const total = get().getCartTotal()
      const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = { restaurant_id: currentRestaurant?.id, table_id: selectedTable, order_number: orderNumber, table_number: table.table_number, subtotal: total, tax_amount: 0, total_amount: total, status: 'pending', payment_status: 'unpaid' }
      const { data: order, error: orderError } = await supabase.from('orders').insert(orderData).select().single()
      if (orderError) throw orderError
      const orderItems = (cartItems as Array<{ id: string; name: string; quantity: number; price: number; special_instructions?: string }>).map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.special_instructions || '',
        status: 'pending' as const
      }))
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
  ...createCartSlice(...a),
  ...createExtraSlice(...a)
}))

export default usePOSStore
