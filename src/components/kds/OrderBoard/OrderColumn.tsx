import React, { useState } from 'react';
import { KDSOrder, OrderStatus, KDSMenuItem } from '../../../lib/kds-types';
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
  const [showItemSummary, setShowItemSummary] = useState(false);

  // 計算餐點的統計摘要（待處理和製作中都需要）
  const calculateItemSummary = () => {
    if (columnType !== 'preparing' && columnType !== 'pending') return {};
    
    const itemSummary: { [key: string]: { total: number; combo: number; single: number } } = {};
    
    orders.forEach(order => {
      if (order.menuItems) {
        order.menuItems.forEach((item: KDSMenuItem) => {
          // 使用更精確的項目名稱統計
          let itemName = item.product_name;
          
          // 如果是套餐組件，使用組件名稱進行統計
          if (item.isComboComponent && item.combo_selections?.[0]?.products?.name) {
            itemName = item.combo_selections[0].products.name;
          }
          
          const quantity = item.quantity || 1;
          const isCombo = item.isComboComponent || (item.combo_id && !item.isComboComponent);
          
          if (!itemSummary[itemName]) {
            itemSummary[itemName] = { total: 0, combo: 0, single: 0 };
          }
          
          itemSummary[itemName].total += quantity;
          if (isCombo) {
            itemSummary[itemName].combo += quantity;
          } else {
            itemSummary[itemName].single += quantity;
          }
        });
      }
    });
    
    return itemSummary;
  };

  const itemSummary = calculateItemSummary();
  const hasItems = Object.keys(itemSummary).length > 0;
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
    <div className={`border rounded-lg ${getColumnColor()} min-h-0 flex flex-col h-full kds-column`}>
      {/* 欄位標題 */}
      <div className="p-3 md:p-4 border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0 kds-column-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base md:text-lg">{getColumnIcon()}</span>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm md:text-base">{title}</h2>
              <p className="text-xs md:text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* 餐點統計按鈕 - 待處理和製作中都顯示 */}
            {(columnType === 'preparing' || columnType === 'pending') && hasItems && (
              <button
                onClick={() => setShowItemSummary(!showItemSummary)}
                className={`p-1 md:p-2 hover:bg-opacity-80 rounded-md transition-colors text-sm md:text-base ${
                  columnType === 'preparing' 
                    ? 'text-blue-600 hover:bg-blue-100' 
                    : 'text-orange-600 hover:bg-orange-100'
                }`}
                title={columnType === 'preparing' ? "顯示製作統計" : "顯示備料統計"}
              >
                📊
              </button>
            )}
            <div className={`px-2 py-1 rounded-full text-xs md:text-sm font-medium ${
              columnType === 'pending' ? 'bg-orange-100 text-orange-600' :
              columnType === 'preparing' ? 'bg-blue-100 text-blue-600' :
              'bg-green-100 text-green-600'
            }`}>
              {orders.length}
            </div>
          </div>
        </div>
        
        {/* 餐點統計摘要 - 待處理和製作中都顯示 */}
        {(columnType === 'preparing' || columnType === 'pending') && showItemSummary && hasItems && (
          <div className={`mt-3 p-2 md:p-3 rounded-md border ${
            columnType === 'preparing' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <h3 className={`text-xs md:text-sm font-semibold mb-2 ${
              columnType === 'preparing' 
                ? 'text-blue-800' 
                : 'text-orange-800'
            }`}>
              📊 {columnType === 'preparing' ? '製作中餐點統計' : '待處理餐點統計（備料參考）'}
            </h3>
            <div className="grid grid-cols-1 gap-1 md:gap-2 text-xs md:text-sm">
              {Object.entries(itemSummary).map(([itemName, counts]) => (
                <div key={itemName} className="py-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 truncate mr-2">{itemName}</span>
                    <span className={`font-semibold flex-shrink-0 ${
                      columnType === 'preparing' 
                        ? 'text-blue-600' 
                        : 'text-orange-600'
                    }`}>
                      x{counts.total}
                    </span>
                  </div>
                  {/* 套餐/單點明細 */}
                  {(counts.combo > 0 && counts.single > 0) && (
                    <div className="ml-2 mt-1 text-xs text-gray-500 flex space-x-3">
                      {counts.combo > 0 && (
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                          套餐 x{counts.combo}
                        </span>
                      )}
                      {counts.single > 0 && (
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                          單點 x{counts.single}
                        </span>
                      )}
                    </div>
                  )}
                  {/* 只有套餐或只有單點時的簡化顯示 */}
                  {(counts.combo > 0 && counts.single === 0) && (
                    <div className="ml-2 mt-1 text-xs text-purple-600">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                        全部為套餐
                      </span>
                    </div>
                  )}
                  {(counts.single > 0 && counts.combo === 0) && (
                    <div className="ml-2 mt-1 text-xs text-gray-600">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                        全部為單點
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 訂單列表 */}
      <div className="p-2 md:p-4 space-y-2 md:space-y-3 overflow-y-auto flex-1 min-h-0 kds-column-content">
        {orders.length === 0 ? (
          <div className="text-center py-4 md:py-8 text-gray-500">
            <div className="text-2xl md:text-4xl mb-2">📝</div>
            <p className="text-sm md:text-base">暫無訂單</p>
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
