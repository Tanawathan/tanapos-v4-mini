import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, Users, Phone, Mail, Baby, Plus, Filter, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react'
import type { Reservation, ReservationFilters } from '../lib/reservation-types'
import { ReservationService } from '../services/reservationService'
import useStore from '../lib/store'
import ReservationForm from '../components/ReservationForm'

interface ReservationManagementPageProps {
  onBack?: () => void
}

export default function ReservationManagementPage({ onBack }: ReservationManagementPageProps) {
  const { currentRestaurant } = useStore()
  
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [activeView, setActiveView] = useState<'list' | 'timeline'>('list')
  const [filters, setFilters] = useState<ReservationFilters>({
    status: ['pending', 'confirmed'],
    date_range: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  })

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadReservations()
    }
  }, [currentRestaurant?.id, filters])

  const loadReservations = async () => {
    if (!currentRestaurant?.id) return
    
    try {
      setLoading(true)
      const data = await ReservationService.getReservations(currentRestaurant.id, filters)
      setReservations(data)
    } catch (error) {
      console.error('載入預約失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReservation = async (formData: any) => {
    if (!currentRestaurant?.id) return
    
    try {
      await ReservationService.createReservation(formData, currentRestaurant.id)
      setShowForm(false)
      await loadReservations() // 重新載入列表
      alert('預約成功！')
    } catch (error) {
      console.error('創建預約失敗:', error)
      alert('預約失敗: ' + (error as Error).message)
    }
  }

  const handleStatusChange = async (reservationId: string, newStatus: Reservation['status']) => {
    try {
      await ReservationService.updateReservationStatus(reservationId, newStatus)
      await loadReservations() // 重新載入列表
    } catch (error) {
      console.error('更新狀態失敗:', error)
      alert('更新失敗: ' + (error as Error).message)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '待確認', class: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '已確認', class: 'bg-green-100 text-green-800' },
      seated: { label: '已入座', class: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', class: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', class: 'bg-red-100 text-red-800' },
      no_show: { label: '未出現', class: 'bg-orange-100 text-orange-800' }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    )
  }

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return {
      date: date.toLocaleDateString('zh-TW', { 
        month: 'numeric', 
        day: 'numeric',
        weekday: 'short'
      }),
      time: date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }
  }

  const parseChildInfo = (customerNotes?: string) => {
    const customerData = ReservationService.parseReservationCustomerData(customerNotes)
    if (customerData) {
      return {
        adult_count: customerData.adults,
        child_count: customerData.children,
        child_chair_needed: customerData.childChairNeeded
      }
    }
    // 回退到舊格式
    return ReservationService.parseChildInfo(customerNotes)
  }

  // 過濾 & 排序
  const filtered = useMemo(() => {
    return reservations
      .filter(r => !query || r.customer_name.includes(query) || r.customer_phone.includes(query))
      .filter(r => !filters.status || filters.status.length === 0 || filters.status.includes(r.status))
      .sort((a,b) => new Date(a.reservation_time).getTime() - new Date(b.reservation_time).getTime())
  }, [reservations, query, filters.status])

  // 分組（今日 / 未來）
  const grouped = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0]
    const groups: Record<string, Reservation[]> = {}
    filtered.forEach(r => {
      const d = r.reservation_time.split('T')[0]
      const key = d === todayKey ? '今日' : d
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return groups
  }, [filtered])

  // 統計 KPI
  const kpis = useMemo(() => {
    const base = { pending:0, confirmed:0, seated:0, completed:0 }
    filtered.forEach(r => { if ((base as any)[r.status] !== undefined) (base as any)[r.status]++ })
    return base
  }, [filtered])

  const toggleExpand = (id:string) => setExpandedIds(prev => { const n = new Set(prev); n.has(id)? n.delete(id): n.add(id); return n })

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <ReservationForm
          onSubmit={handleCreateReservation}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" title="返回">
                ←
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">🗂️ 預約管理 <span className="text-sm text-gray-400 font-normal">{filtered.length} 筆</span></h1>
              <div className="text-xs text-gray-500">快速檢視與操作今日與未來預約</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋姓名或電話" className="pl-8 pr-3 py-2 text-sm border rounded-lg w-56 focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={loadReservations} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"><RefreshCw className="h-4 w-4"/>刷新</button>
            <button onClick={()=>setShowForm(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700"><Plus className="h-4 w-4"/>新增</button>
          </div>
        </div>
        {/* Status Chips */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs">
            {['pending','confirmed','seated','completed','cancelled','no_show'].map(s=>{
              const active = filters.status?.includes(s)
              const count = reservations.filter(r=>r.status===s).length
              return (
                <button key={s} onClick={()=>{
                  setFilters(p=>{ const cur = new Set(p.status||[]); cur.has(s)? cur.delete(s): cur.add(s); return { ...p, status: Array.from(cur)} })
                }} className={`px-3 py-1 rounded-full border flex items-center gap-1 whitespace-nowrap ${active? 'bg-blue-600 text-white border-blue-600':'bg-white hover:bg-gray-50 text-gray-600'}`}>
                  {getStatusBadge(s)}<span className="text-[10px]">{count}</span>
                </button>
              )
            })}
            <button onClick={()=>setFilters(p=>({...p,status:[]}))} className="px-3 py-1 rounded-full border text-gray-500 hover:bg-gray-50">重置</button>
          </div>
          <div className="sm:hidden mt-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋姓名或電話" className="pl-8 pr-3 py-2 text-sm border rounded-lg w-full focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              { key:'pending', label:'待確認', color:'bg-amber-50 text-amber-700', value:kpis.pending },
              { key:'confirmed', label:'已確認', color:'bg-green-50 text-green-700', value:kpis.confirmed },
              { key:'seated', label:'已入座', color:'bg-blue-50 text-blue-700', value:kpis.seated },
              { key:'completed', label:'已完成', color:'bg-gray-50 text-gray-600', value:kpis.completed },
            ] as const
          ).map(k=> (
            <div key={k.key} className="p-4 rounded-lg border bg-white flex flex-col gap-1">
              <div className="text-xs font-medium text-gray-500">{k.label}</div>
              <div className="text-2xl font-semibold">{k.value}</div>
              <div className={`text-[10px] px-2 py-0.5 rounded-full self-start ${k.color}`}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {loading && (
            <div className="grid gap-3">
              {Array.from({length:4}).map((_,i)=>(<div key={i} className="h-24 bg-white border rounded-lg animate-pulse"/>))}
            </div>
          )}
          {!loading && filtered.length===0 && (
            <div className="p-10 text-center border bg-white rounded-lg">
              <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3"/>
              <div className="text-gray-500 mb-2 text-sm">沒有符合條件的預約</div>
              <button onClick={()=>setShowForm(true)} className="text-blue-600 text-sm hover:underline">建立預約</button>
            </div>
          )}
          {!loading && Object.entries(grouped).map(([groupKey,list])=> (
            <div key={groupKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">{groupKey}</h2>
                <span className="text-xs text-gray-400">{list.length} 筆</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map(r=> {
                  const { date, time } = formatDateTime(r.reservation_time)
                  const childInfo = parseChildInfo(r.customer_notes)
                  const expanded = expandedIds.has(r.id!)
                  return (
                    <div key={r.id} className="border bg-white rounded-lg p-4 flex flex-col gap-3 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 grid place-items-center text-sm font-medium">
                            {r.customer_name.slice(0,1)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">{r.customer_name}{getStatusBadge(r.status)}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3"/>{r.customer_phone}</div>
                          </div>
                        </div>
                        <button onClick={()=>toggleExpand(r.id!)} className="text-gray-400 hover:text-gray-600">{expanded? <ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}</button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{date}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3"/>{time}</div>
                        <div className="flex items-center gap-1"><Users className="h-3 w-3"/>{r.party_size}人</div>
                      </div>
                      {expanded && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>
                            {childInfo.adult_count>0 && <span>{childInfo.adult_count}大人 </span>}
                            {childInfo.child_count>0 && <span>{childInfo.child_count}小孩 </span>}
                            {childInfo.child_chair_needed && <span className="inline-flex items-center gap-1 text-blue-600"><Baby className="h-3 w-3"/>兒童椅</span>}
                          </div>
                          {r.special_requests && <div className="text-[11px] text-gray-500">備註：{r.special_requests}</div>}
                          {r.customer_email && <div className="text-[11px] flex items-center gap-1"><Mail className="h-3 w-3"/>{r.customer_email}</div>}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1 border-t mt-auto">
                        {r.status==='pending' && <button onClick={()=>handleStatusChange(r.id!,'confirmed')} className="px-2 py-1 text-[11px] bg-green-50 text-green-700 rounded hover:bg-green-100">確認</button>}
                        {r.status==='confirmed' && <button onClick={()=>handleStatusChange(r.id!,'seated')} className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100">入座</button>}
                        {r.status==='seated' && <button onClick={()=>handleStatusChange(r.id!,'completed')} className="px-2 py-1 text-[11px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200">完成</button>}
                        {['pending','confirmed'].includes(r.status) && <button onClick={()=>handleStatusChange(r.id!,'cancelled')} className="px-2 py-1 text-[11px] bg-red-50 text-red-600 rounded hover:bg-red-100">取消</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
