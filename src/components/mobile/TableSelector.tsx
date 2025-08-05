import React, { useState } from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'

const TableSelector: React.FC = () => {
  const { tables, orderContext, setTableNumber, checkTableStatus } = useMobileOrderStore()
  const [showTableStatus, setShowTableStatus] = useState(false)
  const [tableStatusInfo, setTableStatusInfo] = useState<any>(null)

  // 只在內用模式下顯示
  if (orderContext.diningMode !== 'dine_in') {
    return null
  }

  const handleTableChange = async (tableNumber: string) => {
    setTableNumber(tableNumber)
    
    // 檢查桌況
    const status = await checkTableStatus(tableNumber)
    setTableStatusInfo(status)
    
    // 如果有現有訂單，顯示提醒
    if (status.existingOrders.length > 0) {
      setShowTableStatus(true)
    }
  }

  const closeTableStatus = () => {
    setShowTableStatus(false)
    setTableStatusInfo(null)
  }

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        🪑 桌號選擇
      </label>
      <select
        value={orderContext.tableNumber || ''}
        onChange={(e) => handleTableChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">請選擇桌號</option>
        {tables.map((table) => (
          <option key={table.id} value={table.table_number}>
            T{table.table_number.toString().padStart(2, '0')}
            {table.status === 'occupied' && ' (佔用中)'}
          </option>
        ))}
      </select>

      {/* 桌況提醒彈窗 */}
      {showTableStatus && tableStatusInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="text-2xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                桌號 {tableStatusInfo.tableNumber} 已有訂單
              </h3>
              <div className="text-gray-600 mb-4">
                <p>現有訂單：{tableStatusInfo.existingOrders.join(', ')}</p>
                <p className="text-sm mt-1">狀態：進行中</p>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                您要創建新訂單還是加點？
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    useMobileOrderStore.getState().setOrderMode('new')
                    closeTableStatus()
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📝 新訂單
                </button>
                <button
                  onClick={() => {
                    useMobileOrderStore.getState().setOrderMode('additional')
                    closeTableStatus()
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  ➕ 創建加點
                </button>
              </div>
              <button
                onClick={closeTableStatus}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TableSelector
