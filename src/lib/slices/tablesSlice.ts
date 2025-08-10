import { StateCreator } from 'zustand'
import { supabase } from '../supabase'
import { Table } from '../types'

export interface TablesSliceState {
  tables: Table[]
  tablesLoaded: boolean
  loadTables: () => Promise<void>
  updateTableStatus: (tableId: string, status: Table['status'], metadata?: any) => Promise<void>
  mergeTables: (baseTableId: string, otherTableIds: string[]) => Promise<void>
  unmergeTable: (baseTableId: string) => Promise<void>
}

const MOCK_RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111'

export const createTablesSlice: StateCreator<TablesSliceState & { loading: boolean; error: string | null }, [], [], TablesSliceState> = (set, get) => ({
  tables: [],
  tablesLoaded: false,
  loadTables: async () => {
    const state = get()
    if (state.tablesLoaded && state.tables.length > 0) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let restaurantId = MOCK_RESTAURANT_ID
      if (user?.user_metadata?.restaurant_id) restaurantId = user.user_metadata.restaurant_id
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('table_number', { ascending: true })
      if (error) throw error
      set({ tables: data || [], tablesLoaded: true })
    } catch (e) {
      console.error('loadTables error', e)
      set({ error: e instanceof Error ? e.message : 'loadTables failed' })
    }
  },
  updateTableStatus: async (tableId, status, metadata = {}) => {
    try {
      const now = new Date().toISOString()
      const updateData: any = { status, updated_at: now }
      switch (status) {
        case 'available':
          updateData.last_cleaned_at = now
          updateData.current_session_id = null
          updateData.last_occupied_at = null
          break
        case 'occupied':
          updateData.last_occupied_at = now
          if (metadata.sessionId) updateData.current_session_id = metadata.sessionId
          break
        case 'cleaning':
          updateData.last_cleaned_at = now
          updateData.current_session_id = null
          break
        case 'maintenance':
          updateData.current_session_id = null
          break
      }
      const { error } = await supabase.from('tables').update(updateData).eq('id', tableId)
      if (error) throw error
      set(state => ({ tables: state.tables.map(t => t.id === tableId ? { ...t, ...updateData, ...metadata } : t) }))
    } catch (e) {
      console.error('updateTableStatus error', e)
      set({ error: e instanceof Error ? e.message : 'updateTableStatus failed' })
      throw e
    }
  },
  mergeTables: async (baseTableId, otherTableIds) => {
    if (!baseTableId || !otherTableIds.length) return
    try {
      const state = get()
      const base = state.tables.find(t => t.id === baseTableId)
      const others = state.tables.filter(t => otherTableIds.includes(t.id))
      if (!base || !others.length) throw new Error('桌台不存在')
      const mergedCapacity = (base.capacity || 0) + others.reduce((s, t) => s + (t.capacity || 0), 0)
      const { error: upErr } = await supabase.from('tables').update({
        metadata: { ...(base.metadata || {}), merged_with: others.map(o => o.id), merged_capacity: mergedCapacity },
        updated_at: new Date().toISOString()
      }).eq('id', baseTableId)
      if (upErr) throw upErr
      const { error: othersErr } = await supabase.from('tables').update({
        metadata: { merged_into: baseTableId },
        status: 'inactive',
        updated_at: new Date().toISOString()
      }).in('id', otherTableIds)
      if (othersErr) console.warn('附屬桌更新失敗', othersErr.message)
      set({ tables: state.tables.map(t => {
        if (t.id === baseTableId) return { ...t, metadata: { ...(t.metadata || {}), merged_with: others.map(o => o.id), merged_capacity: mergedCapacity } }
        if (otherTableIds.includes(t.id)) return { ...t, metadata: { ...(t.metadata || {}), merged_into: baseTableId }, status: 'inactive' }
        return t
      }) })
    } catch (e) {
      console.error('mergeTables error', e)
      set({ error: e instanceof Error ? e.message : 'mergeTables failed' })
    }
  },
  unmergeTable: async (baseTableId) => {
    if (!baseTableId) return
    try {
      const state = get()
      const base = state.tables.find(t => t.id === baseTableId)
      if (!base) throw new Error('主桌不存在')
      const mergedIds: string[] = base.metadata?.merged_with || []
      const { error: upErr } = await supabase.from('tables').update({
        metadata: { ...(base.metadata || {}), merged_with: [], merged_capacity: base.capacity },
        updated_at: new Date().toISOString()
      }).eq('id', baseTableId)
      if (upErr) throw upErr
      if (mergedIds.length) {
        const { error: othersErr } = await supabase.from('tables').update({
          metadata: {},
          status: 'available',
          updated_at: new Date().toISOString()
        }).in('id', mergedIds)
        if (othersErr) console.warn('附屬桌解除失敗', othersErr.message)
      }
      set({ tables: state.tables.map(t => {
        if (t.id === baseTableId) return { ...t, metadata: { ...(t.metadata || {}), merged_with: [], merged_capacity: t.capacity } }
        if (mergedIds.includes(t.id)) return { ...t, metadata: {}, status: 'available' }
        return t
      }) })
    } catch (e) {
      console.error('unmergeTable error', e)
      set({ error: e instanceof Error ? e.message : 'unmergeTable failed' })
    }
  }
})
