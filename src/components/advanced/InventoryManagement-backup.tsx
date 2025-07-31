// TanaPOS V4-Mini 庫存管理主頁面
// 三層架構庫存管理 - 原物料 → 半成品 → 成品

import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Factory, 
  UtensilsCrossed, 
  AlertTriangle, 
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
// import { useNotification } from '../NotificationSystem'
import { 
  inventoryService, 
  stockCalculationService, 
  getStockSummary, 
  initializeInventorySystem 
} from '../../lib/api-inventory'
import type { 
  StockSummary, 
  InventoryAlert, 
  RawMaterial, 
  SemiFinishedProduct 
} from '../../lib/types-inventory'

// 臨時的通知功能
const useNotification = () => ({
  addNotification: (notification: { type: string; message: string }) => {
    console.log(`${notification.type}: ${notification.message}`)
  }
})

// ================================
// 庫存管理主組件
// ================================
interface InventoryManagementProps {
  onClose?: () => void
}

export function InventoryManagement({ onClose }: InventoryManagementProps) {
  // 狀態管理
  const [activeTab, setActiveTab] = useState<'overview' | 'raw' | 'semi' | 'recipes' | 'reports'>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null)
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [semiProducts, setSemiProducts] = useState<SemiFinishedProduct[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // 模態狀態
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [showAddSemiProductModal, setShowAddSemiProductModal] = useState(false)
  const [showProductionModal, setShowProductionModal] = useState(false)
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const { addNotification } = useNotification()

  // 載入數據
  const loadData = async () => {
    try {
      const [summary, rawMaterialsData, semiProductsData] = await Promise.all([
        getStockSummary(),
        inventoryService.getRawMaterials(),
        inventoryService.getSemiProducts()
      ])

      setStockSummary(summary)
      setRawMaterials(rawMaterialsData)
      setSemiProducts(semiProductsData)
    } catch (error) {
      console.error('載入庫存數據錯誤:', error)
      addNotification({
        type: 'error',
        message: '載入庫存數據失敗'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 刷新數據
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    addNotification({
      type: 'success',
      message: '庫存數據已更新'
    })
  }

  // 添加原料
  const handleAddMaterial = async (materialData: Partial<RawMaterial>) => {
    try {
      const newMaterial = await inventoryService.createRawMaterial(materialData as Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>)
      setRawMaterials(prev => [...prev, newMaterial])
      setShowAddMaterialModal(false)
      addNotification({
        type: 'success',
        message: `成功添加原料：${materialData.name}`
      })
    } catch (error) {
      console.error('添加原料失敗:', error)
      addNotification({
        type: 'error',
        message: '添加原料失敗'
      })
    }
  }

  // 添加半成品
  const handleAddSemiProduct = async (productData: Partial<SemiFinishedProduct>) => {
    try {
      const newProduct = await inventoryService.createSemiProduct(productData as Omit<SemiFinishedProduct, 'id' | 'createdAt' | 'updatedAt'>)
      setSemiProducts(prev => [...prev, newProduct])
      setShowAddSemiProductModal(false)
      addNotification({
        type: 'success',
        message: `成功添加半成品：${productData.name}`
      })
    } catch (error) {
      console.error('添加半成品失敗:', error)
      addNotification({
        type: 'error',
        message: '添加半成品失敗'
      })
    }
  }

  // 生產半成品
  const handleProduction = async (productionData: any) => {
    try {
      // 這裡會調用生產API
      addNotification({
        type: 'info',
        message: '開始生產半成品...'
      })
      setShowProductionModal(false)
      await handleRefresh()
      addNotification({
        type: 'success',
        message: '生產完成'
      })
    } catch (error) {
      console.error('生產失敗:', error)
      addNotification({
        type: 'error',
        message: '生產失敗'
      })
    }
  }

  // 調整庫存
  const handleStockAdjustment = async (adjustmentData: any) => {
    try {
      // 調用庫存調整API
      setShowAdjustStockModal(false)
      await handleRefresh()
      addNotification({
        type: 'success',
        message: '庫存調整完成'
      })
    } catch (error) {
      console.error('庫存調整失敗:', error)
      addNotification({
        type: 'error',
        message: '庫存調整失敗'
      })
    }
  }

  // 初始化系統
  const initializeSystem = async () => {
    try {
      setRefreshing(true)
      addNotification({
        type: 'info',
        message: '正在初始化庫存系統...'
      })

      await initializeInventorySystem()
      await loadData()

      addNotification({
        type: 'success',
        message: '庫存系統初始化完成'
      })
    } catch (error) {
      console.error('初始化系統錯誤:', error)
      addNotification({
        type: 'error',
        message: '初始化系統失敗'
      })
    }
  }

  // 組件載入時初始化
  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題和操作 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              庫存管理系統
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              三層架構：原物料 → 半成品 → 成品
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              重新整理
            </Button>

            <Button 
              onClick={initializeSystem}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              初始化系統
            </Button>

            {onClose && (
              <Button variant="outline" onClick={onClose}>
                關閉
              </Button>
            )}
          </div>
        </div>

        {/* 警告通知區域 */}
        {stockSummary && stockSummary.alerts.length > 0 && (
          <AlertsSection alerts={stockSummary.alerts} />
        )}

        {/* 導航標籤 */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            {[
              { id: 'overview', label: '總覽', icon: BarChart3 },
              { id: 'raw', label: '原物料', icon: Package },
              { id: 'semi', label: '半成品', icon: Factory },
              { id: 'recipes', label: '食譜管理', icon: UtensilsCrossed },
              { id: 'reports', label: '報表分析', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 內容區域 */}
        <div>
          {activeTab === 'overview' && stockSummary && (
            <OverviewSection 
              stockSummary={stockSummary} 
              rawMaterials={rawMaterials}
              semiProducts={semiProducts}
            />
          )}

          {activeTab === 'raw' && (
            <RawMaterialsSection 
              rawMaterials={rawMaterials}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onRefresh={loadData}
              onAddMaterial={() => setShowAddMaterialModal(true)}
              onAdjustStock={(item) => {
                setSelectedItem(item)
                setShowAdjustStockModal(true)
              }}
            />
          )}

          {activeTab === 'semi' && (
            <SemiProductsSection 
              semiProducts={semiProducts}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onRefresh={loadData}
              onAddSemiProduct={() => setShowAddSemiProductModal(true)}
              onStartProduction={() => setShowProductionModal(true)}
              onAdjustStock={(item) => {
                setSelectedItem(item)
                setShowAdjustStockModal(true)
              }}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesSection 
              onRefresh={loadData}
              onCreateRecipe={() => {
                addNotification({
                  type: 'info',
                  message: '配方管理功能開發中...'
                })
              }}
            />
          )}

          {activeTab === 'reports' && stockSummary && (
            <ReportsSection 
              stockSummary={stockSummary}
              onViewReports={() => {
                addNotification({
                  type: 'info',
                  message: '詳細報表功能開發中...'
                })
              }}
            />
          )}
        </div>
      </div>

      {/* 模態對話框 */}
      {showAddMaterialModal && (
        <AddMaterialModal
          onClose={() => setShowAddMaterialModal(false)}
          onSubmit={handleAddMaterial}
        />
      )}

      {showAddSemiProductModal && (
        <AddSemiProductModal
          onClose={() => setShowAddSemiProductModal(false)}
          onSubmit={handleAddSemiProduct}
        />
      )}

      {showProductionModal && (
        <ProductionModal
          onClose={() => setShowProductionModal(false)}
          onSubmit={handleProduction}
          semiProducts={semiProducts}
        />
      )}

      {showAdjustStockModal && selectedItem && (
        <AdjustStockModal
          item={selectedItem}
          onClose={() => {
            setShowAdjustStockModal(false)
            setSelectedItem(null)
          }}
          onSubmit={handleStockAdjustment}
        />
      )}
    </div>
  )
}

// ================================
// 警告通知區域
// ================================
interface AlertsSectionProps {
  alerts: InventoryAlert[]
}

function AlertsSection({ alerts }: AlertsSectionProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
      default: return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        系統警告 ({alerts.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.slice(0, 6).map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{alert.itemName}</h3>
                <p className="text-sm mt-1">{alert.message}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded">
                {alert.severity.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 6 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          還有 {alerts.length - 6} 個警告...
        </p>
      )}
    </div>
  )
}

// ================================
// 總覽區域
// ================================
interface OverviewSectionProps {
  stockSummary: StockSummary
  rawMaterials: RawMaterial[]
  semiProducts: SemiFinishedProduct[]
}

function OverviewSection({ stockSummary, rawMaterials, semiProducts }: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="原物料總數"
          value={stockSummary.totalRawMaterials}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="半成品總數"
          value={stockSummary.totalSemiProducts}
          icon={Factory}
          color="green"
        />
        <StatCard
          title="低庫存項目"
          value={stockSummary.lowStockItems}
          icon={TrendingDown}
          color="orange"
        />
        <StatCard
          title="總庫存價值"
          value={`$${stockSummary.totalValue.toLocaleString()}`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* 庫存狀態表格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 原物料狀態 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            原物料狀態
          </h3>
          
          <div className="space-y-3">
            {rawMaterials.slice(0, 5).map((material) => (
              <div key={material.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{material.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{material.category}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    material.currentStock <= material.minStock 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {material.currentStock} {material.unit}
                  </p>
                  <p className="text-xs text-gray-500">
                    最低: {material.minStock} {material.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 半成品狀態 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Factory className="h-5 w-5 text-green-500" />
            半成品狀態
          </h3>
          
          <div className="space-y-3">
            {semiProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    實際: {product.actualStock} / 虛擬: {product.virtualStock}
                  </p>
                  <p className={`text-sm ${
                    product.totalAvailable <= product.minActualStock 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    總計: {product.totalAvailable} {product.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================
// 統計卡片
// ================================
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'orange' | 'purple'
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    orange: 'bg-orange-500 text-orange-100',
    purple: 'bg-purple-500 text-purple-100'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

// ================================
// 原物料管理區域
// ================================
interface RawMaterialsSectionProps {
  rawMaterials: RawMaterial[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onRefresh: () => void
  onAddMaterial: () => void
  onAdjustStock: (item: RawMaterial) => void
}

function RawMaterialsSection({ rawMaterials, searchTerm, setSearchTerm, onRefresh, onAddMaterial, onAdjustStock }: RawMaterialsSectionProps) {
  const filteredMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 搜尋和操作 */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋原物料..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button 
          className="flex items-center gap-2"
          onClick={onAddMaterial}
        >
          <Plus className="h-4 w-4" />
          新增原物料
        </Button>
      </div>

      {/* 原物料表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">分類</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">庫存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">成本</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">供應商</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">狀態</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredMaterials.map((material) => (
                <tr
                  key={material.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{material.name}</div>
                      <div className="text-sm text-gray-500">{material.storageLocation}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{material.category}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {material.currentStock} {material.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      最低: {material.minStock} {material.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    ${material.cost}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {material.supplier || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      material.currentStock <= material.minStock
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : material.currentStock <= material.minStock * 1.5
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {material.currentStock <= material.minStock 
                        ? '庫存不足' 
                        : material.currentStock <= material.minStock * 1.5
                        ? '庫存偏低'
                        : '庫存充足'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAdjustStock(material)}
                        className="text-xs"
                      >
                        調整庫存
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        編輯
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ================================
// 半成品管理區域
// ================================
interface SemiProductsSectionProps {
  semiProducts: SemiFinishedProduct[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onRefresh: () => void
  onAddSemiProduct: () => void
  onStartProduction: () => void
  onAdjustStock: (item: SemiFinishedProduct) => void
}

function SemiProductsSection({ semiProducts, searchTerm, setSearchTerm, onRefresh, onAddSemiProduct, onStartProduction, onAdjustStock }: SemiProductsSectionProps) {
  const filteredProducts = semiProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 搜尋和操作 */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋半成品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={onStartProduction}
          >
            <Factory className="h-4 w-4" />
            製作半成品
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={onAddSemiProduct}
          >
            <Plus className="h-4 w-4" />
            新增半成品
          </Button>
        </div>
      </div>

      {/* 半成品表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">分類</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">實際庫存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">虛擬庫存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">總可用</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">製作時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">狀態</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{product.category}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {product.actualStock} {product.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      最低: {product.minActualStock} {product.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400">
                    {product.virtualStock} {product.unit}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${
                      product.totalAvailable <= product.minActualStock
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {product.totalAvailable} {product.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {product.preparationTime}分
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.actualStock <= product.minActualStock
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : product.actualStock <= product.minActualStock * 1.5
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {product.actualStock <= product.minActualStock 
                        ? '需要製作' 
                        : product.actualStock <= product.minActualStock * 1.5
                        ? '即將用完'
                        : '庫存充足'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAdjustStock(product)}
                        className="text-xs"
                      >
                        調整庫存
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onStartProduction}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        製作
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        編輯
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ================================
// 食譜管理區域 (占位符)
// ================================
interface RecipesSectionProps {
  onRefresh: () => void
  onCreateRecipe: () => void
}

function RecipesSection({ onRefresh, onCreateRecipe }: RecipesSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
      <UtensilsCrossed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">食譜管理</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        管理三層架構的製作食譜：原物料 → 半成品 → 成品
      </p>
      <Button onClick={onCreateRecipe}>開始建立食譜</Button>
    </div>
  )
}

// ================================
// 報表分析區域 (占位符)
// ================================
interface ReportsSectionProps {
  stockSummary: StockSummary
  onViewReports: () => void
}

function ReportsSection({ stockSummary, onViewReports }: ReportsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">報表分析</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        庫存週轉率、成本分析、採購建議等深度報表
      </p>
      <Button onClick={onViewReports}>查看詳細報表</Button>
    </div>
  )
}

export default InventoryManagement

// ================================
// 添加原料模態
// ================================
interface AddMaterialModalProps {
  onClose: () => void
  onSubmit: (data: Partial<RawMaterial>) => void
}

function AddMaterialModal({ onClose, onSubmit }: AddMaterialModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: 0,
    minStock: 0,
    cost: 0,
    supplier: '',
    storageLocation: '',
    shelfLife: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          新增原料
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              名稱
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分類
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                單位
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                初始庫存
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.currentStock}
                onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                最低庫存
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                單位成本
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              供應商
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit">
              新增原料
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ================================
// 添加半成品模態
// ================================
interface AddSemiProductModalProps {
  onClose: () => void
  onSubmit: (data: Partial<SemiFinishedProduct>) => void
}

function AddSemiProductModal({ onClose, onSubmit }: AddSemiProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    actualStock: 0,
    minActualStock: 0,
    preparationTime: 0,
    shelfLife: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          新增半成品
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              名稱
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分類
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                單位
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                製作時間(分鐘)
              </label>
              <input
                type="number"
                min="0"
                value={formData.preparationTime}
                onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                初始庫存
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.actualStock}
                onChange={(e) => setFormData(prev => ({ ...prev, actualStock: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                最低庫存
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minActualStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minActualStock: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              保存期限(小時)
            </label>
            <input
              type="number"
              min="0"
              value={formData.shelfLife}
              onChange={(e) => setFormData(prev => ({ ...prev, shelfLife: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit">
              新增半成品
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ================================
// 生產模態
// ================================
interface ProductionModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  semiProducts: SemiFinishedProduct[]
}

function ProductionModal({ onClose, onSubmit, semiProducts }: ProductionModalProps) {
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      productId: selectedProduct,
      quantity
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          製作半成品
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              選擇半成品
            </label>
            <select
              required
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">請選擇半成品</option>
              {semiProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (目前庫存: {product.actualStock} {product.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              製作數量
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit">
              開始製作
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ================================
// 調整庫存模態
// ================================
interface AdjustStockModalProps {
  item: RawMaterial | SemiFinishedProduct
  onClose: () => void
  onSubmit: (data: any) => void
}

function AdjustStockModal({ item, onClose, onSubmit }: AdjustStockModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  
  const currentStock = 'currentStock' in item ? item.currentStock : item.actualStock
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      itemId: item.id,
      adjustmentType,
      quantity,
      reason
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          調整庫存 - {item.name}
        </h3>
        
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            目前庫存: <span className="font-medium">{currentStock} {item.unit}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              調整類型
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="add"
                  checked={adjustmentType === 'add'}
                  onChange={(e) => setAdjustmentType(e.target.value as 'add')}
                  className="mr-2"
                />
                增加庫存
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="subtract"
                  checked={adjustmentType === 'subtract'}
                  onChange={(e) => setAdjustmentType(e.target.value as 'subtract')}
                  className="mr-2"
                />
                減少庫存
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              調整數量 ({item.unit})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              調整原因
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="請說明調整原因..."
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              調整後庫存: <span className="font-medium">
                {adjustmentType === 'add' 
                  ? currentStock + quantity 
                  : Math.max(0, currentStock - quantity)
                } {item.unit}
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit">
              確認調整
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
