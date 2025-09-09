// ================================
// 庫存管理系統 - 庫存盤點頁面
// ================================

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheckIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  CalendarIcon,
  UserIcon,
  PackageIcon,
  RefreshCw,
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
  SearchFilterBar
} from '../components';
import InventoryServices from '../services';

// 模擬組件 - 實際使用時需要從正確的地方導入
const Button: React.FC<any> = ({ children, onClick, ...props }) => (
  <button onClick={onClick} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" {...props}>
    {children}
  </button>
);

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
    red: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
      {children}
    </span>
  );
};

const Dropdown: React.FC<any> = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          {items.map((item: any, index: number) => (
            <div
              key={index}
              className={`px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer ${item.danger ? 'text-red-600' : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================================
// 類型定義
// ================================

interface InventoryCount {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  total_items: number;
  counted_items: number;
  items: InventoryCountItem[];
}

interface InventoryCountItem {
  id: string;
  count_id: string;
  product_id: string;
  product_name: string;
  current_stock: number;
  counted_stock: number | null;
  variance: number | null;
  notes: string;
  counted_by: string | null;
  counted_at: string | null;
  status: 'pending' | 'counted' | 'confirmed';
}

interface CountSummary {
  total_counts: number;
  draft_counts: number;
  in_progress_counts: number;
  completed_counts: number;
  total_variance: number;
  variance_value: number;
}

// ================================
// 庫存盤點頁面主組件
// ================================

export const InventoryCount: React.FC = () => {
  // 狀態管理
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜尋與篩選狀態
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // UI 狀態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ================================
  // 數據載入
  // ================================

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      setIsLoading(true);
  const hasSupabase = !!(import.meta as any).env?.VITE_SUPABASE_URL && !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (hasSupabase) {
        try {
          const { InventoryCountService } = InventoryServices as any;
          const { data } = await InventoryCountService.getCounts(1, 100);
          // Map minimal fields to local model
          const mapped = (data || []).map((c: any) => ({
            id: c.id,
            name: c.count_number || '盤點記錄',
            description: c.notes || '',
            status: c.status,
            created_by: c.created_by || '—',
            created_at: c.created_at,
            started_at: c.started_at || null,
            completed_at: c.completed_at || null,
            total_items: Number(c.total_items ?? 0),
            counted_items: Number(c.counted_items ?? 0),
            items: [],
          })) as InventoryCount[];
          setCounts(mapped);
          return;
        } catch (apiErr) {
          console.warn('⚠️ 盤點記錄 API 載入失敗，改用本地模擬資料。', apiErr);
        }
      }

      // 模擬 API 調用 - fallback
      await new Promise(resolve => setTimeout(resolve, 300));
      const mockCounts: InventoryCount[] = [
        {
          id: '1',
          name: '2024年第一季度全面盤點',
          description: '對所有產品進行全面的庫存盤點，檢查數量差異',
          status: 'completed',
          created_by: '張小明',
          created_at: '2024-03-01T08:00:00Z',
          started_at: '2024-03-01T09:00:00Z',
          completed_at: '2024-03-01T17:30:00Z',
          total_items: 150,
          counted_items: 150,
          items: []
        }
      ];
      setCounts(mockCounts);
    } catch (err) {
      setError('載入盤點記錄失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // ================================
  // 數據處理
  // ================================

  const filteredCounts = counts.filter(count => {
    const matchesSearch = count.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         count.description.toLowerCase().includes(searchValue.toLowerCase()) ||
                         count.created_by.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = !statusFilter || count.status === statusFilter;
    
    const matchesDateRange = (!dateRange.start || count.created_at >= dateRange.start) &&
                            (!dateRange.end || count.created_at <= dateRange.end);
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const summary: CountSummary = {
    total_counts: counts.length,
    draft_counts: counts.filter(c => c.status === 'draft').length,
    in_progress_counts: counts.filter(c => c.status === 'in_progress').length,
    completed_counts: counts.filter(c => c.status === 'completed').length,
    total_variance: counts.reduce((sum, c) => {
      const variance = (c.total_items || 0) - (c.counted_items || 0);
      return sum + variance;
    }, 0),
    variance_value: 0
  };

  // ================================
  // 事件處理
  // ================================

  const handleCreateCount = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditCount = (count: InventoryCount) => {
    setSelectedCount(count);
    setIsEditModalOpen(true);
  };

  const handleViewCount = (count: InventoryCount) => {
    setSelectedCount(count);
    setIsViewModalOpen(true);
  };

  const handleDeleteCount = (count: InventoryCount) => {
    if (confirm('確定要刪除此盤點記錄嗎？')) {
      setCounts(prev => prev.filter(c => c.id !== count.id));
    }
  };

  const handleStartCount = (count: InventoryCount) => {
    setCounts(prev => prev.map(c => 
      c.id === count.id 
        ? { ...c, status: 'in_progress', started_at: new Date().toISOString() }
        : c
    ));
  };

  const handleCompleteCount = (count: InventoryCount) => {
    setCounts(prev => prev.map(c => 
      c.id === count.id 
        ? { ...c, status: 'completed', completed_at: new Date().toISOString() }
        : c
    ));
  };

  // ================================
  // 表格配置
  // ================================

  const columns = [
    {
      title: '盤點名稱',
      dataIndex: 'name' as keyof InventoryCount,
      key: 'name',
      render: (text: string, record: InventoryCount) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status' as keyof InventoryCount,
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          draft: { label: '草稿', color: 'gray' },
          in_progress: { label: '進行中', color: 'blue' },
          completed: { label: '已完成', color: 'green' },
          cancelled: { label: '已取消', color: 'red' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    },
    {
      title: '創建者',
      dataIndex: 'created_by' as keyof InventoryCount,
      key: 'created_by',
      render: (text: string) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
          {text}
        </div>
      ),
    },
    {
      title: '進度',
      key: 'progress',
  // 注意：DataTable 會以 render(value, record, index) 呼叫
  // 此欄位沒有 dataIndex，因此第一個參數為 undefined
  // 需要將簽名寫成 (_, record) 才能正確取得資料列
  render: (_: any, record: InventoryCount) => {
        const totalItems = record.total_items || 0;
        const countedItems = record.counted_items || 0;
        const progress = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;
        return (
          <div>
            <div className="text-sm font-medium">
              {countedItems} / {totalItems}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: '創建時間',
      dataIndex: 'created_at' as keyof InventoryCount,
      key: 'created_at',
      render: (date: string) => (
        <div className="text-sm text-gray-900">
          {new Date(date).toLocaleString('zh-TW')}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
  // 同上，這個欄位沒有 dataIndex，需要使用 (_, record)
  render: (_: any, record: InventoryCount) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewCount(record)}
          >
            查看
          </Button>
          
          {record.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => handleStartCount(record)}
            >
              開始盤點
            </Button>
          )}
          
          {record.status === 'in_progress' && (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleCompleteCount(record)}
            >
              完成盤點
            </Button>
          )}
          
          <Dropdown
            trigger={
              <Button size="sm" variant="outline">
                更多
              </Button>
            }
            items={[
              {
                label: '編輯',
                onClick: () => handleEditCount(record),
                icon: <EditIcon className="h-4 w-4" />,
                disabled: record.status === 'completed'
              },
              {
                label: '列印',
                onClick: () => console.log('列印', record),
                icon: <PrinterIcon className="h-4 w-4" />
              },
              {
                label: '刪除',
                onClick: () => handleDeleteCount(record),
                icon: <TrashIcon className="h-4 w-4" />,
                danger: true,
                disabled: record.status === 'in_progress'
              }
            ]}
          />
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
          onRetry={loadCounts}
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
          title="庫存盤點"
          description="管理和執行庫存盤點作業，確保庫存數據的準確性"
        >
          <Button onClick={handleCreateCount}>
            <PlusIcon className="h-4 w-4 mr-2" />
            新增盤點
          </Button>
        </PageHeader>

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClipboardCheckIcon className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">總盤點數</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.total_counts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">草稿</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.draft_counts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">進行中</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.in_progress_counts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">已完成</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.completed_counts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <PackageIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">總差異數</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.total_variance}</p>
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
                  placeholder="搜尋盤點名稱、描述或創建者..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* 狀態篩選 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部狀態</option>
              <option value="draft">草稿</option>
              <option value="in_progress">進行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            
            {/* 重置按鈕 */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchValue('');
                setStatusFilter('');
                setDateRange({ start: '', end: '' });
              }}
            >
              重置
            </Button>
          </div>
        </div>

        {/* 盤點記錄表格 */}
        {filteredCounts.length === 0 ? (
          <EmptyState
            icon={ClipboardCheckIcon}
            title="暫無盤點記錄"
            description="目前沒有符合條件的庫存盤點記錄"
            action={{
              label: "新增盤點",
              onClick: handleCreateCount
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            dataSource={filteredCounts.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredCounts.length,
              onChange: (page: number, size: number) => {
                setCurrentPage(page);
                setPageSize(size);
              }
            }}
          />
        )}
      </div>

      {/* 創建盤點 Modal */}
      <CreateCountModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newCount) => {
          setCounts(prev => [newCount, ...prev]);
          setIsCreateModalOpen(false);
        }}
      />

      {/* 編輯盤點 Modal */}
      {selectedCount && (
        <EditCountModal 
          isOpen={isEditModalOpen}
          count={selectedCount}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCount(null);
          }}
          onSuccess={(updatedCount) => {
            setCounts(prev => prev.map(c => c.id === updatedCount.id ? updatedCount : c));
            setIsEditModalOpen(false);
            setSelectedCount(null);
          }}
        />
      )}

      {/* 查看盤點詳情 Modal */}
      {selectedCount && (
        <ViewCountModal 
          isOpen={isViewModalOpen}
          count={selectedCount}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedCount(null);
          }}
        />
      )}
    </InventoryLayout>
  );
};

// ================================
// 創建盤點 Modal 組件
// ================================

interface CreateCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: InventoryCount) => void;
}

const CreateCountModal: React.FC<CreateCountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productFilter: 'all' as 'all' | 'category' | 'specific',
    categories: [] as string[],
    products: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCount: InventoryCount = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        status: 'draft',
        created_by: '當前用戶',
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        total_items: 100, // 模擬數據
        counted_items: 0,
        items: []
      };
      
      onSuccess(newCount);
    } catch (error) {
      console.error('創建盤點失敗:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新增庫存盤點"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            盤點名稱 *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="輸入盤點名稱"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            盤點描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
            placeholder="輸入盤點描述"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            盤點範圍
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={formData.productFilter === 'all'}
                onChange={(e) => setFormData({ ...formData, productFilter: 'all' })}
                className="mr-2"
              />
              全部產品
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="category"
                checked={formData.productFilter === 'category'}
                onChange={(e) => setFormData({ ...formData, productFilter: 'category' })}
                className="mr-2"
              />
              依類別選擇
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="specific"
                checked={formData.productFilter === 'specific'}
                onChange={(e) => setFormData({ ...formData, productFilter: 'specific' })}
                className="mr-2"
              />
              指定產品
            </label>
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
            創建盤點
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ================================
// 編輯盤點 Modal 組件
// ================================

interface EditCountModalProps {
  isOpen: boolean;
  count: InventoryCount;
  onClose: () => void;
  onSuccess: (count: InventoryCount) => void;
}

const EditCountModal: React.FC<EditCountModalProps> = ({
  isOpen,
  count,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: count.name,
    description: count.description,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedCount = {
        ...count,
        name: formData.name,
        description: formData.description,
      };
      
      onSuccess(updatedCount);
    } catch (error) {
      console.error('更新盤點失敗:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="編輯庫存盤點"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            盤點名稱 *
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            盤點描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
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
            更新
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ================================
// 查看盤點詳情 Modal 組件
// ================================

interface ViewCountModalProps {
  isOpen: boolean;
  count: InventoryCount;
  onClose: () => void;
}

const ViewCountModal: React.FC<ViewCountModalProps> = ({
  isOpen,
  count,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="盤點詳情"
      size="xl"
    >
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">基本信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">盤點名稱：</span>
              <span className="text-gray-900">{count.name}</span>
            </div>
            <div>
              <span className="text-gray-500">創建者：</span>
              <span className="text-gray-900">{count.created_by}</span>
            </div>
            <div>
              <span className="text-gray-500">狀態：</span>
              <Badge color={count.status === 'completed' ? 'green' : 'blue'}>
                {count.status === 'draft' ? '草稿' : 
                 count.status === 'in_progress' ? '進行中' : 
                 count.status === 'completed' ? '已完成' : '已取消'}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">進度：</span>
              <span className="text-gray-900">
                {count.counted_items || 0} / {count.total_items || 0}
              </span>
            </div>
          </div>
        </div>

        {/* 時間信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">時間記錄</h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="text-gray-500">創建時間：</span>
              <span className="text-gray-900">
                {new Date(count.created_at).toLocaleString('zh-TW')}
              </span>
            </div>
            {count.started_at && (
              <div>
                <span className="text-gray-500">開始時間：</span>
                <span className="text-gray-900">
                  {new Date(count.started_at).toLocaleString('zh-TW')}
                </span>
              </div>
            )}
            {count.completed_at && (
              <div>
                <span className="text-gray-500">完成時間：</span>
                <span className="text-gray-900">
                  {new Date(count.completed_at).toLocaleString('zh-TW')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 描述 */}
        {count.description && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">描述</h3>
            <p className="text-gray-600">{count.description}</p>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <Button onClick={onClose}>
            關閉
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryCount;
