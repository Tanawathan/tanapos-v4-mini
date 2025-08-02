import { ReactNode } from 'react'
import { useLocation, Link } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

interface LayoutProps {
  children: ReactNode
}

export default function SimpleLayout({ children }: LayoutProps) {
  const location = useLocation()
  const isDashboard = location.pathname === '/'

  return (
    <div className="min-h-screen bg-background text-foreground dark-mode-transition">
      {/* 簡單標題 */}
      {!isDashboard && (
        <header className="bg-card shadow-sm border-b border-border p-4 pos-navbar">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="text-xl font-bold text-foreground hover:text-primary"
            >
              ← TanaPOS V4-Mini
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {location.pathname === '/reports' ? '營業報表' : 
                 location.pathname === '/kds' ? '廚房顯示系統' :
                 location.pathname === '/kds-mobile' ? '廚房顯示系統 (移動版)' :
                 location.pathname === '/pos' ? '點餐系統' : 
                 location.pathname === '/orders' ? '訂單管理系統' :
                 location.pathname === '/tables' ? '桌位管理系統' :
                 location.pathname === '/checkout' ? '完整結帳系統' :
                 location.pathname === '/admin' ? '後台管理系統' : '系統'}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      {/* 主要內容 */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
