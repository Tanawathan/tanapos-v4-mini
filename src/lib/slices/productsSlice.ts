import { StateCreator } from 'zustand'
import { supabase } from '../supabase'
import { Category, Product, ComboProduct } from '../types'

export interface ProductsSliceState {
  categories: Category[]
  products: Product[]
  comboProducts: ComboProduct[]
  loadCategories: () => Promise<void>
  loadProducts: () => Promise<void>
  loadComboProducts: () => Promise<void>
}

export const createProductsSlice: StateCreator<ProductsSliceState, [], [], ProductsSliceState> = (set) => ({
  categories: [],
  products: [],
  comboProducts: [],
  loadCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      set({ categories: data || [] })
    } catch (e) {
      console.error('loadCategories error', e)
    }
  },
  loadProducts: async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      set({ products: data || [] })
    } catch (e) {
      console.error('loadProducts error', e)
    }
  },
  loadComboProducts: async () => {
    try {
      const { data, error } = await supabase
        .from('combo_products')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true })
      if (error) throw error
      set({ comboProducts: data || [] })
    } catch (e) {
      console.error('loadComboProducts error', e)
    }
  }
})
