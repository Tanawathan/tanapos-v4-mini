// ================================
// 庫存管理系統 - 產品庫存管理頁面
// ================================

import React, { useState, useEffect } from 'react';
import {
  PackageIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  AlertTriangleIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';

import { 
  InventoryLayout, 
  PageHeader,
  LoadingSpinner,
  ErrorState,
  EmptyState 
} from '../components/Layout';

import {
  DataTable,
  SearchFilterBar,
  TableColumn,
} from '../components';

import { useInventoryStore } from '../stores';
import type { 
  ProductStock as BaseProductStock,
  InventoryTransaction,
  CreateInventoryTransactionRequest 
} from '../types';
import InventoryServices from '../services';

// ================================
// 產品庫存數據類型
// ================================

interface ProductStock extends BaseProductStock {
  reserved_stock: number;
  available_stock: number;
  reorder_point: number;
  last_updated: string;
  monthly_usage: number;
  turnover_rate: number;
  unit: string;
  category: string;
  stock_status: 'normal' | 'low' | 'out' | 'over';
}

interface StockUpdateModal {
  isOpen: boolean;
  product: ProductStock | null;
  type: 'in' | 'out' | 'adjust';
}

// ================================
// 主要產品庫存組件
// ================================

export const ProductInventory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 產品庫存數據
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductStock[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<React.Key[]>([]);
  
  // 搜索和篩選狀態
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  
  // 分頁狀態
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  
  // 模態框狀態
  const [stockUpdateModal, setStockUpdateModal] = useState<StockUpdateModal>({
    isOpen: false,
    product: null,
    type: 'in',
  });

  // Zustand Store
  const inventoryStore = useInventoryStore();

  // ================================
  // 數據載入
  // ================================

  const loadProductsData = async () => {
    try {
      setError(null);
      setLoading(true);

  const hasSupabase = !!(import.meta as any).env?.VITE_SUPABASE_URL && !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  const restaurantId = (import.meta as any).env?.VITE_RESTAURANT_ID as string | undefined;

  if (hasSupabase && restaurantId) {
        try {
          const { ProductStockService } = InventoryServices as any;
          const { data } = await ProductStockService.getProducts({ restaurant_id: restaurantId }, 1, 200);

          const mapped: ProductStock[] = (data || []).map((p: any) => {
            const reserved = Number(p.reserved_stock ?? 0);
            const current = Number(p.current_stock ?? 0);
            return {
              id: p.id,
              restaurant_id: p.restaurant_id,
              category_id: p.category_id,
              name: p.name,
              description: p.description,
              category: p.categories?.name || '未分類',
              unit: p.unit || '件',
              sku: p.sku,
              barcode: p.barcode,
              price: Number(p.price ?? 0),
              cost: Number(p.cost ?? 0),
              track_inventory: !!p.track_inventory,
              current_stock: current,
              min_stock: Number(p.min_stock ?? 0),
              max_stock: Number(p.max_stock ?? 0),
              stock_value: Number(current) * Number(p.cost ?? 0),
              total_in: Number(p.total_in ?? 0),
              total_out: Number(p.total_out ?? 0),
              is_available: !!p.is_available,
              is_active: !!p.is_active,
              created_at: p.created_at,
              updated_at: p.updated_at,
              reserved_stock: reserved,
              available_stock: Math.max(0, current - reserved),
              reorder_point: Number(p.min_stock ?? 0),
              last_updated: p.updated_at || p.created_at,
              stock_status: (p.stock_status as any) || 'normal',
              monthly_usage: Number(p.monthly_usage ?? 0),
              turnover_rate: Number(p.turnover_rate ?? 0),
            } as ProductStock;
          });

          setProducts(mapped);
          setFilteredProducts(mapped);
          setPagination(prev => ({
            ...prev,
            total: mapped.length,
          }));
          return;
        } catch (apiErr) {
          console.warn('⚠️ 產品庫存 API 載入失敗，改用本地模擬資料。', apiErr);
        }
      }

      // Fallback: 模擬 API 調用 + 本地資料
      await new Promise(resolve => setTimeout(resolve, 300));
      const mockProducts: ProductStock[] = [
        {
          id: 'p1',
          restaurant_id: 'r1',
          category_id: undefined,
          name: '經典漢堡',
          description: '經典牛肉漢堡',
          category: '主食',
          unit: '個',
          sku: 'BURGER001',
          barcode: '1234567890123',
          price: 120,
          cost: 80,
          track_inventory: true,
          current_stock: 45,
          min_stock: 20,
          max_stock: 100,
          stock_value: 3600,
          total_in: 200,
          total_out: 155,
          is_available: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          reserved_stock: 5,
          available_stock: 40,
          reorder_point: 20,
          last_updated: '2024-01-15T10:30:00Z',
          stock_status: 'normal',
          monthly_usage: 180,
          turnover_rate: 4.0,
        },
        {
          id: 'p2',
          restaurant_id: 'r1',
          category_id: undefined,
          name: '可口可樂',
          description: '330ml 罐裝可樂',
          category: '飲品',
          unit: '罐',
          sku: 'COLA001',
          barcode: '1234567890124',
          price: 35,
          cost: 20,
          track_inventory: true,
          current_stock: 8,
          min_stock: 50,
          max_stock: 200,
          stock_value: 160,
          total_in: 500,
          total_out: 492,
          is_available: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          reserved_stock: 3,
          available_stock: 5,
          reorder_point: 50,
          last_updated: '2024-01-15T14:20:00Z',
          stock_status: 'low',
          monthly_usage: 450,
          turnover_rate: 9.0,
        },
        {
          id: 'p3',
          restaurant_id: 'r1',
          category_id: undefined,
          name: '薯條',
          description: '中份薯條',
          category: '小食',
          unit: '份',
          sku: 'FRIES001',
          barcode: '1234567890125',
          price: 50,
          cost: 25,
          track_inventory: true,
          current_stock: 0,
          min_stock: 30,
          max_stock: 150,
          stock_value: 0,
          total_in: 1000,
          total_out: 1000,
          is_available: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          reserved_stock: 0,
          available_stock: 0,
          reorder_point: 30,
          last_updated: '2024-01-14T16:45:00Z',
          stock_status: 'out',
          monthly_usage: 320,
          turnover_rate: 10.7,
        },
        {
          id: 'p4',
          restaurant_id: 'r1',
          category_id: undefined,
          name: '雞塊',
          description: '6塊雞塊',
          category: '小食',
          unit: '份',
          sku: 'NUGGET001',
          barcode: '1234567890126',
          price: 80,
          cost: 45,
          track_inventory: true,
          current_stock: 75,
          min_stock: 25,
          max_stock: 120,
          stock_value: 3375,
          total_in: 500,
          total_out: 425,
          is_available: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          reserved_stock: 10,
          available_stock: 65,
          reorder_point: 25,
          last_updated: '2024-01-15T09:15:00Z',
          stock_status: 'normal',
          monthly_usage: 240,
          turnover_rate: 3.2,
        },
      ];

      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setPagination(prev => ({
        ...prev,
        total: mockProducts.length,
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadProductsData();
  }, []);

  // ================================
  // 搜索和篩選邏輯
  // ================================

  useEffect(() => {
    let filtered = [...products];

    // 搜索篩選
    if (searchValue) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchValue.toLowerCase())) ||
        (product.barcode && product.barcode.includes(searchValue))
      );
    }

    // 分類篩選
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // 庫存狀態篩選
    if (stockStatusFilter) {
      filtered = filtered.filter(product => product.stock_status === stockStatusFilter);
    }

    setFilteredProducts(filtered);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length,
    }));
  }, [products, searchValue, categoryFilter, stockStatusFilter]);

  // ================================
  // 表格配置
  // ================================

  const columns: TableColumn<ProductStock>[] = [
    {
      key: 'name',
      title: '產品名稱',
      dataIndex: 'name',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{record.sku}</div>
        </div>
      ),
    },
    {
      key: 'category',
      title: '分類',
      dataIndex: 'category',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value}
        </span>
      ),
    },
    {
      key: 'current_stock',
      title: '當前庫存',
      dataIndex: 'current_stock',
      sortable: true,
      align: 'right',
      render: (value, record) => (
        <div className="text-right">
          <div className="font-medium">{Number(value ?? 0)} {record.unit || '件'}</div>
          <div className="text-xs text-gray-500">
            可用: {Number(record.available_stock ?? 0)} {record.unit || '件'}
          </div>
        </div>
      ),
    },
    {
      key: 'stock_status',
      title: '庫存狀態',
      dataIndex: 'stock_status',
      sortable: true,
      align: 'center',
      render: (value, record) => {
        const statusConfig = {
          normal: { color: 'green', text: '正常' },
          low: { color: 'yellow', text: '偏低' },
          out: { color: 'red', text: '缺貨' },
          over: { color: 'blue', text: '超量' },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
              {value === 'out' && <AlertTriangleIcon className="h-3 w-3 mr-1" />}
              {config.text}
            </span>
          </div>
        );
      },
    },
    {
      key: 'reorder_point',
      title: '補貨點',
      dataIndex: 'reorder_point',
      sortable: true,
      align: 'right',
  render: (value, record) => `${Number(value ?? record.min_stock ?? 0)} ${record.unit || '件'}`,
    },
    {
      key: 'turnover_rate',
      title: '周轉率',
      dataIndex: 'turnover_rate',
      sortable: true,
      align: 'right',
  render: (value) => (typeof value === 'number' ? `${value.toFixed(1)}x` : '—'),
    },
    {
      key: 'last_updated',
      title: '最後更新',
      dataIndex: 'last_updated',
      sortable: true,
  render: (value) => (value ? new Date(value).toLocaleDateString('zh-TW') : '—'),
    },
    {
      key: 'actions',
      title: '操作',
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleStockUpdate(record, 'in')}
            className="text-green-600 hover:text-green-900"
            title="入庫"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleStockUpdate(record, 'out')}
            className="text-blue-600 hover:text-blue-900"
            title="出庫"
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleStockUpdate(record, 'adjust')}
            className="text-yellow-600 hover:text-yellow-900"
            title="調整"
          >
            <EditIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // ================================
  // 事件處理
  // ================================

  const handleStockUpdate = (product: ProductStock, type: 'in' | 'out' | 'adjust') => {
    setStockUpdateModal({
      isOpen: true,
      product,
      type,
    });
  };

  const handleBatchExport = () => {
    // 導出選中的產品庫存數據
    console.log('導出產品:', selectedProducts);
  };

  const handleBatchImport = () => {
    // 批量導入庫存數據
    console.log('批量導入');
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize,
    }));
  };

  // ================================
  // 渲染函數
  // ================================

  if (loading) {
    return (
      <InventoryLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入產品庫存數據...</p>
          </div>
        </div>
      </InventoryLayout>
    );
  }

  if (error) {
    return (
      <InventoryLayout>
        <ErrorState
          title="載入失敗"
          message={error}
          onRetry={loadProductsData}
        />
      </InventoryLayout>
    );
  }

  return (
    <InventoryLayout>
      <PageHeader
        title="產品庫存管理"
        description="管理餐廳產品的庫存數量和狀態"
      >
        <div className="flex space-x-3">
          <button
            onClick={handleBatchImport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            批量導入
          </button>
          
          <button
            onClick={handleBatchExport}
            disabled={selectedProducts.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            導出數據
          </button>
          
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            新增產品
          </button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* 搜索和篩選欄 */}
        <SearchFilterBar
          searchProps={{
            placeholder: '搜索產品名稱、SKU 或條碼...',
            value: searchValue,
            onChange: setSearchValue,
          }}
          filterProps={{
            filterGroups: [
              {
                key: 'category',
                title: '產品分類',
                type: 'select',
                options: [
                  { label: '主食', value: '主食' },
                  { label: '飲品', value: '飲品' },
                  { label: '小食', value: '小食' },
                  { label: '甜點', value: '甜點' },
                ],
              },
              {
                key: 'stock_status',
                title: '庫存狀態',
                type: 'select',
                options: [
                  { label: '庫存正常', value: 'normal' },
                  { label: '庫存偏低', value: 'low' },
                  { label: '缺貨', value: 'out' },
                  { label: '超量', value: 'over' },
                ],
              },
            ],
            activeFilters: [
              ...(categoryFilter ? [{
                key: 'category',
                title: '產品分類',
                value: categoryFilter,
                label: categoryFilter,
              }] : []),
              ...(stockStatusFilter ? [{
                key: 'stock_status',
                title: '庫存狀態',
                value: stockStatusFilter,
                label: stockStatusFilter === 'normal' ? '庫存正常' : 
                       stockStatusFilter === 'low' ? '庫存偏低' : 
                       stockStatusFilter === 'out' ? '缺貨' : '超量',
              }] : []),
            ],
            onFilterChange: (filters) => {
              const categoryFilterValue = filters.find(f => f.key === 'category')?.value || '';
              const statusFilterValue = filters.find(f => f.key === 'stock_status')?.value || '';
              setCategoryFilter(categoryFilterValue);
              setStockStatusFilter(statusFilterValue);
            },
          }}
        />

        {/* 產品庫存表格 */}
        <DataTable
          columns={columns}
          dataSource={filteredProducts.slice(
            (pagination.current - 1) * pagination.pageSize,
            pagination.current * pagination.pageSize
          )}
          loading={loading}
          pagination={{
            current: pagination.current,
            total: pagination.total,
            pageSize: pagination.pageSize,
            onChange: handlePageChange,
          }}
          selection={{
            selectedRowKeys: selectedProducts,
            onChange: setSelectedProducts,
          }}
          rowKey="id"
        />
      </div>

      {/* 庫存更新模態框 */}
      {stockUpdateModal.isOpen && (
        <StockUpdateModal
          product={stockUpdateModal.product}
          type={stockUpdateModal.type}
          onClose={() => setStockUpdateModal({ isOpen: false, product: null, type: 'in' })}
          onSuccess={() => {
            loadProductsData();
            setStockUpdateModal({ isOpen: false, product: null, type: 'in' });
          }}
        />
      )}
    </InventoryLayout>
  );
};

