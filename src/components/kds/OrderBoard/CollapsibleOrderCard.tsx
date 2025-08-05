import React, { useState } from 'react';
import { 
  KDSOrder, 
  OrderStatus, 
  MenuItemStatus,
  URGENCY_COLORS
} from '../../../lib/kds-types';
import { OrderSummary } from '../../../components/kds/OrderCard/OrderSummary';
import { ExpandedOrderView } from '../../../components/kds/OrderCard/ExpandedOrderView';
import { QuickActions } from '../../../components/kds/OrderCard/QuickActions';

interface CollapsibleOrderCardProps {
  order: KDSOrder;
  isExpanded: boolean;
  onToggleExpand: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  columnType: 'pending' | 'preparing' | 'completed';
}

export const CollapsibleOrderCard: React.FC<CollapsibleOrderCardProps> = ({
  order,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  columnType
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  // 計算訂單進度
  const completedItems = (order.menuItems || []).filter(item => 
    item.status === MenuItemStatus.READY || 
    item.status === MenuItemStatus.SERVED
  ).length;

  const totalItems = (order.menuItems || []).length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // 計算預估剩餘時間
  const estimatedTimeRemaining = (order.menuItems || [])
    .filter(item => item.status !== MenuItemStatus.READY && item.status !== MenuItemStatus.SERVED)
    .reduce((total, item) => total + (item.estimated_prep_time || 0), 0);

  // 使用預計算的緊急程度
  const urgencyLevel = order.urgencyLevel || 'low';

  // 處理狀態變更
  const handleStatusChange = (newStatus: OrderStatus) => {
    onStatusChange(order.id, newStatus);
  };

  // 處理餐點狀態變更
  const handleItemStatusChange = (itemId: string, status: MenuItemStatus) => {
    // TODO: 實作餐點狀態變更
    console.log('Update item status:', itemId, status);
  };

  // 快速操作處理
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'start':
        handleStatusChange(OrderStatus.PREPARING);
        break;
      case 'complete':
        handleStatusChange(OrderStatus.READY);
        break;
      case 'pause':
        // TODO: 實作暫停邏輯
        break;
      case 'report_issue':
        // TODO: 實作問題回報
        break;
      case 'add_note':
        // TODO: 實作新增備註
        break;
    }
    setShowQuickActions(false);
  };

  return (
    <div className={`border rounded-lg bg-white shadow-sm border-l-4 ${URGENCY_COLORS[urgencyLevel]}`}>
      {/* 收縮狀態 */}
      {!isExpanded && (
        <div 
          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onToggleExpand(order.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowQuickActions(!showQuickActions);
          }}
        >
          <OrderSummary
            order={order}
            completedItems={completedItems}
            totalItems={totalItems}
            estimatedTimeRemaining={estimatedTimeRemaining}
            urgencyLevel={urgencyLevel}
            progressPercentage={progressPercentage}
          />
        </div>
      )}

      {/* 展開狀態 */}
      {isExpanded && (
        <div className="p-4">
          {/* 訂單標題 */}
          <div 
            className="flex items-center justify-between cursor-pointer mb-4"
            onClick={() => onToggleExpand(order.id)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">🏷️</span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  訂單 #{order.order_number}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>桌號: T{order.table_number?.toString().padStart(2, '0')}</span>
                  <span>⏰ {new Date(order.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>👥 {order.party_size || 0}人</span>
                </div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              ▲
            </button>
          </div>

          {/* 進度條 */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>製作進度 {completedItems}/{totalItems}</span>
              <span>預估剩餘 {estimatedTimeRemaining}分鐘</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  progressPercentage === 100 ? 'bg-green-500' :
                  progressPercentage > 50 ? 'bg-blue-500' : 'bg-orange-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* 展開的訂單詳情 */}
          <ExpandedOrderView
            order={order}
            onItemStatusChange={handleItemStatusChange}
          />

          {/* 備註 */}
          {order.notes && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600">📝</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800">備註</p>
                  <p className="text-sm text-yellow-700">{order.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {columnType === 'pending' && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.PREPARING)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  開始製作
                </button>
              )}
              
              {columnType === 'preparing' && (
                <>
                  <button
                    onClick={() => handleStatusChange(OrderStatus.READY)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    標記完成
                  </button>
                  <button
                    onClick={() => handleStatusChange(OrderStatus.PENDING)}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                  >
                    暫停
                  </button>
                </>
              )}
              
              {columnType === 'completed' && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.SERVED)}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                >
                  已送出
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuickAction('add_note')}
                className="px-3 py-1 text-gray-600 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                📝 備註
              </button>
              <button
                onClick={() => handleQuickAction('report_issue')}
                className="px-3 py-1 text-gray-600 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                ⚠️ 問題
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 快速操作選單 */}
      {showQuickActions && !isExpanded && (
        <QuickActions
          order={order}
          onAction={handleQuickAction}
          onClose={() => setShowQuickActions(false)}
        />
      )}
    </div>
  );
};
