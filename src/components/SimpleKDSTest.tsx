import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const SimpleKDSTest: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        
        addLog('🔍 開始獲取 KDS 訂單...');
        
        const restaurantId = '11111111-1111-1111-1111-111111111111';
        addLog(`📍 使用餐廳ID: ${restaurantId}`);
        
        // 測試基本查詢
        addLog('📋 查詢所有訂單...');
        const { data: allOrders, error: allError } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (allError) {
          addLog(`❌ 查詢失敗: ${allError.message}`);
          setError(allError.message);
          return;
        }
        
        addLog(`✅ 找到 ${allOrders.length} 筆訂單`);
        
        // 查詢有效訂單
        addLog('🔥 查詢有效狀態訂單...');
        const { data: activeOrders, error: activeError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (
                name,
                category_id,
                categories (
                  name
                )
              )
            )
          `)
          .eq('restaurant_id', restaurantId)
          .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
          .order('created_at', { ascending: false });
        
        if (activeError) {
          addLog(`❌ 有效訂單查詢失敗: ${activeError.message}`);
          setError(activeError.message);
          return;
        }
        
        addLog(`🎯 找到 ${activeOrders.length} 筆有效訂單`);
        
        if (activeOrders.length > 0) {
          activeOrders.forEach((order: any) => {
            addLog(`   - ${order.order_number} (${order.status}) 桌號:${order.table_number}`);
          });
        }
        
        setOrders(activeOrders);
        
      } catch (err: any) {
        addLog(`❌ 錯誤: ${err.message}`);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧪 KDS 訂單測試</h1>
      
      {/* 狀態顯示 */}
      <div className="mb-4 p-4 border rounded">
        {loading && <div className="text-blue-600">🔄 載入中...</div>}
        {error && <div className="text-red-600">❌ 錯誤: {error}</div>}
        {!loading && !error && (
          <div className="text-green-600">✅ 成功載入 {orders.length} 筆訂單</div>
        )}
      </div>
      
      {/* 調試日誌 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">📝 調試日誌</h2>
        <div className="bg-gray-100 p-4 rounded h-40 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
      
      {/* 訂單列表 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">📋 訂單列表</h2>
        {orders.length === 0 ? (
          <div className="text-gray-500">暫無有效訂單</div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border p-4 rounded">
                <h3 className="font-bold">訂單 {order.order_number}</h3>
                <p>桌號: {order.table_number}</p>
                <p>狀態: <span className="px-2 py-1 bg-blue-100 rounded">{order.status}</span></p>
                <p>總金額: ${order.total_amount}</p>
                <p>下單時間: {new Date(order.created_at).toLocaleString()}</p>
                <p>項目數量: {order.order_items?.length || 0}</p>
                
                {order.order_items && order.order_items.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-semibold">訂單項目:</h4>
                    <ul className="list-disc list-inside">
                      {order.order_items.map((item: any) => (
                        <li key={item.id}>{item.product_name} x{item.quantity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
