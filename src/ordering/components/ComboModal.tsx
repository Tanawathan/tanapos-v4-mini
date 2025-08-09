import React from 'react'
import { useOrderingStore } from '../state/orderingStore'

interface ComboModalProps { isOpen: boolean; onClose: () => void }

const ComboModal: React.FC<ComboModalProps> = ({ isOpen, onClose }) => {
  const draft = useOrderingStore(s=>s.draft)
  const update = useOrderingStore(s=>s.updateComboSelection)
  const confirm = useOrderingStore(s=>s.confirmComboDraft)
  const cancel = useOrderingStore(s=>s.cancelComboDraft)
  if(!isOpen || !draft) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <h3 className="text-lg font-bold">組合：{draft.name}</h3>
        {Object.entries(draft.rules?.groups || {}).map(([g,rule]: any) => {
          const sel = draft.groups[g]?.selected || []
          return (
            <div key={g} className="border rounded-md p-3">
              <div className="flex justify-between text-sm mb-2 font-medium"><span>{rule.label || g}</span><span>{sel.length}/{rule.max}</span></div>
              <div className="grid grid-cols-2 gap-2">
                {rule.items.map((it: any)=>{
                  const active = sel.includes(it.id)
                  return (
                    <button key={it.id} onClick={()=>update(g,it.id,rule.max)} className={`border rounded-md px-2 py-2 text-xs text-left ${active? 'bg-blue-600 text-white border-blue-700':'bg-ui-secondary hover:bg-blue-50'}`}>{it.name}</button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div className="flex gap-2 pt-2">
          <button onClick={()=>{confirm(); onClose()}} className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-semibold">加入套餐</button>
          <button onClick={()=>{cancel(); onClose()}} className="flex-1 bg-gray-600 text-white rounded-md py-2 text-sm">取消</button>
        </div>
      </div>
    </div>
  )
}

export default ComboModal
