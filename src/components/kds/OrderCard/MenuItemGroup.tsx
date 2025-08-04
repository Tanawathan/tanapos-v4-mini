import React from 'react';
import { 
  KDSMenuItem, 
  MenuItemStatus, 
  MenuCategory 
} from '../../../lib/kds-types';
import { MenuItemRow } from '../../../components/kds/OrderCard/MenuItemRow';

interface MenuItemGroupProps {
  category: MenuCategory;
  categoryName: string;
  categoryIcon: string;
  items: KDSMenuItem[];
  totalItems: number;
  completedItems: number;
  isExpanded: boolean;
  onToggle: () => void;
  onItemStatusChange: (itemId: string, status: MenuItemStatus) => void;
}

export const MenuItemGroup: React.FC<MenuItemGroupProps> = ({
  categoryName,
  categoryIcon,
  items,
  totalItems,
  completedItems,
  isExpanded,
  onToggle,
  onItemStatusChange
}) => {
  const getStatusText = () => {
    if (completedItems === totalItems) {
      return '全部完成';
    } else if (completedItems > 0) {
      return '進行中';
    } else {
      return '待開始';
    }
  };

  const getStatusColor = () => {
    if (completedItems === totalItems) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (completedItems > 0) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  return (
    <div className={`border rounded-md ${getStatusColor()}`}>
      {/* 分類標題 */}
      <div 
        className="p-3 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{categoryIcon}</span>
            <div>
              <h4 className="font-medium text-gray-900">
                {categoryName} ({totalItems}項)
              </h4>
              <p className="text-sm text-gray-600">
                {completedItems}項完成 - {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 進度指示器 */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalItems }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index < completedItems ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <span className="text-gray-400 text-sm">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>
      </div>

      {/* 餐點列表 */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                onStatusChange={onItemStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
