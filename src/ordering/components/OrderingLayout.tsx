import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrderingStore } from '../state/orderingStore'
import { useProducts } from '../hooks/useProducts'
import ComboModal from './ComboModal'
import { supabase } from '../../lib/supabase'
import usePOSStore from '../../lib/store'
// 直接沿用全域設定的餐廳 ID (與 store.ts MOCK_RESTAURANT_ID 同步)
const FALLBACK_RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111'

const OrderingLayout: React.FC = () => {
  const navigate = useNavigate()
  const { items, totals, category, setCategory, search, setSearch, addSingle, startComboDraft, setContext, context, clear } = useOrderingStore()
  const { list: products, loading, error, categories } = useProducts(category, search)
  const [submitting, setSubmitting] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [justAddedId, setJustAddedId] = useState<string|null>(null)
  const [toasts, setToasts] = useState<{id:string; msg:string}[]>([])
  const [tables, setTables] = useState<{id:string; table_number:number; status:string}[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const pushToast = (msg: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t=>[...t,{id,msg}])
    setTimeout(()=> setToasts(t=> t.filter(x=>x.id!==id)), 2200)
  }

  // 偵測 URL query 取得桌台/預約資訊 (簡化)
  React.useEffect(()=>{
    if (!context.tableNumber && !context.takeout) {
      const params = new URLSearchParams(window.location.search)
      const table = params.get('table') || undefined
      const party = params.get('party')
      const name = params.get('name') || undefined
      const takeout = params.get('takeout') === '1'
      if (takeout) {
        setContext({ takeout: true, customerName: name, partySize: party? Number(party): undefined })
      } else if (table) setContext({ tableNumber: table, partySize: party? Number(party): undefined, customerName: name })
    }
  },[context.tableNumber, context.takeout, setContext])

  // 載入桌台列表 (僅首次且尚未選桌號時)
  React.useEffect(()=> {
    const loadTables = async () => {
      try {
        setLoadingTables(true)
        const { data, error } = await supabase
          .from('tables')
          .select('id, table_number, status')
          .in('status', ['available','occupied'])
          .order('table_number', { ascending: true })
  if (!error && data) setTables((data as any).filter((t: any)=>['available','occupied'].includes(t.status)))
      } finally { setLoadingTables(false) }
    }
    if (!context.tableNumber && tables.length===0) loadTables()
  }, [context.tableNumber, tables.length])

  const handleAddProduct = async (p: any) => {
    if (p.isCombo) {
      // 取得真實規則 (combo_selection_rules + combo_selection_options)
      try {
        setComboOpen(true)
        const { data: rulesData, error: rulesErr } = await supabase
          .from('combo_selection_rules')
          .select('id, selection_name, min_selections, max_selections, is_required, display_order')
          .eq('combo_id', p.id)
          .order('display_order', { ascending: true })
        if (rulesErr) throw rulesErr
        const groups: Record<string, any> = {}
        // 並行載入各 rule 的 options
        for (const rule of rulesData || []) {
          const { data: opts, error: optErr } = await supabase
            .from('combo_selection_options')
            .select('id, product_id, additional_price, products(name)')
            .eq('rule_id', rule.id)
            .order('sort_order', { ascending: true })
          if (optErr) throw optErr
          groups[rule.id] = {
            label: rule.selection_name || '選擇',
            min: rule.min_selections || 0,
            max: rule.max_selections || 1,
            required: !!rule.is_required,
            items: (opts||[]).map((o:any)=>({ id: o.product_id, name: o.products?.name || '商品', priceDelta: o.additional_price || 0 }))
          }
        }
  startComboDraft({ comboProductId: p.id, name: p.name, basePrice: p.displayPrice ?? p.price ?? 0, groups: {}, rules: { groups }, comboQty: 1 })
      } catch (e) {
        console.error('載入套餐規則失敗', e)
        alert('載入套餐規則失敗')
  setComboOpen(false)
      }
    } else {
      addSingle({ productId: p.id, name: p.name, unitPrice: p.displayPrice, qty: 1 })
      setJustAddedId(p.id)
      pushToast(`${p.name} 已加入`)
      setTimeout(()=> setJustAddedId(null), 600)
    }
  }

  // 計算每個 product / combo 已在購物車中的數量 (合計所有項目的 qty)
  const productCounts = React.useMemo(()=> {
    const map: Record<string, number> = {}
    items.forEach(i => {
      const add = i.type==='combo' && i.meta?.comboQty ? i.meta.comboQty : i.qty
      map[i.productId] = (map[i.productId] || 0) + add
    })
    return map
  }, [items])

  // 建立產品與分類對應，用於購物車分類排序
  const productMeta = React.useMemo(()=> {
    const meta: Record<string, any> = {}
    products.forEach(p=> { meta[p.id] = p })
    return meta
  }, [products])
  const categoryOrder = React.useMemo(()=> ['set', ...categories.map(c=>c.id)], [categories])
  const categoryName = (id: string): string => {
    if (id === 'set') return '套餐'
    return categories.find(c=>c.id===id)?.name || '其他'
  }
  const groupedCart = React.useMemo(()=> {
    const bucket: Record<string, typeof items> = {}
    items.forEach(it => {
      const meta = productMeta[it.productId]
      const catId = meta?.category_id ? (meta.isCombo? 'set' : meta.category_id) : (it.type==='combo' ? 'set' : 'other')
      if (!bucket[catId]) bucket[catId] = []
      bucket[catId].push(it)
    })
    const ordered: { id: string; name: string; items: typeof items }[] = []
    categoryOrder.forEach(cid => {
      if (bucket[cid] && bucket[cid].length) ordered.push({ id: cid, name: categoryName(cid), items: bucket[cid] })
    })
    // 其他分類
    Object.entries(bucket).forEach(([cid,list])=>{
      if (!categoryOrder.includes(cid)) ordered.push({ id: cid, name: categoryName(cid), items: list })
    })
    return ordered
  }, [items, productMeta, categoryOrder, categories])

  const calcItemLineTotal = (i: any) => {
    const childDelta = (i.comboChildren?.reduce((s: number,c:any)=> s + c.priceDelta,0) || 0)
    return (i.unitPrice + childDelta) * i.qty
  }

  const createOrder = async () => {
  if (items.length === 0 || submitting) return
  if (!context.takeout && !context.tableNumber) { alert('請先選擇桌號'); return }
    try {
      setSubmitting(true)
      // 取得目前餐廳 ID (簡化：假設 tables 已綁定 currentRestaurant via localStorage or global supabase session)
      const { data: r } = await supabase.auth.getSession()
  let restaurantId = (window as any).CURRENT_RESTAURANT_ID || ''
  if (!restaurantId) restaurantId = FALLBACK_RESTAURANT_ID
  if (!restaurantId) throw new Error('缺少餐廳 ID，無法建立訂單')
      // 聚合每個 combo 的子項：同 group + 同 productId 計數，輸出字串："主餐：打拋豬飯x2 紅咖哩x1 | 沙拉：青木瓜x1 豆腐沙拉x2"
      const buildComboSummary = (it: any): string => {
        if (!it.comboChildren || !it.meta?.rules?.groups) return ''
        const ruleGroups = it.meta.rules.groups
        // groupKey -> { label, list: {name,count}[] }
        const grouped: Record<string, Record<string,{name:string; count:number}>> = {}
        it.comboChildren.forEach((c:any)=> {
          if (!grouped[c.groupKey]) grouped[c.groupKey] = {}
          const bucket = grouped[c.groupKey]
          if (!bucket[c.productId]) bucket[c.productId] = { name: c.name, count: 0 }
            bucket[c.productId].count += 1
        })
        const parts: string[] = []
        Object.entries(grouped).forEach(([g, products]) => {
          const label = ruleGroups[g]?.label || g
          const segment = Object.values(products)
            .map(p=> `${p.name}x${p.count}`)
            .join(' ')
          parts.push(`${label}：${segment}`)
        })
        return parts.join(' | ')
      }
      // 取得桌台 id (若有桌號)
      let tableId: string | null = null
      if (!context.takeout && context.tableNumber) {
        const { data: tableRow, error: tableErr } = await supabase
          .from('tables')
          .select('id')
          .eq('table_number', Number(context.tableNumber))
          .limit(1)
          .maybeSingle()
        if (tableErr) console.warn('讀取桌台失敗', tableErr)
        tableId = tableRow?.id || null
      }
      const orderPayload: any = {
        restaurant_id: restaurantId,
        table_number: context.takeout ? null : (context.tableNumber ? Number(context.tableNumber) : null),
        table_id: context.takeout ? null : tableId,
        customer_name: context.customerName || '',
        party_size: context.partySize || null,
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        order_type: context.takeout ? 'takeout' : 'dine_in',
        is_takeout: context.takeout || undefined,
        items: items.map(i => {
          if (i.type==='combo') {
            const comboQty = i.meta?.comboQty || 1
            const basePerSet = comboQty>0 ? (i.unitPrice / comboQty) : i.unitPrice
            const childDelta = (i.comboChildren?.reduce((s:number,c:any)=> s + c.priceDelta,0) || 0)
            const totalPrice = i.unitPrice + childDelta // i.unitPrice 已是 base * comboQty
            return {
              product_id: null,
              product_name: i.name,
              quantity: comboQty,
              unit_price: basePerSet,
              total_price: totalPrice,
              special_instructions: `${buildComboSummary(i)}${i.note? ('\n'+i.note):''}`,
              is_combo_parent: true,
              // 傳遞展開所需的原始子品項 (KDS / store 會聚合寫入 order_combo_selections)
              combo_children: (i.comboChildren||[]).map(c=>({
                productId: c.productId,
                name: c.name,
                groupKey: c.groupKey,
                priceDelta: c.priceDelta
              })),
              meta_rules: i.meta?.rules || null
            }
          }
          // single
          return {
            product_id: i.productId,
            product_name: i.name,
            quantity: i.qty,
            unit_price: i.unitPrice,
            total_price: i.unitPrice * i.qty,
            special_instructions: i.note || '',
            is_combo_parent: false
          }
        })
      }
    console.log('🚀 送出真實訂單 payload', orderPayload)
      console.log('🚀 送出真實訂單 payload', orderPayload)
      const created = await usePOSStore.getState().createOrderWithTableUpdate(orderPayload)
      if (created) {
        pushToast('訂單已建立')
        clear()
      } else {
        alert('訂單建立失敗')
      }
      setSubmitting(false)
    } catch (e:any) {
      console.error('建立訂單失敗', e)
      alert('❌ 建立訂單失敗: ' + e.message)
      setSubmitting(false)
    }
  }
  const handleBack = () => {
    // 若有歷史紀錄則返回，否則回首頁
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ui-secondary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-60 p-4 border-r bg-white/80 backdrop-blur-sm">
        <button onClick={handleBack} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <h2 className="font-bold mb-3">分類</h2>
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          <button onClick={()=>setCategory('all')} className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${category==='all'? 'bg-blue-600 text-white shadow':'bg-ui-secondary hover:bg-blue-50'}`}>全部</button>
          <button onClick={()=>setCategory('set')} className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${category==='set'? 'bg-blue-600 text-white shadow':'bg-ui-secondary hover:bg-blue-50'}`}>套餐</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={()=>setCategory(cat.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${category===cat.id? 'bg-blue-600 text-white shadow':'bg-ui-secondary hover:bg-blue-50'}`}>{cat.name}</button>
          ))}
        </div>
      </div>

      {/* Main Content */}
  {/* 加大下方內距避免被行動底部操作列遮住 */}
  <div className="flex-1 p-4 lg:p-6 space-y-4 pb-32 lg:pb-6">
        {/* Mobile Categories Chips */}
        <div className="lg:hidden -mx-4 px-4 pb-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
          <div className="flex gap-2 min-w-max">
            {[
              { id:'all', name:'全部' },
              { id:'set', name:'套餐' },
              ...categories
            ].map(cat => (
              <button key={cat.id} onClick={()=>setCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${category===cat.id? 'bg-blue-600 border-blue-600 text-white shadow':'bg-white border-ui hover:bg-blue-50'}`}>{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {/* Mobile Back Button */}
          <div className="lg:hidden flex items-center">
            <button onClick={handleBack} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </button>
          </div>
          <div className="flex-1 flex gap-2">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋商品" className="flex-1 border rounded-md px-3 py-2 text-sm bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none"/>
            {!context.tableNumber && (
              <select disabled={loadingTables} value={context.tableNumber || ''} onChange={e=> setContext({ tableNumber: e.target.value || undefined })} className="w-32 border rounded-md px-2 py-2 text-sm bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">選桌號</option>
                {tables.map(t=> <option key={t.id} value={t.table_number}>{t.table_number}</option>)}
              </select>
            )}
          </div>
          {context.tableNumber && (
            <div className="flex items-center gap-2 text-xs">
              <div className="bg-blue-50 border border-blue-200 px-2 py-1 rounded flex items-center gap-1">
                桌號 {context.tableNumber}{context.partySize? ` · ${context.partySize}人`: ''}
              </div>
              <button
                onClick={()=> { setContext({ tableNumber: undefined }) }}
                className="px-2 py-1 rounded border text-gray-500 hover:text-blue-600 hover:border-blue-400 bg-white text-[11px]"
              >更換</button>
            </div>
          )}
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {loading ? (
          <div className="text-sm text-ui-muted p-6">載入商品中...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
            {products.map(p => (
              <button key={p.id} onClick={()=>handleAddProduct(p)} className={`group relative border rounded-xl p-3 md:p-4 bg-white/90 hover:shadow-lg hover:-translate-y-0.5 transition flex flex-col text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${justAddedId===p.id? 'ring-2 ring-green-500 animate-pulse':''}` }>
                {productCounts[p.id] && (
                  <span className="absolute -top-2 -left-2 bg-green-600 text-white rounded-full text-[10px] font-semibold px-1.5 py-0.5 shadow">{productCounts[p.id]}</span>
                )}
                <div className="text-[11px] uppercase tracking-wide font-semibold text-blue-600 mb-1">{p.isCombo? '套餐':'單品'}</div>
                <div className="text-sm md:text-base font-medium mb-2 line-clamp-2 text-gray-800">{p.name}</div>
                <div className="mt-auto font-bold text-blue-700 text-sm md:text-lg">NT$ {p.displayPrice}</div>
                <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition">加入</span>
              </button>
            ))}
            {products.length === 0 && <div className="col-span-full text-center text-xs text-ui-muted py-6">無符合商品</div>}
          </div>
        )}
      </div>

      {/* Desktop Cart Panel */}
      <div className="hidden lg:flex w-80 border-l bg-white p-4 flex-col">
  <h3 className="font-semibold mb-2 flex items-center gap-2">購物車 {context.tableNumber && <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1">桌號 {context.tableNumber}<button onClick={()=>setContext({ tableNumber: undefined })} className="ml-1 text-[10px] underline text-blue-600 hover:text-blue-800">更換</button></span>}</h3>
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {groupedCart.map(group => {
            const groupSubtotal = group.items.reduce((s,i)=> s + calcItemLineTotal(i),0)
            return (
              <div key={group.id}>
                <div className="text-[11px] font-semibold tracking-wide text-gray-500 mb-1 mt-2 first:mt-0 flex justify-between">
                  <span>{group.name}</span>
                  <span className="text-[10px] text-gray-400">NT$ {groupSubtotal}</span>
                </div>
                <div className="space-y-2">
                  {group.items.map(i => (
                    <div key={i.id} className="border rounded-md p-2 bg-ui-secondary/60">
                      <div className="flex justify-between text-sm font-medium"><span className="pr-2 flex-1 truncate" title={i.name}>{i.name}{i.type==='combo' && i.meta?.comboQty>1 && <span className="ml-1 text-[10px] text-gray-500">({i.meta.comboQty}份)</span>}</span><span>x{ i.type==='combo' && i.meta?.comboQty ? i.meta.comboQty : i.qty}</span></div>
                      {i.comboChildren && i.meta?.rules?.groups && (
                        <div className="mt-1 pl-2 text-xs space-y-0.5">
                          {(() => {
                            const ruleGroups = i.meta.rules.groups
                            const groupMap: Record<string, any> = {}
                            i.comboChildren.forEach((c:any) => {
                              if(!groupMap[c.groupKey]) groupMap[c.groupKey] = { label: ruleGroups[c.groupKey]?.label || c.groupKey, products: {} as any }
                              const prodBucket = groupMap[c.groupKey].products
                              if(!prodBucket[c.productId]) prodBucket[c.productId] = { name: c.name, count: 0, priceDelta: c.priceDelta }
                              prodBucket[c.productId].count += 1
                            })
                            return Object.values(groupMap).map((g:any) => {
                              const line = Object.values(g.products).map((p:any) => `${p.name}x${p.count}${p.priceDelta>0? `(+${p.priceDelta * p.count})`:''}`).join(' ')
                              return <div key={g.label} className="truncate">- {g.label}：{line}</div>
                            })
                          })()}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={()=>useOrderingStore.getState().updateQty(i.id,-1)} className="w-7 h-7 text-sm border rounded hover:bg-white">-</button>
                        <span className="text-xs w-6 text-center">{i.qty}</span>
                        <button onClick={()=>useOrderingStore.getState().updateQty(i.id,1)} className="w-7 h-7 text-sm border rounded hover:bg-white">+</button>
                        <button onClick={()=>useOrderingStore.getState().removeItem(i.id)} className="ml-auto text-[10px] text-red-600 hover:underline">刪除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {items.length===0 && <div className="text-xs text-ui-muted">尚無商品</div>}
        </div>
        <div className="border-t pt-3 mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>小計</span><span>NT$ {totals.subtotal}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>總計</span><span>NT$ {totals.total}</span></div>
          <button onClick={createOrder} className="w-full mt-2 bg-green-600 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50" disabled={items.length===0 || submitting || !context.tableNumber}>{submitting? '送出中...' : '送出訂單'}</button>
        </div>
      </div>

      {/* Mobile Cart Drawer */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={()=>setMobileCartOpen(false)}></div>
          <div className="w-full max-w-sm ml-auto h-full bg-white shadow-xl flex flex-col animate-[slideIn_.25s]">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">購物車 {context.tableNumber && <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">桌號 {context.tableNumber}</span>}</h3>
              <button onClick={()=>setMobileCartOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">關閉</button>
            </div>
            <div className="p-4 space-y-2 flex-1 overflow-y-auto">
              {groupedCart.map(group => {
                const groupSubtotal = group.items.reduce((s,i)=> s + calcItemLineTotal(i),0)
                return (
                  <div key={group.id}>
                    <div className="text-[11px] font-semibold tracking-wide text-gray-500 mb-1 mt-2 first:mt-0 flex justify-between">
                      <span>{group.name}</span>
                      <span className="text-[10px] text-gray-400">NT$ {groupSubtotal}</span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map(i => (
                        <div key={i.id} className="border rounded-md p-2 bg-ui-secondary/60">
                          <div className="flex justify-between text-sm font-medium"><span className="pr-2 flex-1 truncate" title={i.name}>{i.name}{i.type==='combo' && i.meta?.comboQty>1 && <span className="ml-1 text-[10px] text-gray-500">({i.meta.comboQty}份)</span>}</span><span>x{ i.type==='combo' && i.meta?.comboQty ? i.meta.comboQty : i.qty}</span></div>
                          {i.comboChildren && i.meta?.rules?.groups && (
                            <div className="mt-1 pl-2 text-xs space-y-0.5">
                              {(() => {
                                const ruleGroups = i.meta.rules.groups
                                const groupMap: Record<string, any> = {}
                                i.comboChildren.forEach((c:any) => {
                                  if(!groupMap[c.groupKey]) groupMap[c.groupKey] = { label: ruleGroups[c.groupKey]?.label || c.groupKey, products: {} as any }
                                  const prodBucket = groupMap[c.groupKey].products
                                  if(!prodBucket[c.productId]) prodBucket[c.productId] = { name: c.name, count: 0, priceDelta: c.priceDelta }
                                  prodBucket[c.productId].count += 1
                                })
                                return Object.values(groupMap).map((g:any) => {
                                  const line = Object.values(g.products).map((p:any) => `${p.name}x${p.count}${p.priceDelta>0? `(+${p.priceDelta * p.count})`:''}`).join(' ')
                                  return <div key={g.label} className="truncate">- {g.label}：{line}</div>
                                })
                              })()}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={()=>useOrderingStore.getState().updateQty(i.id,-1)} className="w-7 h-7 text-sm border rounded hover:bg-white">-</button>
                            <span className="text-xs w-6 text-center">{i.qty}</span>
                            <button onClick={()=>useOrderingStore.getState().updateQty(i.id,1)} className="w-7 h-7 text-sm border rounded hover:bg-white">+</button>
                            <button onClick={()=>useOrderingStore.getState().removeItem(i.id)} className="ml-auto text-[10px] text-red-600 hover:underline">刪除</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {items.length===0 && <div className="text-xs text-ui-muted">尚無商品</div>}
            </div>
            <div className="p-4 border-t space-y-1 text-sm">
              <div className="flex justify-between"><span>小計</span><span>NT$ {totals.subtotal}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>總計</span><span>NT$ {totals.total}</span></div>
              <button onClick={()=>{createOrder(); context.tableNumber && setMobileCartOpen(false)}} className="w-full mt-2 bg-green-600 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50" disabled={items.length===0 || submitting || !context.tableNumber}>{submitting? '送出中...' : '送出訂單'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm p-3 flex items-center gap-3 z-40">
        <button onClick={()=>setMobileCartOpen(true)} className={`relative flex items-center justify-center h-10 px-4 rounded-md border bg-ui-secondary font-medium text-sm ${justAddedId? 'animate-pulse':''}`}>
          購物車
          {items.length>0 && <span className="ml-2 text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">{items.length}</span>}
        </button>
        <div className="flex-1 text-right text-sm">
          <div className="text-[11px] text-ui-muted leading-none mb-0.5">總計</div>
          <div className="font-bold text-base">NT$ {totals.total}</div>
        </div>
  <button onClick={createOrder} disabled={items.length===0 || submitting || !context.tableNumber} className="h-10 px-5 rounded-md bg-green-600 text-white font-semibold text-sm disabled:opacity-40">{submitting? '送出中' : '送出'}</button>
      </div>
      {/* Toasts */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 space-y-2 w-full max-w-xs px-3">
        {toasts.map(t=> (
          <div key={t.id} className="bg-gray-900/90 text-white text-sm px-3 py-2 rounded-md shadow flex items-center justify-between">
            <span className="truncate pr-2">{t.msg}</span>
            <button onClick={()=> setToasts(ts=> ts.filter(x=>x.id!==t.id))} className="text-xs opacity-70 hover:opacity-100">×</button>
          </div>
        ))}
      </div>

      <ComboModal isOpen={comboOpen} onClose={()=>setComboOpen(false)} onConfirmed={()=>{ pushToast('套餐已加入'); setJustAddedId('combo-temp'); setTimeout(()=> setJustAddedId(null), 600) }} />
    </div>
  )
}

export default OrderingLayout
