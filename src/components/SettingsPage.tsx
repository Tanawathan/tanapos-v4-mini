import React, { useState } from 'react'
import { useTheme } from '../lib/theme-store'
import ConnectionTest from './ConnectionTest'
import DiagnosticPanel from './DiagnosticPanel'
import { TodoPanel } from './common/TodoPanel'
import TableSettings from './TableSettings'
import PrinterSettingsTab from './settings/PrinterSettingsTab'

interface SettingsPageProps {
  onBack: () => void
}

// 設定頁面類型定義
type SettingsTab = 'appearance' | 'system' | 'restaurant' | 'notifications' | 'todo' | 'account' | 'printer' | 'about'

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
  const [hasUnsavedChanges] = useState(false)

  // 設定選項定義
  const settingsTabs = [
    { 
      id: 'appearance' as SettingsTab, 
      label: '外觀設定', 
      icon: '🎨',
      description: '主題、色彩、字體設定'
    },
    { 
      id: 'system' as SettingsTab, 
      label: '系統設定', 
      icon: '🔧',
      description: '語言、效能、快取設定'
    },
    { 
      id: 'restaurant' as SettingsTab, 
      label: '桌台設定', 
      icon: '🪑',
      description: '桌台參數、區域管理'
    },
    { 
      id: 'printer' as SettingsTab, 
      label: '印表機', 
      icon: '🖨️',
      description: 'USB 收據機、自動列印'
    },
    { 
      id: 'notifications' as SettingsTab, 
      label: '通知設定', 
      icon: '🔔',
      description: '系統通知、KDS 提醒'
    },
    { 
      id: 'todo' as SettingsTab, 
      label: 'TODO 管理', 
      icon: '📝',
      description: '任務管理、計時器功能'
    },
    { 
      id: 'account' as SettingsTab, 
      label: '帳戶設定', 
      icon: '👤',
      description: '個人資料、隱私設定'
    },
    { 
      id: 'about' as SettingsTab, 
      label: '關於系統', 
      icon: 'ℹ️',
      description: '版本資訊、授權資訊'
    }
  ]

  // 渲染主要內容區域
  const renderContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceSettings />
      case 'system':
        return <SystemSettings />
      case 'restaurant':
        return <TableSettings />
      case 'printer':
        return <PrinterSettingsTab />
      case 'notifications':
        return <NotificationSettings />
      case 'todo':
        return <TodoSettings />
      case 'account':
        return <AccountSettings />
      case 'about':
        return <AboutSettings />
      default:
        return <AppearanceSettings />
    }
  }

  return (
    <div className="min-h-screen bg-ui-secondary">
      {/* 頂部導航 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-3 py-2 text-sm font-medium text-ui-secondary hover:text-ui-primary hover:bg-ui-secondary rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回首頁
              </button>
              <h1 className="text-2xl font-bold text-ui-primary">⚙️ 系統設定</h1>
            </div>
            
            {/* 儲存狀態指示 */}
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-warning-600">
                  <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">有未儲存的變更</span>
                </div>
              )}
              <span className="text-sm text-ui-muted">
                {new Date().toLocaleDateString('zh-TW')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左側邊欄 - 桌面版 */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-ui-primary rounded-lg shadow-sm border border-ui p-4">
              <h3 className="text-lg font-semibold text-ui-primary mb-4">設定選項</h3>
              <nav className="space-y-2">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all duration-200
                      ${activeTab === tab.id
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                        : 'hover:bg-ui-secondary text-ui-secondary'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{tab.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-ui-muted mt-1">{tab.description}</div>
                      </div>
                      {activeTab === tab.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 頂部標籤 - 平板版 */}
          <div className="lg:hidden">
            <div className="bg-ui-primary rounded-lg shadow-sm border border-ui p-2 mb-6">
              <div className="flex overflow-x-auto space-x-2">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                      ${activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-ui-secondary hover:bg-ui-secondary'
                      }
                    `}
                  >
                    <span>{tab.icon}</span>
                    <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 主要內容區域 */}
          <div className="lg:col-span-3">
            <div className="bg-ui-primary rounded-lg shadow-sm border border-ui">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 外觀設定組件
const AppearanceSettings: React.FC = () => {
  const { settings, setThemeMode, setColorblindMode, setHighContrast, setReducedMotion } = useTheme()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ui-primary mb-2">🎨 外觀設定</h2>
        <p className="text-ui-muted">自訂系統的外觀和主題設定</p>
      </div>

      <div className="space-y-8">
        {/* 主題模式設定 */}
        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">🌟 主題模式</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { value: 'light', label: '淺色模式', icon: '☀️', description: '明亮的介面' },
              { value: 'dark', label: '深色模式', icon: '🌙', description: '護眼的深色介面' },
              { value: 'system', label: '跟隨系統', icon: '💻', description: '自動跟隨系統設定' }
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setThemeMode(mode.value as any)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-center
                  ${settings.mode === mode.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-ui hover:border-blue-300 hover:bg-ui-secondary'
                  }
                `}
              >
                <div className="text-3xl mb-2">{mode.icon}</div>
                <div className="font-medium text-ui-primary">{mode.label}</div>
                <div className="text-xs text-ui-muted mt-1">{mode.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 色彩模式設定 */}
        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">🎨 色彩模式</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { value: 'normal', label: '標準色彩', description: '使用標準的色彩系統' },
              { value: 'colorblind', label: '色盲友善', description: '使用藍橙對比配色' }
            ].map((mode) => (
              <label
                key={mode.value}
                className={`
                  flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${settings.colorblindMode === mode.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-ui hover:border-blue-300 hover:bg-ui-secondary'
                  }
                `}
              >
                <input
                  type="radio"
                  name="colorblindMode"
                  value={mode.value}
                  checked={settings.colorblindMode === mode.value}
                  onChange={() => setColorblindMode(mode.value as any)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="font-medium text-ui-primary">{mode.label}</div>
                  <div className="text-sm text-ui-muted">{mode.description}</div>
                </div>
                {settings.colorblindMode === mode.value && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            ))}
          </div>

          {/* 色彩預覽 */}
          <div className="bg-ui-secondary rounded-lg p-4">
            <h4 className="text-sm font-medium text-ui-primary mb-3">狀態色彩預覽</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="w-full h-8 bg-kds-pending rounded mb-1"></div>
                <span className="text-ui-muted">待處理</span>
              </div>
              <div className="text-center">
                <div className="w-full h-8 bg-kds-preparing rounded mb-1"></div>
                <span className="text-ui-muted">製作中</span>
              </div>
              <div className="text-center">
                <div className="w-full h-8 bg-kds-ready rounded mb-1"></div>
                <span className="text-ui-muted">完成</span>
              </div>
            </div>
          </div>
        </div>

        {/* 進階設定 */}
        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">⚙️ 進階設定</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded hover:bg-ui-secondary cursor-pointer">
              <div>
                <div className="font-medium text-ui-primary">高對比度模式</div>
                <div className="text-sm text-ui-muted">增強邊框和文字對比度</div>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="rounded border-ui focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded hover:bg-ui-secondary cursor-pointer">
              <div>
                <div className="font-medium text-ui-primary">減少動畫效果</div>
                <div className="text-sm text-ui-muted">停用過渡動畫和特效</div>
              </div>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="rounded border-ui focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* 即時預覽區域 */}
        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">👁️ 即時預覽</h3>
          
          <div className="space-y-4">
            {/* 模擬訂單卡片 */}
            <div className="border border-ui rounded-lg p-4 bg-ui-secondary">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-ui-primary">📝 訂單 #001</div>
                <span className="px-2 py-1 bg-kds-pending text-white text-xs rounded">待處理</span>
              </div>
              <div className="text-sm text-ui-muted space-y-1">
                <div>桌號：A1 👥 2人</div>
                <div>小計：NT$ 450 ⏰ 5分鐘</div>
              </div>
            </div>

            {/* 模擬KDS卡片 */}
            <div className="border border-ui rounded-lg p-4 bg-ui-secondary">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-ui-primary">🍜 牛肉麵 x2</div>
                <span className="px-2 py-1 bg-kds-ready text-white text-xs rounded">準備中</span>
              </div>
              <div className="text-sm text-ui-muted">
                <div>備註：不要辣 ⏰ 8分鐘</div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-ui">
          <button className="px-6 py-2 border border-ui rounded-lg text-ui-secondary hover:bg-ui-secondary transition-colors">
            重置為預設值
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            儲存設定
          </button>
        </div>
      </div>
    </div>
  )
}

