import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import type { Order } from '../../lib/types-unified'

// 訂單狀態類型
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'

// 訂單管理組件
export default function OrderManagement() {
  const { orders, updateOrderStatus, loadOrders, loading } = usePOSStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 進階篩選狀態
  const [dateFilter, setDateFilter] = useState('all') // all, today, yesterday, week, month
  const [amountFilter, setAmountFilter] = useState('all') // all, low, medium, high
  const [tableFilter, setTableFilter] = useState('all') // all, specific table numbers
  const [sortBy, setSortBy] = useState('created_at') // created_at, total_amount, table_number
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc

  // 組件掛載時載入訂單數據
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📋 訂單管理: 載入訂單數據...')
        await loadOrders()
        console.log('✅ 訂單管理: 訂單數據載入完成')
      } catch (error) {
        console.error('❌ 訂單管理: 載入訂單數據失敗:', error)
      }
    }
    
    loadData()
  }, [loadOrders])

  // 檢查是否為套餐的輔助函數
  const isMealSet = (productName: string): boolean => {
    return productName?.includes('套餐') || false
  }
  
  // 格式化套餐特殊說明的輔助函數
  const formatMealSetInstructions = (productName: string, instructions: string): string => {
    if (!isMealSet(productName)) {
      return instructions
    }
    
    try {
      const data = JSON.parse(instructions)
      let formattedItems: string[] = []
      
      // 處理每個群組的商品
      Object.values(data).forEach((group: any) => {
        if (Array.isArray(group)) {
          group.forEach((item: any) => {
            if (item.name) {
              formattedItems.push(item.name)
            }
          })
        }
      })
      
      if (formattedItems.length > 0) {
        return `套餐組合: ${formattedItems.join(' + ')}`
      }
    } catch (error) {
      // JSON 解析失敗，返回原始說明
    }
    
    return instructions
  }

  // 獲取狀態標籤
  const getStatusLabel = (status: OrderStatus) => {
    const labels = {
      pending: '等待確認',
      confirmed: '已確認',
      preparing: '製作中',
      ready: '待取餐',
      served: '已完成',
      completed: '已完成',
      cancelled: '已取消'
    }
    return labels[status] || status
  }

  // 獲取日期篩選的日期範圍
  const getDateRange = (filter: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (filter) {
      case 'today':
        return { 
          start: today, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        }
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        return { 
          start: yesterday, 
          end: today 
        }
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { 
          start: weekStart, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        }
      case 'month':
        const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        return { 
          start: monthStart, 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        }
      default:
        return null
    }
  }

  // 獲取金額篩選範圍
  const getAmountRange = (filter: string) => {
    switch (filter) {
      case 'low':
        return { min: 0, max: 200 }
      case 'medium':
        return { min: 200, max: 500 }
      case 'high':
        return { min: 500, max: Infinity }
      default:
        return null
    }
  }

  // 過濾訂單
  const filteredOrders = orders.filter(order => {
    // 狀態篩選
    const matchesTab = activeTab === 'all' || order.status === activeTab
    
    // 搜尋篩選
    const matchesSearch = !searchTerm || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table_number?.toString().includes(searchTerm)
    
    // 日期篩選
    let matchesDate = true
    if (dateFilter !== 'all') {
      const dateRange = getDateRange(dateFilter)
      if (dateRange) {
        const orderDate = new Date(order.created_at)
        matchesDate = orderDate >= dateRange.start && orderDate < dateRange.end
      }
    }
    
    // 金額篩選
    let matchesAmount = true
    if (amountFilter !== 'all') {
      const amountRange = getAmountRange(amountFilter)
      if (amountRange) {
        matchesAmount = order.total_amount >= amountRange.min && order.total_amount < amountRange.max
      }
    }
    
    // 桌號篩選
    let matchesTable = true
    if (tableFilter !== 'all') {
      matchesTable = order.table_number?.toString() === tableFilter
    }
    
    return matchesTab && matchesSearch && matchesDate && matchesAmount && matchesTable
  }).sort((a, b) => {
    // 排序邏輯
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      case 'total_amount':
        aValue = a.total_amount
        bValue = b.total_amount
        break
      case 'table_number':
        aValue = a.table_number || 0
        bValue = b.table_number || 0
        break
      default:
        return 0
    }
    
    if (sortOrder === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })

  // 獲取所有唯一的桌號
  const uniqueTableNumbers = [...new Set(orders.map(order => order.table_number))].filter(Boolean).sort((a, b) => (a || 0) - (b || 0))

  // 按狀態統計訂單
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed' || o.status === 'served').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  }

  // 載入狀態檢查
  if (loading && orders.length === 0) {
    return (
      <div className="modern-container" style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
        <div className="modern-card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          載入訂單數據中...
        </div>
        <div className="modern-card-subtitle">
          {orders.length > 0 ? `已載入 ${orders.length} 筆訂單` : '連接數據庫中...'}
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      {/* 標題區域 */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="modern-page-title">
          📋 訂單管理系統
        </h1>

        {/* 統計卡片 */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {[
            { label: '總訂單', count: orderStats.total, badge: 'secondary' },
            { label: '等待確認', count: orderStats.pending, badge: 'warning' },
            { label: '製作中', count: orderStats.preparing, badge: 'primary' },
            { label: '待取餐', count: orderStats.ready, badge: 'success' },
            { label: '已完成', count: orderStats.completed, badge: 'secondary' }
          ].map((stat, index) => (
            <div key={index} className="modern-card" style={{ 
              textAlign: 'center', 
              padding: '0.75rem',
              flex: '1',
              minWidth: '120px'
            }}>
              <div className="modern-card-title" style={{ 
                fontSize: '1.5rem', 
                marginBottom: '0.25rem',
                color: stat.badge === 'warning' ? 'var(--modern-warning)' :
                       stat.badge === 'primary' ? 'var(--modern-primary)' :
                       stat.badge === 'success' ? 'var(--modern-success)' :
                       'var(--modern-text)'
              }}>
                {stat.count}
              </div>
              <div className="modern-card-subtitle" style={{ fontSize: '0.75rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 第一行：搜尋框和排序 */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '2', minWidth: '300px' }}>
              <input
                type="text"
                placeholder="搜尋訂單編號、客戶名稱或桌號..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="modern-input"
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flex: '1', minWidth: '200px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="modern-input"
                style={{ flex: '1' }}
              >
                <option value="created_at">依時間排序</option>
                <option value="total_amount">依金額排序</option>
                <option value="table_number">依桌號排序</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="modern-btn modern-btn-secondary"
                style={{ padding: '0.5rem', minWidth: '60px' }}
                title={sortOrder === 'asc' ? '由小到大' : '由大到小'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* 第二行：進階篩選選項 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
            {/* 日期篩選 */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="modern-input"
            >
              <option value="all">所有日期</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="week">近7天</option>
              <option value="month">近30天</option>
            </select>

            {/* 金額篩選 */}
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="modern-input"
            >
              <option value="all">所有金額</option>
              <option value="low">$0 - $200</option>
              <option value="medium">$200 - $500</option>
              <option value="high">$500以上</option>
            </select>

            {/* 桌號篩選 */}
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="modern-input"
            >
              <option value="all">所有桌號</option>
              {uniqueTableNumbers.map(tableNum => (
                <option key={tableNum} value={tableNum?.toString()}>
                  桌號 {tableNum}
                </option>
              ))}
            </select>

            {/* 重置篩選按鈕 */}
            <button
              onClick={() => {
                setDateFilter('all')
                setAmountFilter('all')
                setTableFilter('all')
                setSearchTerm('')
                setActiveTab('all')
                setSortBy('created_at')
                setSortOrder('desc')
              }}
              className="modern-btn modern-btn-secondary"
              style={{ padding: '0.5rem' }}
            >
              重置篩選
            </button>
          </div>

          {/* 第三行：狀態篩選按鈕 */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: '全部', count: orders.length },
              { key: 'pending', label: '等待確認', count: orderStats.pending },
              { key: 'confirmed', label: '已確認', count: orders.filter(o => o.status === 'confirmed').length },
              { key: 'preparing', label: '製作中', count: orderStats.preparing },
              { key: 'ready', label: '待取餐', count: orderStats.ready },
              { key: 'completed', label: '已完成', count: orderStats.completed },
              { key: 'cancelled', label: '已取消', count: orderStats.cancelled }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`modern-btn ${activeTab === tab.key ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* 篩選結果統計 */}
          {(searchTerm || dateFilter !== 'all' || amountFilter !== 'all' || tableFilter !== 'all' || activeTab !== 'all') && (
            <div className="modern-card" style={{ padding: '0.75rem', backgroundColor: 'var(--modern-primary-light)', border: '1px solid var(--modern-primary)' }}>
              <div className="modern-card-subtitle" style={{ textAlign: 'center' }}>
                📊 篩選結果：找到 {filteredOrders.length} 筆訂單 
                {filteredOrders.length !== orders.length && (
                  <span style={{ color: 'var(--modern-primary)' }}>
                    （共 {orders.length} 筆）
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主要內容區域 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.5fr 1fr', 
        gap: '1.5rem', 
        minHeight: '600px' 
      }}>
        {/* 訂單列表 */}
        <div className="modern-card" style={{ overflow: 'hidden', height: 'fit-content' }}>
          {/* 列表標題 */}
          <div className="modern-card-header">
            <h2 className="modern-card-title">
              訂單列表 ({filteredOrders.length})
            </h2>
          </div>

          {/* 訂單項目 */}
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
                <div className="modern-card-title" style={{ marginBottom: '0.5rem' }}>沒有找到訂單</div>
                <div className="modern-card-subtitle">請嘗試調整搜尋條件或篩選器</div>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id
                
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`modern-card modern-interactive ${isSelected ? 'modern-card-selected' : ''}`}
                    style={{ 
                      margin: '0.5rem',
                      borderRadius: '0.5rem',
                      padding: '0.75rem'
                    }}
                  >
                    {/* 訂單標題行 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <div className="modern-card-title" style={{ marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                          {order.order_number}
                        </div>
                        <div className="modern-card-subtitle" style={{ fontSize: '0.8rem' }}>
                          桌號: {order.table_number} | 項目: {order.order_items?.length || 0}
                          {order.customer_name && (
                            <span> | {order.customer_name}</span>
                          )}
                        </div>
                      </div>
                      <span className={`modern-badge ${
                        order.status === 'pending' ? 'modern-badge-warning' :
                        order.status === 'confirmed' || order.status === 'preparing' ? 'modern-badge-primary' :
                        order.status === 'ready' ? 'modern-badge-success' :
                        order.status === 'completed' || order.status === 'served' ? 'modern-badge-secondary' :
                        'modern-badge-danger'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {getStatusLabel(order.status as OrderStatus)}
                      </span>
                    </div>

                    {/* 訂單詳情行 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div className="modern-card-subtitle" style={{ fontSize: '0.75rem' }}>
                        {new Date(order.created_at).toLocaleString('zh-TW')}
                      </div>
                      <div className="modern-card-title" style={{ fontSize: '0.9rem' }}>
                        ${order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 訂單詳情 */}
        <div className="modern-card" style={{ height: 'fit-content' }}>
          {!selectedOrder ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>�</div>
              <div className="modern-card-title" style={{ marginBottom: '0.5rem' }}>選擇訂單</div>
              <div className="modern-card-subtitle">點擊左側訂單項目查看詳情</div>
            </div>
          ) : (
            <div>
              {/* 詳情標題 */}
              <div className="modern-card-header">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 className="modern-card-title">
                    訂單詳情
                  </h2>
                  <span className={`modern-badge ${
                    selectedOrder.status === 'pending' ? 'modern-badge-warning' :
                    selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' ? 'modern-badge-primary' :
                    selectedOrder.status === 'ready' ? 'modern-badge-success' :
                    selectedOrder.status === 'completed' || selectedOrder.status === 'served' ? 'modern-badge-secondary' :
                    'modern-badge-danger'
                  }`}>
                    {getStatusLabel(selectedOrder.status as OrderStatus)}
                  </span>
                </div>
              </div>

              {/* 詳情內容 */}
              <div className="modern-card-content">
                {/* 基本資訊 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 className="modern-card-title" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
                    基本資訊
                  </h3>
                  <div className="modern-grid modern-grid-1" style={{ gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="modern-card-subtitle">訂單編號:</span>
                      <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                        {selectedOrder.order_number}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="modern-card-subtitle">桌號:</span>
                      <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                        {selectedOrder.table_number}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="modern-card-subtitle">下單時間:</span>
                      <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                        {new Date(selectedOrder.created_at).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="modern-card-subtitle">總金額:</span>
                      <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                        ${selectedOrder.total_amount.toFixed(2)}
                      </span>
                    </div>
                    {selectedOrder.customer_name && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="modern-card-subtitle">客戶姓名:</span>
                        <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                          {selectedOrder.customer_name}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="modern-card-subtitle">聯絡電話:</span>
                        <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                          {selectedOrder.customer_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 訂單項目 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 className="modern-card-title" style={{ marginBottom: '0.75rem' }}>
                    訂單項目
                  </h3>
                  <div className="modern-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {selectedOrder.order_items?.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.75rem',
                          borderBottom: index < selectedOrder.order_items.length - 1 ? '1px solid var(--modern-border)' : 'none',
                          background: index % 2 === 0 ? 'transparent' : 'var(--modern-bg-secondary)'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div className="modern-card-title" style={{
                              marginBottom: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              {item.product_name}
                              {isMealSet(item.product_name) && (
                                <span className="modern-badge modern-badge-warning" style={{ fontSize: '0.6rem' }}>
                                  🍽️ 套餐
                                </span>
                              )}
                            </div>
                            {item.special_instructions && (
                              <div className="modern-card-subtitle" style={{ fontSize: '0.75rem' }}>
                                備註: {formatMealSetInstructions(item.product_name, item.special_instructions)}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="modern-card-title">
                              x{item.quantity}
                            </div>
                            <div className="modern-card-subtitle">
                              ${item.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                      className="modern-btn modern-btn-primary"
                      style={{ width: '100%' }}
                    >
                      確認訂單
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      className="modern-btn modern-btn-warning"
                      style={{ width: '100%' }}
                    >
                      開始製作
                    </button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      className="modern-btn modern-btn-success"
                      style={{ width: '100%' }}
                    >
                      製作完成
                    </button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      className="modern-btn modern-btn-secondary"
                      style={{ width: '100%' }}
                    >
                      完成出餐
                    </button>
                  )}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className="modern-btn modern-btn-danger"
                      style={{ width: '100%' }}
                    >
                      取消訂單
                    </button>
                  )}
                </div>

                {/* 備註 */}
                {selectedOrder.notes && (
                  <div className="modern-card" style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem'
                  }}>
                    <div className="modern-card-title" style={{
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      備註:
                    </div>
                    <div className="modern-card-subtitle">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
