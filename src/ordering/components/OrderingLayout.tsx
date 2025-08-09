import React, { useState } from 'react'
import { useOrderingStore } from '../state/orderingStore'
import { useProducts } from '../hooks/useProducts'
import ComboModal from './ComboModal'
import { supabase } from '../../lib/supabase'

const OrderingLayout: React.FC = () => {
  const { items, totals, category, setCategory, search, setSearch, addSingle, startComboDraft, setContext, context, clear } = useOrderingStore()
  const { list: products, loading, error } = useProducts(category, search)
  const [submitting, setSubmitting] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)

  // 偵測 URL query 取得桌台/預約資訊 (簡化)
  React.useEffect(()=>{
    if (!context.tableNumber) {
      const params = new URLSearchParams(window.location.search)
      const table = params.get('table') || undefined
      const party = params.get('party')
      const name = params.get('name') || undefined
      if (table) setContext({ tableNumber: table, partySize: party? Number(party): undefined, customerName: name })
    }
  },[context.tableNumber, setContext])

  const handleAddProduct = (p: any) => {
    if (p.isCombo) {
      // 啟動套餐草稿 (暫以空規則佔位，後續補實際 groups)
      startComboDraft({ comboProductId: p.id, name: p.name, basePrice: p.displayPrice, groups: {}, rules: { groups: {} } })
      setComboOpen(true)
    } else {
      addSingle({ productId: p.id, name: p.name, unitPrice: p.displayPrice, qty: 1 })
    }
  }

  const createOrder = async () => {
    if (items.length === 0 || submitting) return
    try {
      setSubmitting(true)
      // 取得目前餐廳 ID (簡化：假設 tables 已綁定 currentRestaurant via localStorage or global supabase session)
      const { data: r } = await supabase.auth.getSession()
      const restaurantId = (window as any).CURRENT_RESTAURANT_ID || ''
      const orderPayload: any = {
        restaurant_id: restaurantId,
        table_number: context.tableNumber ? Number(context.tableNumber) : null,
        customer_name: context.customerName || '',
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        status: 'pending',
        payment_status: 'unpaid',
        party_size: context.partySize || null,
        items: items.map(i => ({
          product_id: i.type==='single'? i.productId : null,
          product_name: i.name,
          quantity: i.qty,
          unit_price: i.unitPrice,
          total_price: i.unitPrice * i.qty,
          special_instructions: i.note || '',
          is_combo_parent: i.type==='combo'
        }))
      }
      console.log('🚀 建立訂單 payload', orderPayload)
      // TODO: 呼叫後端現有 API createOrderWithTableUpdate or 直接 supabase 插入
      // 暫時只模擬成功
      setTimeout(()=>{
        alert('✅ 訂單建立成功 (模擬)')
        clear()
        setSubmitting(false)
      }, 600)
    } catch (e:any) {
      console.error('建立訂單失敗', e)
      alert('❌ 建立訂單失敗: ' + e.message)
      setSubmitting(false)
    }
  }
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
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋商品" className="flex-1 border rounded-md px-3 py-2 text-sm"/>
          {context.tableNumber && (
            <div className="text-xs bg-blue-50 border border-blue-200 px-2 py-1 rounded">桌號 {context.tableNumber}{context.partySize? ` · ${context.partySize}人`: ''}</div>
          )}
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {loading ? (
          <div className="text-sm text-ui-muted p-6">載入商品中...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map(p => (
              <button key={p.id} onClick={()=>handleAddProduct(p)} className="group relative border rounded-lg p-3 bg-white hover:shadow transition flex flex-col text-left">
                <div className="text-sm font-medium mb-1 line-clamp-2">{p.name}</div>
                <div className="text-xs text-ui-muted mb-2">{p.isCombo? '套餐' : '單品'}</div>
                <div className="mt-auto font-semibold text-blue-600">NT$ {p.displayPrice}</div>
                <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition">加入</span>
              </button>
            ))}
            {products.length === 0 && <div className="col-span-full text-center text-xs text-ui-muted py-6">無符合商品</div>}
          </div>
        )}
      </div>
      <div className="w-full lg:w-80 border-l border-ui bg-white p-4 flex flex-col">
        <h3 className="font-semibold mb-2">購物車</h3>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {items.map(i => (
            <div key={i.id} className="border rounded-md p-2 bg-ui-secondary">
              <div className="flex justify-between text-sm font-medium"><span>{i.name}</span><span>x{i.qty}</span></div>
              {i.comboChildren && <div className="mt-1 pl-2 text-xs space-y-0.5">{i.comboChildren.map(c=> <div key={c.productId}>- {c.name}</div>)}</div>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={()=>useOrderingStore.getState().updateQty(i.id,-1)} className="w-7 h-7 text-sm border rounded hover:bg-white">-</button>
                <span className="text-xs w-6 text-center">{i.qty}</span>
                <button onClick={()=>useOrderingStore.getState().updateQty(i.id,1)} className="w-7 h-7 text-sm border rounded hover:bg-white">+</button>
                <button onClick={()=>useOrderingStore.getState().removeItem(i.id)} className="ml-auto text-[10px] text-red-600 hover:underline">刪除</button>
              </div>
            </div>
          ))}
          {items.length===0 && <div className="text-xs text-ui-muted">尚無商品</div>}
        </div>
        <div className="border-t pt-3 mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>小計</span><span>NT$ {totals.subtotal}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>總計</span><span>NT$ {totals.total}</span></div>
          <button onClick={createOrder} className="w-full mt-2 bg-green-600 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50" disabled={items.length===0 || submitting}>{submitting? '送出中...' : '送出訂單'}</button>
        </div>
      </div>
      <ComboModal isOpen={comboOpen} onClose={()=>setComboOpen(false)} />
    </div>
  )
}

export default OrderingLayout
