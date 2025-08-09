import React, { useState, useEffect } from 'react';
import { OrderStatus, SortOption, SortDirection, KDSOrder, MenuItemStatus } from '../lib/kds-types';
import { StatsPanel } from './kds/Header/StatsPanel';
import { SortControl } from './kds/Header/SortControl';
import { NotificationPanel } from './kds/Header/NotificationPanel';
import { OrderColumn } from './kds/OrderBoard/OrderColumn';
import { SettingsModal } from './kds/Modals/SettingsModal';
import { useKDSStore } from '../lib/kds-store';

interface KDSPageProps {
  onNavigateToHome?: () => void;
}

export const KDSPage: React.FC<KDSPageProps> = ({ onNavigateToHome }) => {
  const {
    orders,
    stats,
    settings,
    isLoading,
    isInitialLoad,  // 新增：獲取初次載入狀態
    fetchOrders,
    updateOrderStatus,
    updateSettings
  } = useKDSStore();

  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(()=>{
    try {
      const raw = localStorage.getItem('kds-expanded-orders');
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  // 初始化數據
  useEffect(() => {
    // 初次載入（非靜默模式）
    fetchOrders();
    
    // 設置自動刷新（靜默模式）
    const interval = setInterval(() => {
      fetchOrders(true);  // 靜默更新，不顯示載入動畫
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [fetchOrders, settings.autoRefreshInterval]);

  // 計算訂單完成進度 (0-1)
  const calculateOrderProgress = (order: KDSOrder): number => {
    if (!order.menuItems || order.menuItems.length === 0) return 0;
    
    const completedItems = order.menuItems.filter((item) => 
      item.status === MenuItemStatus.READY || item.status === MenuItemStatus.SERVED
    ).length;
    
    return completedItems / order.menuItems.length;
  };

  // 顯示模式變更時自動展開/收合
  useEffect(() => {
    // 僅在第一次載入後若為 detailed 模式且尚無任何展開紀錄時自動展開全部
    if (settings.displayMode === 'detailed') {
      if (expandedOrders.size === 0) {
        const allIds = new Set(orders.map(o => o.id));
        setExpandedOrders(allIds);
        try { localStorage.setItem('kds-expanded-orders', JSON.stringify(Array.from(allIds))); } catch {}
      } else {
        // detailed 模式但已有展開紀錄 -> 只補上新訂單，保持既有展開狀態
        let changed = false;
        const next = new Set(expandedOrders);
        orders.forEach(o => { if (!next.has(o.id)) { next.add(o.id); changed = true; } });
        if (changed) {
          setExpandedOrders(next);
          try { localStorage.setItem('kds-expanded-orders', JSON.stringify(Array.from(next))); } catch {}
        }
      }
    } else {
      // compact 模式不自動清空，保持使用者手動展開狀態
    }
  }, [settings.displayMode, orders]);

  // 排序訂單 - 距離完成越近越優先，相同進度時訂單時間較早的優先
  const sortOrders = (orders: KDSOrder[]): KDSOrder[] => {
    return [...orders].sort((a, b) => {
      // 計算完成進度
      const progressA = calculateOrderProgress(a);
      const progressB = calculateOrderProgress(b);
      
      // 根據排序選項處理
      if (sortBy === 'priority') {
        // 優先級排序：距離完成越近越優先
        if (progressA !== progressB) {
          const result = sortDirection === 'asc' ? progressB - progressA : progressA - progressB;
          console.log(`🎯 優先級排序: 訂單${a.id.slice(-4)} (進度${(progressA*100).toFixed(0)}%) vs 訂單${b.id.slice(-4)} (進度${(progressB*100).toFixed(0)}%) = ${result}`);
          return result;
        }
        // 相同進度時，按訂單時間排序（較早的優先）
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        const result = sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        console.log(`⏰ 時間排序: 訂單${a.id.slice(-4)} vs 訂單${b.id.slice(-4)} = ${result}`);
        return result;
      } else if (sortBy === 'time') {
        // 時間排序
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      } else if (sortBy === 'table') {
        // 桌號排序
        const tableA = a.table_number || 0;
        const tableB = b.table_number || 0;
        if (tableA !== tableB) {
          return sortDirection === 'asc' ? tableA - tableB : tableB - tableA;
        }
        // 相同桌號時按時間排序
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeA - timeB;
      } else if (sortBy === 'status') {
        // 狀態排序 - 按餐點進度
        if (progressA !== progressB) {
          return sortDirection === 'asc' ? progressA - progressB : progressB - progressA;
        }
        // 相同進度時按時間排序
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeA - timeB;
      }
      
      return 0;
    });
  };

  // 分組訂單按狀態（應用排序）
  const groupedOrders = {
    pending: sortOrders(orders.filter((order) => 
      order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED
    )),
    preparing: sortOrders(orders.filter((order) => order.status === OrderStatus.PREPARING)),
    completed: sortOrders(orders.filter((order) => 
      order.status === OrderStatus.READY || 
      order.status === OrderStatus.SERVED || 
      order.status === OrderStatus.COMPLETED
    ))
  };

  // 處理訂單展開/收縮
  const handleToggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
  setExpandedOrders(newExpanded);
  try { localStorage.setItem('kds-expanded-orders', JSON.stringify(Array.from(newExpanded))); } catch {}
  };

  // 批量展開/收縮
  const handleExpandAll = () => {
  const all = new Set(orders.map((order) => order.id));
  setExpandedOrders(all);
  try { localStorage.setItem('kds-expanded-orders', JSON.stringify(Array.from(all))); } catch {}
  };

  const handleCollapseAll = () => {
  const empty = new Set();
  setExpandedOrders(empty);
  try { localStorage.setItem('kds-expanded-orders', JSON.stringify([])); } catch {}
  };

  // 處理訂單狀態變更
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  // 排序功能
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  // 返回首頁功能
  const handleBackToHome = () => {
    if (onNavigateToHome) {
      onNavigateToHome();
    } else {
      // 如果沒有提供導航函數，嘗試回到首頁路徑
      window.location.href = '/';
    }
  };

  if (isLoading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-ui-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-ui-muted">載入 KDS 系統中...</p>
        </div>
      </div>
    );
  }

  return (
  <div className={`min-h-screen bg-ui-secondary flex flex-col kds-container ${settings.mobileLandscapeMode ? 'kds-mobile-landscape' : ''}`}>
      {/* 靜默更新指示器 */}
      {isLoading && !isInitialLoad && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
          更新中...
        </div>
      )}
      
      {/* 標題欄 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui flex-shrink-0 kds-header">
        <div className="px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
              <button
                onClick={handleBackToHome}
                className="flex items-center px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium text-ui-secondary hover:text-ui-primary hover:bg-ui-secondary rounded-md transition-colors whitespace-nowrap"
              >
                <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">返回首頁</span>
                <span className="sm:hidden">返回</span>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-ui-primary truncate">
                🍳 KDS 廚房顯示系統
              </h1>
              <div className="text-xs md:text-sm text-ui-muted hidden sm:block">
                {new Date().toLocaleString('zh-TW')}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              {!settings.hideStats && (
                <div className="hidden md:block">
                  <StatsPanel stats={stats} />
                </div>
              )}
              
              <SortControl
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
              />
              
              <NotificationPanel />
              
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 md:p-2 text-gray-400 hover:text-gray-600 transition-colors text-lg md:text-xl"
                title="設定"
              >
                ⚙️
              </button>
            </div>
          </div>
          
          {/* 在小螢幕上顯示統計資訊 */}
          {!settings.hideStats && (
            <div className="md:hidden mt-2 pt-2 border-t border-ui">
              <StatsPanel stats={stats} />
            </div>
          )}
        </div>
      </header>

      {/* 主要內容區域 */}
  <main className={`p-3 md:p-4 lg:p-6 flex-1 min-h-0 overflow-hidden kds-main ${settings.mobileLandscapeMode && !settings.hideStats ? 'pb-20' : ''}`}>
        {/* 針對平板橫向優化的響應式網格佈局 */}
  <div className={`grid ${settings.displayMode === 'compact' ? 'gap-2 md:gap-3 lg:gap-4' : 'gap-3 md:gap-4 lg:gap-6'} h-full kds-grid ${settings.mobileLandscapeMode ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'}`}>
          {/* 待處理訂單 */}
          <OrderColumn
            title="待處理"
            subtitle="Queue"
            orders={groupedOrders.pending}
            expandedOrders={expandedOrders}
            onToggleExpand={handleToggleExpand}
            onStatusChange={handleStatusChange}
            columnType="pending"
          />

          {/* 製作中訂單 */}
          <OrderColumn
            title="製作中"
            subtitle="In Progress"
            orders={groupedOrders.preparing}
            expandedOrders={expandedOrders}
            onToggleExpand={handleToggleExpand}
            onStatusChange={handleStatusChange}
            columnType="preparing"
          />

          {/* 已完成訂單 */}
          <OrderColumn
            title="已完成"
            subtitle="Completed"
            orders={groupedOrders.completed}
            expandedOrders={expandedOrders}
            onToggleExpand={handleToggleExpand}
            onStatusChange={handleStatusChange}
            columnType="completed"
          />
        </div>
      </main>

      {/* 底部統計欄 */}
      {!settings.hideStats && (
        <footer className={`bg-white border-t border-gray-200 px-3 md:px-6 py-2 md:py-4 flex-shrink-0 kds-footer ${settings.mobileLandscapeMode ? 'fixed bottom-0 left-0 right-0 z-40' : ''}`}>
          <div className="flex items-center justify-center flex-wrap gap-3 md:gap-8 text-xs md:text-sm text-gray-600 kds-footer-stats">
            <span className="hidden md:inline">📈 即時統計:</span>
            <span>待處理 <strong className="text-orange-600">{stats.pendingOrders}</strong></span>
            <span>製作中 <strong className="text-blue-600">{stats.inProgressOrders}</strong></span>
            <span>完成 <strong className="text-green-600">{stats.completedOrders}</strong></span>
            <span>平均 <strong>{stats.averagePrepTime}分鐘</strong></span>
            {stats.overdueOrders > 0 && (
              <span className="text-red-600">
                超時 <strong>{stats.overdueOrders}</strong>
              </span>
            )}
          </div>
          {settings.displayMode === 'compact' && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs">
              <button
                onClick={handleExpandAll}
                className="px-2 py-1 border rounded text-gray-700 hover:bg-gray-50"
              >
                展開全部
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-2 py-1 border rounded text-gray-700 hover:bg-gray-50"
              >
                收合全部
              </button>
              <button
                onClick={() => handleSort(sortBy === 'priority' ? 'time' : 'priority')}
                className="px-2 py-1 border rounded text-gray-700 hover:bg-gray-50"
                title="切換排序（時間/優先級）"
              >
                排序：{sortBy === 'priority' ? '優先級' : '時間'}
              </button>
            </div>
          )}
        </footer>
      )}

      {/* 設定視窗 */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={updateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
