import { useState, useEffect, useMemo } from 'react'
import usePOSStore from '../lib/store'
import { Table } from '../lib/types'
import { supabase } from '../lib/supabase'
import { ReservationService } from '../services/reservationService'
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '../lib/status'
import { useAppNavigation } from './withRouterNavigation'

interface TableManagementPageProps {
  onBack: () => void
}

interface Reservation {
  id: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  party_size: number
  reservation_time: string
  duration_minutes: number
  status: string
  special_requests?: string
  customer_notes?: string
  table_id?: string
}

export default function TableManagementPage({ onBack }: TableManagementPageProps) {
  const { goTo } = useAppNavigation()
  // 使用 selector 模式避免無限渲染
  const tables = usePOSStore(state => state.tables)
  const orders = usePOSStore(state => state.orders)
  const orderItems = usePOSStore(state => state.orderItems)
  const loading = usePOSStore(state => state.loading)
  const error = usePOSStore(state => state.error)
  const tablesLoaded = usePOSStore(state => state.tablesLoaded)
  const ordersLoaded = usePOSStore(state => state.ordersLoaded)
  const loadTables = usePOSStore(state => state.loadTables)
  const loadOrders = usePOSStore(state => state.loadOrders)
  const updateTableStatus = usePOSStore(state => state.updateTableStatus)
  const currentRestaurant = usePOSStore(state => state.currentRestaurant)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [walkInPartySize, setWalkInPartySize] = useState<number>(2)
  const [walkInName, setWalkInName] = useState<string>('')
  const [walkInNotes, setWalkInNotes] = useState<string>('')
  const [creatingWalkIn, setCreatingWalkIn] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])

  useEffect(() => {
    // 只在還沒載入過時才載入，避免無限循環
    if (!tablesLoaded) {
      loadTables()
    }
    if (!ordersLoaded) {
      loadOrders()
    }
    if (currentRestaurant?.id) {
      loadReservations()
    }
  }, [currentRestaurant?.id]) // 移除依賴項，避免無限循環

  // 載入預約資訊
  const loadReservations = async () => {
    if (!currentRestaurant?.id) return
    
    try {
      // 取得台北時區「今日」起訖 (轉為 UTC ISO) 只顯示今日訂位
      const getTodayTaipeiRange = () => {
        const tz = 'Asia/Taipei'
        const todayStr = new Date().toLocaleString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }) // YYYY-MM-DD
        const [y,m,d] = todayStr.split('-').map(Number)
        // 建立台北當地 00:00 與 次日 00:00
        const startLocal = new Date(`${todayStr}T00:00:00+08:00`)
        const endDate = new Date(Date.UTC(y, m-1, d))
        endDate.setUTCDate(endDate.getUTCDate()+1) // 次日 (UTC 基準)
        const endLocal = new Date(`${endDate.toLocaleString('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'})}T00:00:00+08:00`)
        return { startISO: startLocal.toISOString(), endISO: endLocal.toISOString(), dateLabel: todayStr }
      }
      const { startISO, endISO } = getTodayTaipeiRange()
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .in('status', ['confirmed', 'seated']) // 包含已入座的預約
        .gte('reservation_time', startISO)
        .lt('reservation_time', endISO)
        .order('reservation_time', { ascending: true })

      if (error) {
        console.error('載入預約資訊失敗:', error)
      } else {
        setReservations(data || [])
        // 除錯：印出筆數與第一筆時間
        if (data && data.length) {
          console.log('📅 今日預約筆數:', data.length, '第一筆時間(UTC):', data[0].reservation_time)
        } else {
          console.log('📅 今日無預約資料 (range)', startISO, '→', endISO)
        }
      }
    } catch (error) {
      console.error('載入預約資訊異常:', error)
    }
  }

  // 過濾桌台
  const filteredTables = tables.filter(table => {
    if (statusFilter === 'all') return true
    return table.status === statusFilter
  })

  // 取得桌台相關的所有未結帳訂單
  const getTableOrders = (tableNumber: string | number) => {
    const tableNumberStr = String(tableNumber)
    return orders.filter(order => 
      String(order.table_number) === tableNumberStr && 
      ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status || '')
    ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
  }

  // 取得桌台的預約資訊（包含已入座的預約）
  const getTableReservation = (tableId: string) => {
    return reservations.find(reservation => 
      reservation.table_id === tableId && 
      ['confirmed', 'seated'].includes(reservation.status)
    )
  }

  // 取得訂單的項目
  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId)
  }

  // 統一訂單狀態 key 轉換，避免 TS 索引錯誤
  const normalizeOrderStatus = (status: any): keyof typeof ORDER_STATUS_COLOR => {
    const allowed: Array<keyof typeof ORDER_STATUS_COLOR> = ['pending','confirmed','preparing','ready','served','completed','cancelled'] as any
    return allowed.includes(status) ? status : 'pending'
  }

  // ===== 新增：複合狀態計算邏輯 =====
  const ACTIVE_ORDER_STATUS = useMemo(() => new Set(['pending', 'confirmed', 'preparing', 'ready', 'served']), [])

  const withinTwoHours = (iso: string) => {
    const now = Date.now()
    const t = new Date(iso).getTime()
    if (t < now) return false
    const diffMin = (t - now) / 60000
    return diffMin <= 120
  }

  const computeCompositeStatus = (table: Table) => {
    const tableOrders = getTableOrders(table.table_number || '')
    const hasActiveOrders = tableOrders.some(o => ACTIVE_ORDER_STATUS.has(o.status || ''))
    if (hasActiveOrders) {
      return { display: 'occupied', hasActiveOrders, upcomingReservation: null, canWalkIn: false }
    }
    // 找最近且未入座的 confirmed 預約
    const tableResList = reservations.filter(r => r.table_id === table.id && r.status === 'confirmed')
    const upcoming = tableResList
      .filter(r => withinTwoHours(r.reservation_time))
      .sort((a,b) => new Date(a.reservation_time).getTime() - new Date(b.reservation_time).getTime())[0] || null
    if (upcoming) {
      return { display: 'reserved', hasActiveOrders: false, upcomingReservation: upcoming, canWalkIn: false }
    }
    if (table.status === 'cleaning') return { display: 'cleaning', hasActiveOrders: false, upcomingReservation: null, canWalkIn: false }
    if (table.status === 'maintenance') return { display: 'maintenance', hasActiveOrders: false, upcomingReservation: null, canWalkIn: false }
    return { display: 'available', hasActiveOrders: false, upcomingReservation: null, canWalkIn: true }
  }

  // 顏色 / 文字 / 圖示映射基於 display
  const getStatusColor = (display: string) => {
    switch (display) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200'
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'maintenance': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  const getStatusText = (display: string) => {
    switch (display) {
      case 'available': return '可用'
      case 'occupied': return '佔用中'
      case 'reserved': return '已預約'
      case 'cleaning': return '清潔中'
      case 'maintenance': return '維護中'
      default: return '未知'
    }
  }
  const getStatusIcon = (display: string) => {
    switch (display) {
      case 'available': return '✅'
      case 'occupied': return '👥'
      case 'reserved': return '📅'
      case 'cleaning': return '🧹'
      case 'maintenance': return '🔧'
      default: return '❓'
    }
  }

  // 開啟狀態變更模態框
  const openStatusModal = (table: Table) => {
    setSelectedTable(table)
    setShowStatusModal(true)
  }

  // 關閉狀態變更模態框
  const closeStatusModal = () => {
    setSelectedTable(null)
    setShowStatusModal(false)
  }

  const openWalkInModal = (table: Table) => {
    setSelectedTable(table)
    setWalkInPartySize(table.capacity || 2)
    setShowWalkInModal(true)
  }
  const closeWalkInModal = () => {
    setShowWalkInModal(false)
    setWalkInPartySize(2)
    setWalkInName('')
    setWalkInNotes('')
  }

  const handleCreateWalkIn = async () => {
    if (!currentRestaurant?.id || !selectedTable) return
    try {
      setCreatingWalkIn(true)
      const reservation = await ReservationService.createWalkInReservation({
        restaurantId: currentRestaurant.id,
        tableId: selectedTable.id!,
        partySize: walkInPartySize,
        customerName: walkInName,
        notes: walkInNotes
      })
      // 重新載入資料
      await Promise.all([
        loadTables(),
        loadReservations()
      ])
      closeWalkInModal()
      // 開啟預約詳情，方便直接開始點餐
      openReservationModal(reservation as any)
      console.log('✅ 現場帶位建立', reservation.id)
    } catch (e:any) {
      alert('建立現場帶位失敗:' + e.message)
    } finally {
      setCreatingWalkIn(false)
    }
  }

  // 變更桌台狀態
  const changeTableStatus = async (newStatus: string) => {
    if (!selectedTable) return

    try {
      const metadata: any = {}
      
      // 根據新狀態設定相關資訊
      switch (newStatus) {
        case 'available':
          // 清空所有相關資訊
          metadata.sessionId = null
          break
        case 'cleaning':
          // 清潔狀態不需要額外 metadata，資料庫欄位會自動處理
          break
        case 'maintenance':
          // 維護狀態不需要額外 metadata，資料庫欄位會自動處理
          break
        case 'reserved':
          // 預約狀態不需要額外 metadata，資料庫欄位會自動處理
          break
        case 'occupied':
          // 可以設定 session ID 如果有的話
          if (metadata.sessionId) {
            metadata.sessionId = metadata.sessionId
          }
          break
      }

      await updateTableStatus(selectedTable.id, newStatus as Table['status'], metadata)
      closeStatusModal()
      
      console.log(`🪑 桌台 ${selectedTable.table_number} 狀態已更新為: ${getStatusText(newStatus)}`)
    } catch (error) {
      console.error('❌ 更新桌台狀態失敗:', error)
      // 錯誤已經在 store 中處理，這裡不需要額外處理
    }
  }

  // 開啟訂單詳情模態框
  const openOrderModal = (order: any) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  // 打開預約詳情模態
  const openReservationModal = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowReservationModal(true)
  }

  // 處理預約操作
  const handleReservationAction = async (action: 'seated' | 'cancelled' | 'no_show') => {
    if (!selectedReservation) return

    try {
      // 1) 統一走 Service 更新狀態
      await ReservationService.updateReservationStatus(selectedReservation.id, action as any)
      // 2) 桌台狀態同步
      if (action === 'seated' && selectedReservation.table_id) {
        await updateTableStatus(selectedReservation.table_id, 'occupied')
      }
      if ((action === 'cancelled' || action === 'no_show')) {
        await ReservationService.releaseTableForReservation(selectedReservation.id)
      }

      // 重新載入資料
      await Promise.all([
        loadTables(),
        loadReservations()
      ])

      // 更新當前選中的預約資訊
      setSelectedReservation(prev => prev ? { ...prev, status: action } : null)

      const actionText = action === 'seated' ? '入座' : action === 'cancelled' ? '取消' : '標記未出現'
      console.log(`✅ 預約已${actionText}`)
      
    } catch (error) {
      console.error('預約操作失敗:', error)
      alert('操作失敗，請稍後再試')
    }
  }

  // 開始點餐功能
  const handleStartOrdering = () => {
    if (!selectedReservation) return

    // 找到對應的桌台
    const table = tables.find(t => t.id === selectedReservation.table_id)
    if (!table) {
      alert('找不到對應的桌台')
      return
    }

    // 設定點餐資訊到全域狀態
    const orderingInfo = {
      tableNumber: String(table.table_number),
      tableName: table.name || `桌台 ${table.table_number}`,
      partySize: selectedReservation.party_size,
      customerName: selectedReservation.customer_name,
      reservationId: selectedReservation.id
    }

    // 儲存到 store
    usePOSStore.setState({
      selectedTable: table.id,
      orderingInfo
    })

    // 關閉模態並導航到點餐頁面 (v2 使用 /ordering + query 讓 OrderingLayout 自動讀取桌號資訊)
    setShowReservationModal(false)
    
    // 這裡可以觸發導航到點餐頁面
    console.log('🍽️ 開始點餐:', orderingInfo)
    alert(`開始為${selectedReservation.customer_name}(${selectedReservation.party_size}人)在桌台${table.table_number}點餐`)
    // 自動導向到新版點餐頁，帶上 query 參數供 OrderingLayout 取用
    const qs = new URLSearchParams({
      table: String(table.table_number),
      party: String(selectedReservation.party_size || ''),
      name: selectedReservation.customer_name || ''
    })
    goTo(`/ordering?${qs.toString()}`)
  }

  // 關閉訂單詳情模態框
  const closeOrderModal = () => {
    setSelectedOrder(null)
    setShowOrderModal(false)
  }

  // 統計資訊
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
    maintenance: tables.filter(t => t.status === 'maintenance').length
  }

  return (
    <div className="min-h-screen bg-ui-secondary">
      {/* 頂部導航 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左側：返回按鈕和標題 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-ui-muted hover:text-ui-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>返回</span>
              </button>
              <h1 className="text-2xl font-bold text-ui-primary">🪑 桌台管理</h1>
            </div>

            {/* 右側：重新整理按鈕 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // 強制重新載入
                  usePOSStore.setState({ tablesLoaded: false, ordersLoaded: false })
                  loadTables()
                  loadOrders()
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重新整理</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">載入錯誤：{error}</span>
            </div>
          </div>
        )}
        {/* 統計卡片 - 可點擊篩選 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg p-4 shadow-sm border border-ui transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'all'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-ui-primary hover:bg-ui-secondary'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">總桌數</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('available')}
            className={`bg-green-50 rounded-lg p-4 shadow-sm border border-green-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'available'
                ? 'ring-2 ring-green-300 bg-green-100'
                : 'hover:bg-green-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">{stats.available}</div>
              <div className="text-sm text-green-600">可用</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('occupied')}
            className={`bg-red-50 rounded-lg p-4 shadow-sm border border-red-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'occupied'
                ? 'ring-2 ring-red-300 bg-red-100'
                : 'hover:bg-red-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">{stats.occupied}</div>
              <div className="text-sm text-red-600">佔用中</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('reserved')}
            className={`bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'reserved'
                ? 'ring-2 ring-blue-300 bg-blue-100'
                : 'hover:bg-blue-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800">{stats.reserved}</div>
              <div className="text-sm text-blue-600">已預約</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('cleaning')}
            className={`bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'cleaning'
                ? 'ring-2 ring-yellow-300 bg-yellow-100'
                : 'hover:bg-yellow-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-800">{stats.cleaning}</div>
              <div className="text-sm text-yellow-600">清潔中</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('maintenance')}
            className={`bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'maintenance'
                ? 'ring-2 ring-gray-300 bg-gray-100'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.maintenance}</div>
              <div className="text-sm text-gray-600">維護中</div>
            </div>
          </button>
        </div>

        {/* 桌台列表 */}
        <div className="bg-ui-primary rounded-lg shadow-sm border border-ui p-4">
          <h3 className="text-lg font-semibold mb-4 text-ui-primary">桌台列表</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">載入桌台資訊中...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">沒有符合條件的桌台</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTables.map(table => {
                const tableOrders = getTableOrders(table.table_number || '')
                const composite = computeCompositeStatus(table)
                const display = composite.display
                const tableReservation = getTableReservation(table.id!) // 仍保留原顯示邏輯
                const disabledWalkInReason = !composite.canWalkIn ? (composite.hasActiveOrders ? '有未結帳訂單' : composite.upcomingReservation ? '2小時內有預約' : (display==='cleaning'?'清潔中': display==='maintenance'?'維護中':'')) : ''
                return (
                  <div
                    key={table.id}
                    className={`border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${getStatusColor(display)}`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{getStatusIcon(display)}</div>
                      <div className="font-bold text-lg text-gray-900 mb-1">桌號 {table.table_number}</div>
                      {table.name && <div className="text-sm text-gray-600 mb-2">({table.name})</div>}
                      <div className="text-sm text-gray-700 mb-3">{table.capacity} 人座</div>
                      <div className={`inline-block text-xs px-3 py-1 rounded-full font-semibold mb-3 border ${getStatusColor(display)}`}>{getStatusText(display)}</div>
                      {composite.upcomingReservation && display==='reserved' && (
                        <div className="text-xs text-blue-700 mb-2">即將預約 {new Date(composite.upcomingReservation.reservation_time).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})} · {composite.upcomingReservation.party_size}人</div>
                      )}
                      {/* 預約資訊 */}
                      {tableReservation && (
                        <div className="space-y-2 mb-3">
                          <div className="text-xs font-semibold text-blue-800 mb-2">📅 預約資訊</div>
                          <button onClick={() => openReservationModal(tableReservation)} className={`w-full rounded-lg p-2 text-left transition-all duration-200 hover:shadow-md border ${tableReservation.status==='seated'?'bg-green-50 hover:bg-green-100 border-green-200':'bg-blue-50 hover:bg-blue-100 border-blue-200'}`}>
                            <div className={`text-xs font-semibold mb-1 ${tableReservation.status==='seated'?'text-green-800':'text-blue-800'}`}>👤 {tableReservation.customer_name}</div>
                            <div className={`text-xs mb-1 ${tableReservation.status==='seated'?'text-green-600':'text-blue-600'}`}>{tableReservation.party_size} 人 · {tableReservation.status==='confirmed'?'已確認':'已入座'}</div>
                            <div className={`text-xs ${tableReservation.status==='seated'?'text-green-500':'text-blue-500'}`}>{new Date(tableReservation.reservation_time).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                            {tableReservation.special_requests && <div className={`text-xs mt-1 truncate ${tableReservation.status==='seated'?'text-green-400':'text-blue-400'}`}>備註: {tableReservation.special_requests}</div>}
                          </button>
                          <div className={`text-xs font-medium text-center pt-1 ${tableReservation.status==='seated'?'text-green-600':'text-blue-600'}`}>👆 點擊查看預約詳情</div>
                        </div>
                      )}
                      {/* 訂單資訊 */}
                      {tableOrders.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <div className="text-xs font-semibold text-gray-800 mb-2">📋 未結帳訂單 ({tableOrders.length})</div>
                          {tableOrders.map((order,index)=>(
                            <button key={order.id} onClick={()=>openOrderModal(order)} className="w-full bg-white bg-opacity-70 hover:bg-opacity-90 rounded-lg p-2 text-left transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200">
                              <div className="text-xs font-semibold text-gray-800 mb-1">{index===0?'🍽️':'➕'} {order.order_number}</div>
                              <div className="text-xs text-gray-600 flex items-center gap-2">
                                <span>NT$ {(order.total_amount || 0).toLocaleString()}</span>
                                {(() => { const s = normalizeOrderStatus(order.status); return (
                                  <span className={`px-2 py-0.5 rounded-full border ${ORDER_STATUS_COLOR[s]}`}>{ORDER_STATUS_LABEL[s]}</span>
                                ) })()}
                              </div>
                              <div className="text-xs text-gray-500">{new Date(order.created_at || '').toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}</div>
                            </button>
                          ))}
                          <div className="text-xs text-blue-600 font-medium text-center pt-1">👆 點擊訂單查看詳情</div>
                        </div>
                      )}
                      <button onClick={()=>openStatusModal(table)} className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg">變更狀態</button>
                      {composite.canWalkIn && (
                        <button onClick={()=>openWalkInModal(table)} className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg">⚡ 現場帶位</button>
                      )}
                      {!composite.canWalkIn && display==='available' && disabledWalkInReason && (
                        <div className="mt-2 text-[10px] text-red-600">⚠ 無法現場帶位：{disabledWalkInReason}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 狀態變更模態框 */}
      {showStatusModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ui-primary rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">變更桌台狀態</h3>
                <p className="text-gray-600 mt-1">桌號 {selectedTable.table_number}</p>
              </div>
              <button
                onClick={closeStatusModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => changeTableStatus('available')}
                className="w-full p-4 text-left rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-semibold text-green-800">設為可用</div>
                    <div className="text-sm text-green-600">桌台準備就緒，可接受新客人</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('occupied')}
                className="w-full p-4 text-left rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className="font-semibold text-red-800">設為佔用</div>
                    <div className="text-sm text-red-600">客人正在使用中</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('reserved')}
                className="w-full p-4 text-left rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="font-semibold text-blue-800">設為預約</div>
                    <div className="text-sm text-blue-600">桌台已被預約</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('cleaning')}
                className="w-full p-4 text-left rounded-lg border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🧹</span>
                  <div>
                    <div className="font-semibold text-yellow-800">設為清潔中</div>
                    <div className="text-sm text-yellow-600">正在清理桌台</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('maintenance')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔧</span>
                  <div>
                    <div className="font-semibold text-gray-800">設為維護中</div>
                    <div className="text-sm text-gray-600">桌台需要維修</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 現場帶位模態框 */}
      {showWalkInModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">⚡ 現場帶位</h3>
              <button onClick={closeWalkInModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">桌號 {selectedTable.table_number} · 容量 {selectedTable.capacity} 人</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用餐人數</label>
                <input type="number" min={1} max={selectedTable.capacity || 20} value={walkInPartySize} onChange={e=>setWalkInPartySize(Math.min(Number(e.target.value)||1, selectedTable.capacity||20))} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客戶姓名 (可選)</label>
                <input type="text" value={walkInName} onChange={e=>setWalkInName(e.target.value)} placeholder="例如：王先生" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註 (可選)</label>
                <textarea value={walkInNotes} onChange={e=>setWalkInNotes(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="特殊需求或備註"></textarea>
              </div>
              <div className="pt-2 space-y-2">
                <button disabled={creatingWalkIn} onClick={handleCreateWalkIn} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {creatingWalkIn ? '建立中...' : '✅ 確認帶位'}
                </button>
                <button onClick={closeWalkInModal} className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 訂單詳情模態框 */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ui-primary rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">訂單詳情</h3>
                <p className="text-gray-600 mt-1">{selectedOrder.order_number}</p>
              </div>
              <button
                onClick={closeOrderModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 訂單基本資訊 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">桌號</div>
                  <div className="font-semibold">{selectedOrder.table_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">訂單狀態</div>
                  <div className="font-semibold">{selectedOrder.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">客人數量</div>
                  <div className="font-semibold">{selectedOrder.customer_count || 1} 人</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">下單時間</div>
                  <div className="font-semibold">
                    {selectedOrder.created_at 
                      ? new Date(selectedOrder.created_at).toLocaleString('zh-TW')
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* 客戶資訊 */}
            {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">客戶資訊</h4>
                <div className="space-y-2">
                  {selectedOrder.customer_name && (
                    <div>
                      <span className="text-sm text-gray-600">姓名：</span>
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                  )}
                  {selectedOrder.customer_phone && (
                    <div>
                      <span className="text-sm text-gray-600">電話：</span>
                      <span className="font-medium">{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 訂單項目 */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">訂單項目</h4>
              <div className="space-y-3">
                {getOrderItems(selectedOrder.id).length > 0 ? (
                  getOrderItems(selectedOrder.id).map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-600">NT$ {item.unit_price.toLocaleString()}</div>
                          {item.special_instructions && (
                            <div className="text-xs text-blue-600 mt-1">備註：{item.special_instructions}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">x{item.quantity}</div>
                          <div className="text-sm text-gray-600">NT$ {item.total_price.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    暫無訂單項目資料
                  </div>
                )}
              </div>
            </div>

            {/* 金額總計 */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">金額明細</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">小計</span>
                  <span>NT$ {(selectedOrder.subtotal || 605).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">稅額</span>
                  <span>NT$ {(selectedOrder.tax_amount || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>總計</span>
                  <span className="text-green-600">
                    NT$ {(selectedOrder.total_amount || 666).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 備註 */}
            {selectedOrder.notes && (
              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">訂單備註</h4>
                <p className="text-gray-700">{selectedOrder.notes}</p>
              </div>
            )}

            {/* 關閉按鈕 */}
            <button
              onClick={closeOrderModal}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 預約詳情模態框 */}
      {showReservationModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📅 預約詳情</h3>
            
            {/* 客戶資訊 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">客戶資訊</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-blue-700 w-20">姓名:</span>
                  <span className="font-medium">{selectedReservation.customer_name}</span>
                </div>
                {selectedReservation.customer_phone && (
                  <div className="flex items-center">
                    <span className="text-sm text-blue-700 w-20">電話:</span>
                    <span>{selectedReservation.customer_phone}</span>
                  </div>
                )}
                {selectedReservation.customer_email && (
                  <div className="flex items-center">
                    <span className="text-sm text-blue-700 w-20">信箱:</span>
                    <span>{selectedReservation.customer_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 預約資訊 */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-900 mb-3">預約資訊</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-green-700 w-24">預約時間:</span>
                  <span className="font-medium">
                    {new Date(selectedReservation.reservation_time).toLocaleString('zh-TW', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      weekday: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-green-700 w-24">用餐人數:</span>
                  <span className="font-medium">{selectedReservation.party_size} 人</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-green-700 w-24">用餐時長:</span>
                  <span>{selectedReservation.duration_minutes} 分鐘</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-green-700 w-24">預約狀態:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedReservation.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedReservation.status === 'seated'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedReservation.status === 'confirmed' ? '已確認' : 
                     selectedReservation.status === 'seated' ? '已入座' : selectedReservation.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 特殊需求 */}
            {selectedReservation.special_requests && (
              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-900 mb-2">特殊需求</h4>
                <p className="text-yellow-800">{selectedReservation.special_requests}</p>
              </div>
            )}

            {/* 額外備註 */}
            {selectedReservation.customer_notes && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">備註資訊</h4>
                <p className="text-gray-700">{selectedReservation.customer_notes}</p>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="space-y-3">
              {selectedReservation.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => handleReservationAction('seated')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    ✅ 已入座
                  </button>
                  <button
                    onClick={() => handleReservationAction('no_show')}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    ❌ 未出現
                  </button>
                </>
              )}
              
              {['confirmed', 'seated'].includes(selectedReservation.status) && (
                <button
                  onClick={() => handleReservationAction('cancelled')}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  🚫 取消預約
                </button>
              )}
              
              {selectedReservation.status === 'seated' && (
                <button
                  onClick={() => handleStartOrdering()}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  🍽️ 開始點餐
                </button>
              )}
            </div>

            {/* 關閉按鈕 */}
            <button
              onClick={() => setShowReservationModal(false)}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold mt-4"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
