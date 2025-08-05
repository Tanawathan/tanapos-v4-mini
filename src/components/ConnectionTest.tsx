import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface ConnectionStatus {
  api: 'testing' | 'success' | 'error'
  auth: 'testing' | 'success' | 'error'
  data: 'testing' | 'success' | 'error'
  messages: string[]
}

interface Restaurant {
  id: string
  name: string
  is_active: boolean
}

export default function ConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    api: 'testing',
    auth: 'testing', 
    data: 'testing',
    messages: []
  })

  const addMessage = (message: string) => {
    setStatus(prev => ({
      ...prev,
      messages: [...prev.messages, `${new Date().toLocaleTimeString()}: ${message}`]
    }))
  }

  useEffect(() => {
    async function testConnection() {
      addMessage('🚀 開始連接測試...')
      
      // 測試 1: API 連接
      addMessage('📡 測試 API 連接...')
      try {
        const { error } = await supabase
          .from('restaurants')
          .select('count')
          .limit(1)
        
        if (error) {
          setStatus(prev => ({ ...prev, api: 'error' }))
          addMessage(`❌ API 錯誤: ${error.message}`)
        } else {
          setStatus(prev => ({ ...prev, api: 'success' }))
          addMessage('✅ API 連接正常')
        }
      } catch (e) {
        setStatus(prev => ({ ...prev, api: 'error' }))
        addMessage(`❌ API 連接失敗: ${(e as Error).message}`)
      }

      // 測試 2: 認證狀態
      addMessage('🔐 檢查認證狀態...')
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          setStatus(prev => ({ ...prev, auth: 'error' }))
          addMessage(`❌ 認證錯誤: ${authError.message}`)
        } else {
          setStatus(prev => ({ ...prev, auth: 'success' }))
          if (authData.session) {
            addMessage(`✅ 已登入: ${authData.session.user.email}`)
          } else {
            addMessage('ℹ️ 未登入')
          }
        }
      } catch (e) {
        setStatus(prev => ({ ...prev, auth: 'error' }))
        addMessage(`❌ 認證檢查失敗: ${(e as Error).message}`)
      }

      // 測試 3: 資料查詢
      addMessage('📊 測試資料查詢...')
      try {
        const { data: restaurants, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name, is_active')
          .limit(3)
        
        if (restaurantError) {
          setStatus(prev => ({ ...prev, data: 'error' }))
          addMessage(`❌ 資料錯誤: ${restaurantError.message}`)
        } else {
          setStatus(prev => ({ ...prev, data: 'success' }))
          addMessage(`✅ 查詢到 ${restaurants?.length} 間餐廳`)
          restaurants?.forEach((r: Restaurant) => addMessage(`   - ${r.name} (${r.is_active ? 'active' : 'inactive'})`))
        }
      } catch (e) {
        setStatus(prev => ({ ...prev, data: 'error' }))
        addMessage(`❌ 資料查詢失敗: ${(e as Error).message}`)
      }

      addMessage('🎯 連接測試完成')
    }

    testConnection()
  }, [])

  const getStatusIcon = (statusType: 'testing' | 'success' | 'error') => {
    switch (statusType) {
      case 'testing': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
    }
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Supabase 連接測試
        </h3>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(status.api)}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">API 連接</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(status.auth)}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">認證狀態</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(status.data)}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">資料查詢</span>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-h-40 overflow-y-auto">
          {status.messages.map((msg, index) => (
            <div key={index} className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-mono">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
