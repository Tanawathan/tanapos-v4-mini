import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { APP_CONFIG, RESTAURANT_INFO } from '../../config'
import ComboManagementEnhanced from './ComboManagementEnhanced'

// 危險操作確認對話框組件
interface DangerConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  onConfirm: () => void
  onCancel: () => void
  requiresTyping?: boolean
  requiredText?: string
}

function DangerConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  onConfirm, 
  onCancel,
  requiresTyping = false,
  requiredText = '確認刪除'
}: DangerConfirmModalProps) {
  const [typedText, setTypedText] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (isOpen) {
      setTypedText('')
      setCountdown(5)
      const timer = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 0)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const canConfirm = requiresTyping 
    ? typedText === requiredText && countdown === 0
    : countdown === 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="text-red-500 text-3xl mr-3">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{title}</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
          
          {requiresTyping && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                請輸入「{requiredText}」以確認此操作：
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={requiredText}
              />
            </div>
          )}
          
          {countdown > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                請等待 {countdown} 秒後才能確認操作...
              </p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`flex-1 px-4 py-2 rounded-md text-white ${
              canConfirm 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// 系統設定管理組件
export default function AdminSystem() {
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'general'
  const [activeTab, setActiveTab] = useState<'general' | 'database' | 'features' | 'layout' | 'reports' | 'dataexport' | 'backup' | 'dbeditor' | 'userguide' | 'operationguide' | 'combos'>(defaultTab as any)
  const [systemConfig, setSystemConfig] = useState(APP_CONFIG)
  const [restaurantInfo, setRestaurantInfo] = useState(RESTAURANT_INFO)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  
  // 危險操作確認對話框狀態
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    onConfirm: () => void
    requiresTyping?: boolean
    requiredText?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    requiresTyping: false,
    requiredText: '確認刪除'
  })

  // 檢查資料庫連線狀態
  const checkDatabaseConnection = async () => {
    try {
      setDbStatus('checking')
      const { data, error } = await supabase.from('categories').select('count')
      if (error) {
        setDbStatus('disconnected')
      } else {
        setDbStatus('connected')
      }
    } catch (err) {
      setDbStatus('disconnected')
    }
  }

  useEffect(() => {
    checkDatabaseConnection()
    loadRestaurantInfo() // 載入餐廳資訊
    // 每30秒檢查一次連線狀態
    const interval = setInterval(checkDatabaseConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  // 從資料庫載入餐廳資訊
  const loadRestaurantInfo = async () => {
    try {
      console.log('🔍 正在從資料庫載入餐廳資訊...')
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1)
        .single()
      
      if (error) {
        console.error('載入餐廳資訊失敗:', error)
        if (error.code === '42P01') {
          setMessage('❌ 資料庫表不存在，請檢查資料庫設定')
        } else {
          setMessage(`❌ 載入餐廳資訊失敗: ${error.message}`)
        }
        return
      }
      
      if (data) {
        console.log('✅ 成功載入餐廳資訊:', data.name)
        setRestaurantInfo({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: '' // 資料庫中沒有 website 欄位，先設為空
        })
      }
    } catch (err) {
      console.error('載入餐廳資訊錯誤:', err)
      setMessage('❌ 無法連接到資料庫，請檢查網路連線')
    }
  }

  // 保存設定到資料庫
  const saveSettings = async (section: string, data: any) => {
    setLoading(true)
    try {
      if (section === 'restaurant_info') {
        // 先獲取現有餐廳的 ID
        const { data: restaurants, error: selectError } = await supabase
          .from('restaurants')
          .select('id')
          .limit(1)
        
        if (selectError) {
          throw selectError
        }
        
        if (restaurants && restaurants.length > 0) {
          // 更新現有餐廳資訊
          const { error } = await supabase
            .from('restaurants')
            .update({
              name: data.name,
              address: data.address,
              phone: data.phone,
              email: data.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', restaurants[0].id)
          
          if (error) {
            throw error
          }
        } else {
          // 如果沒有餐廳記錄，創建新的
          const { error } = await supabase
            .from('restaurants')
            .insert({
              name: data.name,
              address: data.address,
              phone: data.phone,
              email: data.email
            })
          
          if (error) {
            throw error
          }
        }
        
        setMessage('✅ 餐廳資訊已成功保存到資料庫！')
      } else {
        // 其他設定保存到 localStorage
        localStorage.setItem(`tanapos_${section}`, JSON.stringify(data))
        setMessage(`${section} 設定已保存`)
      }
      
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      console.error('保存設定失敗:', err)
      setMessage(`❌ 保存失敗: ${err.message || '請重試'}`)
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // 危險操作處理函數
  const handleDangerousOperation = (
    title: string,
    message: string,
    confirmText: string,
    operation: () => void,
    requiresTyping: boolean = false,
    requiredText: string = '確認刪除'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm: () => {
        operation()
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      },
      requiresTyping,
      requiredText
    })
  }

  // 重置測試資料
  const resetTestData = async () => {
    setLoading(true)
    try {
      // 這裡實現重置邏輯
      setMessage('測試資料已重置')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage('重置失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  // 清除所有資料
  const clearAllData = async () => {
    setLoading(true)
    try {
      // 實現清除所有資料的邏輯
      setMessage('所有資料已清除')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage('清除失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  // 資料庫優化
  const optimizeDatabase = async () => {
    setLoading(true)
    try {
      // 實現資料庫優化邏輯
      setMessage('資料庫優化完成')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage('優化失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 頂部導航 */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ⚙️ TanaPOS 後台管理系統
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 連線狀態指示器 */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  dbStatus === 'connected' ? 'bg-green-500' : 
                  dbStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {dbStatus === 'connected' ? '資料庫已連線' : 
                   dbStatus === 'disconnected' ? '資料庫未連線' : '檢查中...'}
                </span>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                返回主系統
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 成功/錯誤訊息 */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 側邊選單 */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">管理選單</h2>
              </div>
              <div className="p-2">
                {[
                  { id: 'general', label: '基本設定', icon: '🏪' },
                  { id: 'database', label: '資料庫管理', icon: '🗄️' },
                  { id: 'combos', label: '套餐管理', icon: '🍽️' },
                  { id: 'dbeditor', label: '資料庫編輯器', icon: '📝' },
                  { id: 'features', label: '功能開關', icon: '🔧' },
                  { id: 'layout', label: '佈局管理', icon: '🏗️' },
                  { id: 'reports', label: '報表設定', icon: '📊' },
                  { id: 'dataexport', label: '資料匯出入', icon: '📁' },
                  { id: 'backup', label: '備份與還原', icon: '💾' },
                  { id: 'userguide', label: '使用說明', icon: '📖', condition: systemConfig.FEATURES?.USER_GUIDE },
                  { id: 'operationguide', label: '操作指南', icon: '🎯', condition: systemConfig.FEATURES?.OPERATION_GUIDE }
                ].filter(tab => tab.condition !== false).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* 主要內容區域 */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {activeTab === 'general' && (
                <GeneralSettings
                  restaurantInfo={restaurantInfo}
                  onSave={(data) => {
                    setRestaurantInfo(data)
                    saveSettings('restaurant_info', data)
                  }}
                  loading={loading}
                />
              )}

              {activeTab === 'database' && (
                <DatabaseManagement
                  dbStatus={dbStatus}
                  onRefresh={checkDatabaseConnection}
                  loading={loading}
                  onDangerousOperation={handleDangerousOperation}
                />
              )}

              {activeTab === 'combos' && (
                <ComboManagementEnhanced />
              )}

              {activeTab === 'dbeditor' && (
                <DatabaseEditor
                  loading={loading}
                />
              )}

              {activeTab === 'features' && (
                <FeatureToggles
                  config={systemConfig}
                  onSave={(data) => {
                    setSystemConfig(data)
                    saveSettings('system_config', data)
                  }}
                  loading={loading}
                />
              )}

              {activeTab === 'layout' && (
                <LayoutManagement
                  onSave={(data) => saveSettings('layout_config', data)}
                  loading={loading}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsSettings
                  onSave={(data) => saveSettings('reports_config', data)}
                  loading={loading}
                />
              )}

              {activeTab === 'dataexport' && (
                <DataExportImport
                  loading={loading}
                />
              )}

              {activeTab === 'backup' && (
                <BackupRestore
                  onBackup={() => {/* 備份邏輯 */}}
                  onRestore={() => {/* 還原邏輯 */}}
                  loading={loading}
                  onDangerousOperation={handleDangerousOperation}
                />
              )}

              {activeTab === 'userguide' && (
                <UserGuide />
              )}

              {activeTab === 'operationguide' && (
                <OperationGuide />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 危險操作確認對話框 */}
      <DangerConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        requiresTyping={confirmModal.requiresTyping}
        requiredText={confirmModal.requiredText}
      />
    </div>
  )
}

// 基本設定組件
interface GeneralSettingsProps {
  restaurantInfo: typeof RESTAURANT_INFO
  onSave: (data: typeof RESTAURANT_INFO) => void
  loading: boolean
}

function GeneralSettings({ restaurantInfo, onSave, loading }: GeneralSettingsProps) {
  const [formData, setFormData] = useState(restaurantInfo)

  // 當 restaurantInfo 更新時，同步更新 formData
  useEffect(() => {
    setFormData(restaurantInfo)
  }, [restaurantInfo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">餐廳基本資訊</h3>
        <p className="text-gray-600 dark:text-gray-400">設定餐廳的基本資訊，這些資訊將顯示在系統各處。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              餐廳名稱
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              聯絡電話
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              餐廳地址
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              電子郵件
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 官方網站欄位暫時隱藏，因為資料庫表中沒有 website 欄位 */}
          {false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                官方網站
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存設定'}
          </button>
        </div>
      </form>
    </div>
  )
}

// 資料庫管理組件
interface DatabaseManagementProps {
  dbStatus: 'connected' | 'disconnected' | 'checking'
  onRefresh: () => void
  loading: boolean
  onDangerousOperation?: (
    title: string,
    message: string,
    confirmText: string,
    operation: () => void,
    requiresTyping?: boolean,
    requiredText?: string
  ) => void
}

function DatabaseManagement({ dbStatus, onRefresh, loading, onDangerousOperation }: DatabaseManagementProps) {
  const [dbStats, setDbStats] = useState<any>(null)

  const loadDatabaseStats = async () => {
    try {
      const [categoriesResult, productsResult, tablesResult, ordersResult] = await Promise.all([
        supabase.from('categories').select('count'),
        supabase.from('products').select('count'),
        supabase.from('tables').select('count'),
        supabase.from('orders').select('count')
      ])

      setDbStats({
        categories: categoriesResult.data?.length || 0,
        products: productsResult.data?.length || 0,
        tables: tablesResult.data?.length || 0,
        orders: ordersResult.data?.length || 0
      })
    } catch (err) {
      console.error('載入資料庫統計失敗:', err)
    }
  }

  useEffect(() => {
    if (dbStatus === 'connected') {
      loadDatabaseStats()
    }
  }, [dbStatus])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">資料庫管理</h3>
        <p className="text-gray-600 dark:text-gray-400">監控和管理系統資料庫。</p>
      </div>

      {/* 連線狀態 */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              dbStatus === 'connected' ? 'bg-green-500' : 
              dbStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="font-medium text-gray-900 dark:text-white">
              資料庫狀態: {dbStatus === 'connected' ? '已連線' : 
                          dbStatus === 'disconnected' ? '未連線' : '檢查中...'}
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            重新檢查
          </button>
        </div>
      </div>

      {/* 資料庫統計 */}
      {dbStatus === 'connected' && dbStats && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">資料統計</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '產品分類', value: dbStats.categories, icon: '📂' },
              { label: '產品數量', value: dbStats.products, icon: '🍽️' },
              { label: '桌位數量', value: dbStats.tables, icon: '🪑' },
              { label: '訂單總數', value: dbStats.orders, icon: '📋' }
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 資料庫操作 */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">資料庫操作</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onDangerousOperation?.(
              '重置測試資料',
              '此操作將會刪除所有現有資料並恢復系統預設的測試資料。\n\n⚠️ 警告：這將無法復原，請確保您已經備份重要資料！',
              '確認重置',
              async () => {
                // 實際重置邏輯
                console.log('執行重置測試資料')
              },
              true,
              '重置測試資料'
            )}
            className="p-4 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-800"
          >
            <div className="text-orange-600 dark:text-orange-300 text-2xl mb-2">🔄</div>
            <div className="font-medium text-orange-900 dark:text-orange-100">重置測試資料</div>
            <div className="text-sm text-orange-600 dark:text-orange-300">⚠️ 危險操作 - 恢復示範資料</div>
          </button>
          
          <button 
            onClick={() => onDangerousOperation?.(
              '資料庫優化',
              '此操作將會對資料庫進行優化處理，包括清理無用資料和重建索引。\n\n一般情況下這是安全的操作，但建議在低峰時段執行。',
              '開始優化',
              async () => {
                // 實際優化邏輯
                console.log('執行資料庫優化')
              },
              false
            )}
            className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-800"
          >
            <div className="text-green-600 dark:text-green-300 text-2xl mb-2">📊</div>
            <div className="font-medium text-green-900 dark:text-green-100">資料庫優化</div>
            <div className="text-sm text-green-600 dark:text-green-300">清理和優化資料庫</div>
          </button>
          
          <button className="p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800">
            <div className="text-purple-600 dark:text-purple-300 text-2xl mb-2">📈</div>
            <div className="font-medium text-purple-900 dark:text-purple-100">效能監控</div>
            <div className="text-sm text-purple-600 dark:text-purple-300">查看效能指標</div>
          </button>
        </div>
        
        {/* 額外的危險操作區域 */}
        <div className="mt-8 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <h5 className="text-lg font-medium text-red-900 dark:text-red-100 mb-3">⚠️ 危險操作區域</h5>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            以下操作具有高風險，執行前請確保您了解後果並已備份重要資料
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => onDangerousOperation?.(
                '清除所有資料',
                '⚠️ 極度危險！\n\n此操作將會永久刪除資料庫中的所有資料，包括：\n• 所有產品和分類\n• 所有桌位設定\n• 所有訂單記錄\n• 所有系統設定\n\n此操作無法復原！請確保您真的需要執行此操作。',
                '永久刪除所有資料',
                async () => {
                  // 實際清除邏輯
                  console.log('執行清除所有資料')
                },
                true,
                '清除所有資料'
              )}
              className="p-3 bg-red-100 dark:bg-red-800 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-200 dark:hover:bg-red-700"
            >
              <div className="text-red-600 dark:text-red-300 text-xl mb-1">🗑️</div>
              <div className="font-medium text-red-900 dark:text-red-100 text-sm">清除所有資料</div>
            </button>
            
            <button 
              onClick={() => onDangerousOperation?.(
                '重置系統設定',
                '此操作將會重置所有系統設定回到預設值，包括：\n• 餐廳資訊\n• 功能開關\n• 佈局設定\n• 用戶偏好設定\n\n資料不會被刪除，但設定將會遺失。',
                '重置設定',
                async () => {
                  // 實際重置設定邏輯
                  console.log('執行重置系統設定')
                },
                true,
                '重置系統設定'
              )}
              className="p-3 bg-red-100 dark:bg-red-800 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-200 dark:hover:bg-red-700"
            >
              <div className="text-red-600 dark:text-red-300 text-xl mb-1">⚙️</div>
              <div className="font-medium text-red-900 dark:text-red-100 text-sm">重置系統設定</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 功能開關組件
interface FeatureTogglesProps {
  config: typeof APP_CONFIG
  onSave: (data: typeof APP_CONFIG) => void
  loading: boolean
}

function FeatureToggles({ config, onSave, loading }: FeatureTogglesProps) {
  const [features, setFeatures] = useState(config.FEATURES)

  const handleToggle = (feature: string) => {
    const newFeatures = {
      ...features,
      [feature]: !features[feature as keyof typeof features]
    }
    setFeatures(newFeatures)
  }

  const handleSave = () => {
    const newConfig = {
      ...config,
      FEATURES: features
    }
    onSave(newConfig)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">功能開關</h3>
        <p className="text-gray-600 dark:text-gray-400">控制系統各項功能的啟用狀態。</p>
      </div>

      <div className="space-y-4">
        {Object.entries(features).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getFeatureDescription(key)}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleToggle(key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存設定'}
        </button>
      </div>
    </div>
  )
}

// 其他組件的占位符
function LayoutManagement({ onSave, loading }: { onSave: (data: any) => void, loading: boolean }) {
  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">佈局管理</h3>
      <p className="text-gray-600 dark:text-gray-400">管理場地佈局和界面設定。</p>
      {/* 這裡可以整合現有的 FloorLayoutEditor */}
    </div>
  )
}

function ReportsSettings({ onSave, loading }: { onSave: (data: any) => void, loading: boolean }) {
  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">報表設定</h3>
      <p className="text-gray-600 dark:text-gray-400">設定報表的產生頻率和內容。</p>
    </div>
  )
}

// 資料匯出入組件
function DataExportImport({ loading }: { loading: boolean }) {
  // 資料表結構定義
  const tableStructures = {
    restaurants: {
      name: '餐廳資訊',
      description: '餐廳基本資訊設定',
      fields: {
        id: 'UUID (自動產生)',
        name: '餐廳名稱 (必填)',
        address: '餐廳地址',
        phone: '聯絡電話',
        email: '電子郵件',
        tax_rate: '稅率 (小數)',
        currency: '貨幣代碼',
        timezone: '時區',
        is_active: '是否啟用 (true/false)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        name: 'TanaPOS 示範餐廳',
        address: '台北市信義區信義路五段7號',
        phone: '02-2345-6789',
        email: 'demo@tanapos.com',
        tax_rate: '0.1',
        currency: 'TWD',
        timezone: 'Asia/Taipei',
        is_active: 'true'
      }
    },
    categories: {
      name: '產品分類',
      description: '菜單分類管理',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        name: '分類名稱 (必填)',
        description: '分類描述',
        sort_order: '排序順序 (數字)',
        color: '分類顏色 (HEX色碼)',
        icon: '分類圖示 (Emoji)',
        is_active: '是否啟用 (true/false)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        name: '熱飲',
        description: '各式熱飲咖啡茶品',
        sort_order: '1',
        color: '#E53E3E',
        icon: '☕',
        is_active: 'true'
      }
    },
    products: {
      name: '產品項目',
      description: '菜單產品管理 (支援庫存)',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        category_id: '分類ID (需對應categories表)',
        name: '產品名稱 (必填)',
        description: '產品描述',
        sku: '產品編號 (唯一)',
        price: '售價 (數字)',
        cost: '成本 (數字)',
        image_url: '圖片網址',
        sort_order: '排序順序 (數字)',
        is_available: '是否可售 (true/false)',
        is_active: '是否啟用 (true/false)',
        actual_stock: '實際庫存 (數字)',
        virtual_stock: '虛擬庫存 (數字)',
        total_available: '總可用量 (數字)',
        min_stock: '最低庫存 (數字)',
        preparation_time: '製作時間(分鐘)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        name: '美式咖啡',
        description: '經典美式黑咖啡',
        sku: 'HOT001',
        price: '120',
        cost: '50',
        sort_order: '1',
        is_available: 'true',
        is_active: 'true',
        actual_stock: '0',
        virtual_stock: '0',
        min_stock: '5',
        preparation_time: '5'
      }
    },
    tables: {
      name: '桌位管理',
      description: '餐廳桌位設定 (支援桌台管理)',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        table_number: '桌號 (數字，必填)',
        name: '桌位名稱',
        capacity: '容納人數 (數字)',
        status: '桌位狀態 (available/occupied/reserved/cleaning/maintenance)',
        qr_code: 'QR碼內容',
        position_x: 'X座標位置 (數字)',
        position_y: 'Y座標位置 (數字)',
        table_type: '桌位類型 (square/round/booth)',
        floor_plan: '樓層平面圖',
        is_active: '是否啟用 (true/false)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        table_number: '1',
        name: '1號桌',
        capacity: '4',
        status: 'available',
        position_x: '100',
        position_y: '100',
        table_type: 'square',
        floor_plan: 'main',
        is_active: 'true'
      }
    },
    suppliers: {
      name: '供應商管理',
      description: '原物料供應商資訊',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        name: '供應商名稱 (必填)',
        contact_person: '聯絡人',
        phone: '聯絡電話',
        email: '電子郵件',
        address: '地址',
        payment_terms: '付款條件',
        delivery_days: '配送日期',
        min_order_amount: '最低訂購金額',
        is_active: '是否啟用 (true/false)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        name: '優質肉品供應商',
        contact_person: '李經理',
        phone: '02-1234-5678',
        email: 'meat@supplier.com',
        address: '台北市中山區',
        payment_terms: '月結30天',
        delivery_days: '週一,週三,週五',
        min_order_amount: '5000',
        is_active: 'true'
      }
    },
    raw_materials: {
      name: '原物料管理',
      description: '第一層：原始食材庫存',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        supplier_id: '供應商ID (對應suppliers表)',
        name: '原料名稱 (必填)',
        category: '原料分類 (肉類/蔬菜/調料等)',
        unit: '計量單位 (公斤/公升/包等)',
        current_stock: '當前庫存 (數字)',
        min_stock: '最低庫存 (數字)',
        max_stock: '最高庫存 (數字)',
        cost: '成本價格 (數字)',
        expiry_date: '到期日 (YYYY-MM-DD)',
        storage_location: '儲存位置',
        last_restock_date: '上次進貨日期',
        sku: '料號 (唯一)',
        barcode: '條碼',
        is_active: '是否啟用 (true/false)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        name: '雞胸肉',
        category: '肉類',
        unit: '公斤',
        current_stock: '15.5',
        min_stock: '5',
        max_stock: '50',
        cost: '180',
        expiry_date: '2025-08-05',
        storage_location: '冷藏庫A',
        sku: 'RAW001',
        is_active: 'true'
      }
    },
    semi_finished_products: {
      name: '半成品管理',
      description: '第二層：半成品庫存',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        name: '半成品名稱 (必填)',
        category: '半成品分類 (主料/配菜/醬料等)',
        unit: '計量單位 (份/盤/碗等)',
        actual_stock: '實際庫存 (數字)',
        min_actual_stock: '最低實際庫存 (數字)',
        virtual_stock: '虛擬庫存 (數字，計算得出)',
        total_available: '總可用量 (數字，計算得出)',
        preparation_time: '製作時間(分鐘)',
        shelf_life: '保存時間(小時)',
        actual_cost: '實際製作成本 (數字)',
        virtual_cost: '虛擬製作成本 (數字)',
        auto_restock: '自動補製 (true/false)',
        restock_threshold: '補製閾值 (數字)',
        sku: '料號 (唯一)',
        recipe_id: '食譜ID (對應recipes表)',
        is_active: '是否啟用 (true/false)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        name: '炒雞肉絲',
        category: '主料',
        unit: '份',
        actual_stock: '12',
        min_actual_stock: '5',
        preparation_time: '15',
        shelf_life: '4',
        actual_cost: '85',
        auto_restock: 'true',
        restock_threshold: '8',
        sku: 'SEMI001',
        is_active: 'true'
      }
    },
    recipes: {
      name: '食譜系統',
      description: '製作配方管理',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        name: '食譜名稱 (必填)',
        type: '食譜類型 (raw_to_semi/semi_to_menu/mixed_to_menu)',
        target_id: '目標產品ID',
        target_type: '目標類型 (semi/menu)',
        yield_quantity: '產出數量 (數字)',
        preparation_time: '製作時間(分鐘)',
        difficulty: '難度等級 (easy/medium/hard)',
        instructions: '製作步驟',
        cost_calculation: '成本計算方式 (auto/manual)',
        manual_cost: '手動成本 (數字)',
        labor_cost: '人工成本 (數字)',
        overhead_cost: '間接成本 (數字)',
        is_active: '是否啟用 (true/false)',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        name: '炒雞肉絲食譜',
        type: 'raw_to_semi',
        yield_quantity: '10',
        preparation_time: '15',
        difficulty: 'easy',
        instructions: '1. 雞肉切絲 2. 熱鍋下油 3. 炒至熟透',
        cost_calculation: 'auto',
        labor_cost: '20',
        is_active: 'true'
      }
    },
    table_reservations: {
      name: '桌位預約',
      description: '客戶預約管理',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        table_id: '桌位ID (對應tables表)',
        customer_name: '客戶姓名 (必填)',
        customer_phone: '客戶電話',
        customer_email: '客戶郵件',
        party_size: '用餐人數 (數字)',
        reservation_time: '預約時間 (YYYY-MM-DD HH:MM:SS)',
        duration_minutes: '預計用餐時間(分鐘)',
        status: '預約狀態 (pending/confirmed/seated/completed/cancelled/no_show)',
        special_requests: '特殊需求',
        deposit_amount: '訂金金額 (數字)',
        deposit_paid: '是否已付訂金 (true/false)',
        notes: '備註',
        created_by: '建立者',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        customer_name: '王小明',
        customer_phone: '0912345678',
        party_size: '4',
        reservation_time: '2025-08-01 19:00:00',
        duration_minutes: '120',
        status: 'confirmed',
        special_requests: '靠窗座位',
        deposit_amount: '500',
        deposit_paid: 'true',
        notes: '生日聚餐'
      }
    },
    orders: {
      name: '訂單資料',
      description: '客戶訂單管理',
      fields: {
        id: 'UUID (自動產生)',
        restaurant_id: '餐廳ID (自動關聯)',
        table_id: '桌位ID (可選)',
        order_number: '訂單編號 (唯一，必填)',
        table_number: '桌號 (數字)',
        customer_name: '客戶姓名',
        customer_phone: '客戶電話',
        subtotal: '小計金額 (數字)',
        tax_amount: '稅額 (數字)',
        total_amount: '總金額 (數字)',
        status: '訂單狀態 (pending/confirmed/preparing/ready/served/completed/cancelled)',
        payment_status: '付款狀態 (unpaid/partial/paid/refunded)',
        payment_method: '付款方式',
        notes: '備註',
        created_by: '建立者',
        served_at: '送餐時間',
        completed_at: '完成時間',
        created_at: '建立時間 (自動)',
        updated_at: '更新時間 (自動)'
      },
      example: {
        order_number: 'ORD-20250730-001',
        table_number: '1',
        customer_name: '王小明',
        customer_phone: '0912345678',
        subtotal: '300',
        tax_amount: '15',
        total_amount: '315',
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'cash',
        notes: '不要加糖'
      }
    }
  };

  // 產生CSV內容
  const generateCSV = (tableName: string) => {
    const structure = tableStructures[tableName as keyof typeof tableStructures]
    if (!structure) return ''

    const headers = Object.keys(structure.fields).filter(key => 
      !['id', 'restaurant_id', 'created_at', 'updated_at'].includes(key)
    )
    
    const csvContent = [
      headers.join(','),
      Object.values(structure.example).join(',')
    ].join('\n')

    return csvContent
  }

  // 下載CSV範例檔案
  const downloadCSV = (tableName: string) => {
    const csvContent = generateCSV(tableName)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${tableName}_template.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 下載所有範例檔案
  const downloadAllTemplates = () => {
    Object.keys(tableStructures).forEach(tableName => {
      setTimeout(() => downloadCSV(tableName), 100 * Object.keys(tableStructures).indexOf(tableName))
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">資料匯出入管理</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            下載CSV範例檔案，填寫後可上傳至Supabase資料庫
          </p>
        </div>
        <button
          onClick={downloadAllTemplates}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>📦</span>
          <span>下載全部範例</span>
        </button>
      </div>

      {/* 資料表列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(tableStructures).map(([tableName, structure]) => (
          <div key={tableName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{structure.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{structure.description}</p>
              </div>
              <button
                onClick={() => downloadCSV(tableName)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                下載CSV
              </button>
            </div>
            
            {/* 欄位說明 */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">欄位說明：</h5>
              <div className="text-xs space-y-1">
                {Object.entries(structure.fields).map(([field, description]) => (
                  <div key={field} className="flex justify-between">
                    <span className="font-mono text-blue-600 dark:text-blue-400">{field}</span>
                    <span className="text-gray-600 dark:text-gray-400">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 使用說明 */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">📋 使用說明</h4>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p><strong>1. 下載範例：</strong> 點擊「下載CSV」獲取對應資料表的範例檔案</p>
          <p><strong>2. 編輯資料：</strong> 使用Excel或文字編輯器填寫資料，請勿修改欄位名稱</p>
          <p><strong>3. 上傳到Supabase：</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• 登入您的Supabase專案: <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">https://app.supabase.com</a></li>
            <li>• 進入「Table Editor」</li>
            <li>• 選擇對應的資料表</li>
            <li>• 點擊「Insert」→「Upload CSV」</li>
            <li>• 選擇您編輯好的CSV檔案上傳</li>
          </ul>
          <p><strong>注意事項：</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• 標記「(必填)」的欄位不可為空</li>
            <li>• 標記「(自動產生)」的欄位可留空，系統會自動填入</li>
            <li>• 日期格式請使用: YYYY-MM-DD HH:MM:SS</li>
            <li>• 布林值請使用: true 或 false</li>
            <li>• 上傳前請先備份現有資料</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function BackupRestore({ onBackup, onRestore, loading, onDangerousOperation }: { 
  onBackup: () => void, 
  onRestore: () => void, 
  loading: boolean,
  onDangerousOperation?: (
    title: string,
    message: string,
    confirmText: string,
    operation: () => void,
    requiresTyping?: boolean,
    requiredText?: string
  ) => void
}) {
  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">備份與還原</h3>
      <p className="text-gray-600 dark:text-gray-400">管理系統資料的備份和還原。</p>
      
      <div className="mt-6 space-y-4">
        <button
          onClick={() => {
            // 備份是安全操作，不需要確認
            onBackup()
          }}
          disabled={loading}
          className="w-full p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800"
        >
          <div className="text-blue-600 dark:text-blue-300 text-2xl mb-2">💾</div>
          <div className="font-medium text-blue-900 dark:text-blue-100">建立備份</div>
          <div className="text-sm text-blue-600 dark:text-blue-300">安全操作 - 備份當前資料</div>
        </button>
        
        <button
          onClick={() => onDangerousOperation?.(
            '還原備份',
            '⚠️ 警告！此操作將會用備份資料覆蓋當前所有資料。\n\n以下資料將會被替換：\n• 所有產品和分類資料\n• 所有桌位設定\n• 所有訂單記錄\n• 系統設定\n\n當前的資料將會遺失，請確保這是您想要的操作。',
            '確認還原',
            () => {
              onRestore()
            },
            true,
            '還原備份'
          )}
          disabled={loading}
          className="w-full p-4 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-800"
        >
          <div className="text-orange-600 dark:text-orange-300 text-2xl mb-2">🔄</div>
          <div className="font-medium text-orange-900 dark:text-orange-100">還原備份</div>
          <div className="text-sm text-orange-600 dark:text-orange-300">⚠️ 危險操作 - 覆蓋當前資料</div>
        </button>
      </div>
      
      {/* 備份管理說明 */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">💡 備份建議</h4>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>• <strong>定期備份：</strong> 建議每日營業結束後進行備份</p>
          <p>• <strong>重要操作前：</strong> 在執行重大變更前先建立備份</p>
          <p>• <strong>多重備份：</strong> 保留多個時間點的備份檔案</p>
          <p>• <strong>離線存儲：</strong> 定期將備份檔案下載到本地保存</p>
        </div>
      </div>
    </div>
  )
}

// 資料庫編輯器組件
interface DatabaseEditorProps {
  loading: boolean
}

function DatabaseEditor({ loading }: DatabaseEditorProps) {
  const [activeDbTab, setActiveDbTab] = useState('restaurants')
  const [tableData, setTableData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<any>({})
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newRowData, setNewRowData] = useState<any>({})

  // 資料表配置
  const tables = {
    restaurants: {
      name: '餐廳資訊',
      icon: '🏪',
      columns: ['name', 'address', 'phone', 'email', 'tax_rate', 'currency', 'timezone', 'is_active'],
      displayColumns: ['餐廳名稱', '地址', '電話', '電子郵件', '稅率', '貨幣', '時區', '狀態'],
      types: ['text', 'text', 'text', 'email', 'number', 'text', 'text', 'boolean']
    },
    categories: {
      name: '產品分類',
      icon: '📂',
      columns: ['name', 'description', 'sort_order', 'color', 'icon', 'is_active'],
      displayColumns: ['分類名稱', '描述', '排序', '顏色', '圖示', '狀態'],
      types: ['text', 'text', 'number', 'text', 'text', 'boolean']
    },
    products: {
      name: '產品項目',
      icon: '🍔',
      columns: ['name', 'description', 'sku', 'price', 'cost', 'category_id', 'is_available', 'is_active'],
      displayColumns: ['產品名稱', '描述', '產品編號', '售價', '成本', '分類ID', '可售', '狀態'],
      types: ['text', 'text', 'text', 'number', 'number', 'text', 'boolean', 'boolean']
    },
    tables: {
      name: '桌位管理',
      icon: '🪑',
      columns: ['table_number', 'name', 'capacity', 'status', 'position_x', 'position_y', 'is_active'],
      displayColumns: ['桌號', '桌位名稱', '容納人數', '狀態', 'X座標', 'Y座標', '啟用'],
      types: ['number', 'text', 'number', 'select', 'number', 'number', 'boolean']
    },
    orders: {
      name: '訂單資料',
      icon: '📋',
      columns: ['order_number', 'table_number', 'customer_name', 'subtotal', 'tax_amount', 'total_amount', 'status', 'payment_status'],
      displayColumns: ['訂單編號', '桌號', '客戶姓名', '小計', '稅額', '總額', '訂單狀態', '付款狀態'],
      types: ['text', 'number', 'text', 'number', 'number', 'number', 'select', 'select']
    },
    suppliers: {
      name: '供應商',
      icon: '🚚',
      columns: ['name', 'contact_person', 'phone', 'email', 'address', 'payment_terms', 'is_active'],
      displayColumns: ['供應商名稱', '聯絡人', '電話', '郵件', '地址', '付款條件', '狀態'],
      types: ['text', 'text', 'text', 'email', 'text', 'text', 'boolean']
    },
    raw_materials: {
      name: '原物料',
      icon: '📦',
      columns: ['name', 'category', 'unit', 'current_stock', 'min_stock', 'cost', 'supplier_id', 'is_active'],
      displayColumns: ['原料名稱', '分類', '單位', '當前庫存', '最低庫存', '成本', '供應商ID', '狀態'],
      types: ['text', 'text', 'text', 'number', 'number', 'number', 'text', 'boolean']
    },
    table_reservations: {
      name: '桌位預約',
      icon: '📅',
      columns: ['customer_name', 'customer_phone', 'party_size', 'reservation_time', 'status', 'table_id'],
      displayColumns: ['客戶姓名', '電話', '人數', '預約時間', '狀態', '桌位ID'],
      types: ['text', 'text', 'number', 'datetime-local', 'select', 'text']
    }
  }

  // 載入表格資料
  const loadTableData = async (tableName: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      setTableData(data || [])
    } catch (err: any) {
      setError(`載入${tables[tableName as keyof typeof tables]?.name}失敗: ${err.message}`)
      setTableData([])
    } finally {
      setIsLoading(false)
    }
  }

  // 當切換標籤時載入資料
  useEffect(() => {
    loadTableData(activeDbTab)
  }, [activeDbTab])

  // 保存編輯
  const saveEdit = async (id: string, data: any) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from(activeDbTab)
        .update(data)
        .eq('id', id)

      if (error) {
        throw error
      }

      // 重新載入資料
      await loadTableData(activeDbTab)
      setEditingRow(null)
      setEditingData({})
    } catch (err: any) {
      setError(`更新失敗: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 刪除記錄
  const deleteRecord = async (id: string) => {
    if (!confirm('確定要刪除這筆記錄嗎？')) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from(activeDbTab)
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      await loadTableData(activeDbTab)
    } catch (err: any) {
      setError(`刪除失敗: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 新增記錄
  const addNewRecord = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from(activeDbTab)
        .insert([newRowData])

      if (error) {
        throw error
      }

      await loadTableData(activeDbTab)
      setIsAddingNew(false)
      setNewRowData({})
    } catch (err: any) {
      setError(`新增失敗: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 渲染編輯輸入框
  const renderEditInput = (value: any, column: string, type: string, isNewRow: boolean = false) => {
    const currentValue = isNewRow ? (newRowData[column] || '') : (editingData[column] ?? value)
    const onChange = (newValue: any) => {
      if (isNewRow) {
        setNewRowData(prev => ({ ...prev, [column]: newValue }))
      } else {
        setEditingData(prev => ({ ...prev, [column]: newValue }))
      }
    }

    switch (type) {
      case 'boolean':
        return (
          <select
            value={currentValue ? 'true' : 'false'}
            onChange={(e) => onChange(e.target.value === 'true')}
            className="w-full p-1 border rounded text-sm"
          >
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        )
      case 'select':
        if (column === 'status' && activeDbTab === 'tables') {
          return (
            <select
              value={currentValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="available">可用</option>
              <option value="occupied">使用中</option>
              <option value="reserved">已預約</option>
              <option value="cleaning">清潔中</option>
              <option value="maintenance">維護中</option>
            </select>
          )
        }
        if (column === 'status' && activeDbTab === 'orders') {
          return (
            <select
              value={currentValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="pending">待處理</option>
              <option value="confirmed">已確認</option>
              <option value="preparing">製作中</option>
              <option value="ready">已完成</option>
              <option value="served">已送達</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          )
        }
        if (column === 'payment_status' && activeDbTab === 'orders') {
          return (
            <select
              value={currentValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="unpaid">未付款</option>
              <option value="partial">部分付款</option>
              <option value="paid">已付款</option>
              <option value="refunded">已退款</option>
            </select>
          )
        }
        if (column === 'status' && activeDbTab === 'table_reservations') {
          return (
            <select
              value={currentValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="pending">待確認</option>
              <option value="confirmed">已確認</option>
              <option value="seated">已入座</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="no_show">未到場</option>
            </select>
          )
        }
        break
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full p-1 border rounded text-sm"
            step="0.01"
          />
        )
      case 'email':
        return (
          <input
            type="email"
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-1 border rounded text-sm"
          />
        )
      case 'datetime-local':
        return (
          <input
            type="datetime-local"
            value={currentValue ? new Date(currentValue).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="w-full p-1 border rounded text-sm"
          />
        )
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-1 border rounded text-sm"
          />
        )
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">📝 資料庫編輯器</h3>
        <p className="text-gray-600 dark:text-gray-400">
          直接編輯Supabase資料庫中的資料。請謹慎操作，建議先備份重要資料。
        </p>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 表格標籤 */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {Object.entries(tables).map(([key, table]) => (
              <button
                key={key}
                onClick={() => setActiveDbTab(key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeDbTab === key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                <span className="mr-2">{table.icon}</span>
                {table.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => loadTableData(activeDbTab)}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          🔄 重新載入
        </button>
        <button
          onClick={() => setIsAddingNew(true)}
          disabled={isLoading || isAddingNew}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          ➕ 新增記錄
        </button>
      </div>

      {/* 資料表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                {tables[activeDbTab as keyof typeof tables]?.displayColumns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* 新增行 */}
              {isAddingNew && (
                <tr className="bg-green-50 dark:bg-green-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    (新增中)
                  </td>
                  {tables[activeDbTab as keyof typeof tables]?.columns.map((column, index) => (
                    <td key={index} className="px-6 py-4 whitespace-nowrap">
                      {renderEditInput(
                        '',
                        column,
                        tables[activeDbTab as keyof typeof tables]?.types[index] || 'text',
                        true
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={addNewRecord}
                      disabled={isLoading}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      ✅ 儲存
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNew(false)
                        setNewRowData({})
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ❌ 取消
                    </button>
                  </td>
                </tr>
              )}

              {/* 資料行 */}
              {isLoading ? (
                <tr>
                  <td
                    colSpan={tables[activeDbTab as keyof typeof tables]?.columns.length + 2}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    載入中...
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={tables[activeDbTab as keyof typeof tables]?.columns.length + 2}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    暫無資料
                  </td>
                </tr>
              ) : (
                tableData.map((row, rowIndex) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.id?.slice(0, 8) || rowIndex + 1}
                    </td>
                    {tables[activeDbTab as keyof typeof tables]?.columns.map((column, colIndex) => (
                      <td key={column} className="px-6 py-4 whitespace-nowrap">
                        {editingRow === rowIndex ? (
                          renderEditInput(
                            row[column],
                            column,
                            tables[activeDbTab as keyof typeof tables]?.types[colIndex] || 'text'
                          )
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            {typeof row[column] === 'boolean'
                              ? row[column] ? '是' : '否'
                              : column.includes('time') || column.includes('date')
                              ? row[column] ? new Date(row[column]).toLocaleString('zh-TW') : ''
                              : row[column] || '-'
                            }
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {editingRow === rowIndex ? (
                        <>
                          <button
                            onClick={() => saveEdit(row.id, editingData)}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            ✅ 儲存
                          </button>
                          <button
                            onClick={() => {
                              setEditingRow(null)
                              setEditingData({})
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            ❌ 取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingRow(rowIndex)
                              setEditingData(row)
                            }}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            ✏️ 編輯
                          </button>
                          <button
                            onClick={() => deleteRecord(row.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            🗑️ 刪除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 說明文字 */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ 注意事項</h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• 直接編輯資料庫資料可能影響系統正常運作</li>
          <li>• 建議在執行重要修改前先備份資料</li>
          <li>• 刪除操作無法復原，請謹慎使用</li>
          <li>• 某些欄位有格式限制，請確保輸入正確的資料格式</li>
          <li>• 修改後可能需要重新整理頁面才能在前台看到變更</li>
        </ul>
      </div>
    </div>
  )
}

// 輔助函數
function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    DASHBOARD: '主儀表板功能',
    POS_SYSTEM: 'POS點餐系統',
    KDS_SYSTEM: '廚房顯示系統',
    REPORTS: '報表分析功能',
    INVENTORY: '庫存管理系統',
    TABLE_MANAGEMENT: '桌位管理功能',
    SETTINGS: '系統設定功能',
    STAFF_MANAGEMENT: '員工管理系統',
    TUTORIAL_MODE: '教學模式開關，控制是否顯示教學標籤',
    USER_GUIDE: '使用說明頁面，提供系統基本使用指南',
    OPERATION_GUIDE: '操作指南頁面，提供詳細操作步驟說明'
  }
  return descriptions[feature] || '系統功能'
}

// 使用說明組件
function UserGuide() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">📖 使用說明</h3>
        <p className="text-gray-600 dark:text-gray-400">
          歡迎使用 TanaPOS V4-Mini 餐廳管理系統！以下是系統的基本使用說明。
        </p>
      </div>

      <div className="space-y-6">
        {/* 系統概述 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">🏠 系統概述</h4>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            TanaPOS V4-Mini 是一套專為中小型餐廳設計的現代化管理系統，提供點餐、庫存、報表等完整功能。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">✨ 主要特色</h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 直觀的觸控式介面</li>
                <li>• 即時庫存管理</li>
                <li>• 多樣化報表分析</li>
                <li>• 響應式設計支援</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 適用場景</h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 小型咖啡廳</li>
                <li>• 中型餐廳</li>
                <li>• 快餐店</li>
                <li>• 飲料店</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 快速入門 */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3">🚀 快速入門</h4>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h5 className="font-semibold text-green-900 dark:text-green-300">登入系統</h5>
                <p className="text-green-800 dark:text-green-200 text-sm">使用您的帳號密碼登入系統，首次使用請聯繫管理員。</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h5 className="font-semibold text-green-900 dark:text-green-300">基本設定</h5>
                <p className="text-green-800 dark:text-green-200 text-sm">在「基本設定」中設定餐廳資訊、菜單內容等基礎資料。</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h5 className="font-semibold text-green-900 dark:text-green-300">開始營業</h5>
                <p className="text-green-800 dark:text-green-200 text-sm">回到主頁面開始使用點餐、桌位管理等核心功能。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 主要功能 */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3">🎛️ 主要功能</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🍽️</div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">點餐系統</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">快速點餐、修改訂單、計算總價</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🪑</div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">桌位管理</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">管理桌位狀態、預約、清潔</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📦</div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">庫存管理</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">追蹤庫存、進貨、耗材管理</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">報表分析</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">營收統計、熱銷商品分析</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🔧</div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">系統設定</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">功能開關、佈局管理、備份還原</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">👥</div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">員工管理</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">帳號管理、權限設定、排班</p>
            </div>
          </div>
        </div>

        {/* 常見問題 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-3">❓ 常見問題</h4>
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Q: 如何新增菜單項目？</h5>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">A: 進入「基本設定」→「餐廳資訊」→「菜單管理」，點擊「新增商品」按鈕。</p>
            </div>
            <div>
              <h5 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Q: 如何查看今日營收？</h5>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">A: 在主頁面的統計卡片中可以看到今日營收，或進入「報表分析」查看詳細數據。</p>
            </div>
            <div>
              <h5 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Q: 系統支援多少個桌位？</h5>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">A: 系統可支援無限數量的桌位，可在「桌位管理」中新增和管理。</p>
            </div>
            <div>
              <h5 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Q: 如何備份資料？</h5>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">A: 進入「備份與還原」功能，點擊「立即備份」可下載系統資料備份檔案。</p>
            </div>
          </div>
        </div>

        {/* 聯絡支援 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📞 技術支援</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            如果您在使用過程中遇到任何問題，請隨時聯繫我們的技術支援團隊。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="text-xl">📧</div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">電子郵件</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">support@tanapos.com</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xl">📱</div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">客服專線</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">02-1234-5678</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 操作指南組件
function OperationGuide() {
  const [activeSection, setActiveSection] = useState<'pos' | 'table' | 'inventory' | 'reports' | 'admin'>('pos')

  const sections = [
    { id: 'pos', label: '點餐操作', icon: '🍽️' },
    { id: 'table', label: '桌位管理', icon: '🪑' },
    { id: 'inventory', label: '庫存操作', icon: '📦' },
    { id: 'reports', label: '報表使用', icon: '📊' },
    { id: 'admin', label: '系統管理', icon: '⚙️' }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">🎯 操作指南</h3>
        <p className="text-gray-600 dark:text-gray-400">
          詳細的系統操作步驟說明，幫助您快速上手各項功能。
        </p>
      </div>

      {/* 分類標籤 */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="space-y-6">
        {activeSection === 'pos' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">🍽️ 點餐系統操作</h4>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">📋 建立新訂單</h5>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                      <span>點擊主頁面的「點餐系統」或直接進入 POS 介面</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                      <span>選擇桌號或外帶選項</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                      <span>瀏覽分類或使用搜尋功能找到商品</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                      <span>點擊商品加入購物車，調整數量和備註</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">5</span>
                      <span>確認訂單內容無誤後點擊「結帳」</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">6</span>
                      <span>選擇付款方式並完成交易</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">✏️ 修改訂單</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 在購物車中點擊「編輯」按鈕修改商品數量</li>
                    <li>• 點擊「刪除」按鈕移除不需要的商品</li>
                    <li>• 在商品詳情中添加特殊要求或備註</li>
                    <li>• 已送出的訂單需要到「訂單管理」中進行修改</li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">💳 結帳流程</h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p><strong>現金結帳：</strong>輸入收款金額，系統自動計算找零</p>
                    <p><strong>信用卡結帳：</strong>選擇信用卡付款，等待刷卡確認</p>
                    <p><strong>電子支付：</strong>顯示 QR Code 供客人掃描付款</p>
                    <p><strong>混合付款：</strong>可以組合多種付款方式</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'table' && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-4">🪑 桌位管理操作</h4>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">🆕 新增桌位</h5>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                      <span>進入「桌位管理」頁面</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                      <span>點擊「新增桌位」按鈕</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                      <span>輸入桌號、容納人數等資訊</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                      <span>設定桌位在平面圖上的位置</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">5</span>
                      <span>儲存設定，桌位立即生效</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">🔄 桌位狀態管理</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">狀態類型：</h6>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• <span className="text-green-500">●</span> 空閒 - 可使用狀態</li>
                        <li>• <span className="text-red-500">●</span> 使用中 - 客人用餐中</li>
                        <li>• <span className="text-yellow-500">●</span> 已預約 - 已被預約</li>
                        <li>• <span className="text-gray-500">●</span> 清潔中 - 正在整理</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">快速操作：</h6>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• 點擊桌位快速開台</li>
                        <li>• 長按顯示更多選項</li>
                        <li>• 拖拽調整桌位位置</li>
                        <li>• 右鍵選單進階功能</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">📅 預約管理</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 點擊「新增預約」建立客人預約</li>
                    <li>• 輸入客人資訊、預約時間、人數</li>
                    <li>• 系統自動推薦合適的桌位</li>
                    <li>• 預約時間到達時會自動提醒</li>
                    <li>• 可以修改或取消既有預約</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4">📦 庫存管理操作</h4>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">➕ 新增庫存項目</h5>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 進入「庫存管理」頁面</li>
                    <li>• 選擇適當的分類（原物料/半成品/成品）</li>
                    <li>• 點擊「新增項目」按鈕</li>
                    <li>• 填寫品名、單位、安全庫存量等資訊</li>
                    <li>• 設定供應商資訊和採購價格</li>
                    <li>• 上傳商品圖片（可選）</li>
                  </ol>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">📋 進貨作業</h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p><strong>手動進貨：</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• 選擇庫存項目點擊「進貨」</li>
                      <li>• 輸入進貨數量和採購價格</li>
                      <li>• 填寫供應商和發票資訊</li>
                      <li>• 確認進貨，系統自動更新庫存</li>
                    </ul>
                    <p className="mt-3"><strong>批量進貨：</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• 使用 Excel 模板批量匯入</li>
                      <li>• 掃描條碼快速進貨</li>
                      <li>• 設定自動採購規則</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">⚠️ 庫存監控</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 設定安全庫存量，低於標準時自動提醒</li>
                    <li>• 查看庫存變動歷史記錄</li>
                    <li>• 定期盤點確保數據準確性</li>
                    <li>• 產生庫存報表分析使用趨勢</li>
                    <li>• 設定過期提醒避免食材浪費</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-4">📊 報表使用操作</h4>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">📈 營收報表</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 選擇報表時間範圍（今日/本週/本月/自訂）</li>
                    <li>• 查看總營收、訂單數量、平均客單價</li>
                    <li>• 分析不同時段的營收分佈</li>
                    <li>• 比較不同期間的營收成長</li>
                    <li>• 匯出 PDF 或 Excel 檔案</li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">🏆 商品分析</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 熱銷商品排行榜</li>
                    <li>• 商品銷售趨勢分析</li>
                    <li>• 分類銷售佔比統計</li>
                    <li>• 利潤率分析</li>
                    <li>• 季節性商品表現</li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">📅 自動報表</h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p>設定自動產生報表：</p>
                    <ul className="ml-4 space-y-1">
                      <li>• 每日營收摘要</li>
                      <li>• 週報表（週一自動產生）</li>
                      <li>• 月報表（月初自動產生）</li>
                      <li>• 庫存警示報表</li>
                      <li>• 設定郵件自動寄送</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'admin' && (
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-4">⚙️ 系統管理操作</h4>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">🔧 功能開關</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 控制各模組的啟用狀態</li>
                    <li>• 教學模式開關控制導覽顯示</li>
                    <li>• 根據餐廳需求啟用適當功能</li>
                    <li>• 關閉不需要的功能簡化介面</li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">💾 備份與還原</h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p><strong>建立備份：</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• 點擊「立即備份」下載完整數據</li>
                      <li>• 設定自動備份時間</li>
                      <li>• 選擇備份範圍（全部/部分資料）</li>
                    </ul>
                    <p className="mt-3"><strong>還原資料：</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• 上傳備份檔案</li>
                      <li>• 確認還原範圍</li>
                      <li>• ⚠️ 還原會覆蓋現有資料，請謹慎操作</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">📝 資料庫編輯</h5>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded p-3 mb-3">
                    <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
                      ⚠️ 注意：直接編輯資料庫需要謹慎操作，建議先備份資料
                    </p>
                  </div>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• 選擇要編輯的資料表</li>
                    <li>• 點擊「編輯」修改特定欄位</li>
                    <li>• 使用「新增」按鈕建立新記錄</li>
                    <li>• 危險操作需要輸入確認文字</li>
                    <li>• 修改後重新整理前台查看效果</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
