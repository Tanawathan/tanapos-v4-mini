import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface LoginPageProps {
  onLoginSuccess?: () => void // 現在是可選的，因為我們會使用路由導航
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@tanapos.com')
  const [password, setPassword] = useState('TanaPos2025!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 檢查是否已經登入
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('✅ 用戶已登入:', session.user.email)
        if (onLoginSuccess) {
          onLoginSuccess()
        } else {
          navigate('/', { replace: true })
        }
      }
    }
    checkUser()
  }, [navigate, onLoginSuccess])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('🔐 開始登入流程...')
    console.log('Email:', email)
    console.log('Password:', password ? '已設定' : '未設定')

    try {
      // 首先測試 Supabase 連接
      console.log('🧪 測試 Supabase 連接...')
      const { error: testError } = await supabase
        .from('restaurants')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('❌ Supabase 連接失敗:', testError)
        setError('資料庫連接失敗: ' + testError.message)
        return
      }
      
      console.log('✅ Supabase 連接正常')

      // 嘗試登入
      console.log('🚀 嘗試登入...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (error) {
        console.error('❌ 登入失敗:', error)
        console.error('錯誤狀態:', error.status)
        console.error('錯誤代碼:', error.code)
        
        // 更詳細的錯誤處理
        if (error.message.includes('Invalid login credentials')) {
          setError('登入憑證無效，請檢查電子郵件和密碼')
        } else if (error.message.includes('Invalid API key')) {
          setError('API Key 配置錯誤，請聯繫系統管理員')
        } else if (error.message.includes('Email not confirmed')) {
          setError('電子郵件尚未驗證')
        } else {
          setError('登入失敗: ' + error.message)
        }
      } else {
        console.log('✅ 登入成功:', data.user?.email)
        console.log('用戶 ID:', data.user?.id)
        console.log('Session 狀態:', data.session ? '已建立' : '未建立')
        
        // 使用路由導航或回調函數
        if (onLoginSuccess) {
          onLoginSuccess()
        } else {
          navigate('/', { replace: true })
        }
      }
    } catch (err: any) {
      console.error('❌ 登入過程發生錯誤:', err)
      setError('系統錯誤: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo 和標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🍽️ TanaPOS</h1>
          <p className="text-xl text-gray-600">v4 AI 智慧餐廳管理系統</p>
          <p className="text-sm text-gray-500 mt-2">請使用管理者帳號登入</p>
        </div>

        {/* 登入表單 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">管理者登入</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email 輸入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                電子郵件
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@tanapos.com"
                required
              />
            </div>

            {/* 密碼輸入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密碼
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入密碼"
                required
              />
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 登入按鈕 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登入中...
                </div>
              ) : (
                '🔑 管理者登入'
              )}
            </button>
          </form>

          {/* 測試帳號提示 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">📋 測試帳號資訊</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Email:</strong> admin@tanapos.com</p>
              <p><strong>密碼:</strong> TanaPos2025!</p>
              <p className="text-green-600 mt-2">✅ 此帳號具有完整管理權限</p>
            </div>
          </div>
        </div>

        {/* 系統資訊 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>TanaPOS v4 AI - Supabase 資料庫整合版</p>
          <p>具備完整的 RLS 權限控制機制</p>
        </div>
      </div>
    </div>
  )
}
