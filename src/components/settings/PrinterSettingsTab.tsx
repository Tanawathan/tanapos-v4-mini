import React, { useEffect } from 'react'
import { usePrinterStore } from '../../lib/printer-store'

const Label: React.FC<{title: string; desc?: string; children: React.ReactNode}> = ({title, desc, children}) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="flex-1 min-w-0">
      <div className="font-medium text-ui-primary text-sm">{title}</div>
      {desc && <div className="text-xs text-ui-muted mt-0.5 leading-snug">{desc}</div>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
)

export const PrinterSettingsTab: React.FC = () => {
  const {
    enabled, endpoint, vendorId, productId, autoPrintOnCheckout, openCashDrawer, cutPaper, charset,
  testResult, lastError, setConfig, saveToStorage, runTestPrint
  } = usePrinterStore()

  useEffect(()=>{ saveToStorage() }, [enabled, endpoint, vendorId, productId, autoPrintOnCheckout, openCashDrawer, cutPaper, charset, saveToStorage])

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-ui-primary mb-1">🖨️ 印表機設定</h2>
        <p className="text-ui-muted text-sm">設定收據熱感印表機與自動列印行為</p>
      </div>
      <div className="border border-ui rounded-lg divide-y">
        <div className="p-4 bg-ui-secondary/60 text-xs rounded-t flex flex-wrap gap-2">
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded" title="是否啟用列印">{enabled ? '列印啟用' : '列印停用'}</span>
          {autoPrintOnCheckout && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">結帳自動列印</span>}
          {openCashDrawer && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">開錢箱</span>}
          {cutPaper && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">切紙</span>}
        </div>
        <div className="p-4">
          <Label title="啟用列印">
            <input type="checkbox" checked={enabled} onChange={e=>setConfig({enabled: e.target.checked})} />
          </Label>
          <Label title="列印服務 Endpoint" desc="本機 server.js 服務的 /print URL">
            <input value={endpoint} onChange={e=>setConfig({endpoint: e.target.value})} className="border rounded px-2 py-1 w-60 text-sm" />
          </Label>
          <Label title="Vendor ID" desc="(選填) 指定 USB 裝置廠商 ID 16 進位">
            <input value={vendorId ?? ''} onChange={e=>setConfig({vendorId: e.target.value ? parseInt(e.target.value,16): undefined})} placeholder="0xXXXX" className="border rounded px-2 py-1 w-32 text-sm" />
          </Label>
          <Label title="Product ID" desc="(選填) 裝置產品 ID 16 進位">
            <input value={productId ?? ''} onChange={e=>setConfig({productId: e.target.value ? parseInt(e.target.value,16): undefined})} placeholder="0xXXXX" className="border rounded px-2 py-1 w-32 text-sm" />
          </Label>
          <Label title="字元集" desc="ESC/POS 轉碼 (server.js 預設 GB18030)">
            <select value={charset} onChange={e=>setConfig({charset: e.target.value})} className="border rounded px-2 py-1 text-sm">
              <option value="GB18030">GB18030</option>
              <option value="BIG5">BIG5</option>
              <option value="UTF-8">UTF-8(需印表機支援)</option>
            </select>
          </Label>
          <Label title="結帳自動列印" desc="結帳成功後自動送出列印">
            <input type="checkbox" checked={autoPrintOnCheckout} onChange={e=>setConfig({autoPrintOnCheckout: e.target.checked})} />
          </Label>
          <Label title="列印時開錢箱" desc="送出 ESC p 指令">
            <input type="checkbox" checked={openCashDrawer} onChange={e=>setConfig({openCashDrawer: e.target.checked})} />
          </Label>
          <Label title="列印後切紙" desc="送出 GS V 指令">
            <input type="checkbox" checked={cutPaper} onChange={e=>setConfig({cutPaper: e.target.checked})} />
          </Label>
          <div className="my-4 h-px bg-ui" />
          <Label title="LOGO 圖片 (Base64)" desc="貼上 data:image/png;base64,... 或選擇檔案">
            <div className="flex flex-col items-end gap-2">
              <input
                type="text"
                placeholder="data:image/png;base64,...."
                onChange={e=>setConfig({logoBase64: e.target.value || undefined})}
                className="border rounded px-2 py-1 w-60 text-xs"
              />
              <input type="file" accept="image/*" className="text-xs" onChange={e=>{
                const file = e.target.files?.[0]; if(!file) return; const r=new FileReader(); r.onload=()=>setConfig({logoBase64: r.result as string}); r.readAsDataURL(file);
              }} />
              <button onClick={()=>setConfig({logoBase64: undefined})} className="text-xs text-red-600 underline">移除</button>
            </div>
          </Label>
          <Label title="QR Code 內容" desc="收據底部 QR (付款/連結)">
            <input type="text" onChange={e=>setConfig({qrData: e.target.value || undefined})} className="border rounded px-2 py-1 w-60 text-sm" />
          </Label>
          <Label title="條碼(Code128)" desc="僅 ASCII，例: ORDER123">
            <input type="text" onChange={e=>setConfig({barcode: e.target.value || undefined})} className="border rounded px-2 py-1 w-60 text-sm" />
          </Label>
          <div className="pt-4">
            <button onClick={runTestPrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">送出測試列印</button>
            {testResult && <span className="ml-3 text-green-600 text-sm">{testResult}</span>}
            {lastError && <span className="ml-3 text-red-600 text-sm">{lastError}</span>}
          </div>
        </div>
        <div className="p-4 text-xs text-ui-muted leading-relaxed bg-ui-secondary/40">
          <div className="font-medium text-ui-primary mb-1">使用說明</div>
          <ul className="list-disc list-inside space-y-1">
            <li>請先啟動 print-service: cd print-service && npm i && npm start</li>
            <li>若無法列印，確認系統 USB 權限與 Vendor/Product ID 設定</li>
            <li>測試列印只會送出標題與基本框線，確認通訊是否成功</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PrinterSettingsTab
