import React from 'react'
import { useOrderingStore } from '../state/orderingStore'

const OrderingLayout: React.FC = () => {
  const { items, totals, category, setCategory, search, setSearch } = useOrderingStore()
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ui-secondary">
      <div className="lg:w-56 p-3 border-r border-ui bg-ui-primary">
        <h2 className="font-bold mb-2 text-ui-primary">分類</h2>
        <div className="space-y-2">
          {['all','set','main','side','drink','dessert','soup'].map(c => (
            <button key={c} onClick={()=>setCategory(c)} className={`w-full text-left px-3 py-2 rounded-md text-sm ${category===c? 'bg-blue-600 text-white':'bg-ui-secondary hover:bg-blue-50'}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="flex gap-3 items-center">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋商品" className="flex-1 border rounded-md px-3 py-2 text-sm"/>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* TODO: product source hook */}
          {items.length === 0 && <div className="col-span-full text-center text-sm text-ui-muted">(此處待接產品資料) 暫示購物車項數：{items.length}</div>}
        </div>
      </div>
      <div className="w-full lg:w-80 border-l border-ui bg-white p-4 flex flex-col">
        <h3 className="font-semibold mb-2">購物車</h3>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {items.map(i => (
            <div key={i.id} className="border rounded-md p-2 bg-ui-secondary">
              <div className="flex justify-between text-sm font-medium"><span>{i.name}</span><span>x{i.qty}</span></div>
              {i.comboChildren && <div className="mt-1 pl-2 text-xs space-y-0.5">{i.comboChildren.map(c=> <div key={c.productId}>- {c.name}</div>)}</div>}
            </div>
          ))}
          {items.length===0 && <div className="text-xs text-ui-muted">尚無商品</div>}
        </div>
        <div className="border-t pt-3 mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>小計</span><span>NT$ {totals.subtotal}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>總計</span><span>NT$ {totals.total}</span></div>
          <button className="w-full mt-2 bg-green-600 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50" disabled={items.length===0}>送出訂單</button>
        </div>
      </div>
    </div>
  )
}

export default OrderingLayout
