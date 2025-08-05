import React, { useState, useEffect } from 'react';
import { OrderStatus, SortOption, SortDirection } from '../lib/kds-types';
import { StatsPanel } from './kds/Header/StatsPanel';
import { SortControl } from './kds/Header/SortControl';
import { NotificationPanel } from './kds/Header/NotificationPanel';
import { OrderColumn } from './kds/OrderBoard/OrderColumn';
import { SettingsModal } from './kds/Modals/SettingsModal';
import { useKDSStore } from '../lib/kds-store';

export const KDSPage: React.FC = () => {
  const {
    orders,
    stats,
    settings,
    isLoading,
    fetchOrders,
    updateOrderStatus,
    updateSettings
  } = useKDSStore();

  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // 初始化數據
  useEffect(() => {
    fetchOrders();
    
    // 設置自動刷新
    const interval = setInterval(() => {
      fetchOrders();
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [fetchOrders, settings.autoRefreshInterval]);

  // 分組訂單按狀態
  const groupedOrders = {
    pending: orders.filter((order) => 
      order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED
    ),
    preparing: orders.filter((order) => order.status === OrderStatus.PREPARING),
    completed: orders.filter((order) => 
      order.status === OrderStatus.READY || 
      order.status === OrderStatus.SERVED || 
      order.status === OrderStatus.COMPLETED
    )
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
  };

  // 批量展開/收縮
  const handleExpandAll = () => {
    setExpandedOrders(new Set(orders.map((order) => order.id)));
  };

  const handleCollapseAll = () => {
    setExpandedOrders(new Set());
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
    window.history.back();
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-ui-secondary">
      {/* 標題欄 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center px-3 py-2 text-sm font-medium text-ui-secondary hover:text-ui-primary hover:bg-ui-secondary rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回首頁
              </button>
              <h1 className="text-2xl font-bold text-ui-primary">
                🍳 KDS 廚房顯示系統
              </h1>
              <div className="text-sm text-ui-muted">
                {new Date().toLocaleString('zh-TW')}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <StatsPanel stats={stats} />
              
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
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="設定"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容區域 */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
          <span>📈 即時統計:</span>
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
      </footer>

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
