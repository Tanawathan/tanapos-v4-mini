// ================================
// 庫存管理系統 - 庫存分析儀表板
// ================================

import React, { useState, useEffect } from 'react';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  PieChartIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  PackageIcon,
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  InfoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from 'lucide-react';

import { 
  InventoryLayout, 
  PageHeader,
  LoadingSpinner,
  ErrorState 
} from '../components/Layout';

// 模擬圖表組件
const LineChart: React.FC<any> = ({ data, title }) => (
  <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
    <div className="text-center">
      <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{title} 圖表</p>
      <p className="text-xs text-gray-400">數據點: {data?.length || 0}</p>
    </div>
  </div>
);

const BarChart: React.FC<any> = ({ data, title }) => (
  <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
    <div className="text-center">
      <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{title} 柱狀圖</p>
      <p className="text-xs text-gray-400">數據點: {data?.length || 0}</p>
    </div>
  </div>
);

const PieChart: React.FC<any> = ({ data, title }) => (
  <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
    <div className="text-center">
      <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{title} 圓餅圖</p>
      <p className="text-xs text-gray-400">數據點: {data?.length || 0}</p>
    </div>
  </div>
);

// 模擬組件
const Button: React.FC<any> = ({ children, onClick, variant = 'primary', size = 'md', ...props }) => {
  const baseClass = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  const sizeClass = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  
  return (
    <button onClick={onClick} className={`${baseClass} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClass}`} {...props}>
      {children}
    </button>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder }) => (
  <input
    type="date"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
  />
);

// ================================
// 類型定義
// ================================

interface InventoryAnalytics {
  // 概覽統計
  total_value: number;
  total_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  
  // 趨勢數據
  value_trend: number; // 百分比變化
  turnover_rate: number;
  dead_stock_value: number;
  shrinkage_rate: number;
  
  // 分類分析
  category_distribution: CategoryDistribution[];
  supplier_performance: SupplierPerformance[];
  
  // 時間序列數據
  inventory_trends: InventoryTrend[];
  consumption_patterns: ConsumptionPattern[];
  cost_analysis: CostAnalysis[];
  
  // 預測數據
  demand_forecast: DemandForecast[];
  reorder_predictions: ReorderPrediction[];
}

interface CategoryDistribution {
  category: string;
  value: number;
  percentage: number;
  items_count: number;
  avg_cost: number;
}

interface SupplierPerformance {
  supplier: string;
  total_value: number;
  items_count: number;
  avg_lead_time: number;
  quality_score: number;
  on_time_delivery: number;
}

interface InventoryTrend {
  date: string;
  total_value: number;
  total_quantity: number;
  categories: Record<string, number>;
}

