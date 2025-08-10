import { describe, it, expect, vi, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createOrdersSlice, OrdersSliceState } from '../lib/slices/ordersSlice'

// Minimal supabase mock tailored per test; we re-mock each test case
vi.mock('../lib/supabase', () => ({ supabase: {} }))
import { supabase } from '../lib/supabase'

interface TestStore extends OrdersSliceState {
  tables: any[]
  updateTableStatus: any
  clearCart: () => void
  setSelectedTable: (id: string | null) => void
}

const createTestStore = () => create<TestStore>()((...a) => ({
  ...createOrdersSlice(...a),
  tables: [],
  updateTableStatus: vi.fn(),
  clearCart: vi.fn(),
  setSelectedTable: vi.fn()
}))

const buildSupabaseMock = (options: { orders?: any[]; orderItems?: any[] }) => {
  (supabase as any).auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { user_metadata: { restaurant_id: 'rest1' } } } }) }
  ;(supabase as any).from = (table: string) => {
    const chain: any = {
      _table: table,
      select() { return chain },
      eq() { return chain },
      not() { return chain },
      order() {
        if (table === 'orders') return Promise.resolve({ data: options.orders ?? [], error: null })
        return Promise.resolve({ data: null, error: null })
      },
      in(_col: string, _ids: string[]) { return Promise.resolve({ data: options.orderItems ?? [], error: null }) },
      update() { return { eq: () => Promise.resolve({ error: null }) } },
    }
    return chain
  }
}

describe('ordersSlice', () => {
  let store: ReturnType<typeof createTestStore>
  beforeEach(() => {
    store = createTestStore()
  })

  it('loads orders and processes order items names', async () => {
    buildSupabaseMock({
      orders: [{ id: 'o1', restaurant_id: 'rest1', status: 'pending' }],
      orderItems: [
        { id: 'i1', order_id: 'o1', product_id: 'p1', products: { name: 'Latte', sku: 'L001' }, quantity: 1, unit_price: 120, total_price: 120, status: 'pending' },
        { id: 'i2', order_id: 'o1', product_id: 'p2', product_name: 'Fallback', quantity: 2, unit_price: 50, total_price: 100, status: 'pending' }
      ]
    })
    await store.getState().loadOrders()
    const { orders, orderItems } = store.getState()
    expect(orders.length).toBe(1)
    expect(orderItems.length).toBe(2)
    const names = orderItems.map(i => i.product_name)
    expect(names).toContain('Latte')
    expect(names).toContain('Fallback')
  })

  it('updates order status with timestamp field', async () => {
    // Seed order
    store.setState({ orders: [{ id: 'o2', order_number: '001', status: 'pending' } as any] })
    buildSupabaseMock({ orders: [], orderItems: [] })
    await store.getState().updateOrderStatus('o2', 'ready')
    const updated = store.getState().orders.find(o => o.id === 'o2')!
    expect(updated.status).toBe('ready')
    expect(updated.ready_at).toBeDefined()
  })
})
