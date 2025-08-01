import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Store
import { usePOSStore } from './lib/store-complete'

// Style Context
import { UIStyleProvider } from './contexts/UIStyleContext'

// Layout Components
import SimpleLayout from './components/layout/SimpleLayout'
import ModernLayout from './components/layout/ModernLayout'
import MobileLayout from './components/layout/MobileLayout'
import SimpleDashboard from './components/layout/SimpleDashboard'
import SimpleReports from './components/layout/SimpleReports'

// Modern Components
import ModernHomePage from './components/ModernHomePage'
import DesignShowcase from './components/DesignShowcase'
import UIStyleShowcase from './components/UIStyleShowcase'
import ModernPOSLayout from './components/ModernPOSLayout'
// import ModernPOS from './components/ModernPOS'

// Basic Components
import SimplePOS from './components/basic/SimplePOS'
import NewPOSPage from './components/pages/NewPOSPage'
import SimplePOSPage from './components/pages/SimplePOSPage'
import KDSView from './components/basic/KDSView'

// New POS System
import NewPOSSystem from './components/NewPOSSystem'

// Mobile Components
import MobilePOSInterfaceFull from './components/mobile/MobilePOSInterfaceFull'
import CleanMobilePOS from './components/mobile/CleanMobilePOS'
import KDSMobile from './components/mobile/KDSMobile'

// Advanced Components
import OrderManagement from './components/advanced/OrderManagement'
import TableManagement from './components/advanced/TableManagement'
import TablesView from './components/basic/TablesView'
import NewTablesView from './components/basic/NewTablesView'
import NewTablesViewRedesigned from './components/basic/NewTablesViewRedesigned'
import ModernTablesManagement from './components/advanced/ModernTablesManagement'
import CheckoutSystemNew from './components/advanced/CheckoutSystemNew'
import PostMealCheckout from './components/advanced/PostMealCheckout'
import InventoryManagement from './components/advanced/InventoryManagement'

// Admin Components
import { AdminSystem } from './components/admin'

// UI Components
import NotificationProvider from './components/ui/NotificationSystem'
import NotificationDemo from './components/ui/NotificationDemo'
import PWAInstallPrompt from './components/ui/PWAInstallPrompt'

// ============================================================================
// 裝置檢測功能
// ============================================================================
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768
}

// ============================================================================
// 導航包裝組件
// ============================================================================
const DashboardWrapper = () => {
  const navigate = useNavigate()
  
  const handleNavigate = (view: 'pos' | 'kds' | 'kds-mobile' | 'reports' | 'orders' | 'tables' | 'checkout' | 'checkout-post-meal' | 'inventory' | 'admin') => {
    switch (view) {
      case 'pos':
        navigate('/pos-simple')
        break
      case 'kds':
        navigate('/kds')
        break
      case 'kds-mobile':
        navigate('/kds-mobile')
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
      case 'checkout-post-meal':
        navigate('/checkout-post-meal')
        break
      case 'inventory':
        navigate('/inventory')
        break
      case 'admin':
        navigate('/admin')
        break
    }
  }
  
  return <SimpleDashboard onNavigate={handleNavigate} />
}

// ============================================================================
// 主應用程式組件
// ============================================================================
function App() {
  const isMobile = isMobileDevice()
  const LayoutComponent = isMobile ? MobileLayout : ModernLayout

  useEffect(() => {
    // 設置預設深色模式
    const savedTheme = localStorage.getItem('theme')
    if (!savedTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    
    console.log('✅ App 初始化完成')
  }, [])

  return (
    <UIStyleProvider defaultStyle="modern">
      <NotificationProvider>
        <Router>
          <div className="min-h-screen">
            <LayoutComponent>
              <Routes>
                {/* 現代化主頁 */}
                <Route path="/" element={<ModernHomePage />} />
                
                {/* 傳統儀表板 */}
                <Route path="/dashboard" element={<DashboardWrapper />} />
                
                {/* 現代化 POS 系統 */}
                {/* <Route path="/pos-modern" element={<ModernPOS />} /> */}
                
                {/* 基本功能頁面 */}
                <Route path="/pos" element={<NewPOSPage />} />
                <Route path="/pos-new" element={<NewPOSSystem />} />
                <Route path="/pos-old" element={<SimplePOS />} />
                <Route path="/pos-simple" element={<SimplePOSPage />} />
                <Route path="/pos-modern" element={<ModernPOSLayout />} />
                <Route path="/kds" element={<KDSView />} />
                <Route path="/kds-mobile" element={<KDSMobile />} />
                
                {/* 高級功能頁面 */}
                <Route path="/orders" element={<OrderManagement />} />
                <Route path="/tables" element={<NewTablesViewRedesigned />} />
                <Route path="/tables-old" element={<NewTablesView />} />
                <Route path="/tables-legacy" element={<TablesView />} />
                <Route path="/tables-modern" element={<ModernTablesManagement />} />
                <Route path="/checkout" element={<CheckoutSystemNew />} />
                <Route path="/checkout-post-meal" element={<PostMealCheckout />} />
                <Route path="/inventory" element={<InventoryManagement />} />
                
                {/* 行動裝置點餐介面 */}
                <Route path="/mobile" element={<MobilePOSInterfaceFull />} />
                <Route path="/mobile-clean" element={<CleanMobilePOS />} />
                
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
            </LayoutComponent>
          </div>
          
          {/* PWA 安裝提示 */}
          <PWAInstallPrompt />
        </Router>
      </NotificationProvider>
    </UIStyleProvider>
  )
}

export default App
