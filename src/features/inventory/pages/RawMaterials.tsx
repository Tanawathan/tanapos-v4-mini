// ================================
// 庫存管理系統 - 原料管理頁面
// ================================

import React, { useState, useEffect } from 'react';
import {
  PackageIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  FilterIcon,
  DownloadIcon,
  UploadIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';

import { 
  InventoryLayout, 
  PageHeader,
  LoadingSpinner,
  ErrorState,
  EmptyState 
} from '../components/Layout';

import { 
  DataTable
} from '../components';
import InventoryServices from '../services';

// 模擬組件
const Button: React.FC<any> = ({ children, onClick, variant = 'primary', size = 'md', ...props }) => {
  const baseClass = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClass = variant === 'outline' ? 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700';
  const sizeClass = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  
  return (
    <button onClick={onClick} className={`${baseClass} ${variantClass} ${sizeClass}`} {...props}>
      {children}
    </button>
  );
};

const Modal: React.FC<any> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 ${size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg'} w-full mx-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Badge: React.FC<any> = ({ children, color = 'gray' }) => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800'
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
      {children}
    </span>
  );
};

// ================================
// 類型定義
// ================================

interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit_cost: number;
  supplier: string;
  status: 'active' | 'inactive' | 'discontinued';
  storage_location: string;
  shelf_life: number; // 保質期(天)
  created_at: string;
  updated_at: string;
  last_purchase_date: string | null;
  last_purchase_price: number | null;
}

interface MaterialSummary {
  total_materials: number;
  active_materials: number;
  low_stock_materials: number;
  out_of_stock_materials: number;
  total_value: number;
  categories_count: number;
}

interface StockAlert {
  id: string;
  material_id: string;
  material_name: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expired' | 'near_expiry';
  current_stock: number;
  threshold: number;
  severity: 'high' | 'medium' | 'low';
  created_at: string;
}

// ================================
// 原料管理頁面主組件
// ================================

