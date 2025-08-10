import { StateCreator } from 'zustand'
import type { Product, ComboProduct, CartItem } from '../types'

export interface CartSliceState {
  cartItems: CartItem[]
  addToCart: (p: Product | ComboProduct) => void
  updateCartQuantity: (instanceId: string, quantity: number) => void
  updateCartNote: (instanceId: string, note: string) => void
  removeFromCart: (instanceId: string) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
}

export const createCartSlice: StateCreator<CartSliceState, [], [], CartSliceState> = (set, get) => ({
  cartItems: [],
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
  getCartItemCount: () => get().cartItems.reduce((c, i) => c + i.quantity, 0)
})
