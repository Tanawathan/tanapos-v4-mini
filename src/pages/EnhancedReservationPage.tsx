import React, { useState, useEffect } from 'react'
import { Calendar, Users, Clock, UserCheck, Plus, Search, Filter, Pencil, X, Save, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import ReservationForm from '../components/ReservationForm'
import WalkInRegistration from '../components/WalkInRegistration'
import useStore from '../lib/store'
import { supabase } from '../lib/supabase'
import { ReservationService } from '../services/reservationService'
import { useReservationStore } from '../lib/reservationStore'
import { useNavigate } from 'react-router-dom'

interface Reservation {
  id: string
  customer_name: string
  customer_last_name?: string
  customer_gender?: 'male' | 'female' | 'other'
  customer_phone?: string
  party_size: number
  reservation_time: string
  status: string
  reservation_type?: 'advance' | 'same_day' | 'walk_in'
  is_walk_in?: boolean
  table_id?: string
  // 其他可選欄位，方便顯示/編輯
  customer_email?: string
  duration_minutes?: number
  estimated_end_time?: string
  special_requests?: string
  adult_count?: number
  child_count?: number
  child_chair_needed?: boolean
  // 狀態時間戳
  confirmed_at?: string
  seated_at?: string
  completed_at?: string
  updated_at?: string
}

type ViewMode = 'list' | 'reservation' | 'walkin'
type FilterType = 'all' | 'advance' | 'same_day' | 'walk_in'

export default function EnhancedReservationPage() {
  const { currentRestaurant, tables, tablesLoaded, loadTables } = useStore()
  const updateTableStatus = useStore((state: any) => state.updateTableStatus)
  const navigate = useNavigate()
  
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  // 取代本地 reservations ，改用全域 reservationStore（保留原型別供編輯區使用）
  const reservationStore = useReservationStore()
  const reservationsWithTags = reservationStore.getReservationsWithTags() as any as Reservation[] & { tags?: string[] }[]
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [originalEditing, setOriginalEditing] = useState<Reservation | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [tagFilters, setTagFilters] = useState<string[]>([])

  useEffect(() => {
    if (currentRestaurant?.id) {
      reservationStore.setDate(selectedDate, currentRestaurant.id)
      reservationStore.enableRealtime(currentRestaurant.id)
    }
  }, [currentRestaurant?.id, selectedDate])

  useEffect(() => {
    if (!tablesLoaded) {
      loadTables?.()
    }
  }, [tablesLoaded])

  // 舊的 loadReservations 改為觸發 store reload
  const loadReservations = async () => {
    if (!currentRestaurant?.id) return
    setLoading(true)
    await reservationStore.loadReservations(currentRestaurant.id, selectedDate)
    setLoading(false)
  }

  const handleReservationSubmit = async (formData: any) => {
    if (!currentRestaurant?.id) return
    
    try {
      const reservationData = {
        restaurant_id: currentRestaurant.id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        party_size: formData.party_size,
        reservation_time: `${formData.reservation_date}T${formData.reservation_time}:00`,
        duration_minutes: 120,
        status: 'confirmed',
        special_requests: formData.special_requests,
        reservation_type: isToday(formData.reservation_date) ? 'same_day' : 'advance'
      }

      const { error } = await supabase
        .from('table_reservations')
        .insert(reservationData)

      if (!error) {
        await loadReservations()
        setViewMode('list')
        alert('預約成功！')
      } else {
        console.error('預約失敗:', error)
        alert('預約失敗，請稍後再試')
      }
    } catch (error) {
      console.error('預約提交異常:', error)
      alert('預約失敗，請稍後再試')
    }
  }

  const handleWalkInSubmit = async (formData: any) => {
    if (!currentRestaurant?.id) return
    
    try {
      const walkInData = {
        restaurant_id: currentRestaurant.id,
        customer_name: formData.customer_name,
        customer_last_name: formData.customer_last_name,
        customer_gender: formData.customer_gender || null,
        customer_phone: formData.customer_phone || '',
        party_size: formData.party_size,
        reservation_time: new Date().toISOString(),
        duration_minutes: 120,
        status: 'confirmed',
        is_walk_in: true,
        reservation_type: 'walk_in'
      }

      const { error } = await supabase
        .from('table_reservations')
        .insert(walkInData)

      if (!error) {
        await loadReservations()
        setViewMode('list')
        alert('現場顧客登記成功！')
      } else {
        console.error('現場登記失敗:', error)
        alert('現場登記失敗，請稍後再試')
      }
    } catch (error) {
      console.error('現場登記異常:', error)
      alert('現場登記失敗，請稍後再試')
    }
  }

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  // 來源改為帶 tags 的 store 資料
  const filteredReservations = (reservationsWithTags as any[]).filter(reservation => {
    // 搜尋過濾
    const matchesSearch = !searchTerm || 
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.customer_last_name && reservation.customer_last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reservation.customer_phone && reservation.customer_phone.includes(searchTerm))

    // 類型過濾
    const matchesFilter = filterType === 'all' || 
      (filterType === 'walk_in' && reservation.is_walk_in) ||
      (filterType !== 'walk_in' && reservation.reservation_type === filterType)

  // 標籤過濾 (若有選擇標籤, 須至少命中一個)
  const matchesTags = tagFilters.length === 0 || (reservation.tags && reservation.tags.some((t: string)=> tagFilters.includes(t)))

  return matchesSearch && matchesFilter && matchesTags
  })

  const getReservationTypeLabel = (reservation: Reservation) => {
    if (reservation.is_walk_in) return { label: '現場', color: 'bg-green-100 text-green-800' }
    if (reservation.reservation_type === 'same_day') return { label: '當日', color: 'bg-blue-100 text-blue-800' }
    return { label: '預約', color: 'bg-gray-100 text-gray-800' }
  }

  const getStatusLabel = (status: string) => {
    const statusMap = {
      confirmed: { label: '已確認', color: 'bg-green-100 text-green-800' },
      seated: { label: '已入座', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
  no_show: { label: '未出現', color: 'bg-orange-100 text-orange-800' }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  const getTableLabel = (tableId?: string) => {
    if (!tableId) return '未分配桌台'
    const t = tables?.find((tb: any) => tb.id === tableId)
    return t ? `桌號 ${t.table_number}` : '已分配桌台'
  }

  // 標籤顯示
  const tagLabel = (tag: string) => {
    switch (tag) {
      case 'upcoming': return '即將到店'
      case 'arriving_now': return '抵達時間'
      case 'late': return '遲到'
      case 'ending_soon': return '即將結束'
      case 'overtime': return '超時'
      default: return tag
    }
  }
  const tagStyle = (tag: string) => {
    switch (tag) {
      case 'upcoming': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'arriving_now': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'late': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'ending_soon': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'overtime': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const formatTimeRange = (res: Reservation) => {
    const start = new Date(res.reservation_time)
    const end = res.estimated_end_time
      ? new Date(res.estimated_end_time)
      : new Date(start.getTime() + (res.duration_minutes || 120) * 60000)
    return `${formatTime(start)} ~ ${formatTime(end)}`
  }

  // --- 時區統一顯示 (台北) 輔助函數 ---
  const TAIPEI_LOCALE = 'zh-TW'
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
  const dateTimeOpts: Intl.DateTimeFormatOptions = { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }
  function formatTime(d: Date) { return d.toLocaleTimeString(TAIPEI_LOCALE, timeOpts) }
  function formatDateTime(d: Date) { return d.toLocaleString(TAIPEI_LOCALE, dateTimeOpts) }

  const openEdit = (res: Reservation) => {
  setEditing(res)
  setOriginalEditing(res)
  }

  const handleEditSave = async () => {
    if (!editing) return
    try {
      setSaving(true)
      // 若使用者有修改時間/日期欄，我們已直接存在 editing.reservation_time（ISO）
      const updates: any = {
        customer_name: editing.customer_name,
        customer_phone: editing.customer_phone,
        customer_email: editing.customer_email,
        party_size: editing.party_size,
        reservation_time: editing.reservation_time,
        special_requests: editing.special_requests,
        adult_count: editing.adult_count,
        child_count: editing.child_count,
        child_chair_needed: editing.child_chair_needed,
        status: editing.status
      }

      await ReservationService.updateReservation(editing.id, updates)
      // 若桌台有變更則執行手動分配
      if (editing.table_id && editing.table_id !== originalEditing?.table_id) {
        await ReservationService.assignTableToReservation(editing.id, editing.table_id)
      }
      // 依狀態同步桌況/釋放桌台
      if (originalEditing?.status !== editing.status) {
        if (['cancelled', 'no_show'].includes(editing.status)) {
          await ReservationService.releaseTableForReservation(editing.id)
        } else if (editing.status === 'seated' && editing.table_id) {
          await updateTableStatus(editing.table_id, 'occupied')
        }
      }
      await loadReservations()
      setEditing(null)
      setOriginalEditing(null)
      alert('預約已更新')
    } catch (err) {
      console.error(err)
      alert('更新失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAction = async (res: Reservation, action: 'seat' | 'cancel' | 'no_show' | 'complete') => {
    try {
      setActionBusy(res.id + ':' + action)
      if (action === 'seat') {
        await ReservationService.updateReservationStatus(res.id, 'seated' as any)
        if (res.table_id) {
          await updateTableStatus(res.table_id, 'occupied')
        }
      } else if (action === 'cancel') {
        await ReservationService.updateReservationStatus(res.id, 'cancelled' as any)
        await ReservationService.releaseTableForReservation(res.id)
      } else if (action === 'no_show') {
        await ReservationService.updateReservationStatus(res.id, 'no_show' as any)
        await ReservationService.releaseTableForReservation(res.id)
      } else if (action === 'complete') {
        await ReservationService.updateReservationStatus(res.id, 'completed' as any)
      }
      await loadReservations()
    } catch (e) {
      console.error(e)
      alert('操作失敗，請稍後再試')
    } finally {
      setActionBusy(null)
    }
  }

  if (viewMode === 'reservation') {
    return (
      <div className="p-6">
        <ReservationForm 
          onSubmit={handleReservationSubmit}
          onCancel={() => setViewMode('list')}
          isLoading={loading}
        />
      </div>
    )
  }

  if (viewMode === 'walkin') {
    return (
      <div className="p-6">
        <WalkInRegistration 
          onSubmit={handleWalkInSubmit}
          onCancel={() => setViewMode('list')}
          isLoading={loading}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 返回按鈕 */}
      <div className="mb-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1)
            } else {
              navigate('/')
            }
          }}
          className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          aria-label="返回上一頁"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> 返回
        </button>
      </div>
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">預約管理系統</h1>
        <p className="text-gray-600">管理預約訂位、當日預約和現場顧客登記</p>
      </div>

      {/* 操作按鈕 */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setViewMode('reservation')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Calendar className="h-4 w-4 mr-2" />
          新增預約
        </button>
        <button
          onClick={() => setViewMode('walkin')}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {/* 預約列表 */}
          現場登記
        </button>
        <button
          onClick={() => navigate('/reservations/timeline')}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Clock className="h-4 w-4 mr-2" /> 時間軸
        </button>
        <button
          onClick={loadReservations}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          disabled={loading}
        >
          <Clock className="h-4 w-4 mr-2" />
          {loading ? '載入中...' : '重新載入'}
        </button>
      </div>

      {/* 日期選擇和過濾器 */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">查看日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">搜尋</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋姓名或電話..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">過濾</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              <option value="advance">預約</option>
              <option value="same_day">當日</option>
              <option value="walk_in">現場</option>
            </select>
          </div>
        </div>
        {/* 標籤過濾 */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          {['upcoming','arriving_now','late','ending_soon','overtime'].map(tag => {
            const active = tagFilters.includes(tag)
            return (
              <button
                key={tag}
                onClick={()=> setTagFilters(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag])}
                className={`px-2 py-1 text-xs rounded-full border transition ${active ? tagStyle(tag)+ ' ring-2 ring-offset-1' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}
              >
                {tagLabel(tag)}
              </button>
            )
          })}
          {tagFilters.length>0 && (
            <button onClick={()=> setTagFilters([])} className="text-xs text-blue-600 underline ml-1">清除標籤</button>
          )}
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { type: 'all', label: '總計', color: 'bg-gray-100' },
          { type: 'advance', label: '預約', color: 'bg-blue-100' },
          { type: 'same_day', label: '當日', color: 'bg-green-100' },
          { type: 'walk_in', label: '現場', color: 'bg-orange-100' }
        ].map(stat => {
          const count = stat.type === 'all' 
            ? reservations.length 
            : reservations.filter(r => 
                stat.type === 'walk_in' ? r.is_walk_in : r.reservation_type === stat.type
              ).length
          const guests = stat.type === 'all'
            ? reservations.reduce((sum, r) => sum + r.party_size, 0)
            : reservations.filter(r => 
                stat.type === 'walk_in' ? r.is_walk_in : r.reservation_type === stat.type
              ).reduce((sum, r) => sum + r.party_size, 0)
          
          return (
            <div key={stat.type} className={`${stat.color} p-4 rounded-lg`}>
              <h3 className="font-semibold text-gray-800">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600">{guests} 位客人</p>
            </div>
          )
        })}
      </div>

      {/* 預約列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate === new Date().toISOString().split('T')[0] ? '今日' : selectedDate} 預約列表
            <span className="ml-2 text-sm text-gray-500">
              ({filteredReservations.length} 筆記錄)
            </span>
          </h2>
        </div>
        
        <div className="divide-y">
          {filteredReservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暫無預約記錄</p>
            </div>
          ) : (
            filteredReservations.map((reservation: any) => {
              const reservationType = getReservationTypeLabel(reservation)
              const statusType = getStatusLabel(reservation.status)
              const reservationTime = new Date(reservation.reservation_time)
              const tags: string[] = reservation.tags || []
              
              return (
                <div key={reservation.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {reservation.customer_name}
                        </h3>
                        {reservation.customer_last_name && (
                          <span className="text-sm text-gray-600">
                            ({reservation.customer_last_name})
                          </span>
                        )}
                        {reservation.customer_gender && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {reservation.customer_gender === 'male' ? '👨' : 
                             reservation.customer_gender === 'female' ? '👩' : '👤'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {reservation.party_size} 人
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(reservationTime)}
                        </span>
                        <span className="hidden md:inline text-gray-500">{formatTimeRange(reservation)}</span>
                        <span className="text-gray-500">{getTableLabel(reservation.table_id)}</span>
                        {tags.map(tag => (
                          <span key={tag} className={`px-2 py-0.5 text-xs rounded-full border ${tagStyle(tag)}`}>{tagLabel(tag)}</span>
                        ))}
                        {reservation.customer_phone && (
                          <span>{reservation.customer_phone}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${reservationType.color}`}>
                        {reservationType.label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusType.color}`}>
                        {statusType.label}
                      </span>
                      <button
                        className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-100"
                        onClick={() => openEdit(reservation)}
                        aria-label="編輯預約"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
          {(reservation.seated_at) && (
            <div className="mt-2 text-xs text-gray-500">
              實際到店: {formatDateTime(new Date(reservation.seated_at))}
            </div>
          )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reservation.status === 'confirmed' && (
                      <>
                        <button
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          onClick={() => handleQuickAction(reservation, 'seat')}
                          disabled={actionBusy === reservation.id + ':seat'}
                        >
                          <UserCheck className="h-4 w-4 mr-1" /> 入座
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200 disabled:opacity-50"
                          onClick={() => handleQuickAction(reservation, 'no_show')}
                          disabled={actionBusy === reservation.id + ':no_show'}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" /> 未出現
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
                          onClick={() => handleQuickAction(reservation, 'cancel')}
                          disabled={actionBusy === reservation.id + ':cancel'}
                        >
                          <X className="h-4 w-4 mr-1" /> 取消
                        </button>
                      </>
                    )}
                    {reservation.status === 'seated' && (
                      <>
                        <button
                          className="inline-flex items-center px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                          onClick={() => handleQuickAction(reservation, 'complete')}
                          disabled={actionBusy === reservation.id + ':complete'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> 完成
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
                          onClick={() => handleQuickAction(reservation, 'cancel')}
                          disabled={actionBusy === reservation.id + ':cancel'}
                        >
                          <X className="h-4 w-4 mr-1" /> 取消
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 編輯預約 Modal（移到外層，任何時刻都能顯示） */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">編輯預約</h3>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  value={editing.customer_name}
                  onChange={(e) => setEditing({ ...editing, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                <input
                  value={editing.customer_phone || ''}
                  onChange={(e) => setEditing({ ...editing, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  value={editing.customer_email || ''}
                  onChange={(e) => setEditing({ ...editing, customer_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">人數</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={editing.party_size}
                  onChange={(e) => setEditing({ ...editing, party_size: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成人</label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={editing.adult_count || 0}
                  onChange={(e) => setEditing({ ...editing, adult_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">兒童</label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={editing.child_count || 0}
                  onChange={(e) => setEditing({ ...editing, child_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="childChair"
                  type="checkbox"
                  checked={!!editing.child_chair_needed}
                  onChange={(e) => setEditing({ ...editing, child_chair_needed: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="childChair" className="text-sm text-gray-700">需要兒童椅</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  value={new Date(editing.reservation_time).toISOString().split('T')[0]}
                  onChange={(e) => {
                    const d = e.target.value
                    const old = new Date(editing.reservation_time)
                    const hh = old.getHours().toString().padStart(2, '0')
                    const mm = old.getMinutes().toString().padStart(2, '0')
                    setEditing({ ...editing, reservation_time: new Date(`${d}T${hh}:${mm}:00`).toISOString() })
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                <input
                  type="time"
                  value={formatTime(new Date(editing.reservation_time))}
                  onChange={(e) => {
                    const t = e.target.value
                    const d = new Date(editing.reservation_time).toISOString().split('T')[0]
                    setEditing({ ...editing, reservation_time: new Date(`${d}T${t}:00`).toISOString() })
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">桌台</label>
                <select
                  value={editing.table_id || ''}
                  onChange={(e) => setEditing({ ...editing, table_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">未分配</option>
                  {tables?.filter((t: any) => t.status === 'available' || t.id === editing.table_id)
                    .map((t: any) => (
                      <option key={t.id} value={t.id}>桌號 {t.table_number}（容納 {t.capacity} 人）</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="confirmed">已確認</option>
                  <option value="seated">已入座</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                  <option value="no_show">未出現</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">特殊需求</label>
              <textarea
                rows={3}
                value={editing.special_requests || ''}
                onChange={(e) => setEditing({ ...editing, special_requests: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={saving}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" /> {saving ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
