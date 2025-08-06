import React, { useState } from 'react'
import { Edit2, Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import { OptionEditor } from './OptionEditor'
import type { ComboSelectionRule, ComboSelectionOption } from '../../lib/menu-types'

interface RuleSectionProps {
  rule: ComboSelectionRule
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
  isPreviewMode: boolean
  onUpdate: (updates: Partial<ComboSelectionRule>) => void
  onDelete: () => void
  onMove: (direction: 'up' | 'down') => void
}

export const RuleSection: React.FC<RuleSectionProps> = ({
  rule,
  canMoveUp,
  canMoveDown,
  isPreviewMode,
  onUpdate,
  onDelete,
  onMove
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(rule.name)

  // 處理名稱編輯
  const handleNameEdit = () => {
    if (isEditing) {
      onUpdate({ name: editingName })
      setIsEditing(false)
    } else {
      setEditingName(rule.name)
      setIsEditing(true)
    }
  }

  // 處理數量變更
  const handleQuantityChange = (field: 'min_selections' | 'max_selections', value: number) => {
    const updates: Partial<ComboSelectionRule> = {}
    updates[field] = Math.max(1, value)
    
    // 確保最少選擇數不大於最多選擇數
    if (field === 'min_selections' && value > rule.max_selections) {
      updates.max_selections = value
    }
    if (field === 'max_selections' && value < rule.min_selections) {
      updates.min_selections = value
    }
    
    onUpdate(updates)
  }

  // 新增選項
  const handleAddOption = () => {
    const newOption: ComboSelectionOption = {
      id: `temp_${Date.now()}`,
      rule_id: rule.id,
      product_id: '',
      additional_price: 0,
      is_default: false,
      is_available: true,
      sort_order: (rule.options || []).length,
      created_at: new Date().toISOString()
    }
    onUpdate({ options: [...(rule.options || []), newOption] })
  }

  // 更新選項
  const handleUpdateOption = (optionId: string, updates: Partial<ComboSelectionOption>) => {
    const updatedOptions = rule.options?.map(option => 
      option.id === optionId ? { ...option, ...updates } : option
    ) || []
    onUpdate({ options: updatedOptions })
  }

  // 刪除選項
  const handleDeleteOption = (optionId: string) => {
    const updatedOptions = rule.options?.filter(option => option.id !== optionId) || []
    onUpdate({ options: updatedOptions })
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* 規則標題區 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
                className="px-2 py-1 border border-gray-300 rounded text-lg font-semibold"
                autoFocus
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">
                {rule.name}
              </h3>
            )}

            <span className={`px-2 py-1 text-xs rounded-full ${
              rule.is_required 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {rule.is_required ? '必選' : '可選'}
            </span>
          </div>

          {!isPreviewMode && (
            <div className="flex items-center gap-2">
              {/* 排序按鈕 */}
              <div className="flex flex-col">
                <button
                  onClick={() => onMove('up')}
                  disabled={!canMoveUp}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onMove('down')}
                  disabled={!canMoveDown}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* 編輯按鈕 */}
              <button
                onClick={handleNameEdit}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* 刪除按鈕 */}
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-100 text-red-600 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 規則內容區 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 基本設定 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                規則類型
              </label>
              <select
                value={rule.is_required ? 'required' : 'optional'}
                onChange={(e) => onUpdate({ is_required: e.target.value === 'required' })}
                disabled={isPreviewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
              >
                <option value="required">必選</option>
                <option value="optional">可選</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最少選擇
              </label>
              <input
                type="number"
                min="1"
                value={rule.min_selections}
                onChange={(e) => handleQuantityChange('min_selections', parseInt(e.target.value) || 1)}
                disabled={isPreviewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最多選擇
              </label>
              <input
                type="number"
                min="1"
                value={rule.max_selections}
                onChange={(e) => handleQuantityChange('max_selections', parseInt(e.target.value) || 1)}
                disabled={isPreviewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* 商品選項 */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700">商品選項</h4>
              {!isPreviewMode && (
                <button
                  onClick={handleAddOption}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增選項
                </button>
              )}
            </div>

            <div className="space-y-2">
              {rule.options?.length === 0 || !rule.options ? (
                <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p>尚未新增任何商品選項</p>
                  {!isPreviewMode && (
                    <button
                      onClick={handleAddOption}
                      className="mt-2 text-orange-600 hover:text-orange-700"
                    >
                      點擊新增第一個選項
                    </button>
                  )}
                </div>
              ) : (
                rule.options.map((option) => (
                  <OptionEditor
                    key={option.id}
                    option={option}
                    onUpdate={(updates) => handleUpdateOption(option.id, updates)}
                    onDelete={() => handleDeleteOption(option.id)}
                    isPreviewMode={isPreviewMode}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
