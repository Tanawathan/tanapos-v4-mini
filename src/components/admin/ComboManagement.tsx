import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Product {
  id: string
  name: string
  price: number
  category_id: string
}

interface Category {
  id: string
  name: string
}

interface ComboProduct {
  id: string
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available: boolean
  preparation_time: number
}

interface ComboChoice {
  id: string
  combo_id: string
  category_id: string
  min_selections: number
  max_selections: number
  sort_order: number
  category_name?: string
}

interface ComboSetupForm {
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'selectable'
  preparation_time: number
  choices: {
    category_id: string
    min_selections: number
    max_selections: number
  }[]
}
  rule_id: string
  product_id: string
  additional_price: number
  is_default: boolean
  product_name?: string
  product_price?: number
}

const ComboManagement: React.FC = () => {
  const [combos, setCombos] = useState<ComboProduct[]>([])
  const [comboItems, setComboItems] = useState<{ [comboId: string]: ComboItem[] }>({})
  const [comboRules, setComboRules] = useState<{ [comboId: string]: ComboSelectionRule[] }>({})
  const [comboOptions, setComboOptions] = useState<{ [ruleId: string]: ComboSelectionOption[] }>({})
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // 新增套餐表單狀態
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCombo, setNewCombo] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    preparation_time: 15,
    combo_type: 'fixed' as 'fixed' | 'customizable'
  })
  
  // 選中的套餐和其項目編輯
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null)
  const [editingItems, setEditingItems] = useState<ComboItem[]>([])
  const [editingRules, setEditingRules] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 載入套餐
      const { data: combosData, error: combosError } = await supabase
        .from('combo_products')
        .select('*')
        .order('name')

      if (combosError) throw combosError
      setCombos(combosData || [])

      // 載入套餐項目（固定套餐用）
      const { data: itemsData, error: itemsError } = await supabase
        .from('combo_items')
        .select(`
          *,
          products(name)
        `)

      if (itemsError) throw itemsError
      
      // 按套餐ID分組
      const itemsByCombo: { [comboId: string]: ComboItem[] } = {}
      itemsData?.forEach(item => {
        if (!itemsByCombo[item.combo_id]) {
          itemsByCombo[item.combo_id] = []
        }
        itemsByCombo[item.combo_id].push({
          ...item,
          product_name: item.products?.name
        })
      })
      setComboItems(itemsByCombo)

      // 載入套餐選擇規則（可選擇套餐用）
      const { data: rulesData, error: rulesError } = await supabase
        .from('combo_selection_rules')
        .select(`
          *,
          categories(name)
        `)
        .order('display_order')

      if (rulesError && !rulesError.message.includes('does not exist')) {
        console.warn('combo_selection_rules 表格可能尚未創建:', rulesError.message)
      }
      
      const rulesByCombo: { [comboId: string]: ComboSelectionRule[] } = {}
      rulesData?.forEach(rule => {
        if (!rulesByCombo[rule.combo_id]) {
          rulesByCombo[rule.combo_id] = []
        }
        rulesByCombo[rule.combo_id].push({
          ...rule,
          category_name: rule.categories?.name
        })
      })
      setComboRules(rulesByCombo)

      // 載入套餐選項（可選擇套餐用）
      const { data: optionsData, error: optionsError } = await supabase
        .from('combo_selection_options')
        .select(`
          *,
          products(name, price)
        `)

      if (optionsError && !optionsError.message.includes('does not exist')) {
        console.warn('combo_selection_options 表格可能尚未創建:', optionsError.message)
      }
      
      const optionsByRule: { [ruleId: string]: ComboSelectionOption[] } = {}
      optionsData?.forEach(option => {
        if (!optionsByRule[option.rule_id]) {
          optionsByRule[option.rule_id] = []
        }
        optionsByRule[option.rule_id].push({
          ...option,
          product_name: option.products?.name,
          product_price: option.products?.price
        })
      })
      setComboOptions(optionsByRule)

      // 載入產品和分類
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from('products').select('id, name, price, category_id').eq('is_available', true),
        supabase.from('categories').select('id, name').order('name')
      ])

      if (productsResult.error) throw productsResult.error
      if (categoriesResult.error) throw categoriesResult.error

      setProducts(productsResult.data || [])
      setCategories(categoriesResult.data || [])

    } catch (error) {
      console.error('載入資料失敗:', error)
      setMessage('載入資料失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCombo = async () => {
    if (!newCombo.name || !newCombo.price) {
      setMessage('請填寫套餐名稱和價格')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('combo_products')
        .insert({
          name: newCombo.name,
          description: newCombo.description,
          price: newCombo.price,
          category_id: newCombo.category_id || null,
          preparation_time: newCombo.preparation_time,
          combo_type: newCombo.combo_type,
          is_available: true
        })
        .select()
        .single()

      if (error) throw error

      setMessage('套餐創建成功！')
      setShowAddForm(false)
      setNewCombo({ name: '', description: '', price: 0, category_id: '', preparation_time: 15, combo_type: 'fixed' })
      loadData()
    } catch (error) {
      console.error('創建套餐失敗:', error)
      setMessage('創建套餐失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCombo = async (comboId: string) => {
    if (!confirm('確定要刪除此套餐嗎？此操作會同時刪除套餐內的所有項目。')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('combo_products')
        .delete()
        .eq('id', comboId)

      if (error) throw error

      setMessage('套餐刪除成功！')
      loadData()
    } catch (error) {
      console.error('刪除套餐失敗:', error)
      setMessage('刪除套餐失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItemToCombo = async (comboId: string, productId: string, quantity: number = 1) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('combo_items')
        .insert({
          combo_id: comboId,
          product_id: productId,
          quantity: quantity,
          is_optional: false,
          additional_price: 0
        })

      if (error) throw error

      setMessage('項目添加成功！')
      loadData()
    } catch (error) {
      console.error('添加項目失敗:', error)
      setMessage('添加項目失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItemFromCombo = async (itemId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('combo_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setMessage('項目移除成功！')
      loadData()
    } catch (error) {
      console.error('移除項目失敗:', error)
      setMessage('移除項目失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🍽️ 套餐管理系統</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showAddForm ? '取消' : '新增套餐'}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {/* 新增套餐表單 */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">新增套餐</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  套餐名稱 *
                </label>
                <input
                  type="text"
                  value={newCombo.name}
                  onChange={(e) => setNewCombo({ ...newCombo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="例：經典雞排套餐"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  套餐類型 *
                </label>
                <select
                  value={newCombo.combo_type}
                  onChange={(e) => setNewCombo({ ...newCombo, combo_type: e.target.value as 'fixed' | 'customizable' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="fixed">固定套餐</option>
                  <option value="customizable">可選擇套餐</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  固定套餐：包含指定產品。可選擇套餐：客戶從分類中選擇產品
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  價格 *
                </label>
                <input
                  type="number"
                  value={newCombo.price}
                  onChange={(e) => setNewCombo({ ...newCombo, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="180"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  分類
                </label>
                <select
                  value={newCombo.category_id}
                  onChange={(e) => setNewCombo({ ...newCombo, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">選擇分類</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  製作時間 (分鐘)
                </label>
                <input
                  type="number"
                  value={newCombo.preparation_time}
                  onChange={(e) => setNewCombo({ ...newCombo, preparation_time: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述
                </label>
                <textarea
                  value={newCombo.description}
                  onChange={(e) => setNewCombo({ ...newCombo, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="套餐描述..."
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreateCombo}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '創建中...' : '創建套餐'}
              </button>
            </div>
          </div>
        )}

        {/* 套餐列表 */}
        <div className="space-y-4">
          {combos.map(combo => (
            <div key={combo.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {combo.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{combo.description}</p>
                  <div className="mt-1 flex items-center gap-4 text-sm">
                    <span className="font-medium text-green-600">NT$ {combo.price}</span>
                    <span className="text-gray-500">製作時間: {combo.preparation_time}分鐘</span>
                    <span className={`px-2 py-1 rounded text-xs ${combo.combo_type === 'fixed' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {combo.combo_type === 'fixed' ? '固定套餐' : '可選擇套餐'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${combo.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {combo.is_available ? '可用' : '停用'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCombo(selectedCombo === combo.id ? null : combo.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    {selectedCombo === combo.id ? '收起' : '編輯項目'}
                  </button>
                  <button
                    onClick={() => handleDeleteCombo(combo.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                  >
                    刪除
                  </button>
                </div>
              </div>

              {/* 套餐內容 - 根據套餐類型顯示不同內容 */}
              <div className="mt-3">
                {combo.combo_type === 'fixed' ? (
                  // 固定套餐顯示產品項目
                  <>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">套餐內容:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {comboItems[combo.id]?.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.product_name} × {item.quantity}
                          </span>
                          <button
                            onClick={() => handleRemoveItemFromCombo(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            移除
                          </button>
                        </div>
                      )) || (
                        <div className="text-gray-500 text-sm col-span-full">尚未添加任何項目</div>
                      )}
                    </div>
                  </>
                ) : (
                  // 可選擇套餐顯示選擇規則
                  <>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">選擇規則:</h4>
                    <div className="space-y-2">
                      {comboRules[combo.id]?.map(rule => (
                        <div key={rule.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {rule.selection_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {rule.category_name} | 選 {rule.min_selections}-{rule.max_selections} 項 
                              {rule.is_required ? ' (必選)' : ' (可選)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {comboOptions[rule.id]?.map(option => (
                              <div key={option.id} className="text-xs bg-white dark:bg-gray-800 p-1 rounded">
                                {option.product_name}
                                {option.additional_price > 0 && ` (+NT$${option.additional_price})`}
                                {option.is_default && ' ⭐'}
                              </div>
                            )) || (
                              <div className="text-xs text-gray-500 col-span-full">尚未設定選項</div>
                            )}
                          </div>
                        </div>
                      )) || (
                        <div className="text-gray-500 text-sm">尚未設定選擇規則</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 編輯項目區域 */}
              {selectedCombo === combo.id && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
                  {combo.combo_type === 'fixed' ? (
                    // 固定套餐：添加產品項目
                    <>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">添加項目到套餐</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {products.map(product => (
                          <button
                            key={product.id}
                            onClick={() => handleAddItemToCombo(combo.id, product.id)}
                            className="text-left p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">NT$ {product.price}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    // 可選擇套餐：管理選擇規則
                    <>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">管理選擇規則</h4>
                      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-4">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                          🚧 可選擇套餐規則管理功能開發中...
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-300 text-xs mt-1">
                          請先在 Supabase 中手動設定 combo_selection_rules 和 combo_selection_options
                        </p>
                      </div>
                      
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p><strong>設定步驟：</strong></p>
                        <ol className="list-decimal list-inside space-y-1 mt-2">
                          <li>在 combo_selection_rules 中新增選擇規則</li>
                          <li>指定分類ID和選擇限制</li>
                          <li>在 combo_selection_options 中新增可選產品</li>
                          <li>重新載入此頁面查看規則</li>
                        </ol>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {combos.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              尚未創建任何套餐。點擊「新增套餐」開始建立您的第一個套餐！
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">載入中...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComboManagement
