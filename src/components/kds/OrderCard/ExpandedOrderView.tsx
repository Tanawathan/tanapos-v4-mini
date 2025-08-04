import React, { useState } from 'react';
import { 
  KDSOrder, 
  MenuItemStatus, 
  MenuCategory,
  CATEGORY_ICONS,
  CATEGORY_NAMES 
} from '../../../lib/kds-types';
import { MenuItemGroup } from '../../../components/kds/OrderCard/MenuItemGroup';

interface ExpandedOrderViewProps {
  order: KDSOrder;
  onItemStatusChange: (itemId: string, status: MenuItemStatus) => void;
}

export const ExpandedOrderView: React.FC<ExpandedOrderViewProps> = ({
  order,
  onItemStatusChange
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<MenuCategory>>(
    new Set(Object.values(MenuCategory))
  );

  // 按分類分組餐點
  const groupedItems = order.menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<MenuCategory, typeof order.menuItems>);

  // 切換分類展開狀態
  const toggleCategory = (category: MenuCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-3">
      {Object.entries(groupedItems).map(([category, items]) => {
        const categoryEnum = category as MenuCategory;
        const isExpanded = expandedCategories.has(categoryEnum);
        const completedCount = items.filter(item => 
          item.status === MenuItemStatus.READY || item.status === MenuItemStatus.SERVED
        ).length;
        
        return (
          <MenuItemGroup
            key={category}
            category={categoryEnum}
            categoryName={CATEGORY_NAMES[categoryEnum]}
            categoryIcon={CATEGORY_ICONS[categoryEnum]}
            items={items}
            totalItems={items.length}
            completedItems={completedCount}
            isExpanded={isExpanded}
            onToggle={() => toggleCategory(categoryEnum)}
            onItemStatusChange={onItemStatusChange}
          />
        );
      })}
    </div>
  );
};
