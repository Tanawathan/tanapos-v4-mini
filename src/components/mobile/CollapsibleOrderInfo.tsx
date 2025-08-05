import { useMobileOrderStore } from '../../stores/mobileOrderStore'
import DiningModeSelector from './DiningModeSelector'
import OrderModeSelector from './OrderModeSelector'
import TableSelector from './TableSelector'
import TakeawayInfoInput from './TakeawayInfoInput'

const CollapsibleOrderInfo = () => {
  const { 
    orderContext, 
    isOrderInfoCollapsed, 
    toggleOrderInfoCollapse 
  } = useMobileOrderStore()

  // 計算完成狀態
  const getCompletionStatus = () => {
    if (orderContext.diningMode === 'dine_in') {
      const hasTable = !!orderContext.tableNumber
      return {
        isComplete: hasTable,
        summary: hasTable 
          ? `內用 - 桌號 ${orderContext.tableNumber}${orderContext.partySize ? ` (${orderContext.partySize}人)` : ''}`
          : '內用 - 請選擇桌號'
      }
    } else {
      const hasCustomerInfo = !!(orderContext.takeawayInfo?.customerName && orderContext.takeawayInfo?.customerPhone)
      return {
        isComplete: hasCustomerInfo,
        summary: hasCustomerInfo
          ? `外帶 - ${orderContext.takeawayInfo?.customerName} (${orderContext.takeawayInfo?.pickupNumber})`
          : '外帶 - 請填寫客戶資訊'
      }
    }
  }

  const { isComplete, summary } = getCompletionStatus()

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-4">
      {/* 摺疊標題欄 */}
      <div 
        onClick={toggleOrderInfoCollapse}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <div>
            <h3 className="font-semibold text-gray-900">訂單資訊</h3>
            <p className="text-sm text-gray-600">{summary}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isComplete && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              已完成
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOrderInfoCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 可摺疊內容 */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isOrderInfoCollapsed ? 'max-h-0' : 'max-h-96'
      }`}>
        <div className="p-4 pt-0 border-t border-gray-100">
          <div className="space-y-4">
            {/* 用餐模式選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用餐方式
              </label>
              <DiningModeSelector />
            </div>

            {/* 內用模式的額外選項 */}
            {orderContext.diningMode === 'dine_in' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    訂餐模式
                  </label>
                  <OrderModeSelector />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      請選擇桌號
                    </label>
                    <TableSelector />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👥 人數
                    </label>
                    <select 
                      value={orderContext.partySize || 2}
                      onChange={(e) => {
                        const setPartySize = useMobileOrderStore.getState().setPartySize
                        setPartySize(Number(e.target.value))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(size => (
                        <option key={size} value={size}>{size}人</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* 外帶模式的客戶資訊 */}
            {orderContext.diningMode === 'takeaway' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  客戶資訊
                </label>
                <TakeawayInfoInput />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollapsibleOrderInfo
