import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Store
import { usePOSStore } from './lib/store-complete'

// Style Context
import { UIStyleProvider } from './contexts/UIStyleContext'

// Game Context
import { GameProvider } from './contexts/GameContext'

// Layout Components
import SimpleLayout from './components/layout/SimpleLayout'
import ModernLayout from './components/layout/ModernLayout'
import SimpleDashboard from './components/layout/SimpleDashboard'
import SimpleReports from './components/layout/SimpleReports'

// Modern Components
import ModernHomePage from './components/ModernHomePage'
import DesignShowcase from './components/DesignShowcase'
import UIStyleShowcase from './components/UIStyleShowcase'
// import ModernPOS from './components/ModernPOS'

// Basic Components
import SimplePOS from './components/basic/SimplePOS'
import KDSView from './components/basic/KDSView'

// Advanced Components
import OrderManagement from './components/advanced/OrderManagement'
import TableManagement from './components/advanced/TableManagement'
import CheckoutSystemAdvanced from './components/advanced/CheckoutSystemAdvanced'
import { InventoryManagement } from './components/advanced/InventoryManagement'

// Game Components

// Admin Components
import { AdminSystem } from './components/admin'

// UI Components
import NotificationProvider from './components/ui/NotificationSystem'
import NotificationDemo from './components/ui/NotificationDemo'

// ============================================================================
// 導航包裝組件
// ============================================================================
const DashboardWrapper = () => {
  const navigate = useNavigate()
  
  const handleNavigate = (view: 'pos' | 'kds' | 'reports' | 'orders' | 'tables' | 'checkout' | 'inventory') => {
    switch (view) {
      case 'pos':
        navigate('/pos')
        break
      case 'kds':
        navigate('/kds')
        break
      case 'reports':
        navigate('/reports')
        break
      case 'orders':
        navigate('/orders')
        break
      case 'tables':
        navigate('/tables')
        break
      case 'checkout':
        navigate('/checkout')
        break
      case 'inventory':
        navigate('/inventory')
        break
    }
  }
  
  return <SimpleDashboard onNavigate={handleNavigate} />
}

// ============================================================================
// 主應用程式組�?
// ============================================================================
function App() {
  const { 
    loadProducts, 
    loadCategories, 
    loadTables, 
    loadOrders, 
    loadReservations,
    loadDashboardStats 
  } = usePOSStore()

  useEffect(() => {
    // 設置預設深色模式
    const savedTheme = localStorage.getItem('theme')
    if (!savedTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    
    // 載入所有初始數�?
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadProducts(),
          loadCategories(),
          loadTables(),
          loadOrders(),
          loadReservations(),
          loadDashboardStats()
        ])
        console.log('�?所有初始數據載入完�?)
      } catch (error) {
        console.error('�?載入初始數據失敗:', error)
      }
    }

    loadInitialData()
  }, [loadProducts, loadCategories, loadTables, loadOrders, loadReservations, loadDashboardStats])

  return (
    <UIStyleProvider defaultStyle="modern">
      <GameProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <ModernLayout>
              <Routes>
                {/* 現代化主�?*/}
                <Route path="/" element={<ModernHomePage />} />
                
                {/* 傳統儀表板 */}
                <Route path="/dashboard" element={<DashboardWrapper />} />
                
                {/* 現代�?POS 系統 */}
                {/* <Route path="/pos-modern" element={<ModernPOS />} /> */}
                
                {/* 基本功能頁面 */}
                <Route path="/pos" element={<SimplePOS />} />
                <Route path="/kds" element={<KDSView />} />
                
                {/* 高級功能頁面 */}
                <Route path="/orders" element={<OrderManagement />} />
                <Route path="/tables" element={<TableManagement />} />
                <Route path="/checkout" element={<CheckoutSystemAdvanced />} />
                <Route path="/inventory" element={<InventoryManagement />} />
                
                {/* 報告頁面 */}
                <Route path="/reports" element={<SimpleReports />} />
                
                {/* 後台管理系統 */}
                <Route path="/admin" element={<AdminSystem />} />
                
                {/* 演示頁面 */}
                <Route path="/demo/notifications" element={<NotificationDemo />} />
                <Route path="/design-showcase" element={<DesignShowcase />} />
                <Route path="/ui-styles" element={<UIStyleShowcase />} />
                
                {/* 重定向未知路由到主頁 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* 遊戲中心 - 全域可用 */}
            </ModernLayout>
          </div>
        </Router>
      </NotificationProvider>
      </GameProvider>
    </UIStyleProvider>
  )
}

export default App
