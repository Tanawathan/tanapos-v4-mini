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
  const [quantity, setQuantity] = useState<number>(1)
  const [activeRuleIndex, setActiveRuleIndex] = useState<number>(0)

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
  setQuantity(1)
  setActiveRuleIndex(0)
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
  setActiveRuleIndex(0)
  setQuantity(1)
    } catch (error) {
      console.error('載入套餐規則失敗:', error)
      setError('載入套餐選項失敗')
    } finally {
      setLoading(false)
    }
  }

  // 無逐份模式，無需同步狀態

  if (!isOpen || !combo) return null

  const handleOptionChange = (ruleId: string, optionId: string, rule: ComboSelectionRule) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[ruleId] || []
      if (rule.selection_type === 'single') {
        return { ...prev, [ruleId]: [optionId] }
      } else {
        if (currentSelections.includes(optionId)) {
          const newSelections = currentSelections.filter(id => id !== optionId)
          if (newSelections.length < rule.min_selections) return prev
          return { ...prev, [ruleId]: newSelections }
        } else {
          if (currentSelections.length >= rule.max_selections) return prev
          return { ...prev, [ruleId]: [...currentSelections, optionId] }
        }
      }
    })
  }

  const validateRule = (selections: string[], rule: ComboSelectionRule) => {
    if (rule.is_required && selections.length < rule.min_selections) return false
    if (selections.length > rule.max_selections) return false
    return true
  }

  const validateSelections = (): boolean => {
    if (combo.combo_type === 'fixed') return true
    for (const rule of comboRules) {
      const selections = selectedOptions[rule.id] || []
      if (!validateRule(selections, rule)) return false
    }
    return true
  }

  const calculateTotalPrice = (): number => {
    if (combo.combo_type === 'fixed') return combo.price * quantity
    let totalPrice = combo.price
    for (const rule of comboRules) {
      const selections = selectedOptions[rule.id] || []
      for (const optionId of selections) {
        const option = rule.options.find(opt => opt.id === optionId)
        if (option) totalPrice += option.additional_price
      }
    }
    return totalPrice * quantity
  }

  const handleAddToCart = () => {
    // 對於 fixed 類型套餐，直接加入購物車
    if (combo.combo_type === 'fixed') {
      addToCart(combo, undefined, quantity)
      onClose()
      return
    }

    // 對於 selectable 類型套餐，需要驗證選擇
    if (!validateSelections()) {
      setError('請完成所有必選項目的選擇')
      return
    }

    // 準備套餐選擇資料（套用到每一份）
    const comboSelections: Array<{
      rule_id: string
      selected_product_id: string
      quantity?: number
      additional_price?: number
    }> = []

    Object.entries(selectedOptions).forEach(([ruleId, selectedOptionIds]) => {
      selectedOptionIds.forEach(optionId => {
        const rule = comboRules.find(r => r.id === ruleId)
        const option = rule?.options.find(o => o.id === optionId)
        if (option && option.product_id) {
          comboSelections.push({
            rule_id: ruleId,
            selected_product_id: option.product_id,
            quantity: 1,
            additional_price: option.additional_price || 0
          })
        }
      })
    })

    addToCart(combo, comboSelections, quantity)
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
            {combo.combo_type === 'selectable' && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-gray-600">份數</span>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 grid place-items-center bg-gray-50">-</button>
                  <div className="px-3 text-sm min-w-[2rem] text-center">{quantity}</div>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 grid place-items-center bg-gray-50">+</button>
                </div>
                <span className="text-xs text-gray-500">此選擇將套用到每一份</span>
              </div>
            )}
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

                  {/* 最簡化：無逐份操作與預設按鈕 */}

                  {/* 規則 Tabs（縮短整體長度） */}
                  <div className="mb-3 flex gap-2 overflow-x-auto">
                    {comboRules.map((rule, idx) => {
                      const hasMin = Math.max(1, rule.min_selections || 0)
                      const done = (selectedOptions[rule.id] || []).length >= hasMin
                      return (
                        <button
                          key={rule.id}
                          onClick={() => setActiveRuleIndex(idx)}
                          className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${idx===activeRuleIndex ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-600'}`}
                        >
                          {done ? '✅' : `${idx+1}.`} {rule.selection_name}
                        </button>
                      )
                    })}
                  </div>

                  {/* 當前規則內容（可滾動） */}
                  {comboRules[activeRuleIndex] && (() => {
                    const rule = comboRules[activeRuleIndex]
                    const currentSelections = selectedOptions[rule.id] || []
                    const inputType = rule.selection_type === 'single' ? 'radio' : 'checkbox'
                    return (
                      <div className={`space-y-2 max-h-64 overflow-y-auto pr-1 ${!validateRule(currentSelections, rule) ? 'ring-1 ring-red-300 rounded' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm text-gray-700">
                            {rule.selection_name} {rule.is_required && <span className="text-red-500">*</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rule.selection_type === 'single' ? '單選' : `${rule.min_selections}-${rule.max_selections} 選`}
                          </div>
                        </div>
                        {rule.options.map(option => {
                          const isSelected = currentSelections.includes(option.id)
                          return (
                            <label key={option.id} className={`flex items-center p-2 rounded-lg border cursor-pointer text-sm ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <input
                                type={inputType}
                                name={`rule_${rule.id}`}
                                checked={isSelected}
                                onChange={() => handleOptionChange(rule.id, option.id, rule)}
                                className="mr-2"
                              />
                              <div className="flex-1 flex items-center justify-between gap-2">
                                <span className="truncate">
                                  {option.product_name}
                                  {option.is_default && <span className="ml-1 text-xs text-green-600">[預設]</span>}
                                </span>
                                {option.additional_price !== 0 && (
                                  <span className={`${option.additional_price > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {option.additional_price > 0 ? '+' : ''}${option.additional_price}
                                  </span>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )
                  })()}
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
