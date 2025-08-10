import React, { useEffect, useMemo, useState } from 'react'
import { useReservationStore, computeReservationTags, ReservationRow } from '../lib/reservationStore'
import usePOSStore from '../lib/store'
import { ReservationService } from '../services/reservationService'
import { Users, Clock, Calendar, Plus, X, UserCheck, AlertCircle, CheckCircle2, ArchiveRestore, Phone, Search, Filter, ArrowLeft, Layout, RefreshCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// 新一代預約主控台：整合列表 + 時間軸 + 編輯 / 新增
// 精簡 UI：左側日期與統計 + 篩選 / 中間列表 / 右側時間軸（可收合） / 抽屜表單

interface DraftForm {
  customer_name: string
  customer_phone: string
  party_size: number
  adult_count: number
  child_count: number
  child_chair_needed: boolean
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  special_requests?: string
  table_id?: string
}

const emptyDraft = (): DraftForm => ({
  customer_name: '',
  customer_phone: '',
  party_size: 2,
  adult_count: 2,
  child_count: 0,
  child_chair_needed: false,
  reservation_date: new Date().toISOString().slice(0,10),
  reservation_time: '',
  duration_minutes: 90,
  special_requests: '',
  table_id: undefined
})

const TAGS = ['upcoming','arriving_now','late','ending_soon','overtime'] as const
const STATUS_ORDER = ['confirmed','seated','late','ending_soon','overtime','pending','cancelled','no_show','completed']

function formatHM(d: Date){return d.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})}

