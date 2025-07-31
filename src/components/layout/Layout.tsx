import { ReactNode } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { usePOSStore } from '../../lib/store-complete'

// Icons (using simple SVG icons)
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 8.32a2 2 0 002 2.68h9.36a2 2 0 002-2.68L17 13m-10 0h10" />
  </svg>
)

const OrdersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const KDSIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TablesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { cartItems } = usePOSStore()
  
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const isDashboard = location.pathname === '/'

  const navigation = [
    { name: '菜單', href: '/menu', icon: MenuIcon, current: location.pathname === '/menu' },
    { name: '購物車', href: '/cart', icon: CartIcon, current: location.pathname === '/cart', badge: cartItemCount },
    { name: '訂單', href: '/orders', icon: OrdersIcon, current: location.pathname === '/orders' },
    { name: 'KDS', href: '/kds', icon: KDSIcon, current: location.pathname === '/kds' },
    { name: '桌位', href: '/tables', icon: TablesIcon, current: location.pathname === '/tables' },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - 精簡版 */}
      {!isDashboard && (
        <header className="bg-white shadow-sm border-b border-gray-200 compact-header layout-header-mobile layout-header-tablet layout-header-desktop">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-gray-900">TanaPOS V4-Mini</h1>
            <div className="flex items-center space-x-1 status-indicator">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">本地模式</span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-hidden ${isDashboard ? '' : 'mb-16'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isDashboard && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 layout-nav-mobile layout-nav-tablet layout-nav-desktop">
          <div className="flex justify-around">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors nav-item ${
                    item.current
                      ? 'text-emerald-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="relative">
                    <Icon />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="mt-1">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
