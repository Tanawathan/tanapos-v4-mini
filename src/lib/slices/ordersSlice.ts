import { StateCreator } from 'zustand'
import { supabase } from '../supabase'
import { Order, OrderItem } from '../types'
import { generateDineInOrderNumber, generateTakeawayOrderNumber } from '../../utils/orderNumberGenerator'

export interface OrdersSliceState {
  orders: Order[]
  orderItems: OrderItem[]
  ordersLoaded: boolean
  loadOrders: () => Promise<void>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  processCheckout: (tableId: string, orderId: string, paymentData: { payment_method: string; received_amount?: number; change_amount?: number }) => Promise<void>
  createOrderWithTableUpdate: (orderData: any) => Promise<Order | null>
}

const MOCK_RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111'

export const createOrdersSlice: StateCreator<OrdersSliceState & { tables: any[]; updateTableStatus: any; clearCart: () => void; setSelectedTable: (id: string | null) => void; }, [], [], OrdersSliceState> = (set, get) => ({
  orders: [],
  orderItems: [],
  ordersLoaded: false,
  loadOrders: async () => {
    const state = get()
    if (state.ordersLoaded && state.orders.length > 0) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let restaurantId = MOCK_RESTAURANT_ID
      if (user?.user_metadata?.restaurant_id) restaurantId = user.user_metadata.restaurant_id
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
      if (ordersError) throw ordersError
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`*, products (name, sku), order_combo_selections ( id, rule_id, selected_product_id, quantity, additional_price, combo_selection_rules ( selection_name, description ), products:selected_product_id ( name, price ) )`)
        .in('order_id', (ordersData || []).map((o: any) => o.id))
      if (orderItemsError) throw orderItemsError
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
      set({ orders: ordersData || [], orderItems: processedOrderItems, ordersLoaded: true })
    } catch (e) {
      console.error('loadOrders error', e)
    }
  },
  updateOrderStatus: async (orderId, status) => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() }
      const now = new Date().toISOString()
      switch (status) {
        case 'confirmed': updates.confirmed_at = now; break
        case 'preparing': updates.preparation_started_at = now; break
        case 'ready': updates.ready_at = now; break
        case 'served': updates.served_at = now; break
        case 'completed': updates.completed_at = now; break
      }
      const { error } = await supabase.from('orders').update(updates).eq('id', orderId)
      if (error) throw error
      set(state => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, ...updates } : o) }))
    } catch (e) {
      console.error('updateOrderStatus error', e)
      throw e
    }
  },
  processCheckout: async (tableId, orderId, paymentData) => {
    try {
      const now = new Date().toISOString()
      const { error: orderError } = await supabase.from('orders').update({ status: 'completed', completed_at: now, payment_status: 'paid', updated_at: now }).eq('id', orderId)
      if (orderError) throw orderError
      const { data: orderData, error: fetchError } = await supabase.from('orders').select('total_amount, metadata').eq('id', orderId).single()
      if (fetchError) throw fetchError
      const { error: paymentError } = await supabase.from('payments').insert({ order_id: orderId, payment_method: paymentData.payment_method, amount: orderData.total_amount || 0, received_amount: paymentData.received_amount, change_amount: paymentData.change_amount, status: 'completed', processed_at: now, confirmed_at: now })
      if (paymentError) throw paymentError
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId)
      if (tableId && isUUID) {
        await supabase.from('tables').update({ status: 'cleaning', last_cleaned_at: now, current_session_id: null, updated_at: now }).eq('id', tableId)
      }
      const reservationId = (orderData as any)?.metadata?.reservation_id
      if (reservationId) {
        try { await supabase.from('table_reservations').update({ status: 'completed', completed_at: now, updated_at: now }).eq('id', reservationId) } catch {}
      }
      set(state => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'completed', completed_at: now, payment_status: 'paid' } : o) }))
    } catch (e) {
      console.error('processCheckout error', e)
      throw e
    }
  },
  createOrderWithTableUpdate: async (orderData) => {
    const safeId = () => {
      try { if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID() } catch {}
      const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(-4)
      return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`
    }
    const { updateTableStatus, clearCart, setSelectedTable } = get()
    try {
      const isTakeout = !!orderData.is_takeout || orderData.order_type === 'takeout'
      const orderNumber = isTakeout ? generateTakeawayOrderNumber() : generateDineInOrderNumber((orderData.table_number || 1).toString())
      const now = new Date().toISOString()
      const newOrder: Order = {
        id: safeId(),
        order_number: orderNumber,
        restaurant_id: orderData.restaurant_id,
        table_id: orderData.table_id,
        session_id: null,
        order_type: isTakeout ? 'takeout' : 'dine_in',
        customer_name: orderData.customer_name || '',
        customer_phone: orderData.customer_phone || '',
        customer_email: null,
        table_number: isTakeout ? null : (orderData.table_number || null),
        party_size: orderData.party_size || 1,
        subtotal: orderData.subtotal,
        discount_amount: 0,
        tax_amount: orderData.tax_amount,
        service_charge: 0,
        total_amount: orderData.total_amount,
        status: 'pending',
        payment_status: 'unpaid',
        ordered_at: now,
        created_at: now,
        updated_at: now,
        ai_optimized: false,
        notes: orderData.notes || '',
        metadata: orderData.reservation_id ? { reservation_id: orderData.reservation_id } : null
      }
      set(state => ({ orders: [...state.orders, newOrder] }))
      if (!isTakeout && orderData.table_id) {
        updateTableStatus(orderData.table_id, 'occupied', { orderId: newOrder.id, customer_count: orderData.party_size || 1, seated_at: now, order_number: newOrder.order_number })
      }
      const { error: orderError } = await supabase.from('orders').insert([newOrder])
      if (orderError) throw orderError
      if (orderData.items && orderData.items.length > 0) {
        const nowISO = now
        const orderItems: any[] = []
        const comboSelections: any[] = []
        orderData.items.forEach((item: any) => {
          if (item.is_combo_parent) {
            const parentId = safeId()
            orderItems.push({ id: parentId, order_id: newOrder.id, product_id: null, product_name: `[套餐] ${item.product_name || item.product_name}`, quantity: item.quantity, unit_price: item.unit_price, total_price: item.total_price, special_instructions: item.special_instructions || '', status: 'pending', created_at: nowISO, updated_at: nowISO })
            if (item.combo_children) {
              item.combo_children.forEach((c: any) => {
                comboSelections.push({ id: safeId(), order_item_id: parentId, rule_id: c.groupKey, selected_product_id: c.productId, quantity: 1, additional_price: c.priceDelta || 0, created_at: nowISO })
              })
            }
          } else {
            orderItems.push({ id: safeId(), order_id: newOrder.id, product_id: item.product_id, product_name: item.product_name, quantity: item.quantity, unit_price: item.unit_price, total_price: item.total_price, special_instructions: item.special_instructions || '', status: 'pending', created_at: nowISO, updated_at: nowISO })
          }
        })
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
        if (!itemsError && comboSelections.length) {
          await supabase.from('order_combo_selections').insert(comboSelections)
        }
      }
      if (orderData.table_id) {
        await supabase.from('tables').update({ status: 'occupied', current_session_id: null, last_occupied_at: now, updated_at: now }).eq('id', orderData.table_id)
      }
      clearCart();
      setSelectedTable(null)
      return newOrder
    } catch (e) {
      console.error('createOrderWithTableUpdate error', e)
      return null
    }
  }
})
