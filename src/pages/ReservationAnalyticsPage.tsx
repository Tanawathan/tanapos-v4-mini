import React, { useEffect, useState, useMemo } from 'react'
import { RefreshCcw, Calendar, Users, Clock, Download, BarChart2, TrendingUp, Activity, Filter, AlertCircle } from 'lucide-react'
import { ReservationService } from '../services/reservationService'
import type { Reservation } from '../lib/reservation-types'
import useStore from '../lib/store'

// 新版：預約統計分析 (取代 legacy 頁面)
// 目標：提供營運層面快速洞察 – 今日 / 過去7日 / 區間，量(筆數)、人(人次)、動態(入座轉換)、利用率(座位容量推估)

interface RangePreset { key: string; label: string; days: number | 'today' }
const PRESETS: RangePreset[] = [
  { key:'today', label:'今日', days:'today' },
  { key:'7d', label:'過去7日', days:7 },
  { key:'30d', label:'過去30日', days:30 }
]

interface SeriesPoint { date: string; count: number; people: number; seated: number; completed: number }

// 以本地時區產生 YYYY-MM-DD，避免使用 toISOString() 被轉成 UTC 導致日期-1
const fmtLocalDate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

export default function ReservationAnalyticsPage(){
  const { currentRestaurant, tables } = useStore() as any
  const [loading, setLoading] = useState(false)
  const [rangeKey, setRangeKey] = useState<'today'|'7d'|'30d'>('today')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [useCustom, setUseCustom] = useState(false)
  const [data, setData] = useState<Reservation[]>([])
  const [error, setError] = useState<string>('')

  // 計算日期範圍
  const { startDate, endDate } = useMemo(()=> {
    if (useCustom && customStart && customEnd) return { startDate: customStart, endDate: customEnd }
  const today = new Date(); today.setHours(0,0,0,0)
  if (rangeKey==='today') return { startDate: fmtLocalDate(today), endDate: fmtLocalDate(today) }
    const d = new Date(today)
    d.setDate(d.getDate() - (rangeKey==='7d'?6:29))
  return { startDate: fmtLocalDate(d), endDate: fmtLocalDate(today) }
  }, [rangeKey, useCustom, customStart, customEnd])

  // 載入資料
  useEffect(()=>{ (async()=> { if(!currentRestaurant?.id) return; try { setLoading(true); setError('')
    // 擴大查詢範圍緩衝一天避免時區邊界
  // 依本地時間建立起訖，再轉成 UTC ISO 傳給後端
  const startQLocal = new Date(`${startDate}T00:00:00`); startQLocal.setDate(startQLocal.getDate()-1)
  const endQLocal = new Date(`${endDate}T23:59:59`); endQLocal.setDate(endQLocal.getDate()+1)
  const startQ = startQLocal
  const endQ = endQLocal
    const res = await ReservationService.getReservations(currentRestaurant.id, { dateRange:{ start: startQ.toISOString(), end: endQ.toISOString() } })
    // 前端截止
  const filtered = res.filter(r=> { const dt = new Date(r.reservation_time); const local = fmtLocalDate(dt); return local>=startDate && local<=endDate })
    setData(filtered)
  } catch(e:any){ setError(e.message||'載入失敗') } finally { setLoading(false) } })() }, [currentRestaurant?.id, startDate, endDate])

  // 取得本地日期字串
  const localDateOf = (r: Reservation) => fmtLocalDate(new Date(r.reservation_time))

  // 彙總
  const summary = useMemo(()=> {
    const s = { total:0, people:0, seated:0, completed:0, cancel:0, noShow:0 }
    data.forEach(r=> { s.total++; s.people += r.party_size||0; if(r.status==='seated') s.seated++; if(r.status==='completed') s.completed++; if(r.status==='cancelled') s.cancel++; if(r.status==='no_show') s.noShow++; })
    return s
  },[data])

  // 轉換率
  const conversion = useMemo(()=> {
    const confirmed = data.filter(r=> r.status==='confirmed'||r.status==='seated'||r.status==='completed').length
    const seated = data.filter(r=> r.status==='seated'||r.status==='completed').length
    const completed = data.filter(r=> r.status==='completed').length
    const pct = (a:number,b:number)=> b===0?0: Math.round(a/b*100)
    return { seatRate: pct(seated, confirmed), completeRate: pct(completed, confirmed), cancelRate: pct(summary.cancel, summary.total), noShowRate: pct(summary.noShow, summary.total) }
  },[data, summary])

  // 每日序列
  const series: SeriesPoint[] = useMemo(()=> {
    const map: Record<string, SeriesPoint> = {}
    const iter = new Date(startDate)
    const end = new Date(endDate)
  while(iter<=end){ const k = fmtLocalDate(iter); map[k] = { date:k, count:0, people:0, seated:0, completed:0 }; iter.setDate(iter.getDate()+1) }
    data.forEach(r=> { const dLocal = new Date(new Date(r.reservation_time).getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10); const row = map[dLocal]; if(!row) return; row.count++; row.people += r.party_size||0; if(r.status==='seated') row.seated++; if(r.status==='completed') row.completed++; })
    return Object.values(map)
  },[data, startDate, endDate])

  // 座位利用率（粗估）：已入座 + 已完成 的 party_size ÷ 總容量
  const capacity = useMemo(()=> (tables||[]).filter((t:any)=> t.is_active !== false).reduce((s:number,t:any)=> s + (t.capacity||0),0),[tables])
  const seatUsage = useMemo(()=> { if(!capacity) return 0; const used = data.filter(r=> ['seated','completed'].includes(r.status)).reduce((s,r)=> s + (r.party_size||0),0); return Math.round(used / capacity * 100) },[data, capacity])

  // 今日人數 (不受範圍限制: 只要目前範圍內包含今天則可顯示；若不在則返回 0)
  const todayStr = fmtLocalDate(new Date())
  const todayPeopleAll = useMemo(()=> data.filter(r=> localDateOf(r)===todayStr).reduce((s,r)=> s + (r.party_size||0),0), [data])
  const todayPeopleEffective = useMemo(()=> data.filter(r=> localDateOf(r)===todayStr && !['cancelled','no_show'].includes(r.status)).reduce((s,r)=> s + (r.party_size||0),0), [data])
  const todayPeopleSeated = useMemo(()=> data.filter(r=> localDateOf(r)===todayStr && ['seated','completed'].includes(r.status)).reduce((s,r)=> s + (r.party_size||0),0), [data])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 bg-white border-b px-6 py-3 flex flex-wrap gap-4 items-center">
        <h1 className="text-xl font-semibold flex items-center gap-2"><BarChart2 className="h-5 w-5"/>預約統計分析</h1>
        <div className="flex gap-2 text-xs bg-gray-100 rounded-full p-1">
          {PRESETS.map(p=> (
            <button key={p.key} onClick={()=>{ setUseCustom(false); setRangeKey(p.key as any) }} className={`px-3 py-1 rounded-full ${!useCustom && rangeKey===p.key? 'bg-white shadow text-indigo-600':'text-gray-600 hover:text-indigo-600'}`}>{p.label}</button>
          ))}
          <button onClick={()=> setUseCustom(s=> !s)} className={`px-3 py-1 rounded-full ${useCustom? 'bg-white shadow text-indigo-600':'text-gray-600 hover:text-indigo-600'}`}>自訂</button>
        </div>
        {useCustom && (
          <div className="flex items-center gap-2 text-xs">
            <input type="date" value={customStart} onChange={e=> setCustomStart(e.target.value)} className="border rounded px-2 py-1"/>
            <span>~</span>
            <input type="date" value={customEnd} onChange={e=> setCustomEnd(e.target.value)} className="border rounded px-2 py-1"/>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={()=>{ setRangeKey(rangeKey); }} className="px-3 py-2 text-xs border rounded flex items-center gap-1"><RefreshCcw className="h-4 w-4"/>刷新</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4"/>{error}</div>}
        {/* 核心 KPI */}
        <KpiSection 
          summary={summary} conversion={conversion} seatUsage={seatUsage} capacity={capacity}
          today={{ all: todayPeopleAll, effective: todayPeopleEffective, seated: todayPeopleSeated, date: todayStr }}
        />

        {/* 趨勢圖 (簡易條列) */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4"/>每日趨勢</h2>
            <span className="text-[11px] text-gray-400">{startDate} ~ {endDate}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-gray-500 text-[11px] border-b">
                  <th className="text-left py-1 pr-4 font-medium">日期</th>
                  <th className="text-right py-1 pr-4 font-medium">筆數</th>
                  <th className="text-right py-1 pr-4 font-medium">人次</th>
                  <th className="text-right py-1 pr-4 font-medium">入座</th>
                  <th className="text-right py-1 pr-4 font-medium">完成</th>
                </tr>
              </thead>
              <tbody>
                {series.map(row => (
                  <tr key={row.date} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-1 pr-4 font-mono text-[11px] text-gray-600">{row.date}</td>
                    <td className="py-1 pr-4 text-right">{row.count}</td>
                    <td className="py-1 pr-4 text-right">{row.people}</td>
                    <td className="py-1 pr-4 text-right">{row.seated}</td>
                    <td className="py-1 pr-4 text-right">{row.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 匯出 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Download className="h-4 w-4"/>資料匯出</h2>
            <button onClick={()=> exportCSV(series)} className="px-3 py-1 text-xs border rounded hover:bg-gray-50 flex items-center gap-1"><Download className="h-4 w-4"/>CSV</button>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">匯出每日彙總（筆數 / 人次 / 入座 / 完成）供外部報表或進一步 BI 分析。</p>
        </div>
      </div>
    </div>
  )
}

/* ===== 元件 ===== */
const KpiCard = ({ title, value, sub, icon }: { title:string; value: React.ReactNode; sub?: string; icon?: React.ReactNode }) => (
  <div className="bg-white rounded-lg border p-4 flex flex-col gap-1 shadow-sm">
    <div className="flex items-center gap-2 text-xs text-gray-500">{icon}{title}</div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
    {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
  </div>
)

const CheckIcon = () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
const XIcon = () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>

function exportCSV(rows: SeriesPoint[]) {
  const header = ['date','count','people','seated','completed']
  const lines = [header.join(','), ...rows.map(r => [r.date,r.count,r.people,r.seated,r.completed].join(','))]
  const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'reservation_summary.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// KPI 區塊 (拆分為獨立組件便於後續加入互動或比較視圖)
const KpiSection: React.FC<{ summary:any; conversion:any; seatUsage:number; capacity:number; today:{ all:number; effective:number; seated:number; date:string } }> = ({ summary, conversion, seatUsage, capacity, today }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="預約筆數" value={summary.total} sub={`${summary.people} 人次 (範圍)`} icon={<Calendar className="h-5 w-5"/>} />
        <KpiCard title="已入座" value={summary.seated} sub={`${Math.round(summary.seated? summary.seated/summary.total*100:0)}% 轉入`} icon={<Users className="h-5 w-5"/>} />
        <KpiCard title="已完成" value={summary.completed} sub={`${Math.round(summary.completed? summary.completed/summary.total*100:0)}%`} icon={<CheckIcon/>} />
        <KpiCard title="取消" value={summary.cancel} sub={`${conversion.cancelRate}%`} icon={<XIcon/>} />
        <KpiCard title="未到" value={summary.noShow} sub={`${conversion.noShowRate}%`} icon={<AlertCircle className="h-5 w-5"/>} />
        <KpiCard title="座位利用率" value={seatUsage + '%'} sub={`容量 ${capacity}`} icon={<Activity className="h-5 w-5"/>} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="今日預約人數" value={today.all} sub={today.date} icon={<Users className="h-5 w-5"/>} />
        <KpiCard title="今日有效人數" value={today.effective} sub="-取消/未到" icon={<Users className="h-5 w-5 text-green-600"/>} />
        <KpiCard title="今日入座人數" value={today.seated} sub="含完成" icon={<Users className="h-5 w-5 text-indigo-600"/>} />
      </div>
    </div>
  )
}
