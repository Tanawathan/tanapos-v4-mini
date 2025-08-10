import React, { useEffect, useMemo, useState } from 'react'
import usePOSStore from '../lib/store'
import { useReservationStore, ReservationRow, computeReservationTags } from '../lib/reservationStore'
import { Calendar, Users, Clock, RefreshCcw, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// 顏色方案：根據狀態
const STATUS_COLOR: Record<string,string> = {
  confirmed: 'bg-blue-500/80 hover:bg-blue-500',
  seated: 'bg-emerald-500/80 hover:bg-emerald-500',
  completed: 'bg-gray-400/70 hover:bg-gray-400',
  cancelled: 'bg-red-400/70 hover:bg-red-400 line-through opacity-60',
  no_show: 'bg-orange-400/80 hover:bg-orange-400',
  pending: 'bg-indigo-400/80 hover:bg-indigo-400'
}

const TAG_BADGE: Record<string,string> = {
  upcoming: 'border-blue-300 text-blue-600',
  arriving_now: 'border-emerald-300 text-emerald-600',
  late: 'border-orange-300 text-orange-600',
  ending_soon: 'border-amber-300 text-amber-600',
  overtime: 'border-red-300 text-red-600'
}

// 計算不重疊顯示的 lane 分配
function assignLanes(reservations: ReservationRow[]) {
  const sorted = [...reservations].sort((a,b)=> a.reservation_time.localeCompare(b.reservation_time))
  interface Lane { end: number; items: (ReservationRow & { lane: number })[] }
  const lanes: Lane[] = []
  const withLane: (ReservationRow & { lane: number })[] = []
  sorted.forEach(r => {
    const start = new Date(r.reservation_time).getTime()
    const end = r.estimated_end_time ? new Date(r.estimated_end_time).getTime() : start + (r.duration_minutes||90)*60000
    let placed = false
    for (let i=0;i<lanes.length;i++) {
      if (start >= lanes[i].end - 60*1000) { // 允許 1 分鐘緩衝
        lanes[i].end = Math.max(lanes[i].end, end)
        const item = { ...r, lane: i }
        lanes[i].items.push(item)
        withLane.push(item)
        placed = true
        break
      }
    }
    if (!placed) {
      const laneIndex = lanes.length
      const item = { ...r, lane: laneIndex }
      lanes.push({ end, items: [item] })
      withLane.push(item)
    }
  })
  return { items: withLane, laneCount: lanes.length }
}

export default function ReservationTimelinePage() {
  const navigate = useNavigate()
  const { currentRestaurant, tables, loadTables } = usePOSStore() as any
  const reservationStore = useReservationStore()
  const [date, setDate] = useState(reservationStore.currentDate)
  const [loading, setLoading] = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)
  const [tagFilters, setTagFilters] = useState<string[]>([])

  // 載入 / 切換日期
  useEffect(() => {
    if (currentRestaurant?.id) {
      reservationStore.setDate(date, currentRestaurant.id)
      reservationStore.enableRealtime(currentRestaurant.id)
      if(!tables || !tables.length) loadTables?.()
    }
  }, [currentRestaurant?.id, date])

  const reservationsAll = reservationStore.getReservationsWithTags()
  const reservations = useMemo(()=> {
    if (tagFilters.length===0) return reservationsAll
    return reservationsAll.filter(r => (r as any).tags?.some((t:string)=> tagFilters.includes(t)))
  }, [reservationsAll, tagFilters])

  // 決定時間窗：使用最小開始-最大結束；若無資料 fallback 11:00-22:00
  const { windowStart, windowEnd } = useMemo(() => {
    if (reservations.length === 0) {
      const d = new Date(date+ 'T00:00:00')
      const start = new Date(d); start.setHours(11,0,0,0)
      const end = new Date(d); end.setHours(22,0,0,0)
      return { windowStart: start, windowEnd: end }
    }
    let minStart = Infinity
    let maxEnd = -Infinity
    reservations.forEach(r => {
      const s = new Date(r.reservation_time).getTime()
      const e = r.estimated_end_time ? new Date(r.estimated_end_time).getTime() : s + (r.duration_minutes||90)*60000
      if (s < minStart) minStart = s
      if (e > maxEnd) maxEnd = e
    })
    // 外擴 30 分鐘緩衝
    minStart -= 30*60000
    maxEnd += 30*60000
    return { windowStart: new Date(minStart), windowEnd: new Date(maxEnd) }
  }, [reservations, date])

  const totalMinutes = (windowEnd.getTime() - windowStart.getTime()) / 60000

  const { items: laneItems, laneCount } = useMemo(() => assignLanes(reservations), [reservations])

  // 時刻刻度 (每 30 分鐘)
  const ticks = useMemo(() => {
    const out: Date[] = []
    let cursor = new Date(windowStart)
    cursor.setMinutes(Math.floor(cursor.getMinutes()/30)*30,0,0)
    while (cursor <= windowEnd) {
      out.push(new Date(cursor))
      cursor = new Date(cursor.getTime() + 30*60000)
    }
    return out
  }, [windowStart, windowEnd])

  const formatHM = (d: Date) => d.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})

  const reload = async () => {
    if (!currentRestaurant?.id) return
    setLoading(true)
    await reservationStore.loadReservations(currentRestaurant.id, date)
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <button onClick={()=> navigate(-1)} className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"><ArrowLeft className="h-4 w-4 mr-1"/>返回</button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6"/>預約時間軸</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e=> setDate(e.target.value)} className="px-2 py-1 border rounded" />
          <button onClick={reload} disabled={loading} className="inline-flex items-center px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"><RefreshCcw className="h-4 w-4 mr-1"/>{loading? '載入中':'重新載入'}</button>
        </div>
          <div className="text-sm text-gray-500">{reservations.length} 筆 / {laneCount} 行</div>
          <label className="flex items-center gap-1 text-[11px] text-gray-600">
            <input type="checkbox" className="h-3 w-3" checked={showCancelled} onChange={e=> setShowCancelled(e.target.checked)} /> 顯示已取消
          </label>
        <div className="flex flex-wrap gap-1 ml-auto">
          {['upcoming','arriving_now','late','ending_soon','overtime'].map(tag=> {
            const active = tagFilters.includes(tag)
            return (
              <button key={tag}
                onClick={()=> setTagFilters(prev => prev.includes(tag)? prev.filter(t=>t!==tag): [...prev, tag])}
                className={`px-2 py-1 text-xs rounded-full border transition ${active? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >{tag}</button>
            )
          })}
          {tagFilters.length>0 && <button onClick={()=> setTagFilters([])} className="text-xs text-blue-600 underline ml-1">清除</button>}
        </div>
      </div>

      {/* 刻度列 */}
      <div className="relative border rounded bg-white overflow-hidden">
        <div className="sticky top-0 z-10 flex text-xs bg-gray-50 border-b">
          {ticks.map((t,i)=>{
            const leftPercent = ((t.getTime() - windowStart.getTime())/60000)/totalMinutes*100
            return (
              <div key={i} style={{position:'absolute', left: leftPercent+'%'}} className="-translate-x-1/2 px-1 py-0.5 text-gray-600 whitespace-nowrap">
                {formatHM(t)}
                <div className="w-px h-6 bg-gray-300 mx-auto mt-0.5" />
              </div>
            )
          })}
          <div className="h-8 w-full" />
        </div>
        {/* 線條背景 */}
        <div className="absolute inset-0 pointer-events-none">
          {ticks.map((t,i)=>{
            const leftPercent = ((t.getTime() - windowStart.getTime())/60000)/totalMinutes*100
            return <div key={i} style={{left:leftPercent+'%'}} className="absolute top-0 bottom-0 w-px bg-gray-100" />
          })}
        </div>
        {/* Lane 容器 */}
        <div className="relative">
          {laneItems.map(item => {
            if(item.status==='cancelled' && !showCancelled) return null
            const start = new Date(item.reservation_time).getTime()
            const end = item.estimated_end_time ? new Date(item.estimated_end_time).getTime() : start + (item.duration_minutes||90)*60000
            const left = ((start - windowStart.getTime())/60000)/totalMinutes*100
            const width = Math.max( ( (end - start)/60000)/totalMinutes*100 , 0.5) // 最小寬度
            const cancelled = item.status==='cancelled'
            const color = cancelled? 'bg-gray-300/40 text-gray-500 line-through border border-dashed border-gray-300' : (STATUS_COLOR[item.status] || 'bg-gray-400')
            const tags = computeReservationTags(item)
            const table = tables?.find((t:any)=> t.id===item.table_id)
            const mergedCount = table?.metadata?.merged_with?.length || 0
            const mergedCapacity = table?.metadata?.merged_capacity || table?.capacity
            const tableBadge = table ? `#${table.table_number}${mergedCount? '+'+mergedCount:''}`: ''
            return (
              <div key={item.id}
                className={`absolute text-xs rounded shadow-sm cursor-pointer transition-colors ${color}`}
                style={{ top: (item.lane*42)+10, left: left+'%', width: width+'%', minWidth: '70px'}}
                title={`${item.customer_name} (${item.party_size})\n${formatHM(new Date(item.reservation_time))} - ${formatHM(new Date(end))} \n狀態:${item.status}`}
              >
                <div className="px-2 py-1 flex flex-col gap-0.5">
                  <div className="font-medium truncate">{item.customer_name}</div>
                  <div className="flex items-center gap-1 opacity-90 flex-wrap">
                    <Users className="h-3 w-3" />{item.party_size}
                    <Clock className="h-3 w-3 ml-1" />{formatHM(new Date(item.reservation_time))}
                    {table && <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 leading-none">
                      {tableBadge}
                      {mergedCount>0 && <span className="ml-0.5 text-[10px] text-amber-700">({mergedCapacity})</span>}
                    </span>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {tags.slice(0,2).map(t=> <span key={t} className={`border rounded px-1 leading-tight bg-white/20 ${TAG_BADGE[t]||''}`}>{t}</span>)}
                  </div>
                </div>
              </div>
            )
          })}
          {/* 容器高度 */}
          <div style={{height: laneCount*42 + 60}} />
        </div>
      </div>

      {/* 圖例 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {Object.entries(STATUS_COLOR).map(([k,v]) => (
          <div key={k} className="flex items-center gap-2">
            <div className={`w-6 h-3 rounded ${v.split(' ')[0]}`}></div>
            <span className="capitalize">{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
