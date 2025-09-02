import React, { useEffect, useMemo, useState } from 'react';
import { useKDSV2Store } from '../lib/kds-v2-store';
import { MenuCategory, MenuItemStatus } from '../lib/kds-types';
import OrderTimer from './OrderTimer';

const categoryLabels: Record<string,string> = {
  [MenuCategory.APPETIZERS]: '前菜',
  [MenuCategory.MAIN_COURSE]: '主餐',
  [MenuCategory.BEVERAGES]: '飲品',
  [MenuCategory.DESSERTS]: '甜點',
  [MenuCategory.A_LA_CARTE]: '單點',
  [MenuCategory.ADDITIONAL]: '加點'
};

const statusColor = (s: MenuItemStatus) => {
  switch (s) {
    case MenuItemStatus.READY: return 'bg-green-500';
    case MenuItemStatus.PREPARING: return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
};

const KDSV2Page: React.FC = () => {
  const { tasks, fetch, toggleTask, loading, error, filter, toggleCategory, clearCategories, selectAllCategories, orders, markOrderReady, markOrderServed } = useKDSV2Store() as any;
  const [mode, setMode] = useState<'category'|'table'|'order'>('category');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement|null>(null);
  const prevTaskIdsRef = React.useRef<Set<string>>(new Set());

  // 建立音效 (簡短 beep)，使用 data URI 免外部資源
  useEffect(() => {
    if (!audioRef.current) {
      // 440Hz 100ms 簡單正弦波 wav base64 (生成)
      const dataUri = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAAAA/////wAA//8AAP//AAD//wAA//8AAP//AAD//wAA';
      const el = new Audio(dataUri);
      el.volume = 0.6;
      audioRef.current = el;
    }
  }, []);

  // 偵測新任務 (依 task.id) 播放提示音
  useEffect(() => {
    if (!soundEnabled) return;
    const currentIds = new Set<string>();
    tasks.forEach((t:any)=> currentIds.add(t.id));
    let hasNew = false;
    currentIds.forEach(id => { if (!prevTaskIdsRef.current.has(id)) hasNew = true; });
    if (hasNew && prevTaskIdsRef.current.size>0) {
      // 避免第一次載入就提示（prev 為空跳過）
      try { audioRef.current?.play().catch(()=>{}); } catch {}
    }
    prevTaskIdsRef.current = currentIds;
  }, [tasks, soundEnabled]);

  useEffect(() => { fetch(); const t = setInterval(()=>fetch(true), 15000); return ()=>clearInterval(t); }, [fetch]);

  const allCats = Object.keys(categoryLabels);
  const activeTasks = useMemo(()=> {
    if (!filter.categories.length) return tasks;
    return tasks.filter((t: any)=> filter.categories.includes(t.category));
  }, [tasks, filter.categories]);

  const grouped = useMemo(() => {
    if (mode==='table') {
      const map: Record<string, any[]> = {};
      activeTasks.forEach((t: any) => { 
        let key;
        if (t.tableNumber) {
          key = `桌 ${t.tableNumber}`;
        } else if (t.orderType === 'delivery') {
          key = t.deliveryPlatform ? `${t.deliveryPlatform} 外送` : '外送';
        } else {
          key = '外帶';
        }
        (map[key] ||= []).push(t); 
      });
      return Object.entries(map).map(([k,v]) => ({ 
        key: k, 
        items: v,
        earliestCreatedAt: v.reduce((earliest, item) => {
          return !earliest || item.createdAt < earliest ? item.createdAt : earliest;
        }, null)
      }));
    } else if (mode==='order') {
      const map: Record<string, any[]> = {};
      activeTasks.forEach((t: any) => { 
        // 創建更詳細的訂單標題
        let orderInfo = t.orderNumber;
        if (t.tableNumber) {
          orderInfo += ` (桌 ${t.tableNumber})`;
        } else if (t.orderType === 'delivery') {
          orderInfo += ` (${t.deliveryPlatform || ''}外送)`;
        } else {
          orderInfo += ` (外帶)`;
        }
        const key = `訂單 ${orderInfo}`;
        (map[key] ||= []).push(t); 
      });
      return Object.entries(map).map(([k,v]) => ({ 
        key: k, 
        items: v,
        earliestCreatedAt: v.reduce((earliest, item) => {
          return !earliest || item.createdAt < earliest ? item.createdAt : earliest;
        }, null)
      }));
    } else {
      const map: Record<string, any[]> = {};
      activeTasks.forEach((t: any) => { (map[t.category] ||= []).push(t); });
      return Object.entries(map).map(([k,v]) => ({ 
        key: categoryLabels[k] || k, 
        items: v,
        earliestCreatedAt: v.reduce((earliest, item) => {
          return !earliest || item.createdAt < earliest ? item.createdAt : earliest;
        }, null)
      }));
    }
  }, [activeTasks, mode]);

  return (
    <div className="p-4 space-y-4">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">KDS v2</h1>
        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={()=>fetch()}>刷新</button>
        <button 
          className="px-3 py-1 rounded bg-gray-200" 
          onClick={()=>setMode(m => {
            if (m === 'category') return 'table';
            if (m === 'table') return 'order';
            return 'category';
          })}
        >
          {mode === 'category' ? '切換桌台視圖' : mode === 'table' ? '切換訂單視圖' : '切換分類視圖'}
        </button>
        <button className={`px-3 py-1 rounded ${soundEnabled? 'bg-emerald-500 text-white':'bg-gray-200'}`} onClick={()=>setSoundEnabled(s=>!s)}>{soundEnabled? '🔔音效開':'🔕音效關'}</button>
        {loading && <span className="text-sm text-gray-500">載入中...</span>}
        <div className="flex gap-2 items-center flex-wrap">
          {allCats.map(c => (
            <button key={c} onClick={()=>toggleCategory(c)} className={`text-xs px-2 py-1 rounded border ${filter.categories.includes(c)?'bg-green-500 text-white border-green-500':'bg-white'}`}>{categoryLabels[c]}</button>
          ))}
          <button onClick={()=>selectAllCategories(allCats)} className="text-xs px-2 py-1 rounded bg-gray-100">全選</button>
          <button onClick={()=>clearCategories()} className="text-xs px-2 py-1 rounded bg-gray-100">清空</button>
        </div>
      </header>
  {error && <div className="p-3 rounded bg-red-100 text-red-700 text-sm">載入失敗: {error}</div>}
  <div className="grid md:grid-cols-3 gap-4">
        {grouped.map(group => (
          <div key={group.key} className="bg-white rounded shadow p-2 flex flex-col">
            <div className="font-semibold text-lg mb-2 flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span>{group.key}</span>
                  {group.earliestCreatedAt && (
                    <OrderTimer 
                      createdAt={group.earliestCreatedAt} 
                      className="ml-2"
                    />
                  )}
                </div>
                {(mode==='table' || mode==='order') && (()=> {
                  // 在桌台視圖或訂單視圖：於標題旁邊顯示每個訂單的完成/送出按鈕
                  const orderIds = Array.from(new Set(group.items.map((i:any)=> i.orderId)));
                  return (
                    <div className="flex flex-wrap gap-2">
                      {orderIds.map(oid => {
                        const related = group.items.filter((i:any)=> i.orderId===oid);
                        const allReady = related.length>0 && related.every((t:any)=> [MenuItemStatus.READY, MenuItemStatus.SERVED].includes(t.status));
                        const oStatus = orders[oid]?.status;
                        if (!allReady) return null;
                        return (
                          <div key={oid} className="flex items-center gap-1 text-xs bg-gray-50 border rounded px-2 py-1">
                            <span className="font-medium">訂單 {related[0].orderNumber}</span>
                            {oStatus!=='ready' && oStatus!=='served' && <button onClick={()=>markOrderReady(oid)} className="px-2 py-0.5 bg-emerald-500 text-white rounded">完成</button>}
                            {oStatus==='ready' && <button onClick={()=>markOrderServed(oid)} className="px-2 py-0.5 bg-indigo-500 text-white rounded">送出</button>}
                            {oStatus==='served' && <span className="text-green-600">已送出</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <span className="text-xs text-gray-500">{group.items.filter(i=>i.status===MenuItemStatus.READY).length}/{group.items.length}</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1">
              {group.items.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(item => (
                <button key={item.id} onClick={()=>toggleTask(item.id)} className={`w-full text-left border rounded px-2 py-2 flex items-center gap-2 transition ${item.isVirtual?'opacity-90':''}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${statusColor(item.status)}`}></span>
                  <span className="flex-1">{item.name} x{item.quantity}</span>
                  <span className="text-xs text-gray-500">{item.orderNumber}{item.comboParentId && '·子'}</span>
                </button>
              ))}
              {/* 若為分類視圖且此群組全部 ready，顯示可操作的訂單動作 */}
              {mode==='category' && group.items.length>0 && (() => {
                // 取此群組相關的訂單集合
                const orderIds = Array.from(new Set(group.items.map(i=>i.orderId)));
                return orderIds.map(oid => {
                  const orderTasks = tasks.filter((t: any) => t.orderId===oid);
                  const allReady = orderTasks.length>0 && orderTasks.every((t: any) => [MenuItemStatus.READY, MenuItemStatus.SERVED].includes(t.status));
                  const oStatus = orders[oid]?.status;
                  if (!allReady) return null;
                  return (
                    <div key={oid} className="mt-2 flex gap-2 text-xs">
                      {oStatus!== 'ready' && oStatus!== 'served' && <button onClick={()=>markOrderReady(oid)} className="px-2 py-1 bg-emerald-500 text-white rounded">標記訂單完成</button>}
                      {oStatus=== 'ready' && <button onClick={()=>markOrderServed(oid)} className="px-2 py-1 bg-indigo-500 text-white rounded">標記已送出</button>}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KDSV2Page;
