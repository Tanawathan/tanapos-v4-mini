// ================================
// 庫存管理系統 - 佈局組件
// ================================

import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  PackageIcon,
  BarChart3Icon,
  PackageSearchIcon,
  PackageOpenIcon,
  ShoppingCartIcon,
  UsersIcon,
  SettingsIcon,
  BellIcon,
} from 'lucide-react';

// 庫存系統導航項目
const inventoryNavItems = [
  {
    name: '庫存總覽',
    href: '/inventory',
    icon: BarChart3Icon,
    description: '即時庫存監控和統計',
  },
  {
    name: '庫存查詢',
  href: '/inventory/products',
    icon: PackageSearchIcon,
    description: '查詢商品和原物料庫存',
  },
  {
    name: '庫存異動',
    href: '/inventory/transactions',
    icon: PackageOpenIcon,
    description: '入庫、出庫、調整作業',
  },
  {
    name: '採購管理',
  href: '/inventory/restock',
    icon: ShoppingCartIcon,
    description: '採購訂單和收貨管理',
  },
  {
    name: '供應商管理',
  href: '/inventory/materials',
    icon: UsersIcon,
    description: '供應商檔案和績效',
  },
  {
    name: '報表分析',
  href: '/inventory/analytics',
    icon: BarChart3Icon,
    description: '庫存和採購報表',
  },
  {
    name: '系統設定',
  href: '/inventory/import-export',
    icon: SettingsIcon,
    description: '庫存系統設定',
  },
];

interface InventoryLayoutProps {
  children?: React.ReactNode;
}

export const InventoryLayout: React.FC<InventoryLayoutProps> = ({ children }) => {
  const location = useLocation();

  // 獲取當前活動的導航項目
  const getCurrentNavItem = () => {
    return inventoryNavItems.find(item => 
      location.pathname === item.href || 
      (item.href !== '/inventory' && location.pathname.startsWith(item.href))
    ) || inventoryNavItems[0];
  };

  const currentNavItem = getCurrentNavItem();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航條 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左側 - 系統標題 */}
            <div className="flex items-center">
              <PackageIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">庫存管理系統</h1>
                <p className="text-sm text-gray-500">{currentNavItem.description}</p>
              </div>
            </div>

            {/* 右側 - 快速操作 */}
            <div className="flex items-center space-x-4">
              {/* 警示通知 */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>
              
              {/* 快速補貨按鈕 */}
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                快速補貨
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容區域 */}
      <div className="flex">
        {/* 側邊導航 */}
        <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {inventoryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href !== '/inventory' && location.pathname.startsWith(item.href));
                
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* 主要內容 */}
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

// ================================
// 頁面標題組件
// ================================

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex space-x-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// ================================
// 統計卡片組件
// ================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center">
          {Icon && (
            <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className={`${Icon ? 'ml-4' : ''} flex-1`}>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {trend && (
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </p>
              )}
            </div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================
// 載入狀態組件
// ================================

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

// ================================
// 錯誤狀態組件
// ================================

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '發生錯誤',
  message,
  onRetry,
}) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-red-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            重試
          </button>
        </div>
      )}
    </div>
  );
};

// ================================
// 空狀態組件
// ================================

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  action,
}) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto h-12 w-12 text-gray-400">
          <Icon className="h-full w-full" />
        </div>
      )}
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryLayout;
