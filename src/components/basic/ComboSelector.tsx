import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface ComboSelectionRule {
  id: string
  combo_id: string
  category_id: string
  selection_name: string
  min_selections: number
  max_selections: number
  is_required: boolean
  display_order: number
  category_name?: string
}

interface ComboSelectionOption {
  id: string
  rule_id: string
  product_id: string
  additional_price: number
  is_default: boolean
  product_name?: string
  product_price?: number
  product_description?: string
}

interface ComboProduct {
  id: string
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'customizable'
}

interface SelectedOption {
  ruleId: string
  productId: string
  productName: string
  additionalPrice: number
}

interface ComboSelectorProps {
  combo: ComboProduct
  onSelectionComplete: (selections: SelectedOption[], totalPrice: number) => void
  onCancel: () => void
}

const ComboSelector: React.FC<ComboSelectorProps> = ({ combo, onSelectionComplete, onCancel }) => {
  const [rules, setRules] = useState<ComboSelectionRule[]>([])
  const [options, setOptions] = useState<{ [ruleId: string]: ComboSelectionOption[] }>({})
  const [selections, setSelections] = useState<{ [ruleId: string]: string[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadComboDetails()
  }, [combo.id])

  const loadComboDetails = async () => {
    setLoading(true)
    try {
      // 載入選擇規則
      const { data: rulesData, error: rulesError } = await supabase
        .from('combo_selection_rules')
        .select(`
          *,
          categories(name)
        `)
        .eq('combo_id', combo.id)
        .order('display_order')

      if (rulesError) throw rulesError

      const rulesWithCategory = rulesData.map(rule => ({
        ...rule,
        category_name: rule.categories?.name
      }))
      setRules(rulesWithCategory)

      // 載入選項
      if (rulesData.length > 0) {
        const ruleIds = rulesData.map(rule => rule.id)
        const { data: optionsData, error: optionsError } = await supabase
          .from('combo_selection_options')
          .select(`
            *,
            products(name, price, description)
          `)
          .in('rule_id', ruleIds)

        if (optionsError) throw optionsError

        const optionsByRule: { [ruleId: string]: ComboSelectionOption[] } = {}
        optionsData.forEach(option => {
          if (!optionsByRule[option.rule_id]) {
            optionsByRule[option.rule_id] = []
          }
          optionsByRule[option.rule_id].push({
            ...option,
            product_name: option.products?.name,
            product_price: option.products?.price,
            product_description: option.products?.description
          })
        })
        setOptions(optionsByRule)

        // 設定預設選擇
        const defaultSelections: { [ruleId: string]: string[] } = {}
        rulesData.forEach(rule => {
          const ruleOptions = optionsByRule[rule.id] || []
          const defaultOption = ruleOptions.find(opt => opt.is_default)
          if (defaultOption && rule.min_selections > 0) {
            defaultSelections[rule.id] = [defaultOption.product_id]
          } else {
            defaultSelections[rule.id] = []
          }
        })
        setSelections(defaultSelections)
      }

    } catch (error) {
      console.error('載入套餐詳情失敗:', error)
      setError('載入套餐詳情失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionToggle = (ruleId: string, productId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    setSelections(prev => {
      const currentSelections = prev[ruleId] || []
      let newSelections: string[]

      if (currentSelections.includes(productId)) {
        // 取消選擇
        newSelections = currentSelections.filter(id => id !== productId)
      } else {
        // 新增選擇
        if (currentSelections.length >= rule.max_selections) {
          // 如果已達上限，替換第一個選擇
          newSelections = rule.max_selections === 1 
            ? [productId] 
            : [...currentSelections.slice(1), productId]
        } else {
          newSelections = [...currentSelections, productId]
        }
      }

      return {
        ...prev,
        [ruleId]: newSelections
      }
    })
  }

  const calculateTotalPrice = (): number => {
    let total = combo.price
    
    Object.entries(selections).forEach(([ruleId, productIds]) => {
      productIds.forEach(productId => {
        const option = options[ruleId]?.find(opt => opt.product_id === productId)
        if (option) {
          total += option.additional_price
        }
      })
    })

    return total
  }

  const isSelectionValid = (): boolean => {
    return rules.every(rule => {
      const ruleSelections = selections[rule.id] || []
      return ruleSelections.length >= rule.min_selections && 
             ruleSelections.length <= rule.max_selections &&
             (!rule.is_required || ruleSelections.length > 0)
    })
  }

  const handleComplete = () => {
    if (!isSelectionValid()) return

    const selectedOptions: SelectedOption[] = []
    
    Object.entries(selections).forEach(([ruleId, productIds]) => {
      productIds.forEach(productId => {
        const option = options[ruleId]?.find(opt => opt.product_id === productId)
        if (option) {
          selectedOptions.push({
            ruleId,
            productId,
            productName: option.product_name || '',
            additionalPrice: option.additional_price
          })
        }
      })
    })

    onSelectionComplete(selectedOptions, calculateTotalPrice())
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">載入套餐選項中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-3xl mb-4">❌</div>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              選擇套餐內容
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{combo.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {rules.map(rule => (
            <div key={rule.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {rule.selection_name}
                </h4>
                <div className="text-sm text-gray-500">
                  {rule.category_name} | 選 {rule.min_selections}-{rule.max_selections} 項
                  {rule.is_required && <span className="text-red-500 ml-1">*</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options[rule.id]?.map(option => {
                  const isSelected = selections[rule.id]?.includes(option.product_id) || false
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionToggle(rule.id, option.product_id)}
                      className={`text-left p-3 rounded-md border-2 transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {option.product_name}
                            {option.is_default && <span className="text-yellow-500 ml-1">⭐</span>}
                          </div>
                          {option.product_description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {option.product_description}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                          {option.additional_price > 0 && `+NT$${option.additional_price}`}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                已選擇 {selections[rule.id]?.length || 0} / {rule.max_selections} 項
                {rule.min_selections > 0 && ` (最少 ${rule.min_selections} 項)`}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            總計: NT$ {calculateTotalPrice()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleComplete}
              disabled={!isSelectionValid()}
              className={`px-6 py-2 rounded-md ${
                isSelectionValid()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              確認選擇
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComboSelector
