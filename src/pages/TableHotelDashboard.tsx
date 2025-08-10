import React, { useEffect, useMemo, useState, useRef } from 'react'
import usePOSStore from '../lib/store'
import { Table, Order } from '../lib/types'
import { supabase } from '../lib/supabase'
import { ReservationService } from '../services/reservationService'
import { useAppNavigation } from '../components/withRouterNavigation'

/**
 * 新版「飯店式」桌台/房間綜合控管面板
 * 功能目標：
 * 1. 將桌台視為房間：顯示入住(佔用)、預約(即將入住)、清潔、維護狀態
 * 2. 整合：預約 → 入座 → 點餐 → 出餐 → 結帳 → 清潔 → 可再次預約
 * 3. 狀態時間軸：
 *    - 預約：顯示距開始 / 預計釋出時間 (reservation_time + duration)
 *    - 佔用：顯示已入座時間、點餐狀態、距預計結束 (若來自預約)
 *    - 清潔：顯示已清潔耗時，逾時高亮
 * 4. 快速操作：Seat/入座、開啟點餐、查看訂單、結帳、標記清潔完成
 */

interface ReservationRecord {
  id: string
  customer_name: string
  party_size: number
  reservation_time: string
  duration_minutes: number
  status: string
  table_id?: string
  special_requests?: string
}

interface CompositeTableState {
  table: Table
  statusDisplay: string
  activeOrders: Order[]
  upcomingReservation: ReservationRecord | null
  seatedReservation: ReservationRecord | null
  occupiedSince?: string
  willBeFreeAt?: string
  timeToReservationMinutes?: number
  elapsedOccupiedMinutes?: number
  cleanupElapsedMinutes?: number
  alerts: string[]
}

const TAIPEI_TZ = 'Asia/Taipei'
const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:TAIPEI_TZ}) : ''
const fmtDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:TAIPEI_TZ}) : ''

