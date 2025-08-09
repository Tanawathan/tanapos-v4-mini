import React from 'react'
import { useOrderingStore } from '../state/orderingStore'

interface ComboModalProps { isOpen: boolean; onClose: () => void; onConfirmed?: () => void }

const ComboModal: React.FC<ComboModalProps> = ({ isOpen, onClose, onConfirmed }) => {
  const draft = useOrderingStore(s=>s.draft)
  const update = useOrderingStore(s=>s.updateComboSelection)
  const updateQty = useOrderingStore(s=>s.updateComboQty)
  const confirm = useOrderingStore(s=>s.confirmComboDraft)
  const cancel = useOrderingStore(s=>s.cancelComboDraft)
  if(!isOpen || !draft) return null
  const groups = draft.rules?.groups || {}
  const comboQty = draft.comboQty || 1
  // 驗證：所有必填群組已達 (min * comboQty) 且未超過 (max * comboQty)
  const allValid = Object.entries(groups).every(([k, rule]: any) => {
    const sel = draft.groups[k]?.selected || []
    const minNeeded = rule.min * comboQty
    const maxAllowed = rule.max * comboQty
    if (sel.length > maxAllowed) return false
    if (rule.required && sel.length < minNeeded) return false
    return true
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <h3 className="text-lg font-bold flex items-center justify-between">組合：{draft.name}
          <div className="flex items-center gap-2 text-sm font-medium">
            <button onClick={()=>updateQty((draft.comboQty||1)-1)} className="w-7 h-7 border rounded disabled:opacity-40" disabled={comboQty<=1}>-</button>
            <span className="w-8 text-center">{comboQty}</span>
            <button onClick={()=>updateQty((draft.comboQty||1)+1)} className="w-7 h-7 border rounded">+</button>
          </div>
        </h3>
        {Object.entries(groups).map(([g,rule]: any) => {
          const sel = draft.groups[g]?.selected || []
          const maxAllowed = rule.max * comboQty
          const minNeeded = rule.min * comboQty
          // 統計每個品項被選次數，用於顯示重複數字
          const counts: Record<string, number> = {}
          sel.forEach(id=>{ counts[id] = (counts[id]||0)+1 })
          return (
            <div key={g} className="border rounded-md p-3">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>{rule.label || g} {rule.required && <span className="text-red-500">*</span>} <span className="ml-1 text-xs text-ui-muted">{rule.min * comboQty}-{rule.max * comboQty}</span></span>
                <span className={(sel.length < minNeeded && rule.required) ? 'text-red-500' : ''}>{sel.length}/{maxAllowed}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {rule.items.map((it: any)=>{
                  const count = counts[it.id] || 0
                  const active = count>0
                  return (
                    <button key={it.id} onClick={()=>update(g,it.id,rule.max)} className={`border rounded-md px-2 py-2 text-xs text-left relative ${active? 'bg-blue-600 text-white border-blue-700':'bg-ui-secondary hover:bg-blue-50'}`}>
                      <span>{it.name}</span>
                      {count>0 && <span className="absolute -top-2 -left-2 bg-green-600 text-white rounded-full text-[10px] px-1.5 py-0.5">{count}</span>}
                      {it.priceDelta>0 && <span className={`absolute top-1 right-1 text-[10px] px-1 rounded ${active? 'bg-white/20':'bg-yellow-100 text-yellow-700'}`}>+{it.priceDelta}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div className="flex gap-2 pt-2">
          <button disabled={!allValid} onClick={()=>{confirm(); onClose(); onConfirmed?.();}} className="flex-1 bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-md py-2 text-sm font-semibold">加入套餐</button>
          <button onClick={()=>{cancel(); onClose()}} className="flex-1 bg-gray-600 text-white rounded-md py-2 text-sm">取消</button>
        </div>
      </div>
    </div>
  )
}

export default ComboModal
