import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface Product { id: string; name: string; price: number; category_id: string; is_available?: boolean; is_active?: boolean; type?: 'single' | 'combo' }
export interface ComboProduct { id: string; name: string; price?: number; base_price?: number; category_id?: string; is_available?: boolean }

export interface CategoryOption { id: string; name: string }
interface UseProductsResult {
  loading: boolean
  error?: string
  list: (Product & { displayPrice: number; isCombo?: boolean })[]
  categories: CategoryOption[]
  refetch: () => Promise<void>
}

export function useProducts(category: string, search: string): UseProductsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<ComboProduct[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const load = async () => {
    try {
      setLoading(true)
      setError(undefined)
      const [
        { data: prodData, error: prodErr },
        { data: comboData, error: comboErr },
        { data: catData, error: catErr }
      ] = await Promise.all([
        supabase.from('products').select('id,name,price,category_id,is_available,is_active,sort_order').eq('is_active', true).limit(500),
        supabase.from('combo_products').select('id,name,price,category_id,is_available,sort_order').limit(200),
        supabase.from('categories').select('id,name').eq('is_active', true).order('sort_order', { ascending: true })
      ])
      if (prodErr) throw prodErr
      if (comboErr) throw comboErr
      if (catErr) throw catErr
      setProducts(prodData || [])
      setCombos(comboData || [])
      setCategories(catData || [])
    } catch (e: any) {
      setError(e.message || '載入商品失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const searchLower = search.toLowerCase()
  const matchSearch = (name: string) => !search || name.toLowerCase().includes(searchLower)
  const isAll = category === 'all'
  const isSet = category === 'set'

  const filteredSingles = products
    .filter(p => p.is_available !== false && p.is_active !== false)
    .filter(p => (isAll || (!isSet && p.category_id === category)) && matchSearch(p.name))
    .map(p => ({ ...p, displayPrice: p.price, isCombo: false }))
  const filteredCombos = combos
    .filter(c => c.is_available !== false)
    .filter(c => (isAll || isSet || c.category_id === category) && matchSearch(c.name))
    .map(c => ({ id: c.id, name: c.name, price: (c.base_price ?? c.price) || 0, category_id: c.category_id || 'set', displayPrice: (c.base_price ?? c.price) || 0, isCombo: true as const }))

  return { loading, error, list: [...filteredSingles, ...filteredCombos], categories, refetch: load }
}
