import React from 'react';
import { KDSOrder, OrderStatus } from '../../../lib/kds-types';
import { CollapsibleOrderCard } from '../../../components/kds/OrderBoard/CollapsibleOrderCard';

interface OrderColumnProps {
  title: string;
  subtitle: string;
  orders: KDSOrder[];
  expandedOrders: Set<string>;
  onToggleExpand: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  columnType: 'pending' | 'preparing' | 'completed';
}

export const OrderColumn: React.FC<OrderColumnProps> = ({
  title,
  subtitle,
  orders,
  expandedOrders,
  onToggleExpand,
  onStatusChange,
  columnType
}) => {
  const getColumnIcon = () => {
    switch (columnType) {
      case 'pending': return '📦';
      case 'preparing': return '🔄';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getColumnColor = () => {
    switch (columnType) {
      case 'pending': return 'border-orange-200 bg-orange-50';
      case 'preparing': return 'border-blue-200 bg-blue-50';
      case 'completed': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg ${getColumnColor()}`}>
      {/* 欄位標題 */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getColumnIcon()}</span>
            <div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-sm font-medium ${
            columnType === 'pending' ? 'bg-orange-100 text-orange-600' :
            columnType === 'preparing' ? 'bg-blue-100 text-blue-600' :
            'bg-green-100 text-green-600'
          }`}>
            {orders.length}
          </div>
        </div>
      </div>

      {/* 訂單列表 */}
      <div className="p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>暫無訂單</p>
          </div>
        ) : (
          orders.map((order) => (
            <CollapsibleOrderCard
              key={order.id}
              order={order}
              isExpanded={expandedOrders.has(order.id)}
              onToggleExpand={onToggleExpand}
              onStatusChange={onStatusChange}
              columnType={columnType}
            />
          ))
        )}
      </div>
    </div>
  );
};
