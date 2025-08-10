import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useKDSStore } from '../lib/kds-store'
import { MenuCategory, MenuItemStatus, KDSMenuItem, KDSOrder, CATEGORY_NAMES, CATEGORY_ICONS } from '../lib/kds-types'

// Chef 專用簡化 KDS：分類視圖 + Tabs + 可折疊群組
// 目標分類：前菜 / 主餐 / 單點 / 加點

const CHEF_CATEGORIES: MenuCategory[] = [
  MenuCategory.APPETIZERS,
  MenuCategory.MAIN_COURSE,
  MenuCategory.A_LA_CARTE,
  MenuCategory.ADDITIONAL
]

interface FlatItem extends KDSMenuItem {
  order: Pick<KDSOrder, 'id' | 'table_number' | 'order_number' | 'created_at'>
  orderedMinutesAgo: number
  isOverdue: boolean
}

export const ChefKDSPage: React.FC = () => {
  const { orders, fetchOrders, updateMenuItemStatus, isLoading } = useKDSStore()
  const [showCompleted, setShowCompleted] = useState(false)
  const [autoRefreshSec, setAutoRefreshSec] = useState(15)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [activeCategory, setActiveCategory] = useState<'all' | MenuCategory>('all')
  const [collapsed, setCollapsed] = useState<Set<MenuCategory>>(new Set())
  const [viewMode, setViewMode] = useState<'category' | 'table'>('category')

  // 初次與輪詢抓資料
  useEffect(() => {
    let mounted = true
    const load = async () => {
      await fetchOrders()
      if (mounted) setLastRefresh(new Date())
    }
    load()
    const id = setInterval(async () => {
      await fetchOrders(true)
      if (mounted) setLastRefresh(new Date())
    }, autoRefreshSec * 1000)
    return () => { mounted = false; clearInterval(id) }
  }, [fetchOrders, autoRefreshSec])

  // 扁平化餐點 (含所有，用於桌進度)
  const allChefItems: FlatItem[] = useMemo(() => {
    const now = Date.now()
    const items: FlatItem[] = []
    orders.forEach(order => {
      ;(order.menuItems || []).forEach(mi => {
        if (!mi.category) return
        if (!CHEF_CATEGORIES.includes(mi.category)) return
        if (mi.isComboParent) return
        if (mi.status === MenuItemStatus.CANCELLED) return
        const orderedAt = new Date(mi.ordered_at || order.created_at).getTime()
        const minutes = Math.floor((now - orderedAt) / 60000)
        const est = mi.estimated_prep_time || 0
        const overdue = est > 0 ? minutes > est : minutes > 20
        items.push({
          ...mi,
          order: {
            id: order.id,
            table_number: order.table_number,
            order_number: order.order_number,
            created_at: order.created_at
          },
          orderedMinutesAgo: minutes,
          isOverdue: overdue
        })
      })
    })
    return items
  }, [orders])

  // 目前顯示 (考慮 showCompleted)
  const flatItems: FlatItem[] = useMemo(() => {
    return allChefItems
      .filter(mi => {
        const isCompleted = mi.status === MenuItemStatus.READY || mi.status === MenuItemStatus.SERVED
        if (isCompleted && !showCompleted) return false
        return true
      })
      .sort((a, b) => {
        const aDone = a.status === MenuItemStatus.READY || a.status === MenuItemStatus.SERVED
        const bDone = b.status === MenuItemStatus.READY || b.status === MenuItemStatus.SERVED
        if (aDone !== bDone) return aDone ? 1 : -1
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
        if (b.orderedMinutesAgo !== a.orderedMinutesAgo) return b.orderedMinutesAgo - a.orderedMinutesAgo
        if (b.priority_level !== a.priority_level) return b.priority_level - a.priority_level
        return (a.order.table_number || 0) - (b.order.table_number || 0)
      })
  }, [allChefItems, showCompleted])

  // 桌分組 (使用 allChefItems 取得完整進度)
  const tableGroups = useMemo(() => {
    const map = new Map<string, { items: FlatItem[]; total: number; completed: number; overdue: number; tableNum: number | null; orders: Set<string> }>()
    allChefItems.forEach(it => {
      const key = (it.order.table_number ?? '外帶').toString()
      if (!map.has(key)) {
        map.set(key, { items: [], total: 0, completed: 0, overdue: 0, tableNum: it.order.table_number ?? null, orders: new Set() })
      }
      const g = map.get(key)!
      g.items.push(it)
      g.total++
      if (it.status === MenuItemStatus.READY || it.status === MenuItemStatus.SERVED) g.completed++
      if (it.isOverdue) g.overdue++
      g.orders.add(it.order.order_number)
    })
    return Array.from(map.entries()).sort((a,b)=>{
      const na = a[1].tableNum ?? 9999
      const nb = b[1].tableNum ?? 9999
      return na - nb
    })
  }, [allChefItems])

  // 分組
  const grouped = useMemo(() => {
    const map: Record<MenuCategory, FlatItem[]> = {
      [MenuCategory.APPETIZERS]: [],
      [MenuCategory.MAIN_COURSE]: [],
      [MenuCategory.A_LA_CARTE]: [],
      [MenuCategory.ADDITIONAL]: []
    } as any
    flatItems.forEach(i => { if (i.category && map[i.category as MenuCategory]) map[i.category as MenuCategory].push(i) })
    return map
  }, [flatItems])

  const toggleCollapse = (cat: MenuCategory) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const handleToggleReady = useCallback(async (item: FlatItem) => {
    const targetStatus = item.status === MenuItemStatus.READY || item.status === MenuItemStatus.SERVED ? MenuItemStatus.PREPARING : MenuItemStatus.READY
    await updateMenuItemStatus(item.id, targetStatus)
  }, [updateMenuItemStatus])

  const ItemCard: React.FC<{item: FlatItem}> = ({ item }) => {
    const done = item.status === MenuItemStatus.READY || item.status === MenuItemStatus.SERVED
    return (
      <div
        className={`relative rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-md border-2 transition-colors cursor-pointer select-none ${done ? 'bg-emerald-700/20 border-emerald-500' : item.isOverdue ? 'bg-red-800/30 border-red-500 animate-[pulse_3s_ease-in-out_infinite]' : 'bg-neutral-800 border-neutral-600 hover:border-neutral-400'}`}
        onClick={() => handleToggleReady(item)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-semibold leading-tight break-words">
              {item.product_name}{item.variant_name ? ` (${item.variant_name})` : ''}
            </span>
            <div className="text-xs text-neutral-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
              {item.order.table_number && <span>桌 {item.order.table_number}</span>}
              <span>單 {item.order.order_number}</span>
              <span>{item.quantity} 份</span>
              <span>{item.orderedMinutesAgo} 分鐘</span>
              {item.estimated_prep_time && <span>估 {item.estimated_prep_time}m</span>}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleReady(item) }}
            className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium tracking-wide ${done ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-900' : 'bg-amber-500 hover:bg-amber-400 text-neutral-900'}`}
          >{done ? '復原' : '完成'}</button>
        </div>
        {item.special_instructions && (
          <div className="text-xs bg-neutral-700/60 rounded-md px-2 py-1 text-amber-300 leading-snug whitespace-pre-wrap">
            {item.special_instructions}
          </div>
        )}
        {item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.modifiers.map((m: any, idx: number) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 bg-neutral-600 rounded-full text-neutral-100">{m.name || m.label || m}</span>
            ))}
          </div>
        )}
        {!done && (
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide font-medium">
            <span className={`${item.isOverdue ? 'text-red-400' : 'text-neutral-400'}`}>{item.isOverdue ? '逾時' : (item.status === MenuItemStatus.PREPARING ? '製作中' : '待處理')}</span>
            {item.priority_level > 0 && <span className="text-amber-400">P{item.priority_level}</span>}
          </div>
        )}
        {done && (
          <div className="text-[10px] text-emerald-300 font-medium tracking-wide">已完成 - 點擊可復原</div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-900 text-neutral-50">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-neutral-700 bg-neutral-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => (window.location.href = '/')} className="px-3 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm">返回</button>
          <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">👨‍🍳 Chef KDS {isLoading && <span className="text-xs animate-pulse text-amber-400">更新中...</span>}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-xs md:text-sm">
          <button onClick={() => setViewMode(m => m==='category' ? 'table' : 'category')} className="px-3 py-1.5 rounded-md border bg-neutral-700 hover:bg-neutral-600">{viewMode==='category' ? '按桌檢視' : '按分類檢視'}</button>
          <button onClick={() => setShowCompleted(s => !s)} className={`px-3 py-1.5 rounded-md border ${showCompleted ? 'bg-green-600 border-green-500' : 'bg-neutral-700 border-neutral-600 hover:bg-neutral-600'}`}>{showCompleted ? '隱藏完成' : '顯示完成'}</button>
          <div className="flex items-center gap-1 bg-neutral-700 rounded-md px-2 py-1">
            <span>刷新</span>
            <select className="bg-transparent focus:outline-none" value={autoRefreshSec} onChange={e => setAutoRefreshSec(parseInt(e.target.value) || 15)}>
              {[10,15,20,30,45,60].map(v => <option key={v} value={v}>{v}s</option>)}
            </select>
          </div>
          {lastRefresh && <span className="text-neutral-400 hidden sm:inline">{lastRefresh.toLocaleTimeString()} 刷新</span>}
          <span className="px-2 py-1 rounded bg-neutral-700/60">項目 {flatItems.length}</span>
        </div>
      </div>

      {viewMode==='category' && (
        <>
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto px-3 sm:px-4 py-2 bg-neutral-800/80 border-b border-neutral-700 text-xs sm:text-sm sticky top-[56px] z-20">
            <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-md shrink-0 ${activeCategory==='all' ? 'bg-amber-500 text-neutral-900 font-medium' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'}`}>全部</button>
            {CHEF_CATEGORIES.map(cat => {
              const items = flatItems.filter(i=>i.category===cat)
              const ready = items.filter(i => i.status===MenuItemStatus.READY || i.status===MenuItemStatus.SERVED).length
              return (
                <button key={cat} onClick={()=> setActiveCategory(cat)} className={`px-3 py-1.5 rounded-md flex items-center gap-1 shrink-0 ${activeCategory===cat ? 'bg-amber-500 text-neutral-900 font-medium' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'}`}>
                  <span>{CATEGORY_ICONS[cat]}</span><span>{CATEGORY_NAMES[cat]}</span><span className="text-[10px] opacity-80">{ready}/{items.length}</span>
                </button>
              )
            })}
          </div>
          {/* Category Lists (existing rendering retained) */}
          {activeCategory !== 'all' && (
            <div className="flex-1 overflow-auto p-3 sm:p-4 grid gap-3 md:gap-4" style={{gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))'}}>
              {flatItems.filter(i=>i.category===activeCategory).map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
              {flatItems.filter(i=>i.category===activeCategory).length === 0 && (
                <div className="col-span-full mt-10 text-center text-neutral-400">{showCompleted ? '目前沒有餐點' : '目前沒有未完成的餐點'}</div>
              )}
            </div>
          )}
          {activeCategory === 'all' && (
            <div className="flex-1 overflow-auto px-2 sm:px-4 py-3 space-y-6">
              {CHEF_CATEGORIES.map(cat => {
                const items = flatItems.filter(i=>i.category===cat)
                if (items.length === 0) return null
                const ready = items.filter(i => i.status===MenuItemStatus.READY || i.status===MenuItemStatus.SERVED).length
                const collapsedCat = collapsed.has(cat)
                return (
                  <div key={cat} className="bg-neutral-850/40 rounded-xl border border-neutral-700/70 overflow-hidden">
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-neutral-800/70 cursor-pointer select-none" onClick={()=>toggleCollapse(cat)}>
                      <div className="flex items-center gap-2 font-medium text-sm sm:text-base">
                        <span>{CATEGORY_ICONS[cat]}</span><span>{CATEGORY_NAMES[cat]}</span><span className="text-xs text-neutral-400">{ready}/{items.length}</span>
                      </div>
                      <button className="text-xs text-neutral-400 hover:text-neutral-200">{collapsedCat ? '展開' : '收合'}</button>
                    </div>
                    {!collapsedCat && (
                      <div className="p-3 sm:p-4 grid gap-3 md:gap-4" style={{gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))'}}>
                        {items.map(item => <ItemCard key={item.id} item={item} />)}
                      </div>
                    )}
                  </div>
                )
              })}
              {flatItems.length === 0 && (<div className="text-center text-neutral-400 pt-10">目前沒有餐點</div>)}
            </div>
          )}
        </>
      )}

      {viewMode==='table' && (
        <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-5">
          {tableGroups.map(([key, g]) => {
            const complete = g.completed === g.total && g.total>0
            const headerColor = complete ? 'bg-emerald-600 text-neutral-900' : g.overdue>0 ? 'bg-red-600 text-white' : 'bg-neutral-700 text-neutral-100'
            const visibleItems = flatItems.filter(i => (i.order.table_number ?? '外帶').toString()===key)
            if (!showCompleted) {
              // hide group if no visible items (all completed and hidden)
              if (visibleItems.length===0) return null
            }
            return (
              <div key={key} className={`rounded-xl border ${complete ? 'border-emerald-500' : g.overdue>0 ? 'border-red-500' : 'border-neutral-700'} bg-neutral-850/40 overflow-hidden`}>
                <div className={`flex items-center justify-between px-3 sm:px-4 py-2 text-sm font-medium ${headerColor}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold">{g.tableNum !== null ? `桌 ${g.tableNum}` : '外帶/外送'}</span>
                    <span className="text-xs bg-neutral-900/20 px-2 py-0.5 rounded-md">{g.completed}/{g.total} 完成</span>
                    {g.overdue>0 && !complete && <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">逾時 {g.overdue}</span>}
                    <span className="text-xs text-neutral-900/70 font-normal">訂單 {Array.from(g.orders).join(', ')}</span>
                  </div>
                  {complete && <span className="text-xs font-semibold">全部完成 ✅</span>}
                </div>
                <div className="p-3 sm:p-4 grid gap-3 md:gap-4" style={{gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))'}}>
                  {visibleItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                  {visibleItems.length===0 && (
                    <div className="text-center text-neutral-500 col-span-full py-6 text-sm">此桌項目皆已完成</div>
                  )}
                </div>
              </div>
            )
          })}
          {tableGroups.length===0 && <div className="text-center text-neutral-400 pt-10">目前沒有餐點</div>}
        </div>
      )}
    </div>
  )
}

export default ChefKDSPage
