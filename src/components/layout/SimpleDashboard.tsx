import React, { useEffect } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { useUIStyle } from '../../contexts/UIStyleContext'
import ThemeToggle from '../ThemeToggle'
import type { Order, Table } from '../../lib/types-unified'

const SimpleDashboard: React.FC<{
  onNavigate: (view: 'pos' | 'kds' | 'kds-mobile' | 'reports' | 'orders' | 'tables' | 'checkout' | 'inventory' | 'admin') => void
}> = ({ onNavigate }) => {
  const { currentStyle, styleConfig } = useUIStyle()
  const { orders, tables, loading, loadOrders, loadTables } = usePOSStore()

  useEffect(() => {
    // 載入初始數據
    loadOrders()
    loadTables()
  }, [loadOrders, loadTables])

  // 計算統計數據
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayOrders = orders.filter((order: Order) => 
    new Date(order.created_at) >= today
  )
  
  const todayRevenue = todayOrders.reduce((sum: number, order: Order) => sum + order.total_amount, 0)
  const pendingOrders = orders.filter((order: Order) => 
    ['pending', 'preparing'].includes(order.status)
  ).length
  const occupiedTables = tables.filter((table: Table) => table.status === 'occupied').length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題與主題切換 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">TanaPOS V4-Mini 儀表板</h1>
          <ThemeToggle />
        </div>
        
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="dashboard-stat-card">
            <h3 className="text-sm font-medium text-muted-foreground">今日訂單</h3>
            <p className="text-2xl font-bold text-foreground mt-1">{todayOrders.length}</p>
          </div>
          <div className="dashboard-stat-card">
            <h3 className="text-sm font-medium text-muted-foreground">今日營收</h3>
            <p className="text-2xl font-bold text-foreground mt-1">NT$ {todayRevenue.toFixed(0)}</p>
          </div>
          <div className="dashboard-stat-card">
            <h3 className="text-sm font-medium text-muted-foreground">待處理訂單</h3>
            <p className="text-2xl font-bold text-foreground mt-1">{pendingOrders}</p>
          </div>
          <div className="dashboard-stat-card">
            <h3 className="text-sm font-medium text-muted-foreground">使用中桌台</h3>
            <p className="text-2xl font-bold text-foreground mt-1">{occupiedTables}</p>
          </div>
        </div>
        
        {/* 功能按鈕 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => onNavigate('pos')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">💳</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">POS 點餐系統</h2>
            <p className="text-muted-foreground">快速點餐、結帳功能</p>
          </button>
          
          <button
            onClick={() => onNavigate('kds')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">🍳</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">廚房顯示系統</h2>
            <p className="text-muted-foreground">即時訂單管理</p>
          </button>
          
          <button
            onClick={() => onNavigate('kds-mobile')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">📱</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">KDS 移動版</h2>
            <p className="text-muted-foreground">移動端廚房顯示系統</p>
          </button>
          
          <button
            onClick={() => onNavigate('orders')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">📋</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">訂單管理系統</h2>
            <p className="text-muted-foreground">訂單詳情與狀態追蹤</p>
          </button>
          
          <button
            onClick={() => onNavigate('tables')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">🏪</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">桌位管理系統</h2>
            <p className="text-muted-foreground">桌位狀態與預約管理</p>
          </button>
          
          <button
            onClick={() => onNavigate('checkout')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">💰</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">完整結帳系統</h2>
            <p className="text-muted-foreground">多元付款與發票開立</p>
          </button>
          
          <button
            onClick={() => onNavigate('inventory')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">📦</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">庫存管理系統</h2>
            <p className="text-muted-foreground">三層架構：原物料→半成品→成品</p>
          </button>
          
          <button
            onClick={() => onNavigate('reports')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">📊</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">營業報表</h2>
            <p className="text-muted-foreground">銷售統計分析</p>
          </button>
          
          <button
            onClick={() => onNavigate('admin')}
            className="bg-card rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 border border-border group"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary">後台管理系統</h2>
            <p className="text-muted-foreground">系統設定與配置管理</p>
          </button>
        </div>

        {/* 開發工具區域 */}
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">🛠️ 開發工具與演示</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/demo/notifications'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-md p-4 text-left hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="text-2xl mb-2">🔔</div>
              <h3 className="text-lg font-bold mb-1">通知系統演示</h3>
              <p className="text-purple-100 text-sm">測試音效提醒與通知功能</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleDashboard
