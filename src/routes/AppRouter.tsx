import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HomePage from '../pages/HomePage'
import OrderingPage from '../components/OrderingPage' // legacy ordering (保留備用)
import OrdersPage from '../components/OrdersPage'
import TableManagementPage from '../components/TableManagementPage'
import CheckoutPage from '../components/CheckoutPage'
import SettingsPage from '../components/SettingsPage'
import MenuManagementPage from '../components/MenuManagementPage'
import MobileOrderingPage from '../components/MobileOrderingPage'
import { KDSPage } from '../components/KDSPage'
import LoginPage from '../components/LoginPage'
import ReservationManagementPage from '../pages/ReservationManagementPage'
import EnhancedReservationPage from '../pages/EnhancedReservationPage'
import { OrderingLayout } from '../ordering/components'
import { withRouterNavigation } from '../components/withRouterNavigation'
import { supabase } from '../lib/supabase'

// 包裝組件以支持路由導航
const OrderingPageWithRouter = withRouterNavigation(OrderingPage)
const OrdersPageWithRouter = withRouterNavigation(OrdersPage)
const TableManagementPageWithRouter = withRouterNavigation(TableManagementPage)
const CheckoutPageWithRouter = withRouterNavigation(CheckoutPage)
const SettingsPageWithRouter = withRouterNavigation(SettingsPage)
const MenuManagementPageWithRouter = withRouterNavigation(MenuManagementPage)
const MobileOrderingPageWithRouter = withRouterNavigation(MobileOrderingPage)
const KDSPageWithRouter = withRouterNavigation(KDSPage)
const ReservationManagementPageWithRouter = withRouterNavigation(ReservationManagementPage)
const EnhancedReservationPageWithRouter = withRouterNavigation(EnhancedReservationPage)

// 保護路由組件
interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Optional auth bypass for local E2E/dev
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true'
  if (bypassAuth) {
    return <>{children}</>
  }
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 認證狀態檢查中
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-ui-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-ui-primary mb-2">
            檢查認證狀態...
          </h2>
          <p className="text-ui-muted">
            正在驗證用戶身份
          </p>
        </div>
      </div>
    )
  }

  // 未認證 - 重定向到登入頁面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 登入頁面 - 不需要認證 */}
        <Route path="/login" element={<LoginPage onLoginSuccess={() => {}} />} />
        
        {/* 受保護的路由 */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        {/* 新版點餐 (v2) 做為預設 /ordering 路由 */}
        <Route 
          path="/ordering" 
          element={
            <ProtectedRoute>
              <OrderingLayout />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <OrdersPageWithRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tables" 
          element={
            <ProtectedRoute>
              <TableManagementPageWithRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <CheckoutPageWithRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/kds" 
          element={
            <ProtectedRoute>
              <KDSPageWithRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPageWithRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/menu" 
          element={
            <ProtectedRoute>
              <MenuManagementPageWithRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mobile" 
          element={
            <ProtectedRoute>
              <MobileOrderingPageWithRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reservations" 
          element={
            <ProtectedRoute>
              <EnhancedReservationPageWithRouter />
            </ProtectedRoute>
          } 
        />
  {/* 舊的 /ordering-v2 路由保留，導向 /ordering 以避免外部舊連結失效 */}
  <Route path="/ordering-v2" element={<Navigate to="/ordering" replace />} />
        <Route 
          path="/reservations/legacy" 
          element={
            <ProtectedRoute>
              <ReservationManagementPageWithRouter />
            </ProtectedRoute>
          } 
        />
        
        {/* 重定向其他路徑到首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default AppRouter
