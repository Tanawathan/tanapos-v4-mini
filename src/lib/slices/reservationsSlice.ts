import { StateCreator } from 'zustand'
import { supabase } from '../supabase'
import { TableReservation } from '../types'

export interface ReservationsSliceState {
  reservations: TableReservation[]
  loadReservations: (restaurantId: string) => Promise<void>
}

export const createReservationsSlice: StateCreator<ReservationsSliceState, [], [], ReservationsSliceState> = (set) => ({
  reservations: [],
  loadReservations: async (restaurantId: string) => {
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('reservation_time', { ascending: true })
      if (error) throw error
      set({ reservations: data || [] })
    } catch (e) {
      console.error('loadReservations error', e)
    }
  }
})