export default function ReservationConsolePage(){
  const reservationStore = useReservationStore()
  const { currentRestaurant, tables, loadTables, updateTableStatus } = usePOSStore() as any
  const navigate = useNavigate()

  const [date, setDate] = useState(reservationStore.currentDate)
  const [search, setSearch] = useState('')
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [showTimeline, setShowTimeline] = useState(true)
  const [draft, setDraft] = useState<DraftForm | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [showCancelledOnTimeline, setShowCancelledOnTimeline] = useState(false)

  useEffect(()=>{
    if(currentRestaurant?.id){
      reservationStore.setDate(date, currentRestaurant.id)
      reservationStore.enableRealtime(currentRestaurant.id)
      if(!tables || !tables.length) loadTables?.()
    }
  },[currentRestaurant?.id,date])

  const reservations = reservationStore.getReservationsWithTags()

  // 計算衍生：遲到 / 超時在 tags 即時顯示
  const enhanced = useMemo(()=> reservations.map(r=>{
    const tags = computeReservationTags(r)
    return { ...r, tags }
  }),[reservations])

  const filtered = enhanced.filter(r=>{
    if(search){
      const s = search.toLowerCase()
      if(!(r.customer_name.toLowerCase().includes(s) || (r.customer_phone||'').includes(s))) return false
    }
    if(tagFilters.length>0 && !r.tags.some(t=> tagFilters.includes(t))) return false
    if(statusFilters.length>0 && !statusFilters.includes(r.status)) return false
    return true
  }).sort((a,b)=> a.reservation_time.localeCompare(b.reservation_time))

  // 統計
  const stats = useMemo(()=>{
    const total = enhanced.length
    const seated = enhanced.filter(r=> r.status==='seated').length
    const upcoming = enhanced.filter(r=> r.tags.includes('upcoming')|| r.tags.includes('arriving_now')).length
    const late = enhanced.filter(r=> r.tags.includes('late')).length
    return { total, seated, upcoming, late }
  },[enhanced])

  const openCreate = ()=>{ setDraft(emptyDraft()); setEditingId(null) }
  const openEdit = (id:string)=>{
    const r = enhanced.find(r=> r.id===id)
    if(!r) return
    setDraft({
      customer_name: r.customer_name,
      customer_phone: r.customer_phone||'',
      party_size: r.party_size,
      adult_count: r.adult_count ?? r.party_size,
      child_count: r.child_count||0,
      child_chair_needed: !!r.child_chair_needed,
      reservation_date: r.reservation_time.slice(0,10),
      reservation_time: formatHM(new Date(r.reservation_time)),
      duration_minutes: r.duration_minutes||90,
      special_requests: r.special_requests||'',
      table_id: r.table_id || undefined
    });
    setEditingId(id)
  }
  const closeDrawer = ()=>{ setDraft(null); setEditingId(null) }

  const reload = async ()=>{
    if(!currentRestaurant?.id) return
    setLoading(true)
    await reservationStore.loadReservations(currentRestaurant.id, date)
    setLoading(false)
  }

  const submitDraft = async()=>{
    if(!currentRestaurant?.id || !draft) return
    setSaving(true)
    try {
      const baseISO = `${draft.reservation_date}T${draft.reservation_time.length===5? draft.reservation_time+':00':draft.reservation_time}`
      if(editingId){
        const original = enhanced.find(r=> r.id===editingId)
        await ReservationService.updateReservation(editingId, {
          customer_name: draft.customer_name,
          customer_phone: draft.customer_phone,
          party_size: draft.party_size,
          adult_count: draft.adult_count,
          child_count: draft.child_count,
          child_chair_needed: draft.child_chair_needed,
          reservation_time: baseISO,
          duration_minutes: draft.duration_minutes,
          special_requests: draft.special_requests,
          status: undefined
        } as any)
        // 換桌：釋放舊桌 -> 指派新桌
        if (draft.table_id && draft.table_id !== original?.table_id) {
          if (original?.table_id) {
            await ReservationService.releaseTableForReservation(editingId)
          }
          await ReservationService.assignTableToReservation(editingId, draft.table_id)
        }
        // 移除桌台：若編輯時清空
        if (!draft.table_id && original?.table_id) {
          await ReservationService.releaseTableForReservation(editingId)
        }
      } else {
        const created = await ReservationService.createReservation({
          customer_name: draft.customer_name,
          customer_phone: draft.customer_phone,
          customer_email: '',
          party_size: draft.party_size,
          adult_count: draft.adult_count,
          child_count: draft.child_count,
          child_chair_needed: draft.child_chair_needed,
          reservation_date: draft.reservation_date,
          reservation_time: draft.reservation_time,
          special_requests: draft.special_requests
        }, currentRestaurant.id)
        // 手動選桌（覆蓋自動指派）
        if (draft.table_id) {
          await ReservationService.assignTableToReservation(created.id as string, draft.table_id)
        }
      }
      closeDrawer()
    } catch(err){
      console.error(err)
      alert('儲存失敗')
    } finally { setSaving(false) }
  }

  const quickAction = async(r: ReservationRow, action: 'seat'|'cancel'|'no_show'|'complete'|'auto_assign')=>{
    try {
      if(action==='seat') {
        await ReservationService.updateReservationStatus(r.id,'seated' as any)
        if(r.table_id) await updateTableStatus?.(r.table_id,'occupied')
        // 樂觀更新
        reservationStore.upsertReservation({ ...r, status:'seated', seated_at: new Date().toISOString() } as any)
      } else if(action==='cancel') {
        await ReservationService.updateReservationStatus(r.id,'cancelled' as any)
        if(r.table_id) await ReservationService.releaseTableForReservation(r.id)
        reservationStore.upsertReservation({ ...r, status:'cancelled', table_id: null } as any)
      } else if(action==='no_show') {
        await ReservationService.updateReservationStatus(r.id,'no_show' as any)
        if(r.table_id) await ReservationService.releaseTableForReservation(r.id)
        reservationStore.upsertReservation({ ...r, status:'no_show', table_id: null } as any)
      } else if(action==='complete') {
        await ReservationService.updateReservationStatus(r.id,'completed' as any)
        // 可選：不立即釋放桌台，讓其他流程處理（清潔 / turnover）
        reservationStore.upsertReservation({ ...r, status:'completed', completed_at: new Date().toISOString() } as any)
      } else if(action==='auto_assign') {
        const res = await ReservationService.autoAssignTableForReservation(r.id)
        if(!res.success) alert(res.message)
        else if(res.table){
          reservationStore.upsertReservation({ ...r, table_id: res.table.id } as any)
        }
      }
    } catch(e){ console.error(e); alert('操作失敗') }
  }

  // Timeline 計算
  const timelineItems = filtered
  const windowRange = useMemo(()=>{
    if(timelineItems.length===0){
      const base = new Date(date+'T00:00:00');
      const wStart = new Date(base); wStart.setHours(11,0,0,0)
      const wEnd = new Date(base); wEnd.setHours(22,0,0,0)
      return { wStart, wEnd }
    }
    let min = Infinity, max = -Infinity
    timelineItems.forEach(r=>{ const s=new Date(r.reservation_time).getTime(); const e = r.estimated_end_time? new Date(r.estimated_end_time).getTime(): s + (r.duration_minutes||90)*60000; if(s<min)min=s; if(e>max)max=e })
    min -= 30*60000; max += 30*60000
    return { wStart: new Date(min), wEnd: new Date(max) }
  },[timelineItems,date])
  const totalMinutes = (windowRange.wEnd.getTime()-windowRange.wStart.getTime())/60000 || 1
  const ticks = useMemo(()=>{ const arr:Date[]=[]; let c=new Date(windowRange.wStart); c.setMinutes(Math.floor(c.getMinutes()/30)*30,0,0); while(c<=windowRange.wEnd){ arr.push(new Date(c)); c=new Date(c.getTime()+30*60000)} return arr },[windowRange])

  interface LaneItem extends ReservationRow { lane: number, tags: string[] }
  function assignLanes(list: typeof timelineItems){
    const sorted=[...list].sort((a,b)=> a.reservation_time.localeCompare(b.reservation_time))
    const lanes: {end:number}[]=[]; const out: LaneItem[] = []
    sorted.forEach(r=>{ const s=new Date(r.reservation_time).getTime(); const e = r.estimated_end_time? new Date(r.estimated_end_time).getTime(): s+(r.duration_minutes||90)*60000; let placed=false; for(let i=0;i<lanes.length;i++){ if(s >= lanes[i].end - 60000){ lanes[i].end = Math.max(lanes[i].end,e); out.push({...r, lane:i} as LaneItem); placed=true; break } } if(!placed){ lanes.push({end:e}); out.push({...r, lane:lanes.length-1} as LaneItem) } })
    return { items: out, laneCount: lanes.length }
  }
  const { items: laneItems, laneCount } = useMemo(()=> assignLanes(timelineItems),[timelineItems])

  const tagLabel = (tag:string)=> ({upcoming:'即將',arriving_now:'抵達',late:'遲到',ending_soon:'快結束',overtime:'超時'} as any)[tag]||tag

  const statusLabel = (s:string)=> ({confirmed:'已確認',seated:'已入座',completed:'完成',cancelled:'取消',no_show:'未到',pending:'待確認'} as any)[s]||s
  const statusColor = (s:string)=> ({confirmed:'bg-blue-100 text-blue-700',seated:'bg-emerald-100 text-emerald-700',completed:'bg-gray-100 text-gray-600',cancelled:'bg-red-100 text-red-700 line-through',no_show:'bg-orange-100 text-orange-700',pending:'bg-indigo-100 text-indigo-700'} as any)[s]||'bg-gray-100 text-gray-600'

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 text-white text-xs md:text-sm px-4 py-2 flex flex-wrap items-center gap-3">
        <span className="font-semibold">新版預約主控台 Beta</span>
        <span className="opacity-90">整合列表 / 時間軸 / 快速操作。如遇問題可返回舊版。</span>
        <div className="ml-auto flex gap-3 text-[11px] md:text-xs">
          <button onClick={()=> navigate('/reservations/legacy')} className="underline hover:text-yellow-200">舊版列表</button>
          <button onClick={()=> navigate('/reservations/timeline')} className="underline hover:text-yellow-200">僅時間軸</button>
        </div>
      </div>
      <div className="p-4 border-b bg-white flex items-center gap-3 flex-wrap">
        <button onClick={()=> navigate(-1)} className="px-3 py-2 text-sm border rounded flex items-center gap-1"><ArrowLeft className="h-4 w-4"/>返回</button>
        <h1 className="text-xl font-bold flex items-center gap-2"><Layout className="h-5 w-5"/>預約主控台 (新)</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e=> setDate(e.target.value)} className="px-2 py-1 border rounded" />
          <button onClick={reload} disabled={loading} className="px-3 py-2 text-sm border rounded flex items-center gap-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"><RefreshCcw className="h-4 w-4"/>{loading?'載入中':'重新載入'}</button>
        </div>
        <div className="flex items-center bg-gray-50 rounded border px-2">
          <Search className="h-4 w-4 text-gray-500"/>
          <input placeholder="搜尋姓名/電話" value={search} onChange={e=> setSearch(e.target.value)} className="bg-transparent px-2 py-1 text-sm outline-none" />
        </div>
        <button onClick={openCreate} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700"><Plus className="h-4 w-4"/>新增</button>
        <button onClick={()=> setShowTimeline(s=>!s)} className="px-3 py-2 border rounded text-sm">{showTimeline?'隱藏時間軸':'顯示時間軸'}</button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* 左側篩選 + 統計 */}
        <aside className="w-56 border-r bg-white p-4 overflow-y-auto hidden md:block">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Filter className="h-4 w-4"/>篩選</h2>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">標籤</div>
            <div className="flex flex-wrap gap-1">
              {TAGS.map(t=>{
                const active = tagFilters.includes(t)
                return <button key={t} onClick={()=> setTagFilters(p=> p.includes(t)? p.filter(x=>x!==t): [...p,t])} className={`px-2 py-0.5 rounded text-xs border ${active? 'bg-purple-600 text-white border-purple-600':'bg-white text-gray-600 hover:bg-gray-50'}`}>{tagLabel(t)}</button>
              })}
            </div>
            {tagFilters.length>0 && <button onClick={()=> setTagFilters([])} className="mt-1 text-xs text-blue-600 underline">清除標籤</button>}
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">狀態</div>
            <div className="flex flex-wrap gap-1">
              {['confirmed','seated','completed','cancelled','no_show','pending'].map(s=>{
                const active = statusFilters.includes(s)
                return <button key={s} onClick={()=> setStatusFilters(p=> p.includes(s)? p.filter(x=>x!==s): [...p,s])} className={`px-2 py-0.5 rounded text-xs border ${active? 'bg-emerald-600 text-white border-emerald-600':'bg-white text-gray-600 hover:bg-gray-50'}`}>{statusLabel(s)}</button>
              })}
            </div>
            {statusFilters.length>0 && <button onClick={()=> setStatusFilters([])} className="mt-1 text-xs text-blue-600 underline">清除狀態</button>}
          </div>
          <div className="space-y-2 text-sm">
            <div className="p-2 rounded bg-gray-50">總計 <span className="font-semibold">{stats.total}</span></div>
            <div className="p-2 rounded bg-blue-50">即將/抵達 <span className="font-semibold">{stats.upcoming}</span></div>
            <div className="p-2 rounded bg-emerald-50">已入座 <span className="font-semibold">{stats.seated}</span></div>
            <div className="p-2 rounded bg-orange-50">遲到 <span className="font-semibold">{stats.late}</span></div>
          </div>
        </aside>
        {/* 中間列表 */}
        <main className={`flex-1 overflow-y-auto ${showTimeline? 'md:w-2/5':''}`}> 
          <div className="divide-y">
            {filtered.length===0 && (
              <div className="p-8 text-center text-gray-500">無符合的預約</div>
            )}
            {filtered.map(r=>{
              const start = new Date(r.reservation_time)
              return (
                <div key={r.id} className="p-3 hover:bg-gray-50 flex items-start gap-3 cursor-pointer" onClick={()=> openEdit(r.id)}>
                  <div className="w-20 text-sm text-gray-600 flex flex-col items-center">
                    <span className="font-mono text-base">{formatHM(start)}</span>
                    <span className="text-xs text-gray-400">{r.duration_minutes||90}m</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 truncate max-w-[140px]">{r.customer_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 flex items-center gap-1"><Users className="h-3 w-3"/>{r.party_size}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                      {r.tags.slice(0,3).map(t=> <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">{tagLabel(t)}</span>)}
                      {r.table_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">桌 {tables?.find((tb:any)=> tb.id===r.table_id)?.table_number||'?'}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                      {r.customer_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{r.customer_phone}</span>}
                      {r.special_requests && <span className="truncate max-w-[200px]">{r.special_requests}</span>}
                    </div>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {r.status==='confirmed' && <>
                        <button onClick={(e)=>{e.stopPropagation(); quickAction(r,'seat')}} className="text-xs px-2 py-1 rounded bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700"><UserCheck className="h-3 w-3"/>入座</button>
                        <button onClick={(e)=>{e.stopPropagation(); quickAction(r,'no_show')}} className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 flex items-center gap-1 hover:bg-orange-200"><AlertCircle className="h-3 w-3"/>未到</button>
                        <button onClick={(e)=>{e.stopPropagation(); quickAction(r,'cancel')}} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">取消</button>
                        {!r.table_id && <button onClick={(e)=>{e.stopPropagation(); quickAction(r,'auto_assign')}} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">指派桌台</button>}
                      </>}
                      {r.status==='seated' && <>
                        <button onClick={(e)=>{e.stopPropagation(); quickAction(r,'complete')}} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white flex items-center gap-1 hover:bg-emerald-700"><CheckCircle2 className="h-3 w-3"/>結束</button>
                        <button onClick={(e)=>{e.stopPropagation(); quickAction(r,'cancel')}} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">取消</button>
                      </>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
        {/* 右側時間軸 */}
        {showTimeline && (
          <section className="hidden md:block w-1/2 border-l relative overflow-auto bg-white">
            <div className="p-2 text-xs text-gray-500 flex items-center gap-3">
              <span>時間軸 ({laneCount} 行)</span>
              <label className="inline-flex items-center gap-1 cursor-pointer select-none text-[11px] text-gray-600">
                <input type="checkbox" className="h-3 w-3" checked={showCancelledOnTimeline} onChange={e=> setShowCancelledOnTimeline(e.target.checked)} />
                顯示已取消
              </label>
            </div>
            <div className="relative" style={{minHeight: laneCount*48 + 80}}>
              {/* 刻度 */}
              {ticks.map((t,i)=>{
                const left = ((t.getTime()-windowRange.wStart.getTime())/60000)/totalMinutes*100
                return <div key={i} style={{left: left+'%'}} className="absolute top-0 bottom-0 w-px bg-gray-100">
                  <div className="absolute -top-0.5 -translate-x-1/2 bg-white px-1 text-[10px] text-gray-500">{formatHM(t)}</div>
                </div>
              })}
              {/* Items */}
              {laneItems.map(item=>{
                if(item.status==='cancelled' && !showCancelledOnTimeline) return null
                const s=new Date(item.reservation_time).getTime(); const e = item.estimated_end_time? new Date(item.estimated_end_time).getTime(): s + (item.duration_minutes||90)*60000
                const left = ((s-windowRange.wStart.getTime())/60000)/totalMinutes*100
                const width = ((e-s)/60000)/totalMinutes*100
                const cancelled = item.status==='cancelled'
                const baseColor = cancelled? 'bg-gray-300/40 border border-dashed border-gray-300 text-gray-500 line-through': 'bg-blue-500/80 hover:bg-blue-500 text-white'
        const table = tables?.find((t:any)=> t.id===item.table_id)
        const mergedCount = table?.metadata?.merged_with?.length || 0
        const mergedCapacity = table?.metadata?.merged_capacity || table?.capacity
                return (
                  <div key={item.id} className={`absolute rounded text-[10px] px-2 py-1 cursor-pointer ${baseColor}`} style={{left:left+'%', width: Math.max(width,0.5)+'%', top: item.lane*48 + 24, backdropFilter: cancelled? 'grayscale(0.6)': undefined}} title={`${item.customer_name} ${formatHM(new Date(item.reservation_time))}`}
                    onClick={()=> openEdit(item.id)}
                  >
                    <div className="font-medium truncate">{item.customer_name}</div>
          <div className="flex gap-1 opacity-90 flex-wrap"><Users className="h-3 w-3"/>{item.party_size}<Clock className="h-3 w-3 ml-1"/>{formatHM(new Date(item.reservation_time))}{table && <span className="ml-1 px-1 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">#{table.table_number}{mergedCount? '+'+mergedCount:''}{mergedCount? <span className="ml-0.5 text-[10px]">({mergedCapacity})</span>:null}</span>}</div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 抽屜表單 */}
        {draft && (
          <div className="fixed inset-0 bg-black/30 flex justify-end z-50">
            <div className="w-full max-w-md h-full bg-white shadow-xl flex flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                <h2 className="font-semibold text-lg">{editingId? '編輯預約':'新增預約'}</h2>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={closeDrawer} className="p-2 rounded hover:bg-gray-100"><X className="h-5 w-5"/></button>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">姓名 *</label>
                  <input value={draft.customer_name} onChange={e=> setDraft({...draft, customer_name:e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">電話 *</label>
                  <input value={draft.customer_phone} onChange={e=> setDraft({...draft, customer_phone:e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">成人</label>
                    <input type="number" min={1} value={draft.adult_count} onChange={e=>{ const v=parseInt(e.target.value)||1; setDraft(d=> d?{...d, adult_count:v, party_size:v + d.child_count}:d!)}} className="w-full px-2 py-1 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">兒童</label>
                    <input type="number" min={0} value={draft.child_count} onChange={e=>{ const v=parseInt(e.target.value)||0; setDraft(d=> d?{...d, child_count:v, party_size:v + d.adult_count}:d!)}} className="w-full px-2 py-1 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">總人數</label>
                    <div className="px-2 py-2 border rounded bg-gray-50 text-sm">{draft.party_size}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <input id="childChair" type="checkbox" checked={draft.child_chair_needed} onChange={e=> setDraft({...draft, child_chair_needed: e.target.checked})} />
                  <label htmlFor="childChair">需要兒童椅</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">日期 *</label>
                    <input type="date" value={draft.reservation_date} onChange={e=> setDraft({...draft, reservation_date:e.target.value})} className="w-full px-2 py-1 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">時間 (HH:mm)*</label>
                    <input type="time" value={draft.reservation_time} onChange={e=> setDraft({...draft, reservation_time:e.target.value})} className="w-full px-2 py-1 border rounded" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">桌台 (可選)</label>
                  <div className="flex gap-2">
                    <select value={draft.table_id||''} onChange={e=> setDraft({...draft, table_id: e.target.value || undefined})} className="flex-1 px-2 py-1 border rounded text-sm">
                      <option value="">-- 自動或稍後指派 --</option>
                      {(tables||[])
                        .filter((t:any)=> t.is_active !== false) // 顯示所有未被停用的桌台（null 視為啟用）
                        .filter((t:any)=> !t.metadata?.merged_into)
                        .sort((a:any,b:any)=> ((a.metadata?.merged_capacity)||a.capacity||0)-((b.metadata?.merged_capacity)||b.capacity||0))
                        .map((t:any)=>{
                          // ===== 複合狀態：與桌台管理頁保持一致 =====
                          // 避免 raw table.status 與實際顯示不一致 (例如已結帳但仍為 occupied)
                          const now = Date.now()
                          const inTwoHours = (iso:string)=>{ const ts=new Date(iso).getTime(); return ts>=now && (ts-now)<=120*60000 }
                          const hasSeated = enhanced.some(r=> r.table_id===t.id && r.status==='seated')
                          const hasUpcoming = enhanced.some(r=> r.table_id===t.id && r.status==='confirmed' && inTwoHours(r.reservation_time))
                          let compositeStatus: string
                          if(hasSeated) compositeStatus='occupied'
                          else if(hasUpcoming) compositeStatus='reserved'
                          else if(t.status==='cleaning') compositeStatus='cleaning'
                          else if(t.status==='maintenance') compositeStatus='maintenance'
                          else compositeStatus='available'
                          // 若資料庫仍標記 occupied 但無 seated / upcoming，視為可用，避免下拉誤判
                          const cap = t.metadata?.merged_capacity || t.capacity
                          const warn = draft.party_size > cap
                          const mergedTag = t.metadata?.merged_with?.length? ` +${t.metadata.merged_with.length}`:''
                          const selectable = compositeStatus==='available' || t.id===draft.table_id // 允許保留目前已選
                          const statusTag = compositeStatus==='available'? '' : compositeStatus==='reserved'? ' (預約中)' : compositeStatus==='occupied'? ' (已佔用)' : compositeStatus==='cleaning'? ' (清潔)' : compositeStatus==='maintenance'? ' (維護)' : ''
                          return <option key={t.id} value={t.id} disabled={!selectable}>{`#${t.table_number || '?'} 容${cap}${mergedTag}${warn? ' (不足⚠️)':''}${statusTag}`}</option>
                        })}
                    </select>
                    {editingId && !draft.table_id && <button type="button" onClick={async()=>{
                      if(!editingId) return
                      const res = await ReservationService.autoAssignTableForReservation(editingId)
                      if(!res.success) alert(res.message)
                    }} className="px-2 py-1 text-xs border rounded bg-indigo-50 hover:bg-indigo-100">AI</button>}
                  </div>
                  {draft.table_id && tables && (()=>{
                    const t = (tables as any[]).find(tb=> tb.id===draft.table_id)
                    if(!t) return null
                    return <div className="mt-1 text-[11px] text-gray-500">已選桌號 {t.table_number} (容量 {t.capacity})</div>
                  })()}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">用餐時長(分鐘)</label>
                  <input type="number" min={30} step={15} value={draft.duration_minutes} onChange={e=> setDraft({...draft, duration_minutes: parseInt(e.target.value)||90})} className="w-full px-2 py-1 border rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">特殊需求</label>
                  <textarea value={draft.special_requests} onChange={e=> setDraft({...draft, special_requests:e.target.value})} rows={3} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="p-4 border-t flex gap-3">
                <button onClick={closeDrawer} className="flex-1 px-4 py-2 border rounded">取消</button>
                <button disabled={saving || !draft.customer_name || !draft.customer_phone || !draft.reservation_time} onClick={submitDraft} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{saving? '儲存中...':'儲存'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
