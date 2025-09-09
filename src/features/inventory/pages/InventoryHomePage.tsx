// ================================
// 庫存管理系統 - 主導航頁面
// ================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  PackageIcon,
  HistoryIcon,
  ClipboardCheckIcon,
  DropletIcon,
  BarChart3Icon,
  TrendingUpIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  BoxIcon,
  RefreshCwIcon,
  DatabaseIcon,
  PlusIcon
} from 'lucide-react';

export const InventoryHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                返回首頁
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <PackageIcon className="h-8 w-8 mr-3 text-amber-600" />
                庫存管理系統
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 歡迎區域 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            歡迎使用庫存管理系統
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            完整的庫存管理解決方案，包含產品庫存、交易記錄、庫存盤點和原料管理功能
          </p>
        </div>

        {/* 功能卡片區域 */}
                {/* 功能卡片網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/inventory/products" className="group">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6 group-hover:bg-blue-200 transition-colors">
                <PackageIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">產品庫存</h3>
              <p className="text-gray-600 mb-4">查看和管理所有產品的庫存狀況</p>
              <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                <span className="text-sm font-medium">進入管理</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/inventory/transactions" className="group">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-6 group-hover:bg-green-200 transition-colors">
                <HistoryIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">庫存異動</h3>
              <p className="text-gray-600 mb-4">記錄和查詢所有庫存進出異動</p>
              <div className="flex items-center text-green-600 group-hover:text-green-700">
                <span className="text-sm font-medium">查看記錄</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/inventory/count" className="group">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-6 group-hover:bg-purple-200 transition-colors">
                <ClipboardListIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">庫存盤點</h3>
              <p className="text-gray-600 mb-4">進行庫存實地盤點和差異調整</p>
              <div className="flex items-center text-purple-600 group-hover:text-purple-700">
                <span className="text-sm font-medium">開始盤點</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/inventory/materials" className="group">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-lg mb-6 group-hover:bg-orange-200 transition-colors">
                <BoxIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">原物料</h3>
              <p className="text-gray-600 mb-4">管理烹飪所需的各種原材料</p>
              <div className="flex items-center text-orange-600 group-hover:text-orange-700">
                <span className="text-sm font-medium">管理原料</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/inventory/restock" className="group">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-lg mb-6 group-hover:bg-red-200 transition-colors">
                <RefreshCwIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">自動補貨</h3>
              <p className="text-gray-600 mb-4">智能分析庫存需求，自動生成補貨建議</p>
              <div className="flex items-center text-red-600 group-hover:text-red-700">
                <span className="text-sm font-medium">管理補貨</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/inventory/analytics" className="group">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-lg mb-6 group-hover:bg-indigo-200 transition-colors">
                <BarChart3Icon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">分析儀表板</h3>
              <p className="text-gray-600 mb-4">深度分析庫存數據，洞察業務趨勢</p>
              <div className="flex items-center text-indigo-600 group-hover:text-indigo-700">
                <span className="text-sm font-medium">查看分析</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/inventory/import-export" className="group">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-teal-100 rounded-lg mb-6 group-hover:bg-teal-200 transition-colors">
                <DatabaseIcon className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">導入導出</h3>
              <p className="text-gray-600 mb-4">批量導入庫存數據，導出分析報告</p>
              <div className="flex items-center text-teal-600 group-hover:text-teal-700">
                <span className="text-sm font-medium">數據管理</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-8 rounded-lg shadow-sm border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-lg mb-6">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-500 mb-3">更多功能</h3>
            <p className="text-gray-400 mb-4">敬請期待更多庫存管理功能</p>
            <div className="flex items-center text-gray-400">
              <span className="text-sm font-medium">即將推出</span>
            </div>
          </div>
        </div>

        {/* 快速統計 */}
        <div className="bg-white rounded-xl shadow-lg border p-8 mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3Icon className="h-6 w-6 mr-2 text-gray-600" />
            庫存概覽
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">156</div>
              <div className="text-sm text-gray-600">總產品數量</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">89%</div>
              <div className="text-sm text-gray-600">庫存充足率</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">12</div>
              <div className="text-sm text-gray-600">庫存不足商品</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">3</div>
              <div className="text-sm text-gray-600">缺貨商品</div>
            </div>
          </div>
        </div>

        {/* 最近活動 */}
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUpIcon className="h-6 w-6 mr-2 text-gray-600" />
            最近活動
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">產品庫存調整</div>
                  <div className="text-sm text-gray-600">雞胸肉 +5.0 公斤</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">2 分鐘前</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">庫存盤點完成</div>
                  <div className="text-sm text-gray-600">飲料類產品週期盤點</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">1 小時前</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-gray-900">庫存警報</div>
                  <div className="text-sm text-gray-600">高筋麵粉庫存不足</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">3 小時前</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryHomePage;
