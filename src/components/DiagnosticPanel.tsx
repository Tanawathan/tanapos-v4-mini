import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

interface DiagnosticResult {
  name: string
  success: boolean
  error?: string
  details?: any
  duration?: number
}

interface DiagnosticPanelProps {
  isOpen: boolean
  onClose: () => void
}

const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTest, setSelectedTest] = useState<DiagnosticResult | null>(null)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const restaurantId = import.meta.env.VITE_RESTAURANT_ID

  useEffect(() => {
    if (isOpen) {
      runDiagnostics()
    }
  }, [isOpen])

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])

    const tests = [
      { name: '環境變數檢查', test: checkEnvironmentVariables },
      { name: 'Supabase 連接', test: testSupabaseConnection },
      { name: '餐廳資料載入', test: testRestaurantData },
      { name: '分類資料載入', test: testCategoriesData },
      { name: '產品資料載入', test: testProductsData },
      { name: '桌台資料載入', test: testTablesData },
      { name: '訂單資料載入', test: testOrdersData },
    ]

    const results: DiagnosticResult[] = []

    for (const testCase of tests) {
      const start = Date.now()
      try {
        const result = await testCase.test()
        const duration = Date.now() - start
        results.push({
          name: testCase.name,
          success: result.success,
          error: result.error,
          details: result.details,
          duration
        })
      } catch (error) {
        const duration = Date.now() - start
        results.push({
          name: testCase.name,
          success: false,
          error: error instanceof Error ? error.message : '未知錯誤',
          duration
        })
      }
      setDiagnostics([...results])
    }

    setIsRunning(false)
  }

  const checkEnvironmentVariables = async () => {
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_RESTAURANT_ID']
    const missing = required.filter(key => !import.meta.env[key])
    
    if (missing.length > 0) {
      return {
        success: false,
        error: `缺少環境變數: ${missing.join(', ')}`,
        details: { missing, present: required.filter(key => import.meta.env[key]) }
      }
    }

    // 檢查 UUID 格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(restaurantId)) {
      return {
        success: false,
        error: 'RESTAURANT_ID 格式不正確',
        details: { restaurantId }
      }
    }

    return {
      success: true,
      details: { allPresent: required }
    }
  }

  const testSupabaseConnection = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { error } = await supabase
        .from('restaurants')
        .select('count')
        .limit(1)

      if (error) {
        return {
          success: false,
          error: `連接失敗: ${error.message}`,
          details: { error }
        }
      }

      return {
        success: true,
        details: { connected: true }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '連接異常',
        details: { exception: true }
      }
    }
  }

  const testRestaurantData = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (error) {
        return {
          success: false,
          error: `載入失敗: ${error.message}`,
          details: { error }
        }
      }

      if (!data) {
        return {
          success: false,
          error: '找不到餐廳資料',
          details: { restaurantId }
        }
      }

      return {
        success: true,
        details: { restaurant: data }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '載入異常',
        details: { exception: true }
      }
    }
  }

  const testCategoriesData = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error, count } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId)

      if (error) {
        return {
          success: false,
          error: `載入失敗: ${error.message}`,
          details: { error }
        }
      }

      return {
        success: true,
        details: { count, categories: data?.slice(0, 3) }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '載入異常',
        details: { exception: true }
      }
    }
  }

  const testProductsData = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error, count } = await supabase
        .from('products')
        .select('*, categories(name)', { count: 'exact' })
        .eq('restaurant_id', restaurantId)
        .limit(5)

      if (error) {
        return {
          success: false,
          error: `載入失敗: ${error.message}`,
          details: { error }
        }
      }

      return {
        success: true,
        details: { count, products: data }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '載入異常',
        details: { exception: true }
      }
    }
  }

  const testTablesData = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error, count } = await supabase
        .from('tables')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId)

      if (error) {
        return {
          success: false,
          error: `載入失敗: ${error.message}`,
          details: { error }
        }
      }

      return {
        success: true,
        details: { count, tables: data?.slice(0, 3) }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '載入異常',
        details: { exception: true }
      }
    }
  }

  const testOrdersData = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId)

      if (error) {
        return {
          success: false,
          error: `載入失敗: ${error.message}`,
          details: { error }
        }
      }

      return {
        success: true,
        details: { count, orders: data?.slice(0, 3) }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '載入異常',
        details: { exception: true }
      }
    }
  }

  const getStatusIcon = (result: DiagnosticResult) => {
    if (isRunning && !result.success && !result.error) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
    }
    return result.success ? '✅' : '❌'
  }

  const getStatusColor = (result: DiagnosticResult) => {
    return result.success ? 'text-green-600' : 'text-red-600'
  }

  const passedTests = diagnostics.filter(d => d.success).length
  const totalTests = diagnostics.length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 標題列 */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔧 系統診斷面板</h2>
            <p className="text-gray-600 mt-1">
              檢查 Supabase 連接狀態和資料完整性
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 總體狀態 */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">
                {isRunning ? '🔄' : passedTests === totalTests ? '🎉' : passedTests > totalTests / 2 ? '⚠️' : '🚨'}
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {isRunning ? '診斷進行中...' : `${passedTests}/${totalTests} 項目通過`}
                </div>
                <div className="text-sm text-gray-600">
                  {isRunning ? '正在檢查系統狀態' : 
                   passedTests === totalTests ? '系統狀態良好' : 
                   passedTests > totalTests / 2 ? '系統基本正常，有些問題需要注意' : '系統有嚴重問題需要修復'}
                </div>
              </div>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? '檢查中...' : '重新檢查'}
            </button>
          </div>
        </div>

        {/* 詳細結果 */}
        <div className="flex h-96">
          {/* 測試列表 */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">診斷項目</h3>
              <div className="space-y-2">
                {diagnostics.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedTest(result)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTest === result ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStatusIcon(result)}</span>
                        <div>
                          <div className={`font-medium ${getStatusColor(result)}`}>
                            {result.name}
                          </div>
                          {result.duration && (
                            <div className="text-xs text-gray-500">
                              {result.duration}ms
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {result.error && (
                      <div className="text-xs text-red-600 mt-1 truncate">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 詳細資訊 */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedTest ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {selectedTest.name} 詳細資訊
                </h3>
                
                <div className={`p-3 rounded-lg ${selectedTest.success ? 'bg-green-50' : 'bg-red-50'} mb-4`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{selectedTest.success ? '✅' : '❌'}</span>
                    <div>
                      <div className={`font-medium ${selectedTest.success ? 'text-green-800' : 'text-red-800'}`}>
                        {selectedTest.success ? '檢查通過' : '檢查失敗'}
                      </div>
                      {selectedTest.error && (
                        <div className="text-sm text-red-600 mt-1">
                          {selectedTest.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTest.details && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">詳細資料</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedTest.details, null, 2)}
                    </pre>
                  </div>
                )}

                {/* 修復建議 */}
                {!selectedTest.success && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">🔧 修復建議</h4>
                    <div className="bg-yellow-50 p-3 rounded text-sm">
                      {getFixSuggestion(selectedTest.name)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                選擇左側項目查看詳細資訊
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getFixSuggestion(testName: string): string {
  const suggestions: Record<string, string> = {
    '環境變數檢查': '請檢查 .env 檔案，確保所有必要的環境變數都已正確設定。特別注意 RESTAURANT_ID 必須是有效的 UUID 格式。',
    'Supabase 連接': '檢查 Supabase URL 和 API 金鑰是否正確。確認專案狀態正常，並檢查網路連接。',
    '餐廳資料載入': '執行測試資料載入腳本，或檢查餐廳 ID 是否存在於資料庫中。',
    '分類資料載入': '使用 load-final-complete-data.js 載入測試分類資料。',
    '產品資料載入': '確保產品資料已正確載入，並檢查產品與分類的關聯。',
    '桌台資料載入': '載入桌台測試資料，確保桌台配置正確。',
    '訂單資料載入': '檢查訂單資料和相關的桌台、產品關聯是否正確。'
  }
  return suggestions[testName] || '請檢查相關設定和資料。'
}

export default DiagnosticPanel
