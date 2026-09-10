import { createClient } from '@/lib/supabase/server'

export interface BidangItem {
  id: number | string
  nama: string
  deskripsi?: string | null
  kuota?: number | null
  is_active?: boolean | null
  created_at?: string | null
}

export const bidangService = {
  /**
   * Mengambil daftar bidang magang untuk landing page publik (Server-Side)
   */
  async getPublicBidangs(): Promise<{ data: BidangItem[]; error: string | null }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('bidangs')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: (data as BidangItem[]) || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data bidang.'
      return { data: [], error: msg }
    }
  },
}
