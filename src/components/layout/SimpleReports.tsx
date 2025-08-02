import React from 'react'
import { useUIStyle } from '../../contexts/UIStyleContext'

const SimpleReports: React.FC = () => {
  const { currentStyle, styleConfig } = useUIStyle()
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">營業報表</h1>

      {/* 日期範圍選擇器 */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 mb-4">
        <button className="px-4 py-2 rounded-md bg-blue-500 text-white">今日</button>
        <button className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-50">本週</button>
        <button className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-50">本月</button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">總訂單數</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">15</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">總營收</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">$1,350.00</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">平均訂單金額</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">$90.00</p>
        </div>
      </div>

      {/* 熱銷商品表格 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">熱銷商品</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名稱
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  銷售數量
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  營收
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">經典漢堡</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">15</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$450.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">薯條</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">12</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$180.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">可樂</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">20</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">$100.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SimpleReports