interface ConsumptionPattern {
  material: string;
  daily_avg: number;
  weekly_avg: number;
  monthly_avg: number;
  seasonality: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface CostAnalysis {
  period: string;
  purchase_cost: number;
  holding_cost: number;
  shrinkage_cost: number;
  opportunity_cost: number;
}

interface DemandForecast {
  material: string;
  next_7_days: number;
  next_30_days: number;
  confidence: number;
}

interface ReorderPrediction {
  material: string;
  predicted_reorder_date: string;
  suggested_quantity: number;
  confidence: number;
}

// ================================
// 庫存分析儀表板主組件
// ================================

export const InventoryAnalyticsDashboard: React.FC = () => {
  // 狀態管理
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 篩選條件
  const [filters, setFilters] = useState({
    date_range: '30d',
    category: 'all',
    supplier: 'all',
    start_date: '',
    end_date: ''
  });
  
  // UI 狀態
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'categories' | 'suppliers' | 'forecasts'>('overview');
  const [isExporting, setIsExporting] = useState(false);

  // ================================
  // 數據載入
  // ================================

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // 模擬分析數據
      const mockAnalytics: InventoryAnalytics = {
        // 概覽統計
        total_value: 125000,
        total_items: 156,
        low_stock_items: 12,
        out_of_stock_items: 3,
        
        // 趨勢數據
        value_trend: 8.5,
        turnover_rate: 4.2,
        dead_stock_value: 8500,
        shrinkage_rate: 1.2,
        
        // 分類分析
        category_distribution: [
          {
            category: '肉類',
            value: 45000,
            percentage: 36,
            items_count: 28,
            avg_cost: 1607
          },
          {
            category: '蔬菜',
            value: 32000,
            percentage: 25.6,
            items_count: 42,
            avg_cost: 762
          },
          {
            category: '調料',
            value: 25000,
            percentage: 20,
            items_count: 35,
            avg_cost: 714
          },
          {
            category: '乾貨',
            value: 15000,
            percentage: 12,
            items_count: 25,
            avg_cost: 600
          },
          {
            category: '其他',
            value: 8000,
            percentage: 6.4,
            items_count: 26,
            avg_cost: 308
          }
        ],
        
        // 供應商表現
        supplier_performance: [
          {
            supplier: '優質肉品供應商',
            total_value: 45000,
            items_count: 28,
            avg_lead_time: 1.2,
            quality_score: 4.8,
            on_time_delivery: 95
          },
          {
            supplier: '有機農場',
            total_value: 32000,
            items_count: 42,
            avg_lead_time: 0.8,
            quality_score: 4.9,
            on_time_delivery: 98
          },
          {
            supplier: '金龍麵粉廠',
            total_value: 25000,
            items_count: 35,
            avg_lead_time: 2.1,
            quality_score: 4.6,
            on_time_delivery: 88
          }
        ],
        
        // 時間序列數據
        inventory_trends: generateMockTrendData(),
        consumption_patterns: [
          {
            material: '雞胸肉',
            daily_avg: 3.2,
            weekly_avg: 22.4,
            monthly_avg: 96,
            seasonality: 1.15,
            trend: 'increasing'
          },
          {
            material: '高筋麵粉',
            daily_avg: 2.5,
            weekly_avg: 17.5,
            monthly_avg: 75,
            seasonality: 0.95,
            trend: 'stable'
          },
          {
            material: '新鮮蘑菇',
            daily_avg: 1.8,
            weekly_avg: 12.6,
            monthly_avg: 54,
            seasonality: 1.25,
            trend: 'decreasing'
          }
        ],
        
        cost_analysis: generateMockCostData(),
        
        // 預測數據
        demand_forecast: [
          {
            material: '雞胸肉',
            next_7_days: 22.4,
            next_30_days: 96,
            confidence: 0.89
          },
          {
            material: '高筋麵粉',
            next_7_days: 17.5,
            next_30_days: 75,
            confidence: 0.92
          },
          {
            material: '新鮮蘑菇',
            next_7_days: 12.6,
            next_30_days: 54,
            confidence: 0.76
          }
        ],
        
        reorder_predictions: [
          {
            material: '雞胸肉',
            predicted_reorder_date: '2024-03-25',
            suggested_quantity: 20,
            confidence: 0.88
          },
          {
            material: '高筋麵粉',
            predicted_reorder_date: '2024-03-23',
            suggested_quantity: 15,
            confidence: 0.95
          }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (err) {
      setError('載入分析數據失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成模擬趨勢數據
  function generateMockTrendData(): InventoryTrend[] {
    const trends: InventoryTrend[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        total_value: 120000 + Math.random() * 10000 - 5000,
        total_quantity: 150 + Math.random() * 20 - 10,
        categories: {
          '肉類': 40000 + Math.random() * 8000 - 4000,
          '蔬菜': 30000 + Math.random() * 6000 - 3000,
          '調料': 25000 + Math.random() * 4000 - 2000,
          '乾貨': 15000 + Math.random() * 2000 - 1000,
          '其他': 8000 + Math.random() * 1000 - 500
        }
      });
    }
    
    return trends;
  }

  // 生成模擬成本數據
  function generateMockCostData(): CostAnalysis[] {
    const costs: CostAnalysis[] = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      costs.unshift({
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        purchase_cost: 80000 + Math.random() * 20000 - 10000,
        holding_cost: 5000 + Math.random() * 2000 - 1000,
        shrinkage_cost: 1500 + Math.random() * 1000 - 500,
        opportunity_cost: 2000 + Math.random() * 1000 - 500
      });
    }
    
    return costs;
  }

  // ================================
  // 事件處理
  // ================================

  const handleRefresh = () => {
    loadAnalytics();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 模擬導出數據
      await new Promise(resolve => setTimeout(resolve, 2000));
      // 實際應用中會調用導出 API
      alert('報告已導出成功');
    } catch (error) {
      alert('導出失敗');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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

  if (error || !analytics) {
    return (
      <InventoryLayout>
        <ErrorState 
          message={error || '無法載入分析數據'}
          onRetry={loadAnalytics}
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
        {/* 頁面標題和操作 */}
        <PageHeader
          title="庫存分析儀表板"
          description="深度分析庫存數據，洞察業務趨勢，優化庫存管理策略"
        >
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              重新整理
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              {isExporting ? '導出中...' : '導出報告'}
            </Button>
          </div>
        </PageHeader>

        {/* 篩選條件 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <FilterIcon className="h-5 w-5 text-gray-400" />
            <Select
              value={filters.date_range}
              onChange={(value) => handleFilterChange('date_range', value)}
              options={[
                { value: '7d', label: '最近 7 天' },
                { value: '30d', label: '最近 30 天' },
                { value: '90d', label: '最近 90 天' },
                { value: 'custom', label: '自定義範圍' }
              ]}
            />
            
            {filters.date_range === 'custom' && (
              <>
                <DatePicker
                  value={filters.start_date}
                  onChange={(value) => handleFilterChange('start_date', value)}
                  placeholder="開始日期"
                />
                <DatePicker
                  value={filters.end_date}
                  onChange={(value) => handleFilterChange('end_date', value)}
                  placeholder="結束日期"
                />
              </>
            )}
            
            <Select
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              options={[
                { value: 'all', label: '所有分類' },
                { value: '肉類', label: '肉類' },
                { value: '蔬菜', label: '蔬菜' },
                { value: '調料', label: '調料' },
                { value: '乾貨', label: '乾貨' }
              ]}
              placeholder="選擇分類"
            />
            
            <Select
              value={filters.supplier}
              onChange={(value) => handleFilterChange('supplier', value)}
              options={[
                { value: 'all', label: '所有供應商' },
                { value: '優質肉品供應商', label: '優質肉品供應商' },
                { value: '有機農場', label: '有機農場' },
                { value: '金龍麵粉廠', label: '金龍麵粉廠' }
              ]}
              placeholder="選擇供應商"
            />
          </div>
        </div>

        {/* 關鍵指標概覽 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">庫存總值</p>
                <p className="text-2xl font-semibold text-gray-900">
                  NT$ {analytics.total_value.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {analytics.value_trend > 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${analytics.value_trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analytics.value_trend)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <PackageIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">庫存項目</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.total_items}</p>
                <p className="text-sm text-gray-600">週轉率: {analytics.turnover_rate}x</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">庫存警告</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.low_stock_items}</p>
                <p className="text-sm text-red-600">{analytics.out_of_stock_items} 項缺貨</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingDownIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">滯銷庫存</p>
                <p className="text-2xl font-semibold text-gray-900">
                  NT$ {analytics.dead_stock_value.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">損耗率: {analytics.shrinkage_rate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 標籤導航 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: '概覽分析' },
                { key: 'trends', label: '趨勢分析' },
                { key: 'categories', label: '分類分析' },
                { key: 'suppliers', label: '供應商分析' },
                { key: 'forecasts', label: '預測分析' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 概覽分析 */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">庫存價值趨勢</h3>
                    <LineChart 
                      data={analytics.inventory_trends}
                      title="30 天庫存價值變化"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">分類分布</h3>
                    <PieChart 
                      data={analytics.category_distribution}
                      title="庫存價值分類分布"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">消耗模式分析</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analytics.consumption_patterns.map((pattern, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{pattern.material}</h4>
                          <div className="flex items-center">
                            {pattern.trend === 'increasing' ? (
                              <TrendingUpIcon className="h-4 w-4 text-green-500" />
                            ) : pattern.trend === 'decreasing' ? (
                              <TrendingDownIcon className="h-4 w-4 text-red-500" />
                            ) : (
                              <div className="h-4 w-4 bg-gray-400 rounded-full" />
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>日均消耗: {pattern.daily_avg}</div>
                          <div>週均消耗: {pattern.weekly_avg}</div>
                          <div>月均消耗: {pattern.monthly_avg}</div>
                          <div>季節性指數: {pattern.seasonality}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 趨勢分析 */}
            {selectedTab === 'trends' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">庫存量趨勢</h3>
                  <LineChart 
                    data={analytics.inventory_trends}
                    title="庫存數量變化趨勢"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">成本分析</h3>
                  <BarChart 
                    data={analytics.cost_analysis}
                    title="月度成本構成分析"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">各分類趨勢</h3>
                    <LineChart 
                      data={analytics.inventory_trends}
                      title="分類庫存變化"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">週轉率分析</h3>
                    <BarChart 
                      data={analytics.category_distribution}
                      title="各分類週轉率"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 分類分析 */}
            {selectedTab === 'categories' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">分類價值分布</h3>
                    <PieChart 
                      data={analytics.category_distribution}
                      title="庫存價值分類分布"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">分類項目數量</h3>
                    <BarChart 
                      data={analytics.category_distribution}
                      title="各分類項目數量"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">分類詳細分析</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-4 py-2 text-left">分類</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">總價值</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">佔比</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">項目數</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">平均成本</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.category_distribution.map((category, index) => (
                          <tr key={index}>
                            <td className="border border-gray-200 px-4 py-2 font-medium">
                              {category.category}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              NT$ {category.value.toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {category.percentage}%
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {category.items_count}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              NT$ {category.avg_cost.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 供應商分析 */}
            {selectedTab === 'suppliers' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">供應商價值分布</h3>
                    <PieChart 
                      data={analytics.supplier_performance}
                      title="供應商庫存價值分布"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">交貨表現分析</h3>
                    <BarChart 
                      data={analytics.supplier_performance}
                      title="供應商準時交貨率"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">供應商表現評估</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analytics.supplier_performance.map((supplier, index) => (
                      <div key={index} className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">{supplier.supplier}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">總價值</span>
                            <span className="text-sm font-medium">
                              NT$ {supplier.total_value.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">項目數</span>
                            <span className="text-sm font-medium">{supplier.items_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">平均交期</span>
                            <span className="text-sm font-medium">{supplier.avg_lead_time} 天</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">品質評分</span>
                            <span className="text-sm font-medium">{supplier.quality_score}/5.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">準時率</span>
                            <span className="text-sm font-medium">{supplier.on_time_delivery}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 預測分析 */}
            {selectedTab === 'forecasts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">需求預測</h3>
                    <div className="space-y-4">
                      {analytics.demand_forecast.map((forecast, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900">{forecast.material}</h4>
                            <span className="text-sm text-gray-600">
                              信心度: {Math.round(forecast.confidence * 100)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">7 天需求: </span>
                              <span className="font-medium">{forecast.next_7_days}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">30 天需求: </span>
                              <span className="font-medium">{forecast.next_30_days}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">補貨預測</h3>
                    <div className="space-y-4">
                      {analytics.reorder_predictions.map((prediction, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900">{prediction.material}</h4>
                            <span className="text-sm text-gray-600">
                              信心度: {Math.round(prediction.confidence * 100)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">預計補貨日: </span>
                              <span className="font-medium">{prediction.predicted_reorder_date}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">建議數量: </span>
                              <span className="font-medium">{prediction.suggested_quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">預測準確性分析</h3>
                  <LineChart 
                    data={[]}
                    title="歷史預測 vs 實際消耗對比"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <InfoIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">預測說明</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• 需求預測基於歷史消耗數據、季節性因素和業務趨勢分析</p>
                        <p>• 補貨預測考慮交貨週期、安全庫存和最小訂購量</p>
                        <p>• 信心度反映預測的可靠性，建議優先處理高信心度項目</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </InventoryLayout>
  );
};

export default InventoryAnalyticsDashboard;
