import React, { useState, useEffect } from 'react'
import { useMobileOrderStore, type MenuItem, type ComboSelectionRule } from '../../stores/mobileOrderStore'

interface ComboSelectorModalProps {
  combo: MenuItem | null
  isOpen: boolean
  onClose: () => void
}

const ComboSelectorModal: React.FC<ComboSelectorModalProps> = ({ combo, isOpen, onClose }) => {
  const { addToCart, loadComboRules } = useMobileOrderStore()
  const [selectedOptions, setSelectedOptions] = useState<{[ruleId: string]: string[]}>({})
  const [comboRules, setComboRules] = useState<ComboSelectionRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 載入套餐規則
  useEffect(() => {
    if (isOpen && combo && combo.combo_type === 'selectable') {
      loadComboData()
    }
  }, [isOpen, combo])

  // 重置選擇當模態框關閉時
  useEffect(() => {
    if (!isOpen) {
      setSelectedOptions({})
      setComboRules([])
      setError(null)
    }
  }, [isOpen])

  const loadComboData = async () => {
    if (!combo) return
    
    setLoading(true)
    setError(null)
    try {
      const rules = await loadComboRules(combo.id)
      setComboRules(rules)
      
      // 初始化預設選項
      const defaultSelections: {[ruleId: string]: string[]} = {}
      rules.forEach(rule => {
        const defaultOptions = rule.options.filter(opt => opt.is_default)
        if (defaultOptions.length > 0) {
          defaultSelections[rule.id] = defaultOptions.map(opt => opt.id)
        } else if (rule.is_required && rule.min_selections > 0) {
          // 如果沒有預設值但是必選，選擇第一個選項
          const firstOptions = rule.options.slice(0, rule.min_selections)
          defaultSelections[rule.id] = firstOptions.map(opt => opt.id)
        } else {
          defaultSelections[rule.id] = []
        }
      })
      setSelectedOptions(defaultSelections)
    } catch (error) {
      console.error('載入套餐規則失敗:', error)
      setError('載入套餐選項失敗')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !combo) return null

  const handleOptionChange = (ruleId: string, optionId: string, rule: ComboSelectionRule) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[ruleId] || []
      
      if (rule.selection_type === 'single') {
        // 單選：直接替換
        return { ...prev, [ruleId]: [optionId] }
      } else {
        // 多選：添加或移除
        if (currentSelections.includes(optionId)) {
          // 移除選項（但要檢查最小選擇數）
          const newSelections = currentSelections.filter(id => id !== optionId)
          if (newSelections.length < rule.min_selections) {
            return prev // 不允許少於最小選擇數
          }
          return { ...prev, [ruleId]: newSelections }
        } else {
          // 添加選項（但要檢查最大選擇數）
          if (currentSelections.length >= rule.max_selections) {
            return prev // 不允許超過最大選擇數
          }
          return { ...prev, [ruleId]: [...currentSelections, optionId] }
        }
      }
    })
  }

  const validateSelections = (): boolean => {
    for (const rule of comboRules) {
      const selections = selectedOptions[rule.id] || []
      
      if (rule.is_required && selections.length < rule.min_selections) {
        return false
      }
      
      if (selections.length > rule.max_selections) {
        return false
      }
    }
    return true
  }

  const calculateTotalPrice = (): number => {
    let totalPrice = combo.price
    
    for (const rule of comboRules) {
      const selections = selectedOptions[rule.id] || []
      for (const optionId of selections) {
        const option = rule.options.find(opt => opt.id === optionId)
        if (option) {
          totalPrice += option.additional_price
        }
      }
    }
    
    return totalPrice
  }

  const handleAddToCart = () => {
    // 對於 fixed 類型套餐，直接加入購物車
    if (combo.combo_type === 'fixed') {
      addToCart(combo)
      onClose()
      return
    }

    // 對於 selectable 類型套餐，需要驗證選擇
    if (!validateSelections()) {
      setError('請完成所有必選項目的選擇')
      return
    }

    // TODO: 將選擇的選項資訊包含在購物車項目中
    console.log('套餐選項:', selectedOptions)
    addToCart(combo)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-md max-h-[80vh] rounded-t-xl overflow-hidden">
        {/* 頂部標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            🍱 {combo.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* 套餐資訊 */}
          <div className="mb-6">
            <p className="text-gray-600 mb-2">{combo.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-800">
                NT${combo.combo_type === 'selectable' ? calculateTotalPrice() : combo.price}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {combo.combo_type === 'fixed' ? '固定套餐' : '可選套餐'}
              </span>
            </div>
          </div>

          {/* 錯誤提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 套餐選擇區域 */}
          {combo.combo_type === 'selectable' ? (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">載入選項中...</span>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">請選擇套餐內容</h3>
                  
                  <div className="space-y-6">
                    {comboRules.map((rule) => {
                      const currentSelections = selectedOptions[rule.id] || []
                      return (
                        <div key={rule.id}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">
                              {rule.rule_name}
                              {rule.is_required && <span className="text-red-500 ml-1">*</span>}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {rule.selection_type === 'single' ? '單選' : `${rule.min_selections}-${rule.max_selections} 選`}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {rule.options.map((option) => {
                              const isSelected = currentSelections.includes(option.id)
                              const inputType = rule.selection_type === 'single' ? 'radio' : 'checkbox'
                              
                              return (
                                <label 
                                  key={option.id} 
                                  className={`flex items-center p-2 rounded-lg border-2 transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type={inputType}
                                    name={`rule_${rule.id}`}
                                    checked={isSelected}
                                    onChange={() => handleOptionChange(rule.id, option.id, rule)}
                                    className="mr-3"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        {option.option_name}
                                        {option.is_default && (
                                          <span className="ml-2 text-xs text-green-600">[預設]</span>
                                        )}
                                      </span>
                                      {option.additional_price !== 0 && (
                                        <span className={`text-sm font-medium ${
                                          option.additional_price > 0 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                          {option.additional_price > 0 ? '+' : ''}${option.additional_price}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">套餐內容</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  固定套餐內容已預先搭配，點擊加入購物車即可
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
            >
              取消
            </button>
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
            >
              加入購物車
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComboSelectorModal
