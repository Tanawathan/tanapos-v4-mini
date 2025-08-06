import React from 'react'
import { Clock, Users, Edit2, Trash2, ToggleLeft, ToggleRight, ChefHat, Settings } from 'lucide-react'
import type { ComboProduct, Category } from '../../lib/menu-types'

interface ComboCardProps {
  combo: ComboProduct
  categories: Category[]
  onEdit: (combo: ComboProduct) => void
  onEditRules?: (combo: ComboProduct) => void
  onDelete: (id: string) => void
  onToggleAvailability: (id: string, isAvailable: boolean) => void
}

export const ComboCard: React.FC<ComboCardProps> = ({
  combo,
  categories,
  onEdit,
  onEditRules,
  onDelete,
  onToggleAvailability
}) => {
  const getCategoryInfo = () => {
    if (!combo.category_id) return null
    return categories.find(cat => cat.id === combo.category_id)
  }

  const categoryInfo = getCategoryInfo()

  const getComboTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed':
        return '固定套餐'
      case 'selectable':
        return '自選套餐'
      default:
        return '未知類型'
    }
  }

  const getComboTypeColor = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'bg-blue-100 text-blue-800'
      case 'selectable':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      {/* 套餐頭部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {combo.name}
              </h3>
            </div>
            
            {combo.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {combo.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-sm">
              {/* 套餐類型 */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComboTypeColor(combo.combo_type)}`}>
                {getComboTypeLabel(combo.combo_type)}
              </span>

              {/* 分類信息 */}
              {categoryInfo && (
                <div className="flex items-center gap-1">
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryInfo.color }}
                  />
                  <span className="text-gray-600 text-xs">
                    {categoryInfo.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 價格 */}
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-gray-900">
              ${combo.price}
            </div>
          </div>
        </div>
      </div>

      {/* 套餐詳情 */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 製作時間 */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {combo.preparation_time} 分鐘
            </span>
          </div>

          {/* 選項數量 (僅自選套餐顯示) */}
          {combo.combo_type === 'selectable' && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {combo.selection_rules?.length || 0} 個選項組
              </span>
            </div>
          )}
        </div>

        {/* 狀態顯示 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* 可用狀態 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">供應狀態:</span>
              <span className={`text-sm font-medium ${combo.is_available ? 'text-green-600' : 'text-red-600'}`}>
                {combo.is_available ? '供應中' : '暫停供應'}
              </span>
            </div>
          </div>

          {/* 狀態切換按鈕 */}
          <button
            onClick={() => onToggleAvailability(combo.id, !combo.is_available)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              combo.is_available
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {combo.is_available ? (
              <>
                <ToggleRight className="w-4 h-4" />
                供應中
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                已暫停
              </>
            )}
          </button>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(combo)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            編輯
          </button>
          
          {/* 自選套餐規則編輯按鈕 */}
          {combo.combo_type === 'selectable' && onEditRules && (
            <button
              onClick={() => onEditRules(combo)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              規則
            </button>
          )}
          
          <button
            onClick={() => onDelete(combo.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            刪除
          </button>
        </div>
      </div>
    </div>
  )
}
