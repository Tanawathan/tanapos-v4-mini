import { create } from 'zustand'
import { supabase } from './supabase'

// 擴充的預約資料列（包含資料庫可能出現的欄位）
export interface ReservationRow {
  id: string
  restaurant_id: string
  table_id?: string | null
  customer_name: string
  customer_phone?: string | null
  customer_email?: string | null
  customer_notes?: string | null
  party_size: number
  adult_count?: number | null
  child_count?: number | null
  child_chair_needed?: boolean | null
  reservation_time: string
  duration_minutes: number
  estimated_end_time?: string | null
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  special_requests?: string | null
  occasion?: string | null
  reservation_type?: 'advance' | 'same_day' | 'walk_in'
  is_walk_in?: boolean | null
  confirmed_at?: string | null
  seated_at?: string | null
  completed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  // 其他資料庫欄位容忍
  [key: string]: any
}

export type ReservationTag = 'upcoming' | 'arriving_now' | 'late' | 'ending_soon' | 'overtime'

export interface ReservationWithTags extends ReservationRow {
  tags: ReservationTag[]
}

interface ReservationStoreState {
  currentDate: string // YYYY-MM-DD
  reservations: ReservationRow[]
  loading: boolean
  lastLoadedAt?: number
  realtimeEnabled: boolean
  channel?: any
  lastCancelCleanupAt?: number
  setDate: (date: string, restaurantId?: string) => Promise<void>
  loadReservations: (restaurantId: string, date: string) => Promise<void>
  upsertReservation: (row: ReservationRow) => void
  removeReservation: (id: string) => void
  enableRealtime: (restaurantId: string) => void
  disableRealtime: () => void
  getReservationsWithTags: () => ReservationWithTags[]
  cleanupOldCancelled: (restaurantId: string) => Promise<void>
}

// ---- Tag 計算邏輯 ----
export function computeReservationTags(res: ReservationRow, now: Date = new Date()): ReservationTag[] {
  const tags: ReservationTag[] = []
  if (!res.reservation_time) return tags
  const start = new Date(res.reservation_time)
  const end = res.estimated_end_time ? new Date(res.estimated_end_time) : new Date(start.getTime() + (res.duration_minutes || 90) * 60000)
  const diffMinutes = (start.getTime() - now.getTime()) / 60000
  const sinceStartMinutes = (now.getTime() - start.getTime()) / 60000
  const untilEndMinutes = (end.getTime() - now.getTime()) / 60000

  // upcoming: 已確認且 0 < diff <= 60
  if (res.status === 'confirmed' && diffMinutes > 0 && diffMinutes <= 60) {
    tags.push('upcoming')
  }
  // arriving_now: 已確認且 -5 <= diff <= 5
  if (res.status === 'confirmed' && Math.abs(diffMinutes) <= 5) {
    tags.push('arriving_now')
  }
  // late: 已確認且 過了開始時間 5 分鐘仍未入座
  if (res.status === 'confirmed' && sinceStartMinutes > 5) {
    tags.push('late')
  }
  // ending_soon: 已入座且距離預估結束 <=15 && 還沒超時
  if (res.status === 'seated' && untilEndMinutes <= 15 && untilEndMinutes >= 0) {
    tags.push('ending_soon')
  }
  // overtime: 已入座且已超過預估結束
  if (res.status === 'seated' && untilEndMinutes < 0) {
    tags.push('overtime')
  }
  return tags
}

export const useReservationStore = create<ReservationStoreState>((set, get) => ({
  currentDate: new Date().toISOString().split('T')[0],
  reservations: [],
  loading: false,
  realtimeEnabled: false,
  lastCancelCleanupAt: undefined,

  async setDate(date, restaurantId) {
    set({ currentDate: date })
    if (restaurantId) {
      await get().loadReservations(restaurantId, date)
    }
  },

  async loadReservations(restaurantId: string, date: string) {
    if (!restaurantId) return
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', `${date}T00:00:00`)
        .lt('reservation_time', `${date}T23:59:59`)
        .order('reservation_time', { ascending: true })
      if (!error && data) {
        set({ reservations: data as ReservationRow[], lastLoadedAt: Date.now() })
        // 嘗試背景清理舊的取消預約（非阻塞）
        const now = Date.now()
        const lastRun = get().lastCancelCleanupAt || 0
        // 至少 6 小時跑一次，避免頻繁刪除請求
        if (now - lastRun > 6 * 60 * 60 * 1000) {
          get().cleanupOldCancelled(restaurantId).catch(()=>{})
        }
      } else if (error) {
        console.error('載入預約失敗', error)
      }
    } finally {
      set({ loading: false })
    }
  },

  upsertReservation(row) {
    set(state => {
      const idx = state.reservations.findIndex(r => r.id === row.id)
      let next = state.reservations.slice()
      if (idx >= 0) next[idx] = { ...next[idx], ...row }
      else next.push(row)
      // 僅保留當前日期的資料
      const date = state.currentDate
      next = next.filter(r => (r.reservation_time || '').startsWith(date))
      next.sort((a,b)=> a.reservation_time.localeCompare(b.reservation_time))
      return { reservations: next }
    })
  },

  removeReservation(id) {
    set(state => ({ reservations: state.reservations.filter(r => r.id !== id) }))
  },

  enableRealtime(restaurantId: string) {
    if (get().realtimeEnabled || !restaurantId) return
    const channel = supabase.channel(`reservations:${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_reservations', filter: `restaurant_id=eq.${restaurantId}` }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          get().removeReservation(payload.old.id)
        } else if (payload.new) {
          const row = payload.new as ReservationRow
          const datePart = (row.reservation_time || '').slice(0,10)
          if (datePart === get().currentDate) {
            get().upsertReservation(row)
          }
        }
      })
  .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // console.log('Reservation realtime subscribed')
        }
      })
    set({ channel, realtimeEnabled: true })
  },

  disableRealtime() {
    const ch = get().channel
    if (ch) supabase.removeChannel(ch)
    set({ channel: undefined, realtimeEnabled: false })
  },

  getReservationsWithTags() {
    const now = new Date()
    return get().reservations.map(r => ({ ...r, tags: computeReservationTags(r, now) }))
  },

  /**
   * 自動清理 24 小時前的已取消預約：
   * - 僅刪除 reservation_time 早於現在 24h 且狀態為 cancelled 的記錄
   * - 避免使用者仍需追蹤當日剛取消的資料
   * - 執行頻率：每 6 小時最多一次（由 loadReservations 觸發）
   * 注意：若需要保留歷史紀錄，請改為在後端加上 archived 欄位而非刪除。
   */
  async cleanupOldCancelled(restaurantId: string) {
    try {
      const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('table_reservations')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('status', 'cancelled')
        .lt('reservation_time', threshold)
        .select('id')
      if (error) {
        console.warn('清理取消預約失敗:', error.message)
      } else if (data && data.length) {
        const ids = (data as { id: string }[]).map((r: { id: string }) => r.id)
        set(state => ({ reservations: state.reservations.filter(r => !ids.includes(r.id)), lastCancelCleanupAt: Date.now() }))
        // console.log(`已清理 ${ids.length} 筆過期取消預約`)
      } else {
        set({ lastCancelCleanupAt: Date.now() })
      }
    } catch (err:any) {
      console.warn('清理取消預約異常:', err?.message || err)
    }
  }
}))
