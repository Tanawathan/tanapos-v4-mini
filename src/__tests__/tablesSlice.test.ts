import { describe, it, expect, vi, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createTablesSlice, TablesSliceState } from '../lib/slices/tablesSlice'

vi.mock('../lib/supabase', () => ({ supabase: {} }))
import { supabase } from '../lib/supabase'

interface TestStore extends TablesSliceState { loading: boolean; error: string | null }

const createTestStore = () => create<TestStore>()((...a) => ({
  ...createTablesSlice(...a),
  loading: false,
  error: null
}))

const mockUpdateBehavior = () => {
  ;(supabase as any).from = (table: string) => ({
    update: (_data: any) => ({
      eq: () => Promise.resolve({ error: null }),
      in: () => Promise.resolve({ error: null })
    })
  })
}

describe('tablesSlice merge/unmerge', () => {
  let store: ReturnType<typeof createTestStore>
  beforeEach(() => {
    store = createTestStore()
    mockUpdateBehavior()
    // Seed tables
    store.setState({ tables: [
      { id: 't1', restaurant_id: 'r1', table_number: 1, capacity: 2, metadata: {} },
      { id: 't2', restaurant_id: 'r1', table_number: 2, capacity: 4, metadata: {} },
      { id: 't3', restaurant_id: 'r1', table_number: 3, capacity: 2, metadata: {} }
    ] as any })
  })

  it('merges tables updates metadata and status', async () => {
    await store.getState().mergeTables('t1', ['t2', 't3'])
    const t1 = store.getState().tables.find(t => t.id === 't1')!
    const t2 = store.getState().tables.find(t => t.id === 't2')!
    expect(t1.metadata.merged_with).toEqual(['t2', 't3'])
    expect(t1.metadata.merged_capacity).toBe(8) // 2 + 4 + 2
    expect(t2.status).toBe('inactive')
  })

  it('unmerges tables restores statuses', async () => {
    // First merge
    await store.getState().mergeTables('t1', ['t2'])
    await store.getState().unmergeTable('t1')
    const t1 = store.getState().tables.find(t => t.id === 't1')!
    const t2 = store.getState().tables.find(t => t.id === 't2')!
    expect(t1.metadata.merged_with).toEqual([])
    expect(t2.status).toBe('available')
  })
})
