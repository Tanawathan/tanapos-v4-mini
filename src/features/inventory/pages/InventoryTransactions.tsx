// ================================
// 庫存管理系統 - 庫存交易記錄頁面
// ================================

import React, { useState, useEffect } from 'react';
import {
  HistoryIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  CalendarIcon,
  UserIcon,
  PackageIcon,
  Package,
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
import type { InventoryTransaction } from '../types';
import InventoryServices from '../services';

// ================================
// 交易記錄數據類型
// ================================

interface TransactionRecord extends InventoryTransaction {
  product_name?: string;
  raw_material_name?: string;
  operator_name?: string;
  formatted_date: string;
  stock_change_display: string;
  balance_after: number;
}

interface DateRange {
  start: string;
  end: string;
}

// ================================
// 主要交易記錄組件
// ================================

export const InventoryTransactions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 交易記錄數據
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionRecord[]>([]);
  
  // 搜索和篩選狀態
  const [searchValue, setSearchValue] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  
  // 分頁狀態
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Zustand Store
  const inventoryStore = useInventoryStore();

  // ================================
  // 數據載入
  // ================================

  const loadTransactionsData = async () => {
    try {
      setError(null);
  const hasSupabase = !!(import.meta as any).env?.VITE_SUPABASE_URL && !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  const restaurantId = (import.meta as any).env?.VITE_RESTAURANT_ID as string | undefined;

  if (hasSupabase && restaurantId) {
        try {
          const { InventoryTransactionService } = InventoryServices as any;
          const { data } = await InventoryTransactionService.getTransactions({ restaurant_id: restaurantId }, 1, 200);

          const mapped: TransactionRecord[] = (data || []).map((t: any) => {
            const sign = (t.transaction_type === 'in' || (t.transaction_type === 'adjust' && Number(t.quantity) > 0)) ? '+' : '-';
            const productName = (t.products && t.products.name) || undefined;
            const rawMaterialName = (t.raw_materials && t.raw_materials.name) || undefined;
            return {
              ...t,
              product_name: productName,
              raw_material_name: rawMaterialName,
              operator_name: t.operator_name || undefined,
              formatted_date: new Date(t.created_at).toLocaleString('zh-TW', { hour12: false }).replace('/', '-'),
              stock_change_display: `${sign}${Math.abs(Number(t.quantity ?? 0))}`,
              balance_after: Number(t.stock_after ?? 0),
            } as TransactionRecord;
          });

          setTransactions(mapped);
          setFilteredTransactions(mapped);
          setPagination(prev => ({
            ...prev,
            total: mapped.length,
          }));
          return;
        } catch (apiErr) {
          console.warn('⚠️ 交易記錄 API 載入失敗，改用本地模擬資料。', apiErr);
        }
      }

      // 模擬 API 調用 (fallback)
      await new Promise(resolve => setTimeout(resolve, 300));

      const mockTransactions: TransactionRecord[] = [
        {
          id: 't1',
          restaurant_id: 'r1',
          product_id: 'p1',
          transaction_type: 'out',
          quantity: 10,
          unit: '個',
          reason: 'sale',
          reference_id: 'order_123',
          stock_before: 45,
          stock_after: 35,
          notes: '正常銷售出庫',
          created_by: 'user1',
          created_at: '2024-01-15T14:30:00Z',
          product_name: '經典漢堡',
          operator_name: '張三',
          formatted_date: '2024-01-15 14:30',
          stock_change_display: '-10',
          balance_after: 35,
        },
      ];

      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setPagination(prev => ({
        ...prev,
        total: mockTransactions.length,
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadTransactionsData();
  }, []);

  // ================================
  // 搜索和篩選邏輯
  // ================================

  useEffect(() => {
    let filtered = [...transactions];

    // 搜索篩選
    if (searchValue) {
      filtered = filtered.filter(transaction =>
        transaction.product_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.raw_material_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.reason.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.reference_id?.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.operator_name?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // 交易類型篩選
    if (transactionTypeFilter) {
      filtered = filtered.filter(transaction => transaction.transaction_type === transactionTypeFilter);
    }

    // 日期範圍篩選
    if (dateRange.start) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.created_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.created_at) <= new Date(dateRange.end + 'T23:59:59')
      );
    }

    setFilteredTransactions(filtered);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length,
    }));
  }, [transactions, searchValue, transactionTypeFilter, dateRange]);

  // ================================
  // 表格配置
  // ================================

  const columns: TableColumn<TransactionRecord>[] = [
    {
      key: 'created_at',
      title: '時間',
      dataIndex: 'created_at',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.formatted_date}</div>
          <div className="text-xs text-gray-500">
            {new Date(value).toLocaleDateString('zh-TW')}
          </div>
        </div>
      ),
    },
    {
      key: 'transaction_type',
      title: '類型',
      dataIndex: 'transaction_type',
      sortable: true,
      align: 'center',
      render: (value) => {
        const typeConfig = {
          in: { color: 'green', text: '入庫', icon: ArrowUpIcon },
          out: { color: 'red', text: '出庫', icon: ArrowDownIcon },
          adjust: { color: 'blue', text: '調整', icon: RefreshCwIcon },
          transfer: { color: 'purple', text: '調撥', icon: RefreshCwIcon },
          count: { color: 'yellow', text: '盤點', icon: RefreshCwIcon },
        };
        const config = typeConfig[value as keyof typeof typeConfig];
        const Icon = config.icon;
        return (
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.text}
            </span>
          </div>
        );
      },
    },
    {
      key: 'product_name',
      title: '產品/原料',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center">
            <PackageIcon className="h-4 w-4 mr-2 text-gray-400" />
            {record.product_name || record.raw_material_name || '未知產品'}
          </div>
          <div className="text-sm text-gray-500">
            ID: {record.product_id || record.raw_material_id}
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      title: '數量變化',
      dataIndex: 'quantity',
      sortable: true,
      align: 'right',
      render: (value, record) => (
        <div className="text-right">
          <div className={`font-medium text-lg ${
            record.transaction_type === 'in' || (record.transaction_type === 'adjust' && record.quantity > 0)
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {record.stock_change_display} {record.unit}
          </div>
          <div className="text-xs text-gray-500">
            結餘: {record.balance_after} {record.unit}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      title: '原因',
      dataIndex: 'reason',
      sortable: true,
      render: (value) => {
        const reasonMap = {
          purchase: '採購入庫',
          sale: '銷售出庫',
          waste: '報廢出庫',
          return: '退貨入庫',
          transfer_in: '調撥入庫',
          transfer_out: '調撥出庫',
          count_adjust: '盤點調整',
          system_adjust: '系統調整',
          error_correct: '錯誤更正',
        };
        return reasonMap[value as keyof typeof reasonMap] || value;
      },
    },
    {
      key: 'reference_id',
      title: '參考單號',
      dataIndex: 'reference_id',
      render: (value) => (
        <span className="font-mono text-sm text-blue-600">{value}</span>
      ),
    },
    {
      key: 'operator_name',
      title: '操作人',
      render: (_, record) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-sm">{record.operator_name || '系統'}</span>
        </div>
      ),
    },
    {
      key: 'notes',
      title: '備註',
      dataIndex: 'notes',
      render: (value) => (
        <span className="text-sm text-gray-600">{value || '-'}</span>
      ),
    },
  ];

  // ================================
  // 事件處理
  // ================================

  const handleExport = () => {
    // 導出交易記錄
    console.log('導出交易記錄:', filteredTransactions);
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
            <p className="mt-4 text-gray-600">載入交易記錄...</p>
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
          onRetry={loadTransactionsData}
        />
      </InventoryLayout>
    );
  }

  return (
    <InventoryLayout>
      <PageHeader
        title="庫存交易記錄"
        description="查看所有庫存變動的詳細記錄"
      >
        <div className="flex space-x-3">
          <button
            onClick={loadTransactionsData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            刷新
          </button>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            導出記錄
          </button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* 搜索和篩選欄 */}
        <SearchFilterBar
          searchProps={{
            placeholder: '搜索產品名稱、操作人、單號或原因...',
            value: searchValue,
            onChange: setSearchValue,
          }}
          filterProps={{
            filterGroups: [
              {
                key: 'transaction_type',
                title: '交易類型',
                type: 'select',
                options: [
                  { label: '入庫', value: 'in' },
                  { label: '出庫', value: 'out' },
                  { label: '調整', value: 'adjust' },
                  { label: '調撥', value: 'transfer' },
                  { label: '盤點', value: 'count' },
                ],
              },
              {
                key: 'date_range',
                title: '日期範圍',
                type: 'dateRange',
              },
            ],
            activeFilters: [
              ...(transactionTypeFilter ? [{
                key: 'transaction_type',
                title: '交易類型',
                value: transactionTypeFilter,
                label: transactionTypeFilter === 'in' ? '入庫' : 
                       transactionTypeFilter === 'out' ? '出庫' : '調整',
              }] : []),
              ...(dateRange.start || dateRange.end ? [{
                key: 'date_range',
                title: '日期範圍',
                value: dateRange,
                label: `${dateRange.start || ''} ~ ${dateRange.end || ''}`,
              }] : []),
            ],
            onFilterChange: (filters) => {
              const typeFilterValue = filters.find(f => f.key === 'transaction_type')?.value || '';
              const dateRangeValue = filters.find(f => f.key === 'date_range')?.value || { start: '', end: '' };
              setTransactionTypeFilter(typeFilterValue);
              setDateRange(dateRangeValue);
            },
          }}
        />

        {/* 統計信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <ArrowUpIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">總入庫次數</p>
                <p className="text-xl font-semibold text-gray-900">
                  {filteredTransactions.filter(t => t.transaction_type === 'in').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <ArrowDownIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">總出庫次數</p>
                <p className="text-xl font-semibold text-gray-900">
                  {filteredTransactions.filter(t => t.transaction_type === 'out').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <RefreshCwIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">調整次數</p>
                <p className="text-xl font-semibold text-gray-900">
                  {filteredTransactions.filter(t => t.transaction_type === 'adjust').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <HistoryIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">總記錄數</p>
                <p className="text-xl font-semibold text-gray-900">
                  {filteredTransactions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 交易記錄表格 */}
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Package}
            title="暫無交易記錄"
            description="目前沒有符合條件的庫存交易記錄"
            action={{
              label: "清除篩選條件",
              onClick: () => {
                setSearchValue('');
                setTransactionTypeFilter('');
                setDateRange({ start: '', end: '' });
              }
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            dataSource={filteredTransactions.slice(
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
            rowKey="id"
          />
        )}
      </div>
    </InventoryLayout>
  );
};

export default InventoryTransactions;
