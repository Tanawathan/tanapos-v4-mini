import React from 'react'
import { Eye, Calculator, Package, AlertCircle } from 'lucide-react'
import type { ComboProduct, ComboSelectionRule } from '../../lib/menu-types'

interface ComboPreviewProps {
  combo: ComboProduct
  rules: ComboSelectionRule[]
}

export const ComboPreview: React.FC<ComboPreviewProps> = ({ combo, rules }) => {
  // 計算價格範圍
  const calculatePriceRange = () => {
    let minPrice = combo.price
    let maxPrice = combo.price

    rules.forEach(rule => {
      if (rule.options && rule.options.length > 0) {
        const prices = rule.options.map(option => option.additional_price)
        const minAdditional = Math.min(...prices)
        const maxAdditional = Math.max(...prices)

        // 必選規則會影響最低價格
        if (rule.is_required) {
          minPrice += minAdditional
        }

        // 計算最高價格 (選擇最貴的選項)
        maxPrice += maxAdditional * rule.max_selections
      }
    })

    return { minPrice, maxPrice }
  }

  const { minPrice, maxPrice } = calculatePriceRange()

  // 檢查配置完整性
  const getConfigurationStatus = () => {
    const issues: string[] = []

    if (rules.length === 0) {
      issues.push('尚未設定任何選擇規則')
    }

    rules.forEach((rule, index) => {
      if (!rule.options || rule.options.length === 0) {
        issues.push(`規則 ${index + 1} "${rule.name}" 沒有商品選項`)
      }

      if (rule.is_required && rule.options && !rule.options.some(option => option.is_default)) {
        issues.push(`規則 ${index + 1} "${rule.name}" 是必選但沒有預設選項`)
      }
    })

    return issues
  }

  const configurationIssues = getConfigurationStatus()
  const isComplete = configurationIssues.length === 0

  return (
    <div className="space-y-6">
      {/* 預覽標題 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">套餐預覽</h2>
          </div>
        </div>

        <div className="p-6">
          {/* 基本資訊 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{combo.name}</h3>
            {combo.description && (
              <p className="text-gray-600 mb-3">{combo.description}</p>
            )}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">套餐類型:</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                combo.combo_type === 'fixed' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {combo.combo_type === 'fixed' ? '固定套餐' : '自選套餐'}
              </span>
            </div>
          </div>

          {/* 價格資訊 */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-orange-800">價格資訊</h4>
            </div>
            <div className="space-y-1">
              <p className="text-gray-700">基礎價格: <span className="font-semibold">${combo.price}</span></p>
              {rules.length > 0 && (
                <p className="text-gray-700">
                  價格範圍: <span className="font-semibold text-orange-600">
                    ${minPrice} - ${maxPrice}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* 選擇規則 */}
          {rules.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-700">選擇規則</h4>
              </div>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">{rule.name}</h5>
                        <p className="text-sm text-gray-600">
                          {rule.is_required ? '必選' : '可選'} • 
                          選擇 {rule.min_selections} - {rule.max_selections} 個
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.is_required 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rule.is_required ? '必選' : '可選'}
                      </span>
                    </div>

                    {/* 顯示選項 */}
                    {rule.options && rule.options.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 mb-2">可選商品:</p>
                        <div className="grid grid-cols-1 gap-1">
                          {rule.options.map((option) => (
                            <div key={option.id} className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-sm">
                              <span className="text-gray-700">
                                商品 {option.product_id || '(未選擇)'}
                                {option.is_default && <span className="ml-1 text-orange-600">(預設)</span>}
                              </span>
                              <span className="text-gray-600">
                                {option.additional_price > 0 ? `+$${option.additional_price}` : '免費'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 mt-2">⚠️ 尚未設定商品選項</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 配置狀態 */}
          <div className={`p-4 rounded-lg border ${
            isComplete 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`w-5 h-5 ${
                isComplete ? 'text-green-600' : 'text-red-600'
              }`} />
              <h4 className={`font-semibold ${
                isComplete ? 'text-green-800' : 'text-red-800'
              }`}>
                配置狀態
              </h4>
            </div>

            {isComplete ? (
              <p className="text-green-700">✅ 套餐配置完整，可以發布使用</p>
            ) : (
              <div className="space-y-1">
                <p className="text-red-700 font-medium">需要修正以下問題:</p>
                <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                  {configurationIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 價格計算明細 */}
      {rules.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">價格計算明細</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">基礎價格</span>
                <span className="font-semibold">${combo.price}</span>
              </div>

              {rules.map((rule) => {
                if (!rule.options || rule.options.length === 0) return null

                const prices = rule.options.map(option => option.additional_price)
                const minAdditional = Math.min(...prices)
                const maxAdditional = Math.max(...prices)

                return (
                  <div key={rule.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{rule.name}</span>
                    <span className="text-gray-600">
                      {minAdditional === maxAdditional 
                        ? `+$${minAdditional}`
                        : `+$${minAdditional} ~ +$${maxAdditional * rule.max_selections}`
                      }
                    </span>
                  </div>
                )
              })}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">總價範圍</span>
                  <span className="font-bold text-orange-600 text-lg">
                    ${minPrice} - ${maxPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
