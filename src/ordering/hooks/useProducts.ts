import { useEffect, useState } from 'react'

export interface Product { id: string; name: string; price: number; category: string; is_combo?: boolean }

// TODO: 之後接 Supabase 資料；目前先假資料
const mock: Product[] = [
  { id: 'p1', name: '炒飯', price: 120, category: 'main' },
  { id: 'p2', name: '牛排', price: 480, category: 'main' },
  { id: 'p3', name: '沙拉', price: 90, category: 'side' },
  { id: 'p4', name: '綠茶', price: 40, category: 'drink' },
  { id: 'c1', name: '雙人套餐', price: 699, category: 'set', is_combo: true },
]

export function useProducts(category: string, search: string) {
  const [products, setProducts] = useState<Product[]>([])
  useEffect(() => { setProducts(mock) }, [])
  return products.filter(p => (category==='all'||p.category===category) && p.name.includes(search))
}