export const TableHotelDashboard: React.FC = () => {
  const { goTo } = useAppNavigation()
  const tables = usePOSStore(s=>s.tables)
  const orders = usePOSStore(s=>s.orders)
  const ordersLoaded = usePOSStore(s=>s.ordersLoaded)
  const tablesLoaded = usePOSStore(s=>s.tablesLoaded)
  const loadTables = usePOSStore(s=>s.loadTables)
  const loadOrders = usePOSStore(s=>s.loadOrders)
  const processCheckout = usePOSStore(s=>s.processCheckout)
  const updateTableStatus = usePOSStore(s=>s.updateTableStatus)
  const currentRestaurant = usePOSStore(s=>s.currentRestaurant)

  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [filter, setFilter] = useState<'all'|'available'|'occupied'|'reserved'|'cleaning'|'maintenance'>('all')
  const [actionMessage, setActionMessage] = useState<string|null>(null)
  const realtimeEnabled = true // 可改 env 開關
  const channelRef = useRef<any>(null)
  // 局部覆蓋 (overlay) 狀態，避免整批 reload
  const [patchOrders, setPatchOrders] = useState<Order[]|null>(null)
  const [patchTables, setPatchTables] = useState<Table[]|null>(null)
  const [patchReservations, setPatchReservations] = useState<ReservationRecord[]|null>(null)
  const lastFullSyncRef = useRef<number>(Date.now())

  // 當全域 store 資料更新且尚未建立 overlay 時，同步初始值
  useEffect(()=>{ if(!patchOrders) setPatchOrders(orders) },[orders])
  useEffect(()=>{ if(!patchTables) setPatchTables(tables) },[tables])
  useEffect(()=>{ if(!patchReservations) setPatchReservations(reservations) },[reservations])

  // 取得實際使用的集合（若 overlay 存在則使用 overlay）
  const effectiveOrders = patchOrders || orders
  const effectiveTables = patchTables || tables
  const effectiveReservations = patchReservations || reservations

  // 公用：套用 UPSERT / DELETE
  const upsertItem = <T extends { id: any }>(arr: T[], row: T): T[] => {
    const idx = arr.findIndex(r=>r.id===row.id)
    if(idx===-1) return [...arr, row]
    const clone = arr.slice(); clone[idx] = { ...arr[idx], ...row }; return clone
  }
  const deleteItem = <T extends { id: any }>(arr: T[], id: any): T[] => arr.filter(r=>r.id!==id)

  // 依照 table_id 計算 table_number (若 RT new row 沒帶 mapping)
  const resolveTableNumber = (row: any): any => {
    if(row.table_number) return row
    if(row.table_id){
      const t = (patchTables||tables).find(tb=>tb.id===row.table_id)
      if(t) return { ...row, table_number: t.table_number }
    }
    return row
  }

  // 載入基礎資料
  useEffect(()=>{
    if(!tablesLoaded) loadTables()
    if(!ordersLoaded) loadOrders()
  },[tablesLoaded, ordersLoaded])

  // 今日預約 (含 confirmed / seated)
  const loadTodayReservations = async () => {
    if(!currentRestaurant?.id) return
    setLoadingReservations(true)
    try {
      // 今日台北 00:00 ~ +1 日 00:00 UTC 範圍
      const tz = 'Asia/Taipei'
      const todayStr = new Date().toLocaleString('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'})
      const startLocal = new Date(`${todayStr}T00:00:00+08:00`)
      const endLocal = new Date(startLocal.getTime()+24*60*60*1000)
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .in('status',['confirmed','seated'])
        .gte('reservation_time', startLocal.toISOString())
        .lt('reservation_time', endLocal.toISOString())
        .order('reservation_time', { ascending: true })
      if(error) throw error
      setReservations(data||[])
    } catch(e){
      console.error('載入預約失敗', e)
    } finally { setLoadingReservations(false) }
  }
  useEffect(()=>{ loadTodayReservations() },[currentRestaurant?.id])

  // Realtime 訂閱
  useEffect(()=>{
    if(!realtimeEnabled || !currentRestaurant?.id) return
    if(channelRef.current){
      try { supabase.removeChannel(channelRef.current) } catch {}
    }
    const restaurantId = currentRestaurant.id
    const ch = supabase.channel('table-hotel-realtime-'+restaurantId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, (payload: any)=>{
        if(!payload) return
        const type = payload.eventType
        if(type==='INSERT' || type==='UPDATE') {
          const row = resolveTableNumber(payload.new)
          setPatchOrders(curr=> upsertItem(curr||[], row))
        } else if (type==='DELETE') {
          setPatchOrders(curr=> deleteItem(curr||[], payload.old.id))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_reservations', filter: `restaurant_id=eq.${restaurantId}` }, (payload: any)=>{
        if(!payload) return
        const type = payload.eventType
        if(type==='INSERT' || type==='UPDATE') {
          const row = payload.new
          setPatchReservations(curr=> upsertItem(curr||[], row))
        } else if (type==='DELETE') {
          setPatchReservations(curr=> deleteItem(curr||[], payload.old.id))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${restaurantId}` }, (payload: any)=>{
        if(!payload) return
        const type = payload.eventType
        if(type==='INSERT' || type==='UPDATE') {
          const row = payload.new
          setPatchTables(curr=> upsertItem(curr||[], row))
        } else if (type==='DELETE') {
          setPatchTables(curr=> deleteItem(curr||[], payload.old.id))
        }
      })
      .subscribe((status: string) => {
        if(status==='SUBSCRIBED') console.log('✅ Realtime 訂閱 (增量模式)')
      })
    channelRef.current = ch
    // 週期性全量同步 (避免長時間漂移) 每 5 分鐘一次
    const interval = setInterval(()=>{
      if(Date.now()-lastFullSyncRef.current > 5*60*1000){
        lastFullSyncRef.current = Date.now()
        loadTables(); loadOrders(); loadTodayReservations()
      }
    }, 60*1000)
    return ()=>{ try { supabase.removeChannel(ch) } catch {}; clearInterval(interval) }
  },[realtimeEnabled, currentRestaurant?.id])

  // 建立 tableId -> reservations 分群
  const resByTable = useMemo(()=>{
    const map = new Map<string, ReservationRecord[]>()
    reservations.forEach(r=>{
      if(!r.table_id) return
      if(!map.has(r.table_id)) map.set(r.table_id,[])
      map.get(r.table_id)!.push(r)
    })
    return map
  },[reservations])

  const ACTIVE_ORDER_SET = new Set(['pending','confirmed','preparing','ready','served'])
  const now = Date.now()

  const composite: CompositeTableState[] = useMemo(()=>{
    return effectiveTables.map(table => {
      const tableOrders = effectiveOrders.filter(o=>o.table_id===table.id && ACTIVE_ORDER_SET.has(o.status||''))
      const groupedRes = resByTable.get(table.id!)||[]
      const seatedRes = groupedRes.find(r=>r.status==='seated')||null
      const upcomingRes = seatedRes ? null : groupedRes
        .filter(r=>r.status==='confirmed')
        .filter(r=>{ const t=new Date(r.reservation_time).getTime(); return t>=now && (t-now)<=1000*60*60*3 }) // 3 小時內
        .sort((a,b)=> new Date(a.reservation_time).getTime()-new Date(b.reservation_time).getTime())[0] || null
      const alerts:string[] = []

  let display: string = table.status || 'available'
      if(tableOrders.length>0) display = 'occupied'
      else if(seatedRes) display = 'occupied'
      else if(upcomingRes) display = 'reserved'

      let occupiedSince: string | undefined = table.last_occupied_at || undefined
      if(!occupiedSince && seatedRes) occupiedSince = seatedRes.reservation_time
      const elapsedOccupiedMinutes = occupiedSince ? Math.floor((now - new Date(occupiedSince).getTime())/60000) : undefined

      let willBeFreeAt: string | undefined
      if(seatedRes){
        willBeFreeAt = new Date(new Date(seatedRes.reservation_time).getTime()+ seatedRes.duration_minutes*60000).toISOString()
        if(willBeFreeAt && new Date(willBeFreeAt).getTime()<now) alerts.push('超過預計用餐時間')
      }
      const timeToReservationMinutes = upcomingRes ? Math.floor((new Date(upcomingRes.reservation_time).getTime()-now)/60000) : undefined
      if(timeToReservationMinutes!==undefined && timeToReservationMinutes<15 && display==='reserved') alerts.push('15分鐘內將入座')

      const cleanupElapsedMinutes = table.status==='cleaning' && table.updated_at ? Math.floor((now - new Date(table.updated_at).getTime())/60000) : undefined
      if(cleanupElapsedMinutes!==undefined && cleanupElapsedMinutes>10) alerts.push('清潔逾時')

      return {
        table,
        statusDisplay: display,
        activeOrders: tableOrders,
        upcomingReservation: upcomingRes,
        seatedReservation: seatedRes,
        occupiedSince,
        willBeFreeAt,
        timeToReservationMinutes,
        elapsedOccupiedMinutes,
        cleanupElapsedMinutes,
        alerts
      }
    })
  },[effectiveTables, effectiveOrders, resByTable, now])

  const filtered = composite.filter(c=> filter==='all' ? true : c.statusDisplay===filter)

  const colorFor = (d:string) => {
    switch(d){
      case 'available': return 'bg-green-50 border-green-200'
      case 'occupied': return 'bg-red-50 border-red-200'
      case 'reserved': return 'bg-blue-50 border-blue-200'
      case 'cleaning': return 'bg-yellow-50 border-yellow-200'
      case 'maintenance': return 'bg-gray-50 border-gray-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }
  const labelFor = (d:string) => ({available:'可用',occupied:'佔用中',reserved:'已預約',cleaning:'清潔中',maintenance:'維護中'} as any)[d]||d

  // 操作：入座
  const handleSeat = async (res: ReservationRecord, tableId: string) => {
    try {
      setActionMessage('處理入座中...')
      await ReservationService.updateReservationStatus(res.id,'seated' as any)
      await updateTableStatus(tableId,'occupied')
      await loadTodayReservations()
      setActionMessage('✅ 入座成功')
      setTimeout(()=>setActionMessage(null),1500)
    } catch(e:any){
      setActionMessage('❌ 入座失敗: '+e.message)
    }
  }

  // 操作：開始點餐 (跳轉 ordering)
  const startOrdering = (c: any) => {
    const t = c.table
    const res = c.seatedReservation || c.upcomingReservation
    const qs = new URLSearchParams({ table:String(t.table_number), party:String(res?.party_size||''), name:res?.customer_name||'' })
    goTo(`/ordering?${qs.toString()}`)
  }

  // 操作：快速結帳 (選第一筆 active order)
  const quickCheckout = async (c: any) => {
    if(!c.activeOrders.length) return
    const order = c.activeOrders[0]
    try {
      setActionMessage('結帳處理中...')
      await processCheckout(c.table.id!, order.id, { payment_method:'cash' })
      setActionMessage('✅ 結帳完成 (設為清潔)')
      setTimeout(()=>setActionMessage(null),2000)
    } catch(e:any){
      setActionMessage('❌ 結帳失敗: '+e.message)
    }
  }

  // 操作：清潔完成
  const markCleaned = async (c: any) => {
    try {
      setActionMessage('標記可用...')
      await updateTableStatus(c.table.id!, 'available')
      setActionMessage('✅ 已標記為可用')
      setTimeout(()=>setActionMessage(null),1500)
    } catch(e:any){
      setActionMessage('❌ 標記失敗: '+e.message)
    }
  }

  return (
    <div className="min-h-screen bg-ui-secondary">
      <header className="bg-ui-primary border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-ui-primary">🏨 飯店式桌台控管面板</h1>
          <div className="flex flex-wrap gap-2">
            {['all','available','occupied','reserved','cleaning','maintenance'].map(f=> (
              <button key={f} onClick={()=>setFilter(f as any)} className={`px-3 py-1 rounded-full text-sm border ${filter===f? 'bg-blue-600 text-white border-blue-600':'bg-white hover:bg-blue-50'}`}>{({all:'全部',available:'可用',occupied:'佔用',reserved:'預約',cleaning:'清潔',maintenance:'維護'} as any)[f]}</button>
            ))}
            <button onClick={()=>{loadTables(); loadOrders(); loadTodayReservations()}} className="px-3 py-1 rounded-full text-sm border bg-white hover:bg-green-50">🔄 更新</button>
          </div>
        </div>
        {actionMessage && <div className="bg-blue-50 text-center text-sm py-1 text-blue-700">{actionMessage}</div>}
      </header>
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(c=>{
            return (
              <div key={c.table.id} className={`border rounded-xl p-4 relative flex flex-col ${colorFor(c.statusDisplay)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-lg font-bold">桌 {c.table.table_number}</div>
                    {c.table.name && <div className="text-xs text-gray-600">{c.table.name}</div>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/70 border font-medium">{labelFor(c.statusDisplay)}</span>
                </div>
                <div className="text-xs space-y-1 flex-1">
                  {c.upcomingReservation && (
                    <div className="bg-blue-100 rounded p-2">
                      <div className="font-semibold text-blue-800">📅 預約 {fmtTime(c.upcomingReservation.reservation_time)}</div>
                      <div className="text-blue-700">{c.upcomingReservation.customer_name} · {c.upcomingReservation.party_size}人</div>
                      {c.timeToReservationMinutes!==undefined && <div className="text-blue-600">{c.timeToReservationMinutes} 分鐘後</div>}
                    </div>
                  )}
                  {c.seatedReservation && (
                    <div className="bg-green-100 rounded p-2">
                      <div className="font-semibold text-green-800">👥 已入座 {c.seatedReservation.customer_name}</div>
                      <div className="text-green-700">{c.seatedReservation.party_size}人 · {fmtTime(c.seatedReservation.reservation_time)}</div>
                      {c.elapsedOccupiedMinutes!==undefined && <div className="text-green-600">已用餐 {c.elapsedOccupiedMinutes} 分鐘</div>}
                      {c.willBeFreeAt && <div className="text-green-600">預計釋出 {fmtTime(c.willBeFreeAt)}</div>}
                    </div>
                  )}
                  {c.activeOrders.length>0 && (
                    <div className="bg-white/70 rounded p-2 border">
                      <div className="font-semibold text-gray-800">📋 訂單 {c.activeOrders[0].order_number}</div>
                      <div className="text-gray-600">{c.activeOrders.length} 筆進行中</div>
                      <div className="text-gray-500">狀態：{c.activeOrders[0].status}</div>
                    </div>
                  )}
                  {c.statusDisplay==='cleaning' && (
                    <div className="bg-yellow-100 rounded p-2">
                      <div className="font-semibold text-yellow-800">🧹 清潔中</div>
                      {c.cleanupElapsedMinutes!==undefined && <div className="text-yellow-700">{c.cleanupElapsedMinutes} 分鐘</div>}
                    </div>
                  )}
                  {c.alerts.length>0 && (
                    <div className="bg-red-50 rounded p-2 border border-red-200 text-red-700 space-y-0.5">
                      {c.alerts.map((a,i)=><div key={i}>⚠ {a}</div>)}
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium">
                  {c.upcomingReservation && c.statusDisplay==='reserved' && (
                    <button onClick={()=>handleSeat(c.upcomingReservation!, c.table.id!)} className="col-span-2 py-2 bg-green-600 text-white rounded hover:bg-green-700">✅ 入座</button>
                  )}
                  {c.seatedReservation && (
                    <button onClick={()=>startOrdering(c)} className="col-span-2 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">🍽️ 點餐</button>
                  )}
                  {c.activeOrders.length>0 && (
                    <button onClick={()=>quickCheckout(c)} className="col-span-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">💰 快速結帳</button>
                  )}
                  {c.statusDisplay==='cleaning' && (
                    <button onClick={()=>markCleaned(c)} className="col-span-2 py-2 bg-green-500 text-white rounded hover:bg-green-600">🧼 清潔完成</button>
                  )}
                  {c.statusDisplay==='available' && !c.upcomingReservation && (
                    <button onClick={()=>goTo('/reservations')} className="col-span-2 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">📅 預約主控台</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length===0 && <div className="text-center text-gray-500 py-12">無符合條件的桌台</div>}
      </div>
    </div>
  )
}

export default TableHotelDashboard
