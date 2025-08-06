import React, { useState, useEffect } from 'react'
import { Plus, Edit2, AlertCircle, Eye } from 'lucide-react'
import { RuleSection } from './RuleSection'
import { ComboPreview } from './ComboPreview'
import { MenuService } from '../../services/menuService'
import type { ComboProduct, ComboSelectionRule } from '../../lib/menu-types'

interface ComboRuleEditorProps {
  combo: ComboProduct
  onSave: (rules: ComboSelectionRule[]) => void
  onCancel: () => void
}

export const ComboRuleEditor: React.FC<ComboRuleEditorProps> = ({
  combo,
  onSave,
  onCancel
}) => {
  const [rules, setRules] = useState<ComboSelectionRule[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const menuService = MenuService.getInstance()

  // 載入現有規則 (如果是編輯模式)
  useEffect(() => {
    if (combo.id) {
      loadComboRules()
    }
  }, [combo.id])

  const loadComboRules = async () => {
    if (!combo.id) return
    
    setIsLoading(true)
    try {
      console.log('載入套餐規則:', combo.id)
      const response = await menuService.getComboWithRules(combo.id)
      
      if (response.data && response.data.rules) {
        console.log('載入的規則:', response.data.rules)
        setRules(response.data.rules)
      } else {
        console.log('沒有找到規則，初始化空陣列')
        setRules([])
      }
    } catch (error) {
      console.error('載入規則失敗:', error)
      setRules([])
    } finally {
      setIsLoading(false)
    }
  }

  // 新增規則
  const handleAddRule = () => {
    const newRule: Partial<ComboSelectionRule> = {
      id: `temp_${Date.now()}`,
      combo_id: combo.id,
      name: '新規則',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      sort_order: rules.length,
      created_at: new Date().toISOString(),
      options: []
    }
    setRules([...rules, newRule as ComboSelectionRule])
  }

  // 更新規則
  const handleUpdateRule = (ruleId: string, updates: Partial<ComboSelectionRule>) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ))
  }

  // 刪除規則
  const handleDeleteRule = (ruleId: string) => {
    if (confirm('確定要刪除這個規則嗎？')) {
      setRules(rules.filter(rule => rule.id !== ruleId))
    }
  }

  // 移動規則順序
  const handleMoveRule = (ruleId: string, direction: 'up' | 'down') => {
    const currentIndex = rules.findIndex(rule => rule.id === ruleId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= rules.length) return

    const newRules = [...rules]
    const [movedRule] = newRules.splice(currentIndex, 1)
    newRules.splice(newIndex, 0, movedRule)

    // 更新排序
    newRules.forEach((rule, index) => {
      rule.sort_order = index
    })

    setRules(newRules)
  }

  // 驗證規則
  const validateRules = (): string[] => {
    const errors: string[] = []

    if (rules.length === 0) {
      errors.push('自選套餐至少需要一個選擇規則')
    }

    rules.forEach((rule, index) => {
      if (!rule.name.trim()) {
        errors.push(`規則 ${index + 1}: 規則名稱不能為空`)
      }

      if (rule.min_selections > rule.max_selections) {
        errors.push(`規則 ${index + 1}: 最少選擇數不能大於最多選擇數`)
      }

      if (!rule.options || rule.options.length === 0) {
        errors.push(`規則 ${index + 1}: 至少需要一個商品選項`)
      }

      // 檢查是否有預設選項
      const hasDefault = rule.options?.some(option => option.is_default)
      if (rule.is_required && !hasDefault) {
        errors.push(`規則 ${index + 1}: 必選規則需要設定預設選項`)
      }
    })

    return errors
  }

  // 儲存規則
  const handleSave = async () => {
    const validationErrors = validateRules()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSaving(true)
    try {
      await onSave(rules)
    } catch (error) {
      console.error('儲存規則失敗:', error)
      setErrors(['儲存失敗，請稍後再試'])
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 標題與模式切換 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">套餐規則編輯器</h1>
          <p className="text-gray-600">配置 "{combo.name}" 的選擇規則</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsPreviewMode(false)}
              className={`px-4 py-2 rounded-md transition-colors ${
                !isPreviewMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit2 className="w-4 h-4 inline-block mr-2" />
              編輯模式
            </button>
            <button
              onClick={() => setIsPreviewMode(true)}
              className={`px-4 py-2 rounded-md transition-colors ${
                isPreviewMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 inline-block mr-2" />
              預覽模式
            </button>
          </div>
        </div>
      </div>

      {/* 錯誤提示 */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">需要修正以下問題：</h3>
          </div>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：規則編輯區 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">選擇規則</h2>
                {!isPreviewMode && (
                  <button
                    onClick={handleAddRule}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增規則
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Edit2 className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-4">尚未設定任何選擇規則</p>
                  {!isPreviewMode && (
                    <button
                      onClick={handleAddRule}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      新增第一個規則
                    </button>
                  )}
                </div>
              ) : (
                rules.map((rule, index) => (
                  <RuleSection
                    key={rule.id}
                    rule={rule}
                    index={index}
                    canMoveUp={index > 0}
                    canMoveDown={index < rules.length - 1}
                    isPreviewMode={isPreviewMode}
                    onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
                    onDelete={() => handleDeleteRule(rule.id)}
                    onMove={(direction) => handleMoveRule(rule.id, direction)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右側：預覽區 */}
        <div className="space-y-6">
          <ComboPreview
            combo={combo}
            rules={rules}
          />
        </div>
      </div>

      {/* 底部操作按鈕 */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || errors.length > 0}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '儲存中...' : '儲存規則'}
        </button>
      </div>
    </div>
  )
}
