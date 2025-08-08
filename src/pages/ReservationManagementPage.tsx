import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Phone, Mail, Baby, Plus, Filter, RefreshCw } from 'lucide-react'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 標題與新增按鈕 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="返回主頁"
                >
                  ←
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">預約管理</h1>
                <p className="text-gray-600 mt-2">管理餐廳預約訂位</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadReservations}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重新整理
            </button>
            
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新增預約
            </button>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">篩選：</span>
            </div>
            
            <div className="flex gap-2">
              {['pending', 'confirmed', 'seated', 'completed'].map(status => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => {
                      const newStatus = e.target.checked
                        ? [...(filters.status || []), status]
                        : (filters.status || []).filter(s => s !== status)
                      setFilters(prev => ({ ...prev, status: newStatus }))
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    {getStatusBadge(status)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 預約列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">載入中...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">目前沒有預約資料</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                建立第一個預約
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客戶資訊
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      預約時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      人數詳情
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((reservation) => {
                    const { date, time } = formatDateTime(reservation.reservation_time)
                    const childInfo = parseChildInfo(reservation.customer_notes)
                    
                    return (
                      <tr key={reservation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">
                                {reservation.customer_name}
                              </div>
                            </div>
                            <div className="flex items-center mt-1">
                              <Phone className="h-3 w-3 text-gray-400 mr-2" />
                              <div className="text-xs text-gray-500">
                                {reservation.customer_phone}
                              </div>
                            </div>
                            {reservation.customer_email && (
                              <div className="flex items-center mt-1">
                                <Mail className="h-3 w-3 text-gray-400 mr-2" />
                                <div className="text-xs text-gray-500">
                                  {reservation.customer_email}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">{date}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {time}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            總計 {reservation.party_size} 人
                          </div>
                          <div className="text-xs text-gray-500">
                            {childInfo.adult_count > 0 && `${childInfo.adult_count} 大人`}
                            {childInfo.child_count > 0 && ` ${childInfo.child_count} 小孩`}
                            {childInfo.child_chair_needed && (
                              <div className="flex items-center mt-1">
                                <Baby className="h-3 w-3 text-blue-500 mr-1" />
                                <span className="text-blue-600">需要兒童椅</span>
                              </div>
                            )}
                          </div>
                          {reservation.special_requests && (
                            <div className="text-xs text-gray-500 mt-1">
                              備註: {reservation.special_requests}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(reservation.status)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {reservation.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(reservation.id!, 'confirmed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              確認
                            </button>
                          )}
                          
                          {reservation.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(reservation.id!, 'seated')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              入座
                            </button>
                          )}
                          
                          {reservation.status === 'seated' && (
                            <button
                              onClick={() => handleStatusChange(reservation.id!, 'completed')}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              完成
                            </button>
                          )}
                          
                          {['pending', 'confirmed'].includes(reservation.status) && (
                            <button
                              onClick={() => handleStatusChange(reservation.id!, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                            >
                              取消
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* 統計資訊 */}
        {reservations.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">統計資訊</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['pending', 'confirmed', 'seated', 'completed'].map(status => {
                const count = reservations.filter(r => r.status === status).length
                const totalGuests = reservations
                  .filter(r => r.status === status)
                  .reduce((sum, r) => sum + r.party_size, 0)
                
                return (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-500">
                      {getStatusBadge(status)}
                    </div>
                    <div className="text-xs text-gray-400">
                      共 {totalGuests} 位客人
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
