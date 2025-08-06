import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, ChefHat, Package, Clock, Utensils } from 'lucide-react'
import { ComboCard } from './ComboCard'
import { ComboModal } from './ComboModal'
import { ComboRuleEditor } from './ComboRuleEditor'
import { useMenuStore } from '../../stores/menuStore'
import type { ComboProduct } from '../../lib/menu-types'

export const ComboManagement: React.FC = () => {
  const {
    combos,
    categories,
    loading,
    error,
    loadCombos,
    loadCategories,
    createCombo,
    updateCombo,
    deleteCombo
  } = useMenuStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<ComboProduct | null>(null)
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false)
  const [editingRulesCombo, setEditingRulesCombo] = useState<ComboProduct | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterAvailability, setFilterAvailability] = useState<string>('')

  // 載入資料
  useEffect(() => {
    loadCategories()
    loadCombos()
  }, [loadCategories, loadCombos])

  // 篩選套餐
  const filteredCombos = combos.filter(combo => {
    const matchesSearch = !searchTerm || 
      combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (combo.description && combo.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !filterCategory || combo.category_id === filterCategory
    const matchesType = !filterType || combo.combo_type === filterType
    const matchesAvailability = !filterAvailability || 
      (filterAvailability === 'available' ? combo.is_available : !combo.is_available)

    return matchesSearch && matchesCategory && matchesType && matchesAvailability
  })

  // 統計數據
  const stats = {
    total: combos.length,
    available: combos.filter(combo => combo.is_available).length,
    unavailable: combos.filter(combo => !combo.is_available).length,
    fixed: combos.filter(combo => combo.combo_type === 'fixed').length,
    selectable: combos.filter(combo => combo.combo_type === 'selectable').length
  }

  // 處理新增套餐
  const handleCreateCombo = () => {
    setEditingCombo(null)
    setIsModalOpen(true)
  }

  // 處理編輯套餐
  const handleEditCombo = (combo: ComboProduct) => {
    setEditingCombo(combo)
    setIsModalOpen(true)
  }

  // 處理編輯套餐規則
  const handleEditRules = (combo: ComboProduct) => {
    if (combo.combo_type !== 'selectable') {
      alert('只有自選套餐需要設定選擇規則')
      return
    }
    setEditingRulesCombo(combo)
    setIsRuleEditorOpen(true)
  }

  // 處理規則保存
  const handleSaveRules = async (rules: any[]) => {
    if (!editingRulesCombo) return false

    try {
      // TODO: 使用 MenuService 保存規則
      console.log('保存套餐規則:', editingRulesCombo.id, rules)
      setIsRuleEditorOpen(false)
      setEditingRulesCombo(null)
      return true
    } catch (error) {
      console.error('保存規則失敗:', error)
      return false
    }
  }

  // 取消規則編輯
  const handleCancelRuleEdit = () => {
    setIsRuleEditorOpen(false)
    setEditingRulesCombo(null)
  }

  // 處理刪除套餐
  const handleDeleteCombo = async (id: string) => {
    if (!confirm('確定要刪除這個套餐嗎？此操作無法復原。')) {
      return
    }

    try {
      await deleteCombo(id)
    } catch (error) {
      console.error('刪除套餐失敗:', error)
      alert('刪除套餐失敗，請稍後再試')
    }
  }

  // 處理切換可用狀態
  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await updateCombo(id, { is_available: isAvailable })
    } catch (error) {
      console.error('更新套餐狀態失敗:', error)
      alert('更新套餐狀態失敗，請稍後再試')
    }
  }

  // 處理表單提交
  const handleSubmitCombo = async (data: any) => {
    try {
      if (editingCombo) {
        return await updateCombo(editingCombo.id, data)
      } else {
        return await createCombo(data)
      }
    } catch (error) {
      console.error('保存套餐失敗:', error)
      return false
    }
  }

  // 清除篩選
  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterType('')
    setFilterAvailability('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">載入套餐資料中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">載入套餐資料時發生錯誤</div>
        <button
          onClick={() => loadCombos()}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 如果在規則編輯模式，顯示規則編輯器 */}
      {isRuleEditorOpen && editingRulesCombo ? (
        <ComboRuleEditor
          combo={editingRulesCombo}
          onSave={handleSaveRules}
          onCancel={handleCancelRuleEdit}
        />
      ) : (
        <>
          {/* 頁面標題與操作 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ChefHat className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">套餐管理</h1>
            <p className="text-gray-600">管理餐廳的套餐商品和配置</p>
          </div>
        </div>
        
        <button
          onClick={handleCreateCombo}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新增套餐
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">總套餐數</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">供應中</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">已暫停</p>
              <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Utensils className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">固定套餐</p>
              <p className="text-2xl font-bold text-blue-600">{stats.fixed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Utensils className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">自選套餐</p>
              <p className="text-2xl font-bold text-green-600">{stats.selectable}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜尋與篩選 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">搜尋與篩選</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜尋框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋套餐名稱或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 分類篩選 */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">所有分類</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* 類型篩選 */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">所有類型</option>
            <option value="fixed">固定套餐</option>
            <option value="selectable">自選套餐</option>
          </select>

          {/* 可用狀態篩選 */}
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">所有狀態</option>
            <option value="available">供應中</option>
            <option value="unavailable">已暫停</option>
          </select>
        </div>

        {/* 清除篩選 */}
        {(searchTerm || filterCategory || filterType || filterAvailability) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              清除所有篩選
            </button>
          </div>
        )}
      </div>

      {/* 套餐列表 */}
      <div>
        {filteredCombos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map((combo) => (
              <ComboCard
                key={combo.id}
                combo={combo}
                categories={categories}
                onEdit={handleEditCombo}
                onEditRules={handleEditRules}
                onDelete={handleDeleteCombo}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {combos.length === 0 ? '尚無套餐' : '找不到符合條件的套餐'}
            </h3>
            <p className="text-gray-500 mb-6">
              {combos.length === 0 
                ? '開始建立您的第一個套餐商品' 
                : '請調整搜尋條件或清除篩選器'
              }
            </p>
            {combos.length === 0 && (
              <button
                onClick={handleCreateCombo}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                新增第一個套餐
              </button>
            )}
          </div>
        )}
      </div>

      {/* 套餐 Modal */}
      <ComboModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCombo}
        combo={editingCombo}
        categories={categories}
      />
      </>
      )}
    </div>
  )
}
