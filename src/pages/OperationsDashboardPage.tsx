import { useEffect, useMemo, useState } from 'react'
import usePOSStore from '../lib/store'
import { supabase } from '../lib/supabase'

/*
  店內營運統計頁面 (MVP)
  目標：快速總覽今日 / 近7日核心指標，並提供後續擴充位 (銷售趨勢、熱門品項、翻桌效率等)。
*/
export default function OperationsDashboardPage(){
  const { orders, orderItems, products, tables, loadOrders, loadTables, loadProducts, currentRestaurant } = usePOSStore()
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState<'today'|'7d'|'30d'>('today')
  const [rangeStart, setRangeStart] = useState<string>('')
  const [rangeEnd, setRangeEnd] = useState<string>('')

  // 時區：台北
  const TZ = 'Asia/Taipei'
  const computeRange = () => {
    const now = new Date()
    const end = new Date(now)
    const start = new Date(now)
    if(range==='today'){
      // 今日 00:00 ~ 明日 00:00
      const d = new Date(now.toLocaleString('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'})) // local parse
      start.setTime(d.getTime())
      start.setHours(0,0,0,0)
      end.setTime(start.getTime()+24*60*60*1000)
    } else if(range==='7d') {
      end.setHours(0,0,0,0)
      start.setTime(end.getTime()-7*24*60*60*1000)
    } else { // 30d
      end.setHours(0,0,0,0)
      start.setTime(end.getTime()-30*24*60*60*1000)
    }
    setRangeStart(start.toISOString())
    setRangeEnd(end.toISOString())
  }
  useEffect(()=>{ computeRange() },[range])

  // 初始載入
  useEffect(()=>{ if(!currentRestaurant?.id) return; loadOrders(); loadTables(); loadProducts(); },[currentRestaurant?.id])

  // 依時間區間過濾訂單 (只算已成立非取消)
  const filteredOrders = useMemo(()=>{
    if(!rangeStart || !rangeEnd) return [] as any[]
    return orders.filter(o=> {
      const t = new Date(o.created_at||0).getTime()
      const status = o.status || ''
      return t>= new Date(rangeStart).getTime() && t < new Date(rangeEnd).getTime() && !['cancelled'].includes(status)
    })
  },[orders, rangeStart, rangeEnd])

  // KPI 計算
  const kpis = useMemo(()=>{
    const totalSales = filteredOrders.reduce((s,o)=> s + (o.total_amount||0),0)
    const orderCount = filteredOrders.length
    const avgOrderValue = orderCount? totalSales / orderCount : 0
    // 估算人數 (customer_count 欄位存在時)
    const totalCovers = filteredOrders.reduce((s,o)=> s + (o.customer_count||0),0)
    const avgPerGuest = totalCovers? totalSales / totalCovers : 0
    // 桌台利用率 (今日/區間內有至少一筆訂單的不同桌數 / 總桌數)
    const usedTables = new Set(filteredOrders.map(o=> String(o.table_number))).size
    const tableUtilization = tables.length? usedTables / tables.length : 0
    return { totalSales, orderCount, avgOrderValue, totalCovers, avgPerGuest, tableUtilization }
  },[filteredOrders, tables.length])

  // 熱門品項 (Top 5 by quantity)
  const topProducts = useMemo(()=>{
    const qtyMap: Record<string,{id:string; name:string; qty:number; sales:number}> = {}
    orderItems.forEach(it=> {
      const order = orders.find(o=> o.id===it.order_id)
      if(!order) return
      const t = new Date(order.created_at||0).getTime()
      if(!(t>= new Date(rangeStart).getTime() && t < new Date(rangeEnd).getTime())) return
      const p = products.find(p=> p.id===it.product_id)
      const name = p?.name || it.product_name || '未命名'
      const pid = it.product_id || 'unknown'
      if(!qtyMap[pid]) qtyMap[pid] = { id: pid, name, qty:0, sales:0 }
      qtyMap[pid].qty += it.quantity || 0
      qtyMap[pid].sales += it.total_price || 0
    })
    return Object.values(qtyMap).sort((a,b)=> b.qty - a.qty).slice(0,5)
  },[orderItems, orders, products, rangeStart, rangeEnd])

  return (
    <div className="min-h-screen bg-ui-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-ui-primary">📊 店內營運統計</h1>
          <div className="flex gap-2">
            {(['today','7d','30d'] as const).map(r=> (
              <button key={r} onClick={()=> setRange(r)} className={`px-3 py-1.5 rounded text-sm border ${range===r? 'bg-blue-600 text-white border-blue-600':'bg-white hover:bg-gray-50'}`}>{r==='today'?'今日': r==='7d'?'近7日':'近30日'}</button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-1">總營收</div>
            <div className="text-2xl font-bold text-gray-900">NT$ {kpis.totalSales.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-1">訂單數</div>
            <div className="text-2xl font-bold text-gray-900">{kpis.orderCount}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-1">平均客單價</div>
            <div className="text-2xl font-bold text-gray-900">NT$ {kpis.avgOrderValue.toFixed(0)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-1">總人次 (covers)</div>
            <div className="text-2xl font-bold text-gray-900">{kpis.totalCovers}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-1">人均消費</div>
            <div className="text-2xl font-bold text-gray-900">NT$ {kpis.avgPerGuest.toFixed(0)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-1">桌台利用率</div>
            <div className="text-2xl font-bold text-gray-900">{(kpis.tableUtilization*100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">🔥 熱門品項 (數量 Top 5)</h2>
          {topProducts.length===0 && <div className="text-sm text-gray-500">區間內沒有訂單資料</div>}
          <div className="divide-y">
            {topProducts.map((p,i)=>(
              <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-gray-400 text-right">{i+1}</span>
                  <span className="font-medium text-gray-800">{p.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-gray-600">{p.qty} 件</span>
                  <span className="text-gray-900 font-medium">NT$ {p.sales.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">🧪 後續可加值指標建議</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>尖峰時段銷售折線圖</li>
            <li>分類 (Category) 銷售占比圓餅圖</li>
            <li>翻桌時間分佈 (需紀錄桌台佔用開始/結束時間)</li>
            <li>預約 vs 現場 (walk-in) 訂單比率</li>
            <li>套餐 / 單點 組成與 upsell 分析</li>
            <li>客流趨勢 (covers) 與人均消費對比</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
