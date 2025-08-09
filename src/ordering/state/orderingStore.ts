import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 安全 ID 生成：某些 WebView / 舊版瀏覽器不支援 crypto.randomUUID
const genId = (): string => {
  try {
    const g: any = (globalThis as any)
    if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID()
  } catch {}
  return 'id-' + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36)
}

export interface ComboChild { productId: string; name: string; groupKey: string; priceDelta: number }

// 規則群組結構 (由 component 載入後放入 draft.rules.groups)
export interface ComboRuleItem { id: string; name: string; priceDelta: number }
export interface ComboRuleGroup { label: string; min: number; max: number; required: boolean; items: ComboRuleItem[] }
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
  takeout?: boolean // 外帶模式
}

interface OrderingTotals { subtotal: number; tax: number; total: number }

interface ComboDraftGroupState { selected: string[] }
export interface ComboDraft {
  comboProductId: string
  name: string
  basePrice: number
  comboQty: number // 使用者在套餐彈窗選擇的份數
  groups: Record<string, ComboDraftGroupState>
  rules: { groups: Record<string, ComboRuleGroup> }
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
  updateComboSelection: (groupKey: string, productId: string, baseMax: number) => void
  updateComboQty: (qty: number) => void
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
  const subtotal = items.reduce((s,i)=> {
    const childDelta = (i.comboChildren?.reduce((cs,c)=> cs + c.priceDelta,0) || 0) * i.qty
    return s + (i.unitPrice * i.qty) + childDelta
  }, 0)
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
  startComboDraft: (draft) => set({ draft: { ...draft, comboQty: draft.comboQty || 1 } }),
  updateComboSelection: (groupKey, productId, baseMax) => {
    const draft = get().draft; if(!draft) return
    const grp = draft.groups[groupKey] || { selected: [] }
    // 動態上限：原始 rule.max * comboQty (每份套餐 1 份主餐 → 2 份套餐即可點 2 份主餐)
    const effectiveMax = baseMax * (draft.comboQty || 1)
    const perItemMax = (draft.comboQty || 1) * baseMax // 同一品項可重複次數
    const selected = [...grp.selected]
    const total = selected.length
    const countThis = selected.filter(id=>id===productId).length
    if (countThis === 0) {
      if (total < effectiveMax) selected.push(productId) // 新增一份
    } else if (countThis < perItemMax && total < effectiveMax) {
      // 還可以再加同品項
      selected.push(productId)
    } else {
      // 已達該品項或整體上限 → 循環回 0 (移除全部該品項)
      for (let i = selected.length -1; i>=0; i--) if (selected[i]===productId) selected.splice(i,1)
    }
    draft.groups[groupKey] = { selected }
    set({ draft: { ...draft } })
  },
  updateComboQty: (qty) => {
    const draft = get().draft; if(!draft) return
    const newQty = Math.min(20, Math.max(1, qty))
    // 若縮小份數，需修剪各群組已選數量 (從前面刪除)
    Object.entries(draft.rules.groups).forEach(([g, rule]) => {
      const effectiveMax = rule.max * newQty
      const grp = draft.groups[g] || { selected: [] }
      if (grp.selected.length > effectiveMax) grp.selected = grp.selected.slice(0, effectiveMax)
      draft.groups[g] = grp
    })
    draft.comboQty = newQty
    set({ draft: { ...draft } })
  },
  cancelComboDraft: () => set({ draft: undefined }),
  confirmComboDraft: () => {
    const draft = get().draft; if(!draft) return
    const children: ComboChild[] = []
    Object.entries(draft.groups).forEach(([g,gs]) => {
      const ruleGroup = draft.rules.groups[g]
      gs.selected.forEach(pid => {
        const item = ruleGroup?.items.find(it=>it.id===pid)
        children.push({ productId: pid, name: item?.name || pid, groupKey: g, priceDelta: item?.priceDelta || 0 })
      })
    })
    // 將份數體現在單價 (unitPrice = basePrice * 份數)，購物車項目 qty 維持 1，子品項按總份數展開
    const newItem: CartItem = { id: genId(), type: 'combo', productId: draft.comboProductId, name: draft.name, unitPrice: draft.basePrice * (draft.comboQty||1), qty: 1, comboChildren: children, meta: { rules: draft.rules, comboQty: draft.comboQty || 1 } }
    const items = [...get().items, newItem]
    set({ items, draft: undefined, totals: calcTotals(items) })
  },
  addSingle: (item) => { const newItem: CartItem = { id: genId(), type:'single', ...item, qty: item.qty||1 }; const items=[...get().items,newItem]; set({ items, totals: calcTotals(items) }) },
  updateQty: (id, delta) => { const items = get().items.map(i => i.id===id ? { ...i, qty: Math.max(1, i.qty+delta)}:i); set({ items, totals: calcTotals(items) }) },
  updateNote: (id,note)=>{ const items=get().items.map(i=>i.id===id?{...i,note}:i); set({ items }) },
  removeItem: (id)=>{ const items=get().items.filter(i=>i.id!==id); set({ items, totals: calcTotals(items) }) },
  clear: ()=> set({ items: [], totals: { subtotal:0, tax:0, total:0 } }),
  computeTotals: ()=> set({ totals: calcTotals(get().items) })
}), { name: 'ordering-store-v1' }))
