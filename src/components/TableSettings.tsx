import React, { useState, useEffect } from 'react'
import { Save, RotateCcw, Plus, Edit, Trash2, Settings, MapPin, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import useStore from '../lib/store'

// 桌台設定相關的類型定義
interface Table {
  id: string
  restaurant_id: string
  table_number: string
  name: string
  capacity: number
  min_capacity: number
  max_capacity: number
  status: string
  floor_level: number
  zone: string
  position_x: number
  position_y: number
  table_type: string
  features: string[]
  qr_enabled: boolean
  ai_assignment_priority: number
  ai_features_score: number
  cleaning_duration_minutes: number
  is_active: boolean
  metadata: any
}

interface TableConfig {
  general: {
    default_capacity: number
    default_cleaning_duration: number
    auto_assignment_enabled: boolean
    qr_code_enabled: boolean
  }
  zones: {
    available_zones: string[]
    default_zone: string
  }
  features: {
    available_features: string[]
    default_features: string[]
  }
  ai_settings: {
    auto_assignment: boolean
    priority_scoring: boolean
    smart_recommendations: boolean
  }
}

export default function TableSettings() {
  const { currentRestaurant } = useStore()
  
  const [tables, setTables] = useState<Table[]>([])
  const [tableConfig, setTableConfig] = useState<TableConfig>({
    general: {
      default_capacity: 4,
      default_cleaning_duration: 15,
      auto_assignment_enabled: true,
      qr_code_enabled: true
    },
    zones: {
      available_zones: ['大廳', 'VIP區', '包廂', '戶外'],
      default_zone: '大廳'
    },
    features: {
      available_features: ['窗邊', '安靜', '充電插座', '兒童友善', '輪椅友善', '包廂'],
      default_features: []
    },
    ai_settings: {
      auto_assignment: true,
      priority_scoring: true,
      smart_recommendations: false
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'individual'>('overview')
  const [editingTable, setEditingTable] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 載入桌台資料
  useEffect(() => {
    if (currentRestaurant?.id) {
      loadTables()
    }
  }, [currentRestaurant?.id])

  const loadTables = async (showRetryMessage = false) => {
    if (!currentRestaurant?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      if (showRetryMessage) {
        setLoadingMessage(`重新載入桌台資料... (第${retryCount + 1}次嘗試)`)
      } else {
        setLoadingMessage('載入桌台資料...')
      }
      
      // 模擬載入進度
      const progressMessages = [
        '連接資料庫...',
        '查詢桌台資訊...',
        '載入桌台配置...',
        '整理資料...'
      ]
      
      for (let i = 0; i < progressMessages.length; i++) {
        setLoadingMessage(progressMessages[i])
        if (i < progressMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      const { data, error } = await supabase
        .from('tables')
        .select(`
          *,
          restaurant_id,
          table_number,
          name,
          capacity,
          min_capacity,
          max_capacity,
          status,
          floor_level,
          zone,
          position_x,
          position_y,
          table_type,
          features,
          qr_enabled,
          ai_assignment_priority,
          ai_features_score,
          cleaning_duration_minutes,
          is_active,
          created_at,
          updated_at,
          metadata
        `)
        .eq('restaurant_id', currentRestaurant.id)
        .order('table_number', { ascending: true })

      if (!error && data) {
        setTables(data)
        setRetryCount(0)
        setLoadingMessage('載入完成！')
        
        // 載入完成後短暫顯示成功訊息
        setTimeout(() => {
          setLoadingMessage('')
        }, 1000)
        
      } else {
        throw new Error(error?.message || '未知錯誤')
      }
    } catch (error: any) {
      console.error('載入桌台失敗:', error)
      setError(`載入失敗: ${error.message}`)
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // 自動重試機制
  const handleRetry = () => {
    if (retryCount < 3) {
      loadTables(true)
    } else {
      setError('多次載入失敗，請檢查網路連接或重新整理頁面')
    }
  }

  // 更新桌台配置
  const updateTableConfig = (section: keyof TableConfig, key: string, value: any) => {
    setTableConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  // 批量更新桌台
  const batchUpdateTables = async (updates: Partial<Table>) => {
    if (!currentRestaurant?.id) return
    
    try {
      setLoading(true)
      setLoadingMessage('驗證批量更新資料...')
      
      // 對批量更新進行基本驗證（不檢查唯一性，因為是所有桌台）
      const validation = await validateTableData(updates, undefined)
      
      // 過濾掉唯一性錯誤（批量更新時不適用）
      const relevantErrors = validation.errors.filter(error => 
        !error.includes('已存在')
      )
      
      if (relevantErrors.length > 0) {
        setError(`驗證失敗: ${relevantErrors.join(', ')}`)
        return
      }
      
      setLoadingMessage('執行批量更新...')
      
      const { error } = await supabase
        .from('tables')
        .update(updates)
        .eq('restaurant_id', currentRestaurant.id)

      if (!error) {
        setLoadingMessage('重新載入資料...')
        await loadTables()
        setHasUnsavedChanges(false)
        setError(null)
        setLoadingMessage('批量更新成功！')
        
        // 成功訊息自動消失
        setTimeout(() => {
          setLoadingMessage('')
        }, 2000)
      } else {
        throw new Error(error?.message || '批量更新失敗')
      }
    } catch (error: any) {
      console.error('批量更新異常:', error)
      setError(`批量更新失敗: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 驗證桌台資料
  const validateTableData = async (tableData: Partial<Table>, excludeTableId?: string): Promise<{isValid: boolean; errors: string[]}> => {
    const errors: string[] = []
    
    // 檢查桌台編號唯一性
    if (tableData.table_number !== undefined) {
      const { data: existingTables } = await supabase
        .from('tables')
        .select('id, table_number')
        .eq('restaurant_id', currentRestaurant?.id)
        .eq('table_number', tableData.table_number)
      
      if (existingTables && existingTables.length > 0) {
        const duplicateTable = existingTables.find(t => t.id !== excludeTableId)
        if (duplicateTable) {
          errors.push(`桌台編號 ${tableData.table_number} 已存在`)
        }
      }
    }
    
    // 檢查容量範圍
    if (tableData.capacity !== undefined) {
      if (tableData.capacity <= 0) {
        errors.push('桌台容量必須大於 0')
      } else if (tableData.capacity > 50) {
        errors.push('桌台容量不能超過 50 人')
      }
    }
    
    // 檢查最小最大容量關係
    if (tableData.min_capacity !== undefined && tableData.max_capacity !== undefined && tableData.max_capacity !== null) {
      if (tableData.min_capacity > tableData.max_capacity) {
        errors.push('最小容量不能大於最大容量')
      }
    }
    
    // 檢查清潔時間範圍
    if (tableData.cleaning_duration_minutes !== undefined) {
      if (tableData.cleaning_duration_minutes < 5) {
        errors.push('清潔時間不能少於 5 分鐘')
      } else if (tableData.cleaning_duration_minutes > 120) {
        errors.push('清潔時間不能超過 120 分鐘')
      }
    }
    
    // 檢查必填欄位
    if (tableData.name !== undefined && (!tableData.name || tableData.name.trim().length === 0)) {
      errors.push('桌台名稱不能為空')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 更新單個桌台
  const updateSingleTable = async (tableId: string, updates: Partial<Table>) => {
    try {
      setLoading(true)
      setLoadingMessage('驗證桌台資料...')
      
      // 驗證資料
      const validation = await validateTableData(updates, tableId)
      if (!validation.isValid) {
        setError(`驗證失敗: ${validation.errors.join(', ')}`)
        return
      }
      
      setLoadingMessage('更新桌台資訊...')
      
      const { error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', tableId)

      if (!error) {
        setLoadingMessage('重新載入資料...')
        await loadTables()
        setEditingTable(null)
        setError(null)
        setLoadingMessage('桌台更新成功！')
        
        // 成功訊息自動消失
        setTimeout(() => {
          setLoadingMessage('')
        }, 2000)
      } else {
        throw new Error(error?.message || '更新失敗')
      }
    } catch (error: any) {
      console.error('桌台更新異常:', error)
      setError(`更新失敗: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 儲存全域設定
  const saveGlobalConfig = async () => {
    if (!currentRestaurant?.id) return
    
    try {
      setLoading(true)
      
      // 將桌台設定儲存到餐廳的 settings 中
      const { data: restaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', currentRestaurant.id)
        .single()

      if (fetchError) {
        console.error('取得餐廳設定失敗:', fetchError)
        return
      }

      const updatedSettings = {
        ...restaurant?.settings,
        table_settings: tableConfig
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ settings: updatedSettings })
        .eq('id', currentRestaurant.id)

      if (!updateError) {
        setHasUnsavedChanges(false)
        alert('桌台設定儲存成功！')
      } else {
        console.error('桌台設定儲存失敗:', updateError)
        alert('桌台設定儲存失敗，請稍後再試')
      }
    } catch (error) {
      console.error('桌台設定儲存異常:', error)
      alert('桌台設定儲存失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const tabButtons = [
    { id: 'overview', label: '桌台總覽', icon: MapPin },
    { id: 'config', label: '全域設定', icon: Settings },
    { id: 'individual', label: '個別設定', icon: Edit }
  ]

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ui-primary mb-2 flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          桌台參數設定
        </h2>
        <p className="text-ui-muted">管理餐廳桌台的各種參數和配置</p>
      </div>

      {/* 頂部狀態列 */}
      <div className="bg-ui-secondary rounded-lg p-4 mb-6">
        {/* 載入狀態指示器 */}
        {(loading || loadingMessage) && (
          <div className="mb-4 flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800">
              <div className="flex space-x-1 mr-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm font-medium">{loadingMessage || '處理中...'}</span>
            </div>
          </div>
        )}
        
        {/* 錯誤狀態指示器 */}
        {error && (
          <div className="mb-4 flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-md transition-colors"
              disabled={loading}
            >
              {retryCount < 3 ? '重試' : '重新整理'}
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-ui-primary">{tables.length}</div>
            <div className="text-sm text-ui-muted">總桌台數</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tables.filter(t => t.is_active).length}
            </div>
            <div className="text-sm text-ui-muted">啟用桌台</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tables.filter(t => t.qr_enabled).length}
            </div>
            <div className="text-sm text-ui-muted">QR碼啟用</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(tables.map(t => t.zone)).size}
            </div>
            <div className="text-sm text-ui-muted">使用區域</div>
          </div>
        </div>
        
        {hasUnsavedChanges && (
          <div className="mt-4 flex items-center justify-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center text-amber-800">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
              有未儲存的變更
            </div>
          </div>
        )}
      </div>

      {/* 標籤導航 */}
      <div className="flex space-x-1 mb-6 bg-ui-secondary rounded-lg p-1">
        {tabButtons.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`
              flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-ui-secondary hover:bg-ui-primary hover:text-ui-primary'
              }
            `}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* 內容區域 */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <TableOverview
            tables={tables}
            loading={loading}
            onRefresh={loadTables}
            onQuickEdit={(tableId) => setEditingTable(tableId)}
          />
        )}

        {activeTab === 'config' && (
          <GlobalTableConfig
            config={tableConfig}
            onConfigChange={updateTableConfig}
            onSave={saveGlobalConfig}
            onBatchUpdate={batchUpdateTables}
            loading={loading}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}

        {activeTab === 'individual' && (
          <IndividualTableConfig
            tables={tables}
            editingTable={editingTable}
            onEditTable={setEditingTable}
            onUpdateTable={updateSingleTable}
            loading={loading}
            availableZones={tableConfig.zones.available_zones}
            availableFeatures={tableConfig.features.available_features}
          />
        )}
      </div>
    </div>
  )
}

// 桌台總覽組件
const TableOverview: React.FC<{
  tables: Table[]
  loading: boolean
  onRefresh: () => void
  onQuickEdit: (tableId: string) => void
}> = ({ tables, loading, onRefresh, onQuickEdit }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'occupied': return 'bg-red-100 text-red-800'
      case 'cleaning': return 'bg-yellow-100 text-yellow-800'
      case 'reserved': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const statusLabels = {
    available: '可用',
    occupied: '使用中',
    cleaning: '清潔中',
    reserved: '已預約',
    maintenance: '維護中'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-ui-primary">桌台總覽</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {loading ? '載入中...' : '重新載入'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="border border-ui rounded-lg p-4 bg-ui-primary">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-ui-primary">
                  桌台 {table.table_number}
                </h4>
                <p className="text-sm text-ui-muted">{table.name}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(table.status)}`}>
                {statusLabels[table.status as keyof typeof statusLabels] || table.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ui-muted">容量:</span>
                <span className="flex items-center text-ui-primary">
                  <Users className="h-3 w-3 mr-1" />
                  {table.capacity} 人
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-ui-muted">區域:</span>
                <span className="text-ui-primary">{table.zone}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-ui-muted">樓層:</span>
                <span className="text-ui-primary">{table.floor_level}F</span>
              </div>

              {table.features && table.features.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {table.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-ui-secondary text-xs rounded">
                      {feature}
                    </span>
                  ))}
                  {table.features.length > 3 && (
                    <span className="px-2 py-1 bg-ui-secondary text-xs rounded">
                      +{table.features.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-ui">
              <div className="flex items-center space-x-2 text-xs text-ui-muted">
                <div className={`w-2 h-2 rounded-full ${table.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{table.is_active ? '啟用' : '停用'}</span>
                {table.qr_enabled && (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>QR</span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => onQuickEdit(table.id)}
                className="flex items-center px-2 py-1 text-xs bg-ui-secondary text-ui-secondary rounded hover:bg-blue-50 hover:text-blue-600"
              >
                <Edit className="h-3 w-3 mr-1" />
                編輯
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && !loading && (
        <div className="text-center py-12 text-ui-muted">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>尚未找到任何桌台</p>
          <p className="text-sm">請先在桌台管理頁面建立桌台</p>
        </div>
      )}
    </div>
  )
}

// 全域桌台設定組件
const GlobalTableConfig: React.FC<{
  config: TableConfig
  onConfigChange: (section: keyof TableConfig, key: string, value: any) => void
  onSave: () => void
  onBatchUpdate: (updates: any) => void
  loading: boolean
  hasUnsavedChanges: boolean
}> = ({ config, onConfigChange, onSave, onBatchUpdate, loading, hasUnsavedChanges }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-ui-primary">全域桌台設定</h3>

      {/* 基本設定 */}
      <div className="border border-ui rounded-lg p-6">
        <h4 className="text-md font-medium text-ui-primary mb-4">⚙️ 基本設定</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-ui-primary mb-2">
              預設容量
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.general.default_capacity}
              onChange={(e) => onConfigChange('general', 'default_capacity', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ui-primary mb-2">
              預設清潔時間 (分鐘)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={config.general.default_cleaning_duration}
              onChange={(e) => onConfigChange('general', 'default_cleaning_duration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.auto_assignment_enabled}
              onChange={(e) => onConfigChange('general', 'auto_assignment_enabled', e.target.checked)}
              className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-3"
            />
            <span className="text-sm font-medium text-ui-primary">啟用自動分桌</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.qr_code_enabled}
              onChange={(e) => onConfigChange('general', 'qr_code_enabled', e.target.checked)}
              className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-3"
            />
            <span className="text-sm font-medium text-ui-primary">預設啟用 QR 碼點餐</span>
          </label>
        </div>
      </div>

      {/* 區域設定 */}
      <div className="border border-ui rounded-lg p-6">
        <h4 className="text-md font-medium text-ui-primary mb-4">🏢 區域設定</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ui-primary mb-2">
              可用區域
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.zones.available_zones.map((zone, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">
                  {zone}
                  <button
                    onClick={() => {
                      const newZones = config.zones.available_zones.filter((_, i) => i !== index)
                      onConfigChange('zones', 'available_zones', newZones)
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="新增區域..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newZone = e.currentTarget.value.trim()
                  if (!config.zones.available_zones.includes(newZone)) {
                    onConfigChange('zones', 'available_zones', [...config.zones.available_zones, newZone])
                  }
                  e.currentTarget.value = ''
                }
              }}
              className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-primary mb-2">
              預設區域
            </label>
            <select
              value={config.zones.default_zone}
              onChange={(e) => onConfigChange('zones', 'default_zone', e.target.value)}
              className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {config.zones.available_zones.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 特色設定 */}
      <div className="border border-ui rounded-lg p-6">
        <h4 className="text-md font-medium text-ui-primary mb-4">✨ 桌台特色設定</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ui-primary mb-2">
              可用特色
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.features.available_features.map((feature, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
                  {feature}
                  <button
                    onClick={() => {
                      const newFeatures = config.features.available_features.filter((_, i) => i !== index)
                      onConfigChange('features', 'available_features', newFeatures)
                    }}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="新增特色..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newFeature = e.currentTarget.value.trim()
                  if (!config.features.available_features.includes(newFeature)) {
                    onConfigChange('features', 'available_features', [...config.features.available_features, newFeature])
                  }
                  e.currentTarget.value = ''
                }
              }}
              className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* AI 設定 */}
      <div className="border border-ui rounded-lg p-6">
        <h4 className="text-md font-medium text-ui-primary mb-4">🤖 AI 智慧設定</h4>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.ai_settings.auto_assignment}
              onChange={(e) => onConfigChange('ai_settings', 'auto_assignment', e.target.checked)}
              className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-3"
            />
            <div>
              <span className="text-sm font-medium text-ui-primary">智慧自動分桌</span>
              <p className="text-xs text-ui-muted">根據客人數量和桌台特色自動推薦最適合的桌台</p>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.ai_settings.priority_scoring}
              onChange={(e) => onConfigChange('ai_settings', 'priority_scoring', e.target.checked)}
              className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-3"
            />
            <div>
              <span className="text-sm font-medium text-ui-primary">優先級評分</span>
              <p className="text-xs text-ui-muted">根據桌台使用頻率和客人偏好調整推薦優先級</p>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.ai_settings.smart_recommendations}
              onChange={(e) => onConfigChange('ai_settings', 'smart_recommendations', e.target.checked)}
              className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-3"
            />
            <div>
              <span className="text-sm font-medium text-ui-primary">智慧推薦</span>
              <p className="text-xs text-ui-muted">根據歷史數據提供個人化的桌台推薦</p>
            </div>
          </label>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-ui">
        <button
          onClick={() => onBatchUpdate({
            cleaning_duration_minutes: config.general.default_cleaning_duration,
            qr_enabled: config.general.qr_code_enabled,
          })}
          disabled={loading}
          className="px-6 py-2 border border-ui text-ui-secondary rounded-lg hover:bg-ui-secondary disabled:opacity-50"
        >
          批量套用到所有桌台
        </button>
        
        <button
          onClick={onSave}
          disabled={loading || !hasUnsavedChanges}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? '儲存中...' : '儲存設定'}
        </button>
      </div>
    </div>
  )
}

// 個別桌台設定組件
const IndividualTableConfig: React.FC<{
  tables: Table[]
  editingTable: string | null
  onEditTable: (tableId: string | null) => void
  onUpdateTable: (tableId: string, updates: Partial<Table>) => void
  loading: boolean
  availableZones: string[]
  availableFeatures: string[]
}> = ({ tables, editingTable, onEditTable, onUpdateTable, loading, availableZones, availableFeatures }) => {
  const [editForm, setEditForm] = useState<Partial<Table>>({})

  useEffect(() => {
    if (editingTable) {
      const table = tables.find(t => t.id === editingTable)
      if (table) {
        setEditForm(table)
      }
    }
  }, [editingTable, tables])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTable && editForm) {
      onUpdateTable(editingTable, editForm)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-ui-primary mb-4">個別桌台設定</h3>
      
      {!editingTable ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="border border-ui rounded-lg p-4 bg-ui-primary">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-ui-primary">桌台 {table.table_number}</h4>
                <button
                  onClick={() => onEditTable(table.id)}
                  className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  編輯
                </button>
              </div>
              <div className="space-y-1 text-sm text-ui-muted">
                <div>容量: {table.capacity} 人</div>
                <div>區域: {table.zone}</div>
                <div>樓層: {table.floor_level}F</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div className="bg-ui-primary border border-ui rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-medium text-ui-primary">
                編輯桌台 {editForm.table_number}
              </h4>
              <button
                type="button"
                onClick={() => onEditTable(null)}
                className="text-ui-muted hover:text-ui-primary"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-ui-primary mb-2">
                  桌台編號
                </label>
                <input
                  type="text"
                  value={editForm.table_number || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, table_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-primary mb-2">
                  桌台名稱
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-primary mb-2">
                  容量
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editForm.capacity || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-primary mb-2">
                  區域
                </label>
                <select
                  value={editForm.zone || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, zone: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {availableZones.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-primary mb-2">
                  樓層
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editForm.floor_level || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, floor_level: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-primary mb-2">
                  清潔時間 (分鐘)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={editForm.cleaning_duration_minutes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cleaning_duration_minutes: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.is_active || false}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-3"
                />
                <span className="text-sm font-medium text-ui-primary">啟用桌台</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.qr_enabled || false}
                  onChange={(e) => setEditForm(prev => ({ ...prev, qr_enabled: e.target.checked }))}
                  className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-3"
                />
                <span className="text-sm font-medium text-ui-primary">啟用 QR 碼點餐</span>
              </label>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-ui-primary mb-2">
                桌台特色
              </label>
              <div className="flex flex-wrap gap-2">
                {availableFeatures.map((feature) => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(editForm.features || []).includes(feature)}
                      onChange={(e) => {
                        const currentFeatures = editForm.features || []
                        if (e.target.checked) {
                          setEditForm(prev => ({ 
                            ...prev, 
                            features: [...currentFeatures, feature] 
                          }))
                        } else {
                          setEditForm(prev => ({ 
                            ...prev, 
                            features: currentFeatures.filter(f => f !== feature) 
                          }))
                        }
                      }}
                      className="rounded border-ui focus:ring-2 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-ui-primary">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-ui">
              <button
                type="button"
                onClick={() => onEditTable(null)}
                className="px-4 py-2 border border-ui text-ui-secondary rounded-lg hover:bg-ui-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
