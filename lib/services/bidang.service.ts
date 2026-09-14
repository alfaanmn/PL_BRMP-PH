import { createClient } from '@/lib/supabase/server'

export interface PembimbingItem {
  id: number | string
  nama: string
  nip?: string | null
  jabatan?: string | null
  kuota?: number | null
  is_active?: boolean | null
}

export interface BidangItem {
  id: number | string
  nama: string
  deskripsi?: string | null
  kuota?: number | null
  is_active?: boolean | null
  created_at?: string | null
}

export interface BidangDetail extends BidangItem {
  pembimbings: PembimbingItem[]
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

  /**
   * Mengambil detail satu bidang beserta daftar pembimbingnya (Server-Side)
   */
  async getBidangById(id: string | number): Promise<{ data: BidangDetail | null; error: string | null }> {
    try {
      const supabase = await createClient()

      const { data: bidang, error: bidangError } = await supabase
        .from('bidangs')
        .select('*')
        .eq('id', id)
        .single()

      if (bidangError || !bidang) {
        return { data: null, error: bidangError?.message || 'Bidang tidak ditemukan.' }
      }

      // Ambil relasi pembimbing melalui bidang_pembimbing
      let pembimbings: PembimbingItem[] = []
      try {
        const { data: bpData } = await supabase
          .from('bidang_pembimbing')
          .select('pembimbing_id, pembimbings(id, nama, nip, jabatan, kuota, is_active)')
          .eq('bidang_id', id)

        if (bpData && bpData.length > 0) {
          pembimbings = bpData
            .map((item: any) => item.pembimbings)
            .filter((p: any) => p && p.is_active !== false)
        }
      } catch {
        // Fallback jika relasi bidang_pembimbing kosong
        pembimbings = []
      }

      return {
        data: {
          ...(bidang as BidangItem),
          pembimbings,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat detail bidang.'
      return { data: null, error: msg }
    }
  },
}