// 暫時的佔位組件
const SystemSettings: React.FC = () => {
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ui-primary mb-2">🔧 系統設定</h2>
        <p className="text-ui-muted">設定系統語言、效能和同步選項</p>
      </div>

      <div className="space-y-8">
        {/* Supabase 連線測試 */}
        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">📡 資料庫連線測試</h3>
          <p className="text-ui-muted mb-4">檢查 Supabase 資料庫連線狀態</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <ConnectionTest />
          </div>
        </div>

        {/* 系統診斷工具 */}
        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">🔧 系統診斷工具</h3>
          <p className="text-ui-muted mb-4">檢查系統狀態、效能和錯誤診斷</p>
          <button
            onClick={() => setShowDiagnostic(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔧 開啟診斷面板
          </button>
        </div>

        {/* 簡化版本 - 避免複雜的組件造成崩潰 */}
        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">🌍 語言與地區</h3>
          <p className="text-ui-muted">語言和地區設定功能正在開發中...</p>
        </div>

        <div className="border border-ui rounded-lg p-6">
          <h3 className="text-lg font-medium text-ui-primary mb-4">⚡ 效能設定</h3>
          <p className="text-ui-muted">效能設定功能正在開發中...</p>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-ui">
          <button className="px-6 py-2 border border-ui rounded-lg text-ui-secondary hover:bg-ui-secondary transition-colors">
            重置為預設值
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            儲存設定
          </button>
        </div>
      </div>

      {/* 診斷面板 */}
      <DiagnosticPanel 
        isOpen={showDiagnostic} 
        onClose={() => setShowDiagnostic(false)} 
      />
    </div>
  )
}

const NotificationSettings: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-ui-primary mb-4">🔔 通知設定</h2>
    <p className="text-ui-muted">通知設定功能開發中...</p>
  </div>
)

const TodoSettings: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-ui-primary mb-4">📝 TODO 管理</h2>
    <TodoPanel />
  </div>
)

const AccountSettings: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-ui-primary mb-4">👤 帳戶設定</h2>
    <p className="text-ui-muted">帳戶設定功能開發中...</p>
  </div>
)

const AboutSettings: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-ui-primary mb-4">ℹ️ 關於系統</h2>
    <p className="text-ui-muted">系統資訊功能開發中...</p>
  </div>
)
