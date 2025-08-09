import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ComboChild { productId: string; name: string; groupKey: string; priceDelta: number }
export interface CartItem {
  id: string
  type: 'single' | 'combo'
  productId: string
  name: string
  unitPrice: number
  qty: number
  note?: string
  comboChildren?: ComboChild[]
  meta?: any
}

interface OrderingContext {
  tableNumber?: string
  tableName?: string
  reservationId?: string
  partySize?: number
  customerName?: string
}

interface OrderingTotals { subtotal: number; tax: number; total: number }

interface ComboDraftGroupState { selected: string[] }
export interface ComboDraft {
  comboProductId: string
  name: string
  basePrice: number
  groups: Record<string, ComboDraftGroupState>
  rules: any
}

interface OrderingState {
  context: OrderingContext
  items: CartItem[]
  draft?: ComboDraft
  category: string
  search: string
  submitting: boolean
  totals: OrderingTotals
  setContext: (ctx: Partial<OrderingContext>) => void
  setCategory: (c: string) => void
  setSearch: (q: string) => void
  startComboDraft: (draft: ComboDraft) => void
  updateComboSelection: (groupKey: string, productId: string, max: number) => void
  cancelComboDraft: () => void
  confirmComboDraft: () => void
  addSingle: (item: Omit<CartItem,'id'|'type'>) => void
  updateQty: (id: string, delta: number) => void
  updateNote: (id: string, note: string) => void
  removeItem: (id: string) => void
  clear: () => void
  computeTotals: () => void
}

const calcTotals = (items: CartItem[]): OrderingTotals => {
  const subtotal = items.reduce((s,i)=> s + (i.unitPrice * i.qty) + (i.comboChildren?.reduce((cs,c)=> cs + c.priceDelta,0) || 0), 0)
  const tax = 0
  return { subtotal, tax, total: subtotal + tax }
}

export const useOrderingStore = create<OrderingState>()(persist((set,get)=>({
  context: {},
  items: [],
  category: 'all',
  search: '',
  submitting: false,
  totals: { subtotal:0, tax:0, total:0 },
  setContext: (ctx) => set({ context: { ...get().context, ...ctx } }),
  setCategory: (c) => set({ category: c }),
  setSearch: (search) => set({ search }),
  startComboDraft: (draft) => set({ draft }),
  updateComboSelection: (groupKey, productId, max) => {
    const draft = get().draft; if(!draft) return
    const grp = draft.groups[groupKey] || { selected: [] }
    let selected = grp.selected.includes(productId)
      ? grp.selected.filter(id=>id!==productId)
      : [...grp.selected, productId]
    if (selected.length > max) selected = selected.slice(1) // 簡單策略：超過則移除最早
    draft.groups[groupKey] = { selected }
    set({ draft: { ...draft } })
  },
  cancelComboDraft: () => set({ draft: undefined }),
  confirmComboDraft: () => {
    const draft = get().draft; if(!draft) return
    const children: ComboChild[] = []
    Object.entries(draft.groups).forEach(([g,gs]) => {
      gs.selected.forEach(pid => children.push({ productId: pid, name: pid, groupKey: g, priceDelta: 0 }))
    })
    const newItem: CartItem = { id: crypto.randomUUID(), type: 'combo', productId: draft.comboProductId, name: draft.name, unitPrice: draft.basePrice, qty: 1, comboChildren: children, meta: { rules: draft.rules } }
    const items = [...get().items, newItem]
    set({ items, draft: undefined, totals: calcTotals(items) })
  },
  addSingle: (item) => { const newItem: CartItem = { id: crypto.randomUUID(), type:'single', ...item, qty: item.qty||1 }; const items=[...get().items,newItem]; set({ items, totals: calcTotals(items) }) },
  updateQty: (id, delta) => { const items = get().items.map(i => i.id===id ? { ...i, qty: Math.max(1, i.qty+delta)}:i); set({ items, totals: calcTotals(items) }) },
  updateNote: (id,note)=>{ const items=get().items.map(i=>i.id===id?{...i,note}:i); set({ items }) },
  removeItem: (id)=>{ const items=get().items.filter(i=>i.id!==id); set({ items, totals: calcTotals(items) }) },
  clear: ()=> set({ items: [], totals: { subtotal:0, tax:0, total:0 } }),
  computeTotals: ()=> set({ totals: calcTotals(get().items) })
}), { name: 'ordering-store-v1' }))
