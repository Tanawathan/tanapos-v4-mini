// ================================
// 庫存管理系統 - 儀表板頁面
// ================================

import React, { useState, useEffect } from 'react';
import {
  PackageIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  BarChart3Icon,
  CalendarIcon,
  RefreshCwIcon,
} from 'lucide-react';

import { 
  InventoryLayout, 
  PageHeader, 
  StatCard,
  LoadingSpinner,
  ErrorState 
} from '../components/Layout';

import {
  SimpleBarChart,
  SimplePieChart,
  SimpleLineChart,
  MetricCard,
  ChartDataPoint,
  TimeSeriesDataPoint,
} from '../components/Charts';

import { useInventoryStore } from '../stores';
import type { StockAlert } from '../types';

// ================================
// 儀表板數據類型
// ================================

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalValue: number;
  monthlyTurnover: number;
  trends: {
    products: number;
    lowStock: number;
    value: number;
    turnover: number;
  };
}

interface CategoryStock {
  category: string;
  currentStock: number;
  value: number;
  percentage: number;
}

interface StockMovement {
  date: string;
  inbound: number;
  outbound: number;
  net: number;
}

// ================================
// 主要儀表板組件
// ================================

export const InventoryDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 儀表板數據狀態
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryStock[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<StockAlert[]>([]);
  const [topProducts, setTopProducts] = useState<ChartDataPoint[]>([]);

  // Zustand Store
  const inventoryStore = useInventoryStore();

  // ================================
  // 數據載入
  // ================================

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // 模擬 API 調用 - 在實際應用中這裡會調用真實的 API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模擬儀表板統計數據
      const mockStats: DashboardStats = {
        totalProducts: 1247,
        lowStockCount: 23,
        totalValue: 2847392,
        monthlyTurnover: 8.5,
        trends: {
          products: 5.2,
          lowStock: -12.3,
          value: 8.7,
          turnover: 2.1,
        },
      };

      // 模擬分類庫存數據
      const mockCategoryData: CategoryStock[] = [
        { category: '飲品', currentStock: 450, value: 125000, percentage: 35 },
        { category: '主食', currentStock: 320, value: 180000, percentage: 25 },
        { category: '小食', currentStock: 280, value: 95000, percentage: 20 },
        { category: '調料', currentStock: 197, value: 47000, percentage: 20 },
      ];

      // 模擬庫存變動數據
      const mockStockMovements: StockMovement[] = [
        { date: '2024-01-01', inbound: 120, outbound: 95, net: 25 },
        { date: '2024-01-02', inbound: 85, outbound: 110, net: -25 },
        { date: '2024-01-03', inbound: 150, outbound: 85, net: 65 },
        { date: '2024-01-04', inbound: 95, outbound: 120, net: -25 },
        { date: '2024-01-05', inbound: 110, outbound: 95, net: 15 },
        { date: '2024-01-06', inbound: 130, outbound: 105, net: 25 },
        { date: '2024-01-07', inbound: 100, outbound: 115, net: -15 },
      ];

      // 模擬熱門產品數據
      const mockTopProducts: ChartDataPoint[] = [
        { label: '可樂', value: 245, trend: 12.5 },
        { label: '漢堡', value: 198, trend: -3.2 },
        { label: '薯條', value: 167, trend: 8.7 },
        { label: '咖啡', value: 134, trend: 15.3 },
        { label: '沙拉', value: 89, trend: -1.8 },
      ];

      // 載入告警數據 - 模擬數據
      const mockAlerts: StockAlert[] = [
        {
          id: '1',
          restaurant_id: '1',
          product_id: 'p1',
          alert_type: 'low_stock',
          alert_level: 'critical',
          title: '庫存不足告警',
          message: '可樂庫存不足',
          current_stock: 5,
          threshold_value: 10,
          status: 'active',
          auto_resolve: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          restaurant_id: '1', 
          product_id: 'p2',
          alert_type: 'low_stock',
          alert_level: 'warning',
          title: '庫存不足告警',
          message: '漢堡庫存不足',
          current_stock: 8,
          threshold_value: 20,
          status: 'active',
          auto_resolve: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // 更新狀態
      setDashboardStats(mockStats);
      setCategoryData(mockCategoryData);
      setStockMovements(mockStockMovements);
      setRecentAlerts(mockAlerts.slice(0, 5)); // 只顯示最近5個告警
      setTopProducts(mockTopProducts);

    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 刷新數據
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  // 初始載入
  useEffect(() => {
    loadDashboardData();
  }, []);

  // ================================
  // 渲染函數
  // ================================

  const renderMetrics = () => {
    if (!dashboardStats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="總產品數量"
          value={dashboardStats.totalProducts}
          trend={{
            value: dashboardStats.trends.products,
            isPositive: dashboardStats.trends.products > 0,
          }}
          icon={<PackageIcon className="h-6 w-6" />}
          color="blue"
        />
        
        <MetricCard
          title="低庫存告警"
          value={dashboardStats.lowStockCount}
          subtitle="需要補貨"
          trend={{
            value: dashboardStats.trends.lowStock,
            isPositive: dashboardStats.trends.lowStock < 0, // 告警減少是好事
          }}
          icon={<AlertTriangleIcon className="h-6 w-6" />}
          color="red"
        />
        
        <MetricCard
          title="庫存總值"
          value={`NT$ ${dashboardStats.totalValue.toLocaleString()}`}
          trend={{
            value: dashboardStats.trends.value,
            isPositive: dashboardStats.trends.value > 0,
          }}
          icon={<DollarSignIcon className="h-6 w-6" />}
          color="green"
        />
        
        <MetricCard
          title="月周轉率"
          value={`${dashboardStats.monthlyTurnover}%`}
          subtitle="庫存效率"
          trend={{
            value: dashboardStats.trends.turnover,
            isPositive: dashboardStats.trends.turnover > 0,
          }}
          icon={<TrendingUpIcon className="h-6 w-6" />}
          color="purple"
        />
      </div>
    );
  };

  const renderCharts = () => {
    const categoryChartData: ChartDataPoint[] = categoryData.map(item => ({
      label: item.category,
      value: item.currentStock,
      color: undefined, // 使用默認顏色
    }));

    const movementChartData: TimeSeriesDataPoint[] = stockMovements.map(item => ({
      date: item.date,
      value: item.inbound,
      secondary: item.outbound,
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SimplePieChart
          title="分類庫存分布"
          data={categoryChartData}
          size={180}
        />
        
        <SimpleLineChart
          title="7日庫存變動趨勢"
          data={movementChartData}
          height={250}
          lineColor="stroke-blue-500"
          secondaryLineColor="stroke-red-500"
        />
      </div>
    );
  };

  const renderTopProducts = () => {
    return (
      <div className="mb-8">
        <SimpleBarChart
          title="熱門產品出貨量"
          data={topProducts}
          height={300}
          showValues={true}
        />
      </div>
    );
  };

  const renderRecentAlerts = () => {
    if (recentAlerts.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近告警</h3>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>目前沒有告警</p>
          </div>
        </div>
      );
    }

    const priorityColors = {
      critical: 'border-red-200 bg-red-50',
      warning: 'border-yellow-200 bg-yellow-50',
      info: 'border-blue-200 bg-blue-50',
    };

    const priorityTextColors = {
      critical: 'text-red-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800',
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">最近告警</h3>
          <button
            onClick={() => {/* 導航到告警頁面 */}}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            查看全部
          </button>
        </div>
        
        <div className="space-y-3">
          {recentAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${priorityColors[alert.alert_level]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`font-medium ${priorityTextColors[alert.alert_level]}`}>
                    {alert.message}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    產品ID: {alert.product_id} | 當前庫存: {alert.current_stock}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.created_at).toLocaleDateString('zh-TW')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ================================
  // 主渲染
  // ================================

  if (loading) {
    return (
      <InventoryLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入儀表板數據...</p>
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
          onRetry={loadDashboardData}
        />
      </InventoryLayout>
    );
  }

  return (
    <InventoryLayout>
      <PageHeader
        title="庫存儀表板"
        description="查看庫存概況和關鍵指標"
      >
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新數據
          </button>
          
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            查看報表
          </button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* 關鍵指標 */}
        {renderMetrics()}

        {/* 圖表區域 */}
        {renderCharts()}

        {/* 熱門產品 */}
        {renderTopProducts()}

        {/* 最近告警 */}
        {renderRecentAlerts()}
      </div>
    </InventoryLayout>
  );
};

export default InventoryDashboard;
