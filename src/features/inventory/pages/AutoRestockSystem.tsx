// ================================
// 庫存管理系統 - 自動補貨系統
// ================================

import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DollarSignIcon,
  PackageIcon,
  SendIcon,
  RefreshCwIcon,
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

// 模擬組件
const Button: React.FC<any> = ({ children, onClick, variant = 'primary', size = 'md', ...props }) => {
  const baseClass = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700'
  };
  const sizeClass = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  
  return (
    <button onClick={onClick} className={`${baseClass} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClass}`} {...props}>
      {children}
    </button>
  );
};

const Modal: React.FC<any> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 ${size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg'} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
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

interface RestockSuggestion {
  id: string;
  material_id: string;
  material_name: string;
  current_stock: number;
  min_stock: number;
  suggested_quantity: number;
  priority: 'high' | 'medium' | 'low';
  supplier: string;
  unit_cost: number;
  estimated_cost: number;
  lead_time: number; // 交貨天數
  last_purchase_date: string | null;
  consumption_rate: number; // 每日消耗量
  stock_out_risk: number; // 缺貨風險 (0-100%)
  created_at: string;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
}

interface SupplierOrder {
  id: string;
  supplier: string;
  order_date: string;
  expected_delivery: string;
  total_items: number;
  total_cost: number;
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: RestockSuggestion[];
  notes: string;
}

interface RestockSettings {
  auto_generate_suggestions: boolean;
  suggestion_frequency: 'daily' | 'weekly' | 'bi_weekly';
  default_safety_stock_days: number;
  min_order_amount: number;
  notification_enabled: boolean;
}

// ================================
// 自動補貨系統主組件
// ================================

export const AutoRestockSystem: React.FC = () => {
  // 狀態管理
  const [suggestions, setSuggestions] = useState<RestockSuggestion[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [settings, setSettings] = useState<RestockSettings>({
    auto_generate_suggestions: true,
    suggestion_frequency: 'daily',
    default_safety_stock_days: 7,
    min_order_amount: 1000,
    notification_enabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI 狀態
  const [activeTab, setActiveTab] = useState<'suggestions' | 'orders' | 'settings'>('suggestions');
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ================================
  // 數據載入
  // ================================

  useEffect(() => {
    loadRestockData();
  }, []);

  const loadRestockData = async () => {
    try {
      setIsLoading(true);
      
      // 模擬補貨建議數據
      const mockSuggestions: RestockSuggestion[] = [
        {
          id: '1',
          material_id: 'mat_1',
          material_name: '高筋麵粉',
          current_stock: 3.2,
          min_stock: 5.0,
          suggested_quantity: 15.0,
          priority: 'high',
          supplier: '金龍麵粉廠',
          unit_cost: 35,
          estimated_cost: 525,
          lead_time: 2,
          last_purchase_date: '2024-03-10',
          consumption_rate: 2.5,
          stock_out_risk: 85,
          created_at: '2024-03-21T10:00:00Z',
          status: 'pending'
        },
        {
          id: '2',
          material_id: 'mat_2',
          material_name: '新鮮蘑菇',
          current_stock: 0,
          min_stock: 2.0,
          suggested_quantity: 8.0,
          priority: 'high',
          supplier: '有機農場',
          unit_cost: 120,
          estimated_cost: 960,
          lead_time: 1,
          last_purchase_date: '2024-03-15',
          consumption_rate: 1.5,
          stock_out_risk: 100,
          created_at: '2024-03-21T11:00:00Z',
          status: 'approved'
        },
        {
          id: '3',
          material_id: 'mat_3',
          material_name: '雞胸肉',
          current_stock: 15.5,
          min_stock: 10.0,
          suggested_quantity: 20.0,
          priority: 'medium',
          supplier: '優質肉品供應商',
          unit_cost: 180,
          estimated_cost: 3600,
          lead_time: 1,
          last_purchase_date: '2024-03-18',
          consumption_rate: 3.2,
          stock_out_risk: 45,
          created_at: '2024-03-21T12:00:00Z',
          status: 'pending'
        }
      ];

      // 模擬供應商訂單數據
      const mockOrders: SupplierOrder[] = [
        {
          id: 'order_1',
          supplier: '有機農場',
          order_date: '2024-03-21',
          expected_delivery: '2024-03-22',
          total_items: 2,
          total_cost: 1560,
          status: 'confirmed',
          items: mockSuggestions.filter(s => s.supplier === '有機農場'),
          notes: '急件，請優先處理'
        },
        {
          id: 'order_2',
          supplier: '金龍麵粉廠',
          order_date: '2024-03-20',
          expected_delivery: '2024-03-22',
          total_items: 1,
          total_cost: 525,
          status: 'shipped',
          items: mockSuggestions.filter(s => s.supplier === '金龍麵粉廠'),
          notes: ''
        }
      ];
      
      setSuggestions(mockSuggestions);
      setOrders(mockOrders);
    } catch (err) {
      setError('載入補貨數據失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // ================================
  // 事件處理
  // ================================

  const handleGenerateSuggestions = async () => {
    try {
      setIsLoading(true);
      // 模擬生成補貨建議的 API 調用
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadRestockData();
    } catch (err) {
      setError('生成補貨建議失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, status: 'approved' } : s
    ));
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, status: 'cancelled' } : s
    ));
  };

  const handleCreateOrder = () => {
    const approvedSuggestions = suggestions.filter(s => 
      selectedSuggestions.includes(s.id) && s.status === 'approved'
    );
    
    if (approvedSuggestions.length === 0) {
      alert('請選擇已批准的補貨建議');
      return;
    }
    
    setIsCreateOrderModalOpen(true);
  };

  const handleToggleSelection = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId) 
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const handleSelectAll = () => {
    const approvedIds = suggestions
      .filter(s => s.status === 'approved')
      .map(s => s.id);
    setSelectedSuggestions(approvedIds);
  };

  const handleClearSelection = () => {
    setSelectedSuggestions([]);
  };

  // ================================
  // 補貨建議表格配置
  // ================================

  const suggestionColumns = [
    {
      title: '選擇',
      key: 'select',
  // 無 dataIndex，使用 (_, record) 獲取資料列
  render: (_: any, record: RestockSuggestion) => (
        <input
          type="checkbox"
          checked={selectedSuggestions.includes(record.id)}
          onChange={() => handleToggleSelection(record.id)}
          disabled={record.status !== 'approved'}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      title: '原料名稱',
      dataIndex: 'material_name' as keyof RestockSuggestion,
      key: 'material_name',
      render: (text: string, record: RestockSuggestion) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">供應商: {record.supplier}</div>
        </div>
      ),
    },
    {
      title: '庫存狀況',
      key: 'stock_status',
  render: (_: any, record: RestockSuggestion) => (
        <div>
          <div className="text-sm">
            <span className="text-gray-600">當前: </span>
            <span className={record.current_stock <= record.min_stock ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {record.current_stock}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">最小: </span>
            <span>{record.min_stock}</span>
          </div>
          <div className="text-xs text-gray-500">日消耗: {record.consumption_rate}</div>
        </div>
      ),
    },
    {
      title: '建議補貨',
      key: 'suggestion',
  render: (_: any, record: RestockSuggestion) => (
        <div>
          <div className="font-medium">{record.suggested_quantity} 單位</div>
          <div className="text-sm text-gray-600">NT$ {record.estimated_cost.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{record.lead_time} 天交貨</div>
        </div>
      ),
    },
    {
      title: '優先級',
      dataIndex: 'priority' as keyof RestockSuggestion,
      key: 'priority',
      render: (priority: string, record: RestockSuggestion) => (
        <div>
          <Badge color={priority === 'high' ? 'red' : priority === 'medium' ? 'yellow' : 'green'}>
            {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
          </Badge>
          <div className="text-xs text-gray-500 mt-1">
            缺貨風險: {record.stock_out_risk}%
          </div>
        </div>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status' as keyof RestockSuggestion,
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { label: '待審核', color: 'gray' },
          approved: { label: '已批准', color: 'green' },
          ordered: { label: '已下單', color: 'blue' },
          received: { label: '已收貨', color: 'green' },
          cancelled: { label: '已取消', color: 'red' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    },
    {
      title: '操作',
      key: 'actions',
  render: (_: any, record: RestockSuggestion) => (
        <div className="flex space-x-2">
          {record.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApproveSuggestion(record.id)}
              >
                批准
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectSuggestion(record.id)}
              >
                拒絕
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Badge color="green">可下單</Badge>
          )}
        </div>
      ),
    },
  ];

  // ================================
  // 訂單表格配置
  // ================================

  const orderColumns = [
    {
      title: '訂單信息',
      key: 'order_info',
  render: (_: any, record: SupplierOrder) => (
        <div>
          <div className="font-medium text-gray-900">訂單 #{record.id}</div>
          <div className="text-sm text-gray-600">{record.supplier}</div>
          <div className="text-xs text-gray-500">下單日期: {record.order_date}</div>
        </div>
      ),
    },
    {
      title: '商品詳情',
      key: 'items',
  render: (_: any, record: SupplierOrder) => (
        <div>
          <div className="text-sm font-medium">{record.total_items} 個商品</div>
          <div className="text-sm text-gray-600">總計: NT$ {record.total_cost.toLocaleString()}</div>
        </div>
      ),
    },
    {
      title: '預計交貨',
      dataIndex: 'expected_delivery' as keyof SupplierOrder,
      key: 'expected_delivery',
      render: (date: string) => (
        <div className="text-sm text-gray-900">{date}</div>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status' as keyof SupplierOrder,
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          draft: { label: '草稿', color: 'gray' },
          sent: { label: '已發送', color: 'blue' },
          confirmed: { label: '已確認', color: 'green' },
          shipped: { label: '已發貨', color: 'blue' },
          delivered: { label: '已送達', color: 'green' },
          cancelled: { label: '已取消', color: 'red' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    }
  ];

  // ================================
  // 統計數據
  // ================================

  const stats = {
    pending_suggestions: suggestions.filter(s => s.status === 'pending').length,
    approved_suggestions: suggestions.filter(s => s.status === 'approved').length,
    total_estimated_cost: suggestions
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.estimated_cost, 0),
    active_orders: orders.filter(o => ['sent', 'confirmed', 'shipped'].includes(o.status)).length,
    high_priority_items: suggestions.filter(s => s.priority === 'high' && s.status === 'pending').length
  };

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
          onRetry={loadRestockData}
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
          title="自動補貨系統"
          description="智能分析庫存需求，自動生成補貨建議，簡化採購流程"
        >
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleGenerateSuggestions}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              重新分析
            </Button>
            <Button onClick={() => setIsSettingsModalOpen(true)}>
              設定補貨規則
            </Button>
          </div>
        </PageHeader>

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">待審核建議</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending_suggestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">已批准建議</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved_suggestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">預估成本</p>
                <p className="text-2xl font-semibold text-gray-900">
                  NT$ {stats.total_estimated_cost.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ShoppingCartIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">進行中訂單</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active_orders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">高優先級</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.high_priority_items}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 標籤導航 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'suggestions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                補貨建議 ({suggestions.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                採購訂單 ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                系統設定
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* 補貨建議標籤 */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                {/* 批量操作工具列 */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleSelectAll}
                    >
                      全選已批准
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearSelection}
                    >
                      清除選擇
                    </Button>
                    {selectedSuggestions.length > 0 && (
                      <Button
                        onClick={handleCreateOrder}
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-2" />
                        創建訂單 ({selectedSuggestions.length})
                      </Button>
                    )}
                  </div>
                </div>

                {/* 建議表格 */}
                {suggestions.length === 0 ? (
                  <EmptyState
                    icon={PackageIcon}
                    title="暫無補貨建議"
                    description="系統將根據庫存水平自動生成補貨建議"
                    action={{
                      label: "立即分析",
                      onClick: handleGenerateSuggestions
                    }}
                  />
                ) : (
                  <DataTable
                    columns={suggestionColumns}
                    dataSource={suggestions.slice(
                      (currentPage - 1) * pageSize,
                      currentPage * pageSize
                    )}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: suggestions.length,
                      onChange: (page: number, size: number) => {
                        setCurrentPage(page);
                        setPageSize(size);
                      }
                    }}
                  />
                )}
              </div>
            )}

            {/* 採購訂單標籤 */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCartIcon}
                    title="暫無採購訂單"
                    description="批准補貨建議後可創建採購訂單"
                  />
                ) : (
                  <DataTable
                    columns={orderColumns}
                    dataSource={orders}
                    pagination={{
                      current: 1,
                      pageSize: 10,
                      total: orders.length,
                      onChange: () => {}
                    }}
                  />
                )}
              </div>
            )}

            {/* 系統設定標籤 */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">自動化設定</h3>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        自動生成補貨建議
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.auto_generate_suggestions}
                        onChange={(e) => setSettings({
                          ...settings,
                          auto_generate_suggestions: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        分析頻率
                      </label>
                      <select
                        value={settings.suggestion_frequency}
                        onChange={(e) => setSettings({
                          ...settings,
                          suggestion_frequency: e.target.value as any
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="daily">每日</option>
                        <option value="weekly">每週</option>
                        <option value="bi_weekly">雙週</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        安全庫存天數
                      </label>
                      <input
                        type="number"
                        value={settings.default_safety_stock_days}
                        onChange={(e) => setSettings({
                          ...settings,
                          default_safety_stock_days: parseInt(e.target.value)
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">訂單設定</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最小訂單金額 (NT$)
                      </label>
                      <input
                        type="number"
                        value={settings.min_order_amount}
                        onChange={(e) => setSettings({
                          ...settings,
                          min_order_amount: parseInt(e.target.value)
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        啟用通知提醒
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.notification_enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          notification_enabled: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button>
                    儲存設定
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 創建訂單 Modal */}
      <CreateOrderModal 
        isOpen={isCreateOrderModalOpen}
        selectedSuggestions={suggestions.filter(s => selectedSuggestions.includes(s.id))}
        onClose={() => setIsCreateOrderModalOpen(false)}
        onSuccess={(newOrder) => {
          setOrders(prev => [newOrder, ...prev]);
          setSelectedSuggestions([]);
          setIsCreateOrderModalOpen(false);
        }}
      />
    </InventoryLayout>
  );
};

// ================================
// 創建訂單 Modal 組件
// ================================

interface CreateOrderModalProps {
  isOpen: boolean;
  selectedSuggestions: RestockSuggestion[];
  onClose: () => void;
  onSuccess: (order: SupplierOrder) => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  selectedSuggestions,
  onClose,
  onSuccess,
}) => {
  const [orderData, setOrderData] = useState({
    supplier: '',
    expected_delivery: '',
    notes: ''
  });

  const suppliers = [...new Set(selectedSuggestions.map(s => s.supplier))];
  const totalCost = selectedSuggestions.reduce((sum, s) => sum + s.estimated_cost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newOrder: SupplierOrder = {
        id: `order_${Date.now()}`,
        supplier: orderData.supplier,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery: orderData.expected_delivery,
        total_items: selectedSuggestions.length,
        total_cost: totalCost,
        status: 'draft',
        items: selectedSuggestions,
        notes: orderData.notes
      };
      
      onSuccess(newOrder);
    } catch (error) {
      console.error('創建訂單失敗:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="創建採購訂單"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 供應商選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            供應商 *
          </label>
          <select
            required
            value={orderData.supplier}
            onChange={(e) => setOrderData({ ...orderData, supplier: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">選擇供應商</option>
            {suppliers.map(supplier => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
        </div>

        {/* 預計交貨日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            預計交貨日期 *
          </label>
          <input
            type="date"
            required
            value={orderData.expected_delivery}
            onChange={(e) => setOrderData({ ...orderData, expected_delivery: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        {/* 訂單項目 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            訂單項目
          </label>
          <div className="border border-gray-200 rounded-md">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">項目</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">數量</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">單價</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">小計</th>
                </tr>
              </thead>
              <tbody>
                {selectedSuggestions
                  .filter(s => !orderData.supplier || s.supplier === orderData.supplier)
                  .map((item, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-sm">{item.material_name}</td>
                    <td className="px-4 py-2 text-sm">{item.suggested_quantity}</td>
                    <td className="px-4 py-2 text-sm">NT$ {item.unit_cost}</td>
                    <td className="px-4 py-2 text-sm">NT$ {item.estimated_cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900">總計</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    NT$ {selectedSuggestions
                      .filter(s => !orderData.supplier || s.supplier === orderData.supplier)
                      .reduce((sum, s) => sum + s.estimated_cost, 0)
                      .toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            備註
          </label>
          <textarea
            value={orderData.notes}
            onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
            placeholder="輸入訂單備註..."
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
            創建訂單
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AutoRestockSystem;
