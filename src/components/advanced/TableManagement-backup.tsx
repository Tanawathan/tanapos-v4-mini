import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { offlineManager } from '../../lib/offline-manager'
import FloorLayoutEditor from './FloorLayoutEditor'

// 擴展桌位狀態定義
export type TableStatus = 
  | 'available'     // 綠色：空閒
  | 'seated'        // 黃色：已入座
  | 'reserved'      // 藍色：已預訂  
  | 'ordered'       // 紫色：用餐中
  | 'waiting_food'  // 橘色：等待上菜
  | 'needs_service' // 紅色：需要服務
  | 'cleaning'      // 灰色：清潔中
  | 'out_of_order'  // 暗灰：停用

// 計時器系統
interface TableTimer {
  id: string
  table_id: string
  timer_type: 'seating' | 'ordering' | 'reservation'
  started_at: string
  ended_at?: string
  duration_minutes?: number
  is_active: boolean
}

// 計時器 Hook
const useTableTimers = () => {
  const [timers, setTimers] = useState<Record<string, TableTimer>>({})

  // 計算實時時間差
  const getTimerDisplay = (startTime: string): string => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`
    }
    return `${minutes}分`
  }

  // 啟動計時器
  const startTimer = (tableId: string, timerType: TableTimer['timer_type']) => {
    const timer: TableTimer = {
      id: `timer_${tableId}_${Date.now()}`,
      table_id: tableId,
      timer_type: timerType,
      started_at: new Date().toISOString(),
      is_active: true
    }
    setTimers(prev => ({ ...prev, [tableId]: timer }))
  }

  // 停止計時器
  const stopTimer = (tableId: string) => {
    setTimers(prev => {
      const timer = prev[tableId]
      if (timer) {
        const endTime = new Date().toISOString()
        const duration = Math.floor((new Date(endTime).getTime() - new Date(timer.started_at).getTime()) / (1000 * 60))
        return {
          ...prev,
          [tableId]: {
            ...timer,
            ended_at: endTime,
            duration_minutes: duration,
            is_active: false
          }
        }
      }
      return prev
    })
  }

  return { timers, getTimerDisplay, startTimer, stopTimer }
}

// 桌位類型
interface Table {
  id: string
  table_number: number
  capacity: number
  status: TableStatus
  current_order_id?: string
  reserved_by?: string
  reserved_at?: string
  reserved_until?: string
  notes?: string
  last_cleaned?: string
}

// 預約類型
interface Reservation {
  id: string
  table_id: string
  customer_name: string
  customer_phone: string
  party_size: number
  reservation_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'no_show'
  notes?: string
  created_at: string
}

// 桌位使用記錄
interface TableSession {
  id: string
  table_id: string
  started_at: string
  ended_at?: string
  duration_minutes?: number
  customer_count: number
  total_revenue: number
}

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tableStats, setTableStats] = useState<any>({})
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showLayoutEditor, setShowLayoutEditor] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'layout'>('grid')
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  // 使用計時器功能
  const { timers, getTimerDisplay, startTimer, stopTimer } = useTableTimers()

  // 載入桌位資料（支援離線模式）
  const loadTables = async () => {
    try {
      setLoading(true)
      setError(null)

      // 檢查網路連線狀態
      const isOnline = offlineManager.getNetworkStatus()
      
      if (!isOnline) {
        console.log('📴 網路離線，使用本地示範資料')
        const offlineData = offlineManager.getOfflineTableData()
        setTables(offlineData)
        setIsOfflineMode(true)
        setLoading(false)
        return
      }

      // 嘗試連接 Supabase API
      const apiConnected = await offlineManager.checkAPIConnection(
        'https://peubpisofenlyquqnpan.supabase.co/rest/v1/'
      )

      if (!apiConnected) {
        console.log('🔌 API 連線失敗，使用離線模式')
        const offlineData = offlineManager.getOfflineTableData()
        setTables(offlineData)
        setIsOfflineMode(true)
        setLoading(false)
        return
      }

      // 嘗試載入線上資料（使用重試機制）
      const result = await offlineManager.retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('tables')
          .select(`
            *,
            orders (
              id,
              order_number,
              total_amount,
              status,
              created_at
            )
          `)
          .order('table_number')

        if (error) throw error
        return data
      }, '載入桌位資料')

      if (result) {
        const formattedTables = result.map(table => ({
          ...table,
          current_order_id: table.orders?.find((o: any) => 
            ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
          )?.id
        }))

        setTables(formattedTables)
        setIsOfflineMode(false)
        
        // 保存到本地存儲以備離線使用
        offlineManager.saveToLocalStorage('tables_cache', formattedTables)
      } else {
        // 如果線上載入失敗，嘗試從本地存儲載入
        const cachedData = offlineManager.getFromLocalStorage('tables_cache')
        if (cachedData) {
          console.log('📦 使用快取資料')
          setTables(cachedData)
          setIsOfflineMode(true)
        } else {
          console.log('📴 使用離線示範資料')
          const offlineData = offlineManager.getOfflineTableData()
          setTables(offlineData)
          setIsOfflineMode(true)
        }
      }
    } catch (err) {
      console.error('載入桌位失敗:', err)
      
      // 發生錯誤時使用離線資料
      const cachedData = offlineManager.getFromLocalStorage('tables_cache')
      if (cachedData) {
        setTables(cachedData)
        setIsOfflineMode(true)
        setError('使用快取資料（網路連線異常）')
      } else {
        const offlineData = offlineManager.getOfflineTableData()
        setTables(offlineData)
        setIsOfflineMode(true)
        setError('網路連線異常，使用離線示範資料')
      }
    } finally {
      setLoading(false)
    }
  }

  // 載入預約資料（支援離線模式）
  const loadReservations = async () => {
    try {
      if (isOfflineMode) {
        const offlineReservations = offlineManager.getOfflineReservationData()
        setReservations(offlineReservations)
        return
      }

      const result = await offlineManager.retryWithBackoff(async () => {
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            tables (table_number, capacity)
          `)
          .gte('reservation_time', `${today}T00:00:00`)
          .order('reservation_time')

        if (error) throw error
        return data
      }, '載入預約資料')

      if (result) {
        setReservations(result)
        offlineManager.saveToLocalStorage('reservations_cache', result)
      } else {
        // 使用快取或離線資料
        const cachedData = offlineManager.getFromLocalStorage('reservations_cache')
        setReservations(cachedData || offlineManager.getOfflineReservationData())
      }
    } catch (err) {
      console.error('載入預約失敗:', err)
      const cachedData = offlineManager.getFromLocalStorage('reservations_cache')
      setReservations(cachedData || offlineManager.getOfflineReservationData())
    }
  }

  // 載入桌位統計
  const loadTableStats = async () => {
    try {
      // 今日桌位使用統計
      const today = new Date().toISOString().split('T')[0]
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('table_sessions')
        .select('*')
        .gte('started_at', `${today}T00:00:00`)

      if (sessionsError) throw sessionsError

      // 計算週轉率和使用率
      const stats: any = {}
      tables.forEach(table => {
        const tableSessions = sessionsData?.filter(s => s.table_id === table.id) || []
        const totalRevenue = tableSessions.reduce((sum, s) => sum + (s.total_revenue || 0), 0)
        const avgDuration = tableSessions.length > 0 
          ? tableSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / tableSessions.length
          : 0

        stats[table.id] = {
          sessionsToday: tableSessions.length,
          totalRevenue,
          avgDuration: Math.round(avgDuration),
          utilizationRate: Math.round((tableSessions.length * avgDuration) / (24 * 60) * 100)
        }
      })

      setTableStats(stats)
    } catch (err) {
      console.error('載入統計失敗:', err)
    }
  }

  // 更新桌位狀態
  const updateTableStatus = async (tableId: string, status: TableStatus, notes?: string) => {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      }
      
      if (notes !== undefined) {
        updateData.notes = notes
      }

      if (status === 'cleaning') {
        updateData.last_cleaned = new Date().toISOString()
      }

      if (status === 'available') {
        updateData.current_order_id = null
        updateData.reserved_by = null
        updateData.reserved_at = null
        updateData.reserved_until = null
        // 停止所有計時器
        stopTimer(tableId)
      }

      // 計時器邏輯
      const currentTable = tables.find(t => t.id === tableId)
      if (currentTable) {
        // 當狀態從 available 變為 seated 時啟動就座計時器
        if (currentTable.status === 'available' && status === 'seated') {
          startTimer(tableId, 'seating')
        }
        // 當狀態從 seated 變為 ordered 時啟動點餐計時器
        else if (currentTable.status === 'seated' && status === 'ordered') {
          stopTimer(tableId) // 停止就座計時器
          startTimer(tableId, 'ordering')
        }
        // 當狀態變為 reserved 時啟動預約計時器
        else if (status === 'reserved') {
          startTimer(tableId, 'reservation')
        }
        // 當狀態變為非活動狀態時停止計時器
        else if (['available', 'cleaning', 'out_of_order'].includes(status)) {
          stopTimer(tableId)
        }
      }

      const { error } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', tableId)

      if (error) throw error

      await loadTables()
      
      // 更新選中的桌位
      if (selectedTable?.id === tableId) {
        const updatedTable = tables.find(t => t.id === tableId)
        if (updatedTable) {
          setSelectedTable({ ...updatedTable, status, notes })
        }
      }
    } catch (err) {
      console.error('更新桌位狀態失敗:', err)
      setError('更新桌位狀態失敗')
    }
  }

  // 桌位預約
  const createReservation = async (reservationData: Omit<Reservation, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .insert({
          ...reservationData,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // 如果是即時預約，更新桌位狀態
      const reservationTime = new Date(reservationData.reservation_time)
      const now = new Date()
      const timeDiff = reservationTime.getTime() - now.getTime()
      
      if (timeDiff <= 15 * 60 * 1000) { // 15分鐘內的預約
        await updateTableStatus(reservationData.table_id, 'reserved')
      }

      await loadReservations()
      setShowReservationModal(false)
    } catch (err) {
      console.error('建立預約失敗:', err)
      setError('建立預約失敗')
    }
  }

  // 桌位合併
  const mergeTables = async (tableIds: string[], newTableNumber: number) => {
    try {
      // 檢查所有桌位都可用
      const targetTables = tables.filter(t => tableIds.includes(t.id))
      const allAvailable = targetTables.every(t => t.status === 'available')
      
      if (!allAvailable) {
        setError('只能合併空閒的桌位')
        return
      }

      // 計算總容量
      const totalCapacity = targetTables.reduce((sum, t) => sum + t.capacity, 0)

      // 更新主桌位
      const mainTableId = tableIds[0]
      await supabase
        .from('tables')
        .update({
          table_number: newTableNumber,
          capacity: totalCapacity,
          notes: `合併桌位: ${targetTables.map(t => t.table_number).join(', ')}`,
          status: 'seated'
        })
        .eq('id', mainTableId)

      // 標記其他桌位為合併狀態
      for (let i = 1; i < tableIds.length; i++) {
        await supabase
          .from('tables')
          .update({
            status: 'out_of_order',
            notes: `已合併至桌號 ${newTableNumber}`
          })
          .eq('id', tableIds[i])
      }

      await loadTables()
      setShowMergeModal(false)
    } catch (err) {
      console.error('合併桌位失敗:', err)
      setError('合併桌位失敗')
    }
  }

  // 保存場地佈局
  const saveFloorLayout = async (layout: any) => {
    try {
      // 這裡可以擴展到真實的資料庫保存
      // 目前先保存到 localStorage
      localStorage.setItem(`floor_layout_${layout.id}`, JSON.stringify(layout))
      
      setCurrentLayout(layout)
      setShowLayoutEditor(false)
      
      // 如果佈局包含桌位更新，同步更新桌位
      if (layout.tables && layout.tables.length > 0) {
        // 可以在這裡同步桌位位置信息到資料庫
        console.log('佈局已保存:', layout.name)
      }
    } catch (err) {
      console.error('保存佈局失敗:', err)
      setError('保存佈局失敗')
    }
  }

  // 載入場地佈局
  const loadFloorLayout = async (layoutId?: string) => {
    try {
      if (layoutId) {
        const saved = localStorage.getItem(`floor_layout_${layoutId}`)
        if (saved) {
          setCurrentLayout(JSON.parse(saved))
        }
      }
    } catch (err) {
      console.error('載入佈局失敗:', err)
    }
  }

  // 換桌功能
  const switchTables = async (fromTableId: string, toTableId: string) => {
    try {
      const fromTable = tables.find(t => t.id === fromTableId)
      const toTable = tables.find(t => t.id === toTableId)

      if (!fromTable || !toTable) {
        setError('找不到指定的桌位')
        return
      }

      if (toTable.status !== 'available') {
        setError('目標桌位不可用')
        return
      }

      // 如果來源桌位有訂單，轉移訂單
      if (fromTable.current_order_id) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ table_id: toTableId })
          .eq('id', fromTable.current_order_id)

        if (orderError) throw orderError
      }

      // 更新桌位狀態
      await updateTableStatus(fromTableId, 'available')
      await updateTableStatus(toTableId, 'seated')

      await loadTables()
    } catch (err) {
      console.error('換桌失敗:', err)
      setError('換桌失敗')
    }
  }

  // 獲取狀態樣式
  const getStatusStyle = (status: TableStatus) => {
    const styles = {
      available: 'bg-green-100 text-green-800 border-green-300',
      occupied: 'bg-red-100 text-red-800 border-red-300',
      reserved: 'bg-blue-100 text-blue-800 border-blue-300',
      cleaning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      out_of_order: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return styles[status] || styles.available
  }

  // 獲取狀態標籤
  const getStatusLabel = (status: TableStatus) => {
    const labels = {
      available: '空閒',
      occupied: '使用中',
      reserved: '已預約',
      cleaning: '清潔中',
      out_of_order: '停用'
    }
    return labels[status] || '未知'
  }

  // 獲取桌位圖示
  const getTableIcon = (capacity: number) => {
    if (capacity <= 2) return '🪑'
    if (capacity <= 4) return '🍽️'
    if (capacity <= 6) return '🎂'
    return '🏛️'
  }

  useEffect(() => {
    loadTables()
    loadReservations()

    // 設定即時更新
    const subscription = supabase
      .channel('tables-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tables' },
        () => {
          loadTables()
          loadTableStats()
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' },
        () => loadReservations()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (tables.length > 0) {
      loadTableStats()
    }
  }, [tables])

  // 計時器實時更新
  useEffect(() => {
    const interval = setInterval(() => {
      // 強制重新渲染以更新計時器顯示
      setTables(prev => [...prev])
    }, 60000) // 每分鐘更新一次

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">載入桌位中...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 標題和控制項 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🏪 桌位管理系統
            {isOfflineMode && (
              <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                🔌 離線模式
              </span>
            )}
          </h1>
          
          <div className="flex gap-2">
            {!isOfflineMode && (
              <button
                onClick={loadTables}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                title="重新載入"
              >
                🔄 重新整理
              </button>
            )}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'layout' : 'grid')}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {viewMode === 'grid' ? '列表檢視' : viewMode === 'list' ? '佈局檢視' : '網格檢視'}
            </button>
            {!isOfflineMode && (
              <>
                <button
                  onClick={() => setShowLayoutEditor(true)}
                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  🏗️ 編輯佈局
                </button>
                <button
                  onClick={() => setShowReservationModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  新增預約
                </button>
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  桌位合併
                </button>
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  使用報表
                </button>
              </>
            )}
          </div>
        </div>

        {/* 離線模式提示 */}
        {isOfflineMode && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  離線模式
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    目前處於離線模式，顯示示範資料。網路恢復後請點擊「重新整理」按鈕同步最新資料。
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      onClick={loadTables}
                      className="bg-amber-50 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    >
                      🔄 重新連線
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 統計摘要 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {tables.filter(t => t.status === 'available').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">空閒桌位</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {tables.filter(t => ['seated', 'ordered', 'waiting_food'].includes(t.status)).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">使用中</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {tables.filter(t => t.status === 'reserved').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已預約</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {tables.filter(t => t.status === 'cleaning').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">清潔中</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {Math.round((tables.filter(t => ['seated', 'ordered', 'waiting_food'].includes(t.status)).length / tables.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">使用率</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-900 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 桌位展示 */}
        <div className="lg:col-span-2">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  stats={tableStats[table.id]}
                  timer={timers[table.id]}
                  onClick={() => setSelectedTable(table)}
                  onStatusChange={updateTableStatus}
                  selected={selectedTable?.id === table.id}
                  getTimerDisplay={getTimerDisplay}
                />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">桌位列表</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {tables.map(table => (
                  <TableListItem
                    key={table.id}
                    table={table}
                    stats={tableStats[table.id]}
                    timer={timers[table.id]}
                    onClick={() => setSelectedTable(table)}
                    onStatusChange={updateTableStatus}
                    selected={selectedTable?.id === table.id}
                    getTimerDisplay={getTimerDisplay}
                  />
                ))}
              </div>
            </div>
          ) : (
            // 佈局視圖
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">場地佈局</h3>
                <button
                  onClick={() => setShowLayoutEditor(true)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  編輯佈局
                </button>
              </div>
              <div className="p-4">
                {currentLayout ? (
                  <LayoutViewer layout={currentLayout} tables={tables} onTableClick={setSelectedTable} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🏗️</div>
                    <p>尚未建立場地佈局</p>
                    <button
                      onClick={() => setShowLayoutEditor(true)}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      建立新佈局
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 桌位詳情和預約列表 */}
        <div className="space-y-6">
          {/* 選中桌位詳情 */}
          {selectedTable && (
            <TableDetailPanel
              table={selectedTable}
              stats={tableStats[selectedTable.id]}
              onStatusChange={updateTableStatus}
              onSwitchTable={switchTables}
              availableTables={tables.filter(t => t.status === 'available' && t.id !== selectedTable.id)}
            />
          )}

          {/* 今日預約 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                今日預約 ({reservations.length})
              </h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {reservations.map(reservation => (
                <ReservationItem
                  key={reservation.id}
                  reservation={reservation}
                  onConfirm={(id) => {
                    // 確認預約邏輯
                  }}
                  onCancel={(id) => {
                    // 取消預約邏輯
                  }}
                />
              ))}
              {reservations.length === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  今日無預約
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 預約彈窗 */}
      {showReservationModal && (
        <ReservationModal
          tables={tables.filter(t => t.status === 'available')}
          onClose={() => setShowReservationModal(false)}
          onSubmit={createReservation}
        />
      )}

      {/* 合併桌位彈窗 */}
      {showMergeModal && (
        <MergeTablesModal
          tables={tables.filter(t => t.status === 'available')}
          onClose={() => setShowMergeModal(false)}
          onSubmit={mergeTables}
        />
      )}

      {/* 統計報表彈窗 */}
      {showStatsModal && (
        <TableStatsModal
          tables={tables}
          stats={tableStats}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* 場地佈局編輯器 */}
      {showLayoutEditor && (
        <FloorLayoutEditor
          currentLayout={currentLayout}
          tables={tables}
          onSave={saveFloorLayout}
          onClose={() => setShowLayoutEditor(false)}
        />
      )}
    </div>
  )
}

// 桌位卡片組件
interface TableCardProps {
  table: Table
  stats?: any
  timer?: TableTimer
  onClick: () => void
  onStatusChange: (id: string, status: TableStatus) => void
  selected: boolean
  getTimerDisplay: (startTime: string) => string
}

function TableCard({ table, stats, timer, onClick, onStatusChange, selected, getTimerDisplay }: TableCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all
        ${selected ? 'ring-2 ring-blue-500' : ''}
        ${getStatusStyle(table.status)}`}
      onClick={onClick}
    >
      {/* 桌位資訊 */}
      <div className="text-center">
        <div className="text-2xl mb-1">{getTableIcon(table.capacity)}</div>
        <div className="font-bold text-lg">桌號 {table.table_number}</div>
        <div className="text-sm opacity-75">{table.capacity} 人桌</div>
        <div className="text-xs mt-1">{getStatusLabel(table.status)}</div>
      </div>

      {/* 計時器顯示 */}
      {timer && timer.is_active && (
        <div className="mt-2 text-center">
          <div className="bg-white bg-opacity-80 rounded px-2 py-1 text-xs">
            <div className="font-semibold text-gray-700">
              {timer.timer_type === 'seating' && '就座時間'}
              {timer.timer_type === 'ordering' && '點餐時間'}
              {timer.timer_type === 'reservation' && '預約時間'}
            </div>
            <div className="text-blue-600 font-bold">
              {getTimerDisplay(timer.started_at)}
            </div>
          </div>
        </div>
      )}

      {/* 統計資訊 */}
      {stats && (
        <div className="mt-2 text-xs text-center">
          <div>今日: {stats.sessionsToday} 次</div>
          <div>營收: ${stats.totalRevenue}</div>
        </div>
      )}

      {/* 狀態菜單 */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          ⋮
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white border rounded shadow-lg z-10 min-w-[120px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(table.id, 'available')
                setShowMenu(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              設為空閒
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(table.id, 'seated')
                setShowMenu(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              設為入座
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(table.id, 'ordered')
                setShowMenu(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              設為用餐中
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(table.id, 'waiting_food')
                setShowMenu(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              等待上菜
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(table.id, 'needs_service')
                setShowMenu(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              需要服務
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(table.id, 'cleaning')
                setShowMenu(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              開始清潔
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(table.id, 'out_of_order')
                setShowMenu(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              停用桌位
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 其他輔助組件將在下一部分繼續實作...

// 獲取狀態樣式的輔助函數
function getStatusStyle(status: TableStatus) {
  const styles = {
    available: 'bg-green-100 text-green-800 border-green-300',
    seated: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    reserved: 'bg-blue-100 text-blue-800 border-blue-300',
    ordered: 'bg-purple-100 text-purple-800 border-purple-300',
    waiting_food: 'bg-orange-100 text-orange-800 border-orange-300',
    needs_service: 'bg-red-100 text-red-800 border-red-300',
    cleaning: 'bg-gray-100 text-gray-800 border-gray-300',
    out_of_order: 'bg-slate-100 text-slate-800 border-slate-300'
  }
  return styles[status] || styles.available
}

// 獲取狀態標籤的輔助函數
function getStatusLabel(status: TableStatus) {
  const labels = {
    available: '空閒',
    seated: '已入座',
    reserved: '已預約',
    ordered: '用餐中',
    waiting_food: '等待上菜',
    needs_service: '需要服務',
    cleaning: '清潔中',
    out_of_order: '停用'
  }
  return labels[status] || '未知'
}

// 獲取桌位圖示的輔助函數
function getTableIcon(capacity: number) {
  if (capacity <= 2) return '🪑'
  if (capacity <= 4) return '🍽️'
  if (capacity <= 6) return '🎂'
  return '🏛️'
}

// 桌位列表項目組件 (簡化版)
function TableListItem({ table, stats, timer, onClick, onStatusChange, selected, getTimerDisplay }: TableCardProps) {
  return (
    <div
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700
        ${selected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-xl">{getTableIcon(table.capacity)}</div>
          <div>
            <div className="font-medium">桌號 {table.table_number}</div>
            <div className="text-sm text-gray-600">{table.capacity} 人桌</div>
            {/* 計時器顯示 */}
            {timer && timer.is_active && (
              <div className="text-xs text-blue-600 font-medium">
                {timer.timer_type === 'seating' && '就座'}: {getTimerDisplay(timer.started_at)}
                {timer.timer_type === 'ordering' && '點餐'}: {getTimerDisplay(timer.started_at)}
                {timer.timer_type === 'reservation' && '預約'}: {getTimerDisplay(timer.started_at)}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`px-2 py-1 text-xs rounded ${getStatusStyle(table.status)}`}>
            {getStatusLabel(table.status)}
          </div>
          {stats && (
            <div className="text-xs text-gray-500 mt-1">
              今日 {stats.sessionsToday} 次
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 桌位詳情面板組件 (簡化版)
interface TableDetailPanelProps {
  table: Table
  stats?: any
  onStatusChange: (id: string, status: TableStatus) => void
  onSwitchTable: (fromId: string, toId: string) => void
  availableTables: Table[]
}

function TableDetailPanel({ table, stats, onStatusChange, onSwitchTable, availableTables }: TableDetailPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">桌位詳情</h3>
      <div className="space-y-3">
        <div>
          <span className="text-gray-600">桌號:</span>
          <span className="ml-2 font-medium">{table.table_number}</span>
        </div>
        <div>
          <span className="text-gray-600">容量:</span>
          <span className="ml-2 font-medium">{table.capacity} 人</span>
        </div>
        <div>
          <span className="text-gray-600">狀態:</span>
          <span className="ml-2">{getStatusLabel(table.status)}</span>
        </div>
        {stats && (
          <div className="pt-2 border-t">
            <div className="text-sm text-gray-600">今日統計:</div>
            <div className="text-sm">使用次數: {stats.sessionsToday}</div>
            <div className="text-sm">營收: ${stats.totalRevenue}</div>
            <div className="text-sm">平均時長: {stats.avgDuration}分鐘</div>
          </div>
        )}
      </div>
    </div>
  )
}

// 預約項目組件 (簡化版)
interface ReservationItemProps {
  reservation: Reservation
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
}

function ReservationItem({ reservation, onConfirm, onCancel }: ReservationItemProps) {
  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{reservation.customer_name}</div>
          <div className="text-sm text-gray-600">
            {new Date(reservation.reservation_time).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div className="text-sm text-gray-600">
            {reservation.party_size} 人
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-2">
            {reservation.status}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => onConfirm(reservation.id)}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded"
            >
              確認
            </button>
            <button
              onClick={() => onCancel(reservation.id)}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 預約彈窗組件 (簡化版)
interface ReservationModalProps {
  tables: Table[]
  onClose: () => void
  onSubmit: (data: Omit<Reservation, 'id' | 'created_at'>) => void
}

function ReservationModal({ tables, onClose, onSubmit }: ReservationModalProps) {
  const [formData, setFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: '',
    party_size: 2,
    reservation_time: '',
    duration_minutes: 120,
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      status: 'pending'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">新增預約</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">選擇桌位</label>
            <select
              value={formData.table_id}
              onChange={(e) => setFormData({...formData, table_id: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">請選擇桌位</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  桌號 {table.table_number} ({table.capacity}人桌)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">客戶姓名</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">聯絡電話</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">用餐人數</label>
            <input
              type="number"
              value={formData.party_size}
              onChange={(e) => setFormData({...formData, party_size: parseInt(e.target.value)})}
              className="w-full border rounded px-3 py-2"
              min="1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">預約時間</label>
            <input
              type="datetime-local"
              value={formData.reservation_time}
              onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              確認預約
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 合併桌位彈窗組件 (簡化版)
interface MergeTablesModalProps {
  tables: Table[]
  onClose: () => void
  onSubmit: (tableIds: string[], newTableNumber: number) => void
}

function MergeTablesModal({ tables, onClose, onSubmit }: MergeTablesModalProps) {
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [newTableNumber, setNewTableNumber] = useState<number>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTables.length < 2) {
      alert('請至少選擇兩個桌位進行合併')
      return
    }
    onSubmit(selectedTables, newTableNumber)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">桌位合併</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">選擇要合併的桌位</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tables.map(table => (
                <label key={table.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTables([...selectedTables, table.id])
                      } else {
                        setSelectedTables(selectedTables.filter(id => id !== table.id))
                      }
                    }}
                    className="mr-2"
                  />
                  桌號 {table.table_number} ({table.capacity}人桌)
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">新桌號</label>
            <input
              type="number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2"
              min="1"
              required
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
            >
              確認合併
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 統計報表彈窗組件 (簡化版)
interface TableStatsModalProps {
  tables: Table[]
  stats: any
  onClose: () => void
}

function TableStatsModal({ tables, stats, onClose }: TableStatsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">桌位使用報表</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border p-2">桌號</th>
                <th className="border p-2">容量</th>
                <th className="border p-2">今日使用次數</th>
                <th className="border p-2">今日營收</th>
                <th className="border p-2">平均時長</th>
                <th className="border p-2">使用率</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => {
                const tableStat = stats[table.id] || {}
                return (
                  <tr key={table.id}>
                    <td className="border p-2 text-center">{table.table_number}</td>
                    <td className="border p-2 text-center">{table.capacity}</td>
                    <td className="border p-2 text-center">{tableStat.sessionsToday || 0}</td>
                    <td className="border p-2 text-center">${tableStat.totalRevenue || 0}</td>
                    <td className="border p-2 text-center">{tableStat.avgDuration || 0}分</td>
                    <td className="border p-2 text-center">{tableStat.utilizationRate || 0}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 佈局檢視器組件
interface LayoutViewerProps {
  layout: any
  tables: Table[]
  onTableClick: (table: Table) => void
}

function LayoutViewer({ layout, tables, onTableClick }: LayoutViewerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // 繪製佈局
  const drawLayout = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空畫布
    ctx.clearRect(0, 0, layout.width, layout.height)

    // 背景
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, layout.width, layout.height)

    // 繪製障礙物
    if (layout.obstacles) {
      layout.obstacles.forEach((obstacle: any) => {
        ctx.fillStyle = obstacle.color
        ctx.fillRect(obstacle.position.x, obstacle.position.y, obstacle.width, obstacle.height)
        
        if (obstacle.label) {
          ctx.fillStyle = '#ffffff'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(
            obstacle.label, 
            obstacle.position.x + obstacle.width/2, 
            obstacle.position.y + obstacle.height/2
          )
        }
      })
    }

    // 繪製桌位
    if (layout.tables) {
      layout.tables.forEach((layoutTable: any) => {
        // 找到對應的當前桌位狀態
        const currentTable = tables.find(t => t.id === layoutTable.id)
        const status = currentTable?.status || layoutTable.status

        // 桌位顏色
        const colors = {
          available: '#10b981',
          seated: '#f59e0b',
          reserved: '#3b82f6',
          ordered: '#8b5cf6',
          waiting_food: '#f97316',
          needs_service: '#ef4444',
          cleaning: '#6b7280',
          out_of_order: '#374151'
        }

        ctx.fillStyle = colors[status as keyof typeof colors] || '#10b981'
        ctx.strokeStyle = '#374151'
        ctx.lineWidth = 2

        const x = layoutTable.position.x
        const y = layoutTable.position.y
        const w = layoutTable.width
        const h = layoutTable.height

        if (layoutTable.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(x + w/2, y + h/2, w/2, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
        } else {
          ctx.fillRect(x, y, w, h)
          ctx.strokeRect(x, y, w, h)
        }

        // 桌號
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(layoutTable.table_number.toString(), x + w/2, y + h/2 - 5)
        
        // 容量
        ctx.font = '10px Arial'
        ctx.fillText(`${layoutTable.capacity}人`, x + w/2, y + h/2 + 8)
      })
    }
  }

  // 點擊處理
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !layout.tables) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 找到點擊的桌位
    const clickedLayoutTable = layout.tables.find((table: any) => 
      x >= table.position.x && x <= table.position.x + table.width &&
      y >= table.position.y && y <= table.position.y + table.height
    )

    if (clickedLayoutTable) {
      const currentTable = tables.find(t => t.id === clickedLayoutTable.id)
      if (currentTable) {
        onTableClick(currentTable)
      }
    }
  }

  React.useEffect(() => {
    drawLayout()
  }, [layout, tables])

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={layout.width}
        height={layout.height}
        onClick={handleCanvasClick}
        className="cursor-pointer"
        style={{ 
          display: 'block', 
          maxWidth: '100%', 
          height: 'auto',
          aspectRatio: `${layout.width} / ${layout.height}`
        }}
      />
    </div>
  )
}