export const RawMaterials: React.FC = () => {
  // 狀態管理
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜尋與篩選狀態
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // all, low_stock, out_of_stock
  
  // UI 狀態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockUpdateModalOpen, setIsStockUpdateModalOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ================================
  // 數據載入
  // ================================

  useEffect(() => {
    loadMaterials();
    loadStockAlerts();
  }, []);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
  const hasSupabase = !!(import.meta as any).env?.VITE_SUPABASE_URL && !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  const restaurantId = (import.meta as any).env?.VITE_RESTAURANT_ID as string | undefined;

  if (hasSupabase && restaurantId) {
        try {
          const { RawMaterialStockService } = InventoryServices as any;
          const { data } = await RawMaterialStockService.getRawMaterials({ restaurant_id: restaurantId }, 1, 100);
          const mapped: RawMaterial[] = (data || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            category: m.category,
            unit: m.unit || 'unit',
            current_stock: Number(m.current_stock ?? 0),
            min_stock: Number(m.min_stock ?? 0),
            max_stock: Number(m.max_stock ?? 0),
            unit_cost: Number(m.cost_per_unit ?? 0),
            supplier: m.suppliers?.name || '—',
            status: m.is_active ? 'active' : 'inactive',
            storage_location: m.storage_location || '',
            shelf_life: m.shelf_life_days ?? 0,
            created_at: m.created_at,
            updated_at: m.updated_at,
            last_purchase_date: null,
            last_purchase_price: m.last_purchase_cost ?? null,
          }));
          setMaterials(mapped);
          return;
        } catch (apiErr) {
          console.warn('⚠️ 原料資料 API 載入失敗，改用本地模擬資料。', apiErr);
        }
      }

      // 模擬資料 (fallback)
      await new Promise(resolve => setTimeout(resolve, 300));
      const mockMaterials: RawMaterial[] = [
        {
          id: '1',
          name: '雞胸肉',
          category: '肉類',
          unit: '公斤',
          current_stock: 15.5,
          min_stock: 10,
          max_stock: 50,
          unit_cost: 180,
          supplier: '優質肉品供應商',
          status: 'active',
          storage_location: '冷凍庫A區',
          shelf_life: 7,
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-03-20T14:30:00Z',
          last_purchase_date: '2024-03-18T10:00:00Z',
          last_purchase_price: 175
        },
        {
          id: '2',
          name: '高筋麵粉',
          category: '麵粉類',
          unit: '公斤',
          current_stock: 3.2,
          min_stock: 5,
          max_stock: 25,
          unit_cost: 35,
          supplier: '金龍麵粉廠',
          status: 'active',
          storage_location: '乾貨倉庫',
          shelf_life: 180,
          created_at: '2024-01-10T08:00:00Z',
          updated_at: '2024-03-19T16:20:00Z',
          last_purchase_date: '2024-03-10T14:00:00Z',
          last_purchase_price: 34
        },
        {
          id: '3',
          name: '新鮮蘑菇',
          category: '蔬菜類',
          unit: '公斤',
          current_stock: 0,
          min_stock: 2,
          max_stock: 8,
          unit_cost: 120,
          supplier: '有機農場',
          status: 'active',
          storage_location: '冷藏室B區',
          shelf_life: 3,
          created_at: '2024-02-01T08:00:00Z',
          updated_at: '2024-03-20T12:00:00Z',
          last_purchase_date: '2024-03-15T09:30:00Z',
          last_purchase_price: 115
        },
        {
          id: '4',
          name: '橄欖油',
          category: '調料類',
          unit: '公升',
          current_stock: 8.5,
          min_stock: 3,
          max_stock: 15,
          unit_cost: 220,
          supplier: '進口食材商',
          status: 'active',
          storage_location: '調料櫃',
          shelf_life: 365,
          created_at: '2024-01-20T08:00:00Z',
          updated_at: '2024-03-18T11:15:00Z',
          last_purchase_date: '2024-03-05T15:20:00Z',
          last_purchase_price: 210
        },
        {
          id: '5',
          name: '牛奶',
          category: '乳製品',
          unit: '公升',
          current_stock: 12.0,
          min_stock: 8,
          max_stock: 30,
          unit_cost: 45,
          supplier: '鮮乳坊',
          status: 'active',
          storage_location: '冷藏室A區',
          shelf_life: 5,
          created_at: '2024-02-10T08:00:00Z',
          updated_at: '2024-03-21T08:30:00Z',
          last_purchase_date: '2024-03-20T07:00:00Z',
          last_purchase_price: 44
        }
      ];
      
  setMaterials(mockMaterials);
    } catch (err) {
      setError('載入原料數據失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStockAlerts = async () => {
    try {
      // 模擬庫存警報數據
      const mockAlerts: StockAlert[] = [
        {
          id: '1',
          material_id: '2',
          material_name: '高筋麵粉',
          alert_type: 'low_stock',
          current_stock: 3.2,
          threshold: 5,
          severity: 'medium',
          created_at: '2024-03-21T10:00:00Z'
        },
        {
          id: '2',
          material_id: '3',
          material_name: '新鮮蘑菇',
          alert_type: 'out_of_stock',
          current_stock: 0,
          threshold: 2,
          severity: 'high',
          created_at: '2024-03-21T12:00:00Z'
        }
      ];
      
      setStockAlerts(mockAlerts);
    } catch (err) {
      console.error('載入庫存警報失敗:', err);
    }
  };

  // ================================
  // 數據處理
  // ================================

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         material.category.toLowerCase().includes(searchValue.toLowerCase()) ||
                         material.supplier.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesCategory = !categoryFilter || material.category === categoryFilter;
    const matchesStatus = !statusFilter || material.status === statusFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low_stock') {
      matchesStock = material.current_stock > 0 && material.current_stock <= material.min_stock;
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = material.current_stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const categories = [...new Set(materials.map(m => m.category))];

  const summary: MaterialSummary = {
    total_materials: materials.length,
    active_materials: materials.filter(m => m.status === 'active').length,
    low_stock_materials: materials.filter(m => m.current_stock > 0 && m.current_stock <= m.min_stock).length,
    out_of_stock_materials: materials.filter(m => m.current_stock === 0).length,
    total_value: materials.reduce((sum, m) => sum + (m.current_stock * m.unit_cost), 0),
    categories_count: categories.length
  };

  // ================================
  // 事件處理
  // ================================

  const handleCreateMaterial = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleUpdateStock = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setIsStockUpdateModalOpen(true);
  };

  const handleDeleteMaterial = (material: RawMaterial) => {
    if (confirm('確定要刪除此原料嗎？')) {
      setMaterials(prev => prev.filter(m => m.id !== material.id));
    }
  };

  const getStockStatus = (material: RawMaterial) => {
    if (material.current_stock === 0) {
      return { status: 'out_of_stock', label: '缺貨', color: 'red' };
    } else if (material.current_stock <= material.min_stock) {
      return { status: 'low_stock', label: '庫存不足', color: 'yellow' };
    } else if (material.current_stock >= material.max_stock) {
      return { status: 'high_stock', label: '庫存充足', color: 'green' };
    } else {
      return { status: 'normal', label: '正常', color: 'blue' };
    }
  };

  // ================================
  // 表格配置
  // ================================

  const columns = [
    {
      title: '原料名稱',
      dataIndex: 'name' as keyof RawMaterial,
      key: 'name',
      render: (text: string, record: RawMaterial) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">{record.category}</div>
        </div>
      ),
    },
    {
      title: '庫存狀態',
      key: 'stock_status',
      // 無 dataIndex，需使用 (_, record)
      render: (_: any, record: RawMaterial) => {
        const stockStatus = getStockStatus(record);
        return (
          <div>
            <Badge color={stockStatus.color}>{stockStatus.label}</Badge>
            <div className="text-sm text-gray-500 mt-1">
        {(record.current_stock ?? 0)} {record.unit}
            </div>
          </div>
        );
      },
    },
    {
      title: '庫存範圍',
      key: 'stock_range',
      render: (_: any, record: RawMaterial) => (
        <div className="text-sm">
          <div>最小: {record.min_stock} {record.unit}</div>
          <div>最大: {record.max_stock} {record.unit}</div>
        </div>
      ),
    },
    {
      title: '單價',
      dataIndex: 'unit_cost' as keyof RawMaterial,
      key: 'unit_cost',
      render: (cost: number, record: RawMaterial) => (
        <div>
          <div className="font-medium">NT$ {cost}</div>
          <div className="text-sm text-gray-500">/ {record.unit}</div>
        </div>
      ),
    },
    {
      title: '庫存價值',
      key: 'stock_value',
    render: (_: any, record: RawMaterial) => (
        <div className="font-medium">
      NT$ {(((record.current_stock ?? 0) * (record.unit_cost ?? 0)) as number).toLocaleString()}
        </div>
      ),
    },
    {
      title: '供應商',
      dataIndex: 'supplier' as keyof RawMaterial,
      key: 'supplier',
      render: (supplier: string) => (
        <div className="text-sm text-gray-900">{supplier}</div>
      ),
    },
    {
      title: '儲存位置',
      dataIndex: 'storage_location' as keyof RawMaterial,
      key: 'storage_location',
      render: (location: string) => (
        <div className="text-sm text-gray-600">{location}</div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
  render: (_: any, record: RawMaterial) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUpdateStock(record)}
          >
            調整庫存
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditMaterial(record)}
          >
            編輯
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteMaterial(record)}
          >
            刪除
          </Button>
        </div>
      ),
    },
  ];

  // ================================
  // 載入中與錯誤狀態
  // ================================

  if (isLoading) {
    return (
      <InventoryLayout>
        <LoadingSpinner />
      </InventoryLayout>
    );
  }

  if (error) {
    return (
      <InventoryLayout>
        <ErrorState 
          message={error}
          onRetry={loadMaterials}
        />
      </InventoryLayout>
    );
  }

  // ================================
  // 渲染組件
  // ================================

  return (
    <InventoryLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <PageHeader
          title="原料管理"
          description="管理餐廳原料庫存，監控庫存水平和供應商信息"
        >
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowAlerts(!showAlerts)}
            >
              <AlertTriangleIcon className="h-4 w-4 mr-2" />
              庫存警報 ({stockAlerts.length})
            </Button>
            <Button onClick={handleCreateMaterial}>
              <PlusIcon className="h-4 w-4 mr-2" />
              新增原料
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <UploadIcon className="h-4 w-4 mr-2" />
              CSV 匯入
            </Button>
          </div>
        </PageHeader>

        {/* 庫存警報區域 */}
        {showAlerts && stockAlerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="font-medium text-yellow-800">庫存警報</h3>
            </div>
            <div className="space-y-2">
              {stockAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <span className="font-medium">{alert.material_name}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      {alert.alert_type === 'low_stock' ? '庫存不足' : 
                       alert.alert_type === 'out_of_stock' ? '已缺貨' : '其他警報'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">當前庫存:</span>
                    <span className="ml-1 font-medium">{alert.current_stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <PackageIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">總原料數</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.total_materials}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">活躍原料</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.active_materials}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingDownIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">庫存不足</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.low_stock_materials}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">已缺貨</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.out_of_stock_materials}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3Icon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">類別數</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.categories_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">總庫存價值</p>
                <p className="text-2xl font-semibold text-gray-900">
                  NT$ {summary.total_value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜尋與篩選 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜尋框 */}
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋原料名稱、類別或供應商..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* 類別篩選 */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部類別</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* 狀態篩選 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部狀態</option>
              <option value="active">活躍</option>
              <option value="inactive">停用</option>
              <option value="discontinued">停產</option>
            </select>
            
            {/* 庫存篩選 */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部庫存</option>
              <option value="low_stock">庫存不足</option>
              <option value="out_of_stock">已缺貨</option>
            </select>
            
            {/* 重置按鈕 */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchValue('');
                setCategoryFilter('');
                setStatusFilter('');
                setStockFilter('');
              }}
            >
              重置
            </Button>
          </div>
        </div>

        {/* 原料表格 */}
        {filteredMaterials.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="暫無原料數據"
            description="目前沒有符合條件的原料記錄"
            action={{
              label: "新增原料",
              onClick: handleCreateMaterial
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            dataSource={filteredMaterials.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredMaterials.length,
              onChange: (page: number, size: number) => {
                setCurrentPage(page);
                setPageSize(size);
              }
            }}
          />
        )}
      </div>

      {/* 新增原料 Modal */}
      <CreateMaterialModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newMaterial) => {
          setMaterials(prev => [newMaterial, ...prev]);
          setIsCreateModalOpen(false);
        }}
      />

      {/* 編輯原料 Modal */}
      {selectedMaterial && (
        <EditMaterialModal 
          isOpen={isEditModalOpen}
          material={selectedMaterial}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMaterial(null);
          }}
          onSuccess={(updatedMaterial) => {
            setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
            setIsEditModalOpen(false);
            setSelectedMaterial(null);
          }}
        />
      )}

      {/* 庫存調整 Modal */}
      {selectedMaterial && (
        <StockUpdateModal 
          isOpen={isStockUpdateModalOpen}
          material={selectedMaterial}
          onClose={() => {
            setIsStockUpdateModalOpen(false);
            setSelectedMaterial(null);
          }}
          onSuccess={(updatedMaterial) => {
            setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
            setIsStockUpdateModalOpen(false);
            setSelectedMaterial(null);
          }}
        />
      )}

      {/* CSV 匯入 Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={() => loadMaterials()}
      />
    </InventoryLayout>
  );
};

// ================================
// 新增原料 Modal 組件
// ================================

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (material: RawMaterial) => void;
}

const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    min_stock: 0,
    max_stock: 0,
    unit_cost: 0,
    supplier: '',
    storage_location: '',
    shelf_life: 0,
    current_stock: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newMaterial: RawMaterial = {
        id: Date.now().toString(),
        ...formData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_purchase_date: null,
        last_purchase_price: null
      };
      
      onSuccess(newMaterial);
    } catch (error) {
      console.error('創建原料失敗:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新增原料"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原料名稱 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              類別 *
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              單位 *
            </label>
            <input
              type="text"
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              單價 *
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最小庫存 *
            </label>
            <input
              type="number"
              required
              step="0.1"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最大庫存 *
            </label>
            <input
              type="number"
              required
              step="0.1"
              value={formData.max_stock}
              onChange={(e) => setFormData({ ...formData, max_stock: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              供應商
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              儲存位置
            </label>
            <input
              type="text"
              value={formData.storage_location}
              onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              保質期 (天)
            </label>
            <input
              type="number"
              value={formData.shelf_life}
              onChange={(e) => setFormData({ ...formData, shelf_life: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              初始庫存
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            取消
          </Button>
          <Button type="submit">
            創建原料
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ================================
// 編輯原料 Modal 組件
// ================================

interface EditMaterialModalProps {
  isOpen: boolean;
  material: RawMaterial;
  onClose: () => void;
  onSuccess: (material: RawMaterial) => void;
}

const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
  isOpen,
  material,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: material.name,
    category: material.category,
    unit: material.unit,
    min_stock: material.min_stock,
    max_stock: material.max_stock,
    unit_cost: material.unit_cost,
    supplier: material.supplier,
    storage_location: material.storage_location,
    shelf_life: material.shelf_life
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedMaterial = {
        ...material,
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      onSuccess(updatedMaterial);
    } catch (error) {
      console.error('更新原料失敗:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="編輯原料"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原料名稱 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              類別 *
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              單位 *
            </label>
            <input
              type="text"
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              單價 *
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最小庫存 *
            </label>
            <input
              type="number"
              required
              step="0.1"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最大庫存 *
            </label>
            <input
              type="number"
              required
              step="0.1"
              value={formData.max_stock}
              onChange={(e) => setFormData({ ...formData, max_stock: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              供應商
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              儲存位置
            </label>
            <input
              type="text"
              value={formData.storage_location}
              onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              保質期 (天)
            </label>
            <input
              type="number"
              value={formData.shelf_life}
              onChange={(e) => setFormData({ ...formData, shelf_life: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            取消
          </Button>
          <Button type="submit">
            更新
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ================================
// 庫存調整 Modal 組件
// ================================

interface StockUpdateModalProps {
  isOpen: boolean;
  material: RawMaterial;
  onClose: () => void;
  onSuccess: (material: RawMaterial) => void;
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  isOpen,
  material,
  onClose,
  onSuccess,
}) => {
  const [updateType, setUpdateType] = useState<'add' | 'subtract' | 'set'>('add');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // 以庫存異動記錄來更新 Supabase 並同步庫存
      const { InventoryTransactionService } = (await import('../../inventory/services')).default as any;

      // 將 set 轉換為 adjust：以差值調整
      let adjQty = quantity;
      if (updateType === 'subtract') adjQty = -Math.abs(quantity);
      if (updateType === 'add') adjQty = Math.abs(quantity);
      if (updateType === 'set') adjQty = quantity - (material.current_stock || 0);

      await InventoryTransactionService.createTransaction({
        raw_material_id: (material as any).id,
        transaction_type: 'adjust',
        quantity: adjQty,
        unit: material.unit,
        reason: reason || (updateType === 'set' ? '盤點調整' : '手動調整'),
        reference_type: updateType === 'set' ? 'count' : 'adjustment',
        notes: `UI ${updateType} 調整`
      });

      // 讀回最新庫存
      const { default: InventoryServices } = await import('../../inventory/services');
      const { RawMaterialStockService } = InventoryServices as any;
      const restaurantId = (import.meta as any).env?.VITE_RESTAURANT_ID as string | undefined;
      const { data } = await RawMaterialStockService.getRawMaterials({ restaurant_id: restaurantId }, 1, 500);
      const refreshed = (data || []).find((m: any) => m.id === (material as any).id);
      const updatedMaterial = refreshed ? {
        ...material,
        current_stock: refreshed.current_stock,
        updated_at: refreshed.updated_at || new Date().toISOString()
      } : {
        ...material,
        current_stock: Math.max(0, (material.current_stock || 0) + adjQty),
        updated_at: new Date().toISOString()
      };

      onSuccess(updatedMaterial as any);
    } catch (error) {
      console.error('更新庫存失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNewStock = () => {
    let newStock = material.current_stock;
    
    switch (updateType) {
      case 'add':
        newStock += quantity;
        break;
      case 'subtract':
        newStock -= quantity;
        break;
      case 'set':
        newStock = quantity;
        break;
    }
    
    return Math.max(0, newStock);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="庫存調整"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 原料信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{material.name}</h3>
          <div className="text-sm text-gray-600">
            <div>當前庫存: {material.current_stock} {material.unit}</div>
            <div>最小庫存: {material.min_stock} {material.unit}</div>
            <div>最大庫存: {material.max_stock} {material.unit}</div>
          </div>
        </div>

        {/* 調整類型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            調整類型 *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="add"
                checked={updateType === 'add'}
                onChange={(e) => setUpdateType('add')}
                className="mr-2"
              />
              增加庫存
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="subtract"
                checked={updateType === 'subtract'}
                onChange={(e) => setUpdateType('subtract')}
                className="mr-2"
              />
              減少庫存
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="set"
                checked={updateType === 'set'}
                onChange={(e) => setUpdateType('set')}
                className="mr-2"
              />
              設定庫存
            </label>
          </div>
        </div>

        {/* 數量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            數量 *
          </label>
          <input
            type="number"
            required
            step="0.1"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder={`請輸入${updateType === 'set' ? '新的庫存數量' : '調整數量'}`}
          />
        </div>

        {/* 調整後預覽 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm">
            <span className="text-gray-600">調整後庫存: </span>
            <span className="font-medium text-blue-900">
              {getNewStock()} {material.unit}
            </span>
          </div>
        </div>

        {/* 調整原因 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            調整原因
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
            placeholder="請輸入庫存調整的原因..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            取消
          </Button>
          <Button type="submit">
            {loading ? '處理中...' : '確認調整'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RawMaterials;

// 輕量 CSV 匯入 Modal（無外部依賴）
const ImportModal: React.FC<{ isOpen: boolean; onClose: () => void; onImported: () => void }> = ({ isOpen, onClose, onImported }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const restaurantId = (import.meta as any).env?.VITE_RESTAURANT_ID as string | undefined;

  if (!isOpen) return null;

  const example = 'name,unit,category,current_stock,min_stock,max_stock,cost_per_unit\n雞胸肉,公斤,肉類,0,10,50,180';

  const parseCSVText = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1);
    return dataLines.map(line => {
      // 簡化版：不支援帶逗號的引號欄位
      const cols = line.split(',').map(c => c.trim());
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = cols[i] ?? '');
      return obj;
    });
  };

  const onFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = parseCSVText(text);
        setRows(parsed);
      } catch (e: any) {
        setError(e?.message || 'CSV 解析失敗');
      }
    };
    reader.onerror = () => setError('讀取檔案失敗');
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!rows.length || !restaurantId) return;
    setLoading(true);
    try {
      const { RawMaterialStockService } = InventoryServices as any;
      await RawMaterialStockService.bulkUpsertRawMaterials(rows, restaurantId);
      onImported();
      onClose();
    } catch (e: any) {
      setError(e?.message || '匯入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">CSV 匯入原物料</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">支援欄位：name, unit, category, current_stock, min_stock, max_stock, cost_per_unit</p>
          <div className="p-3 bg-gray-50 rounded border text-xs font-mono">{example}</div>
          <input type="file" accept=".csv" onChange={(e) => e.target.files && onFile(e.target.files[0])} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          {rows.length > 0 && (
            <div className="max-h-48 overflow-auto border rounded">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    {Object.keys(rows[0]).map(k => (<th key={k} className="px-2 py-1 text-left">{k}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t">
                      {Object.keys(rows[0]).map(k => (<td key={k} className="px-2 py-1">{r[k]}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && <div className="p-2 text-xs text-gray-500">... 共 {rows.length} 筆</div>}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded">取消</button>
            <button onClick={doImport} disabled={loading || !rows.length || !restaurantId} className="px-4 py-2 text-sm text-white bg-blue-600 rounded disabled:opacity-50">
              {loading ? '匯入中...' : '開始匯入'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
