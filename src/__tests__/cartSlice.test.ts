import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import type { CartSliceState } from '../lib/slices/cartSlice'
import { createCartSlice } from '../lib/slices/cartSlice'

// Helper to build a store with only cart slice
const createCartStore = () => create<CartSliceState>()((...a) => ({
  ...createCartSlice(...a)
}))

describe('cartSlice', () => {
  let useStore: ReturnType<typeof createCartStore>
  beforeEach(() => {
    useStore = createCartStore()
  })

  it('adds items with unique instanceId', () => {
    const prod = { id: 'p1', name: 'Coffee', price: 100 } as any
    useStore.getState().addToCart(prod)
    useStore.getState().addToCart(prod)
    const items = useStore.getState().cartItems
    expect(items.length).toBe(2)
    expect(items[0].instanceId).not.toBe(items[1].instanceId)
  })

  it('updates quantity and removes when quantity <= 0', () => {
    const prod = { id: 'p2', name: 'Tea', price: 50 } as any
    useStore.getState().addToCart(prod)
    const item = useStore.getState().cartItems[0]
    useStore.getState().updateCartQuantity(item.instanceId, 3)
    expect(useStore.getState().cartItems[0].quantity).toBe(3)
    useStore.getState().updateCartQuantity(item.instanceId, 0)
    expect(useStore.getState().cartItems.length).toBe(0)
  })

  it('computes total and count correctly', () => {
    useStore.getState().addToCart({ id: 'a', name: 'A', price: 10 } as any)
    useStore.getState().addToCart({ id: 'b', name: 'B', price: 25 } as any)
    const [i1, i2] = useStore.getState().cartItems
    useStore.getState().updateCartQuantity(i1.instanceId, 2) // 2 * 10 = 20
    useStore.getState().updateCartQuantity(i2.instanceId, 3) // 3 * 25 = 75
    expect(useStore.getState().getCartTotal()).toBe(95)
    expect(useStore.getState().getCartItemCount()).toBe(5)
  })
})
