import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface Product { id: string; name: string; price: number; category_id: string; is_available?: boolean; type?: 'single' | 'combo' }
export interface ComboProduct { id: string; name: string; base_price: number; is_available?: boolean }

interface UseProductsResult {
  loading: boolean
  error?: string
  list: (Product & { displayPrice: number; isCombo?: boolean })[]
  refetch: () => Promise<void>
}

export function useProducts(category: string, search: string): UseProductsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<ComboProduct[]>([])

  const load = async () => {
    try {
      setLoading(true)
      setError(undefined)
      const [{ data: prodData, error: prodErr }, { data: comboData, error: comboErr }] = await Promise.all([
        supabase.from('products').select('id,name,price,category_id,is_available').eq('is_deleted', false).limit(500),
        supabase.from('combo_products').select('id,name,base_price,is_available').eq('is_deleted', false).limit(200)
      ])
      if (prodErr) throw prodErr
      if (comboErr) throw comboErr
      setProducts(prodData || [])
      setCombos(comboData || [])
    } catch (e: any) {
      setError(e.message || '載入商品失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filteredSingles = products.filter(p => p.is_available !== false)
    .filter(p => (category==='all'||p.category_id===category) && (!search || p.name.includes(search)))
    .map(p => ({ ...p, displayPrice: p.price, isCombo: false }))
  const filteredCombos = combos.filter(c => c.is_available !== false)
    .filter(c => (category==='all'||category==='set') && (!search || c.name.includes(search)))
    .map(c => ({ id: c.id, name: c.name, price: c.base_price, category_id: 'set', displayPrice: c.base_price, isCombo: true as const }))

  return { loading, error, list: [...filteredSingles, ...filteredCombos], refetch: load }
}