// ================================
// 庫存更新模態框組件
// ================================

interface StockUpdateModalProps {
  product: ProductStock | null;
  type: 'in' | 'out' | 'adjust';
  onClose: () => void;
  onSuccess: () => void;
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  product,
  type,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const typeConfig = {
    in: { title: '入庫', color: 'green', icon: PlusIcon },
    out: { title: '出庫', color: 'blue', icon: DownloadIcon },
    adjust: { title: '調整', color: 'yellow', icon: EditIcon },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !reason) return;

    setLoading(true);
    try {
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('庫存更新:', {
        product_id: product.id,
        type,
        quantity: Number(quantity),
        reason,
        notes,
      });
      
      onSuccess();
    } catch (error) {
      console.error('更新失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Icon className={`h-6 w-6 text-${config.color}-600 mr-2`} />
            <h3 className="text-lg font-medium text-gray-900">
              {config.title}庫存
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900">{product.name}</div>
          <div className="text-sm text-gray-500">
            當前庫存: {product.current_stock} {product.unit}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              數量 ({product.unit})
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="輸入數量"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原因
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">請選擇原因</option>
              {type === 'in' && (
                <>
                  <option value="purchase">採購入庫</option>
                  <option value="return">退貨入庫</option>
                  <option value="transfer_in">調撥入庫</option>
                </>
              )}
              {type === 'out' && (
                <>
                  <option value="sale">銷售出庫</option>
                  <option value="waste">報廢出庫</option>
                  <option value="transfer_out">調撥出庫</option>
                </>
              )}
              {type === 'adjust' && (
                <>
                  <option value="count_adjust">盤點調整</option>
                  <option value="system_adjust">系統調整</option>
                  <option value="error_correct">錯誤更正</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備註
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="輸入備註信息（可選）"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !quantity || !reason}
              className={`px-4 py-2 text-sm font-medium text-white bg-${config.color}-600 rounded-md hover:bg-${config.color}-700 disabled:opacity-50`}
            >
              {loading ? '處理中...' : '確認'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductInventory;
