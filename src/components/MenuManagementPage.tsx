import { useState } from 'react';
import ProductManagement from './menu/ProductManagement';
import CategoryManagement from './menu/CategoryManagement';
import { ComboManagement } from './menu/ComboManagement';

interface MenuManagementPageProps {
  onBack: () => void;
}

export default function MenuManagementPage({ onBack }: MenuManagementPageProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'combos' | 'categories' | 'analytics'>('products');

  const tabs = [
    { id: 'products', label: '📝 商品管理', component: ProductManagement },
    { id: 'combos', label: '🎁 套餐管理', component: ComboManagement },
    { id: 'categories', label: '📂 分類管理', component: CategoryManagement },
    { id: 'analytics', label: '📊 報表分析', component: () => <PlaceholderTab title="報表分析" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">📋 菜單管理</h1>
            </div>
            
            <button 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← 返回
            </button>
          </div>
        </div>
      </div>

      {/* Tab 導航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(() => {
          const currentTab = tabs.find(tab => tab.id === activeTab);
          if (currentTab) {
            const Component = currentTab.component;
            return <Component />;
          }
          return null;
        })()}
      </div>
    </div>
  );
}

// 佔位組件
function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">�</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">此功能將在後續階段開發</p>
    </div>
  );
}
