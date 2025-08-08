import React, { useState, useEffect } from 'react'
import { Calendar, Users, Clock, UserCheck, Plus, Search, Filter } from 'lucide-react'
import ReservationForm from '../components/ReservationForm'
import WalkInRegistration from '../components/WalkInRegistration'
import useStore from '../lib/store'
import { supabase } from '../lib/supabase'

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
  arrival_time?: string
  table_id?: string
}

type ViewMode = 'list' | 'reservation' | 'walkin'
type FilterType = 'all' | 'advance' | 'same_day' | 'walk_in'

export default function EnhancedReservationPage() {
  const { currentRestaurant } = useStore()
  
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadReservations()
  }, [currentRestaurant?.id, selectedDate])

  const loadReservations = async () => {
    if (!currentRestaurant?.id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .gte('reservation_time', selectedDate + 'T00:00:00')
        .lt('reservation_time', selectedDate + 'T23:59:59')
        .order('reservation_time', { ascending: true })

      if (!error && data) {
        setReservations(data)
      } else {
        console.error('載入預約失敗:', error)
      }
    } catch (error) {
      console.error('載入預約異常:', error)
    } finally {
      setLoading(false)
    }
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
        arrival_time: new Date().toISOString(),
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

  const filteredReservations = reservations.filter(reservation => {
    // 搜尋過濾
    const matchesSearch = !searchTerm || 
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.customer_last_name && reservation.customer_last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reservation.customer_phone && reservation.customer_phone.includes(searchTerm))

    // 類型過濾
    const matchesFilter = filterType === 'all' || 
      (filterType === 'walk_in' && reservation.is_walk_in) ||
      (filterType !== 'walk_in' && reservation.reservation_type === filterType)

    return matchesSearch && matchesFilter
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
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' }
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
          <UserCheck className="h-4 w-4 mr-2" />
          現場登記
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
            filteredReservations.map(reservation => {
              const reservationType = getReservationTypeLabel(reservation)
              const statusType = getStatusLabel(reservation.status)
              const reservationTime = new Date(reservation.reservation_time)
              
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
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {reservation.party_size} 人
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {reservationTime.toLocaleTimeString('zh-TW', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false
                          })}
                        </span>
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
                    </div>
                  </div>
                  
                  {reservation.arrival_time && (
                    <div className="mt-2 text-xs text-gray-500">
                      實際到店: {new Date(reservation.arrival_time).toLocaleString('zh-TW')}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
