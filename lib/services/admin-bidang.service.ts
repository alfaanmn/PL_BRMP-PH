import { createClient } from '@/lib/supabase/client'

export interface BidangPembimbingRelation {
  id: number | string
  bidang_id: number | string
  pembimbing_id: number | string
  is_active: boolean
  pembimbings: {
    id: number | string
    nama: string
    nip?: string | null
    jabatan?: string | null
    email?: string | null
    no_hp?: string | null
    is_active?: boolean
  } | null
}

export interface AdminBidangListItem {
  id: number | string
  nama: string
  deskripsi?: string | null
  kuota: number
  terisi: number
  sisa_kuota: number
  peserta_aktif_count: number
  jenjang?: string | null
  persyaratan?: string | null
  tugas?: string | null
  banner_url?: string | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
  pembimbing_count: number
  pembimbing_list: Array<{
    assignment_id: number | string
    pembimbing_id: number | string
    nama: string
    nip?: string | null
    jabatan?: string | null
    email?: string | null
    no_hp?: string | null
    is_active: boolean
  }>
}

export interface CreateBidangPayload {
  nama: string
  deskripsi?: string | null
  kuota: number
  jenjang?: string | null
  persyaratan?: string | null
  tugas?: string | null
  is_active?: boolean
}

export interface UpdateBidangPayload {
  nama?: string
  deskripsi?: string | null
  kuota?: number
  jenjang?: string | null
  persyaratan?: string | null
  tugas?: string | null
  is_active?: boolean
}

export const adminBidangService = {
  /**
   * Mengambil daftar master bidang dengan relasi pembimbing dan hitungan peserta aktif
   */
  async getBidangList(params?: {
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }): Promise<{ data: AdminBidangListItem[]; error: string | null }> {
    try {
      const supabase = createClient()

      // 1. Ambil seluruh bidang
      let query = supabase.from('bidangs').select('*').order('id', { ascending: true })

      if (params?.status === 'active') {
        query = query.eq('is_active', true)
      } else if (params?.status === 'inactive') {
        query = query.eq('is_active', false)
      }

      if (params?.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`
        query = query.or(`nama.ilike.${term},deskripsi.ilike.${term}`)
      }

      const { data: bidangsData, error: bidangsError } = await query

      if (bidangsError) {
        return { data: [], error: bidangsError.message }
      }

      if (!bidangsData || bidangsData.length === 0) {
        return { data: [], error: null }
      }

      const bidangIds = bidangsData.map((b) => b.id)

      // 2. Ambil relasi bidang_pembimbing untuk bidang-bidang ini
      const { data: relationsData, error: relationsError } = await supabase
        .from('bidang_pembimbing')
        .select(`
          id,
          bidang_id,
          pembimbing_id,
          is_active,
          pembimbings (
            id,
            nama,
            nip,
            jabatan,
            email,
            no_hp,
            is_active
          )
        `)
        .in('bidang_id', bidangIds)

      if (relationsError) {
        console.warn('Gagal memuat relasi bidang_pembimbing:', relationsError.message)
      }

      // 3. Ambil pengajuan aktif (Sedang Magang, Disetujui) untuk menghitung peserta aktif riil
      const { data: pengajuansData, error: pengajuansError } = await supabase
        .from('pengajuans')
        .select('id, bidang_id, jumlah_anggota, status')
        .in('status', ['Sedang Magang', 'Disetujui'])
        .in('bidang_id', bidangIds)

      if (pengajuansError) {
        console.warn('Gagal memuat pengajuan aktif untuk kuota:', pengajuansError.message)
      }

      // Map relasi per bidang
      const relationsMap = new Map<number | string, any[]>()
      if (relationsData) {
        for (const rel of relationsData) {
          const bId = rel.bidang_id
          if (!relationsMap.has(bId)) {
            relationsMap.set(bId, [])
          }
          if (rel.pembimbings) {
            relationsMap.get(bId)!.push({
              assignment_id: rel.id,
              pembimbing_id: rel.pembimbing_id,
              nama: (rel.pembimbings as any).nama,
              nip: (rel.pembimbings as any).nip,
              jabatan: (rel.pembimbings as any).jabatan,
              email: (rel.pembimbings as any).email,
              no_hp: (rel.pembimbings as any).no_hp,
              is_active: rel.is_active && (rel.pembimbings as any).is_active !== false,
            })
          }
        }
      }

      // Map peserta aktif per bidang
      const activePesertaMap = new Map<number | string, number>()
      if (pengajuansData) {
        for (const p of pengajuansData) {
          const bId = p.bidang_id
          const current = activePesertaMap.get(bId) || 0
          const count = Number(p.jumlah_anggota) || 1
          activePesertaMap.set(bId, current + count)
        }
      }

      // Format data akhir
      const formatted: AdminBidangListItem[] = bidangsData.map((b) => {
        const kuota = Number(b.kuota) || 0
        const activePeserta = activePesertaMap.get(b.id) || 0
        // Sisa kuota berdasarkan kuota maks dikurangi peserta aktif riil (atau b.terisi jika lebih tinggi)
        const terisiActual = Math.max(Number(b.terisi) || 0, activePeserta)
        const sisa = Math.max(0, kuota - terisiActual)
        const pList = relationsMap.get(b.id) || []

        return {
          id: b.id,
          nama: b.nama,
          deskripsi: b.deskripsi || null,
          kuota: kuota,
          terisi: terisiActual,
          sisa_kuota: sisa,
          peserta_aktif_count: activePeserta,
          jenjang: b.jenjang || null,
          persyaratan: b.persyaratan || null,
          tugas: b.tugas || null,
          banner_url: b.banner_url || null,
          is_active: b.is_active ?? true,
          created_at: b.created_at || null,
          updated_at: b.updated_at || null,
          pembimbing_count: pList.filter((p) => p.is_active).length,
          pembimbing_list: pList,
        }
      })

      return { data: formatted, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat master bidang.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menambah bidang baru
   */
  async createBidang(payload: CreateBidangPayload): Promise<{ data: any; error: string | null }> {
    try {
      if (!payload.nama || !payload.nama.trim()) {
        return { data: null, error: 'Nama bidang wajib diisi.' }
      }
      if (payload.kuota < 0) {
        return { data: null, error: 'Kuota tidak boleh negatif.' }
      }

      const supabase = createClient()
      const insertData = {
        nama: payload.nama.trim(),
        deskripsi: payload.deskripsi?.trim() || null,
        kuota: Number(payload.kuota) || 0,
        terisi: 0,
        jenjang: payload.jenjang?.trim() || null,
        persyaratan: payload.persyaratan?.trim() || null,
        tugas: payload.tugas?.trim() || null,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
      }

      const { data, error } = await supabase.from('bidangs').insert([insertData]).select().single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan bidang.'
      return { data: null, error: msg }
    }
  },

  /**
   * Mengedit data bidang
   */
  async updateBidang(
    id: number | string,
    payload: UpdateBidangPayload
  ): Promise<{ data: any; error: string | null }> {
    try {
      if (payload.nama !== undefined && !payload.nama.trim()) {
        return { data: null, error: 'Nama bidang tidak boleh kosong.' }
      }
      if (payload.kuota !== undefined && payload.kuota < 0) {
        return { data: null, error: 'Kuota tidak boleh bernilai negatif.' }
      }

      const supabase = createClient()
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }

      if (payload.nama !== undefined) updateData.nama = payload.nama.trim()
      if (payload.deskripsi !== undefined) updateData.deskripsi = payload.deskripsi?.trim() || null
      if (payload.kuota !== undefined) updateData.kuota = Number(payload.kuota) || 0
      if (payload.jenjang !== undefined) updateData.jenjang = payload.jenjang?.trim() || null
      if (payload.persyaratan !== undefined) updateData.persyaratan = payload.persyaratan?.trim() || null
      if (payload.tugas !== undefined) updateData.tugas = payload.tugas?.trim() || null
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active

      const { data, error } = await supabase.from('bidangs').update(updateData).eq('id', id).select().single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui bidang.'
      return { data: null, error: msg }
    }
  },

  /**
   * Mengubah status aktif/nonaktif bidang
   */
  async toggleStatus(id: number | string, is_active: boolean): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('bidangs')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status bidang.'
      return { success: false, error: msg }
    }
  },

  /**
   * Mengambil semua master pembimbing aktif untuk pilihan dropdown penugasan
   */
  async getAvailablePembimbings(): Promise<{
    data: Array<{ id: number | string; nama: string; nip?: string | null; jabatan?: string | null; email?: string | null }>;
    error: string | null;
  }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pembimbings')
        .select('id, nama, nip, jabatan, email')
        .eq('is_active', true)
        .order('nama', { ascending: true })

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat pembimbing.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menghubungkan pembimbing ke bidang
   */
  async assignPembimbing(
    bidangId: number | string,
    pembimbingId: number | string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = createClient()

      // Cek apakah relasi sudah pernah ada
      const { data: existing, error: checkError } = await supabase
        .from('bidang_pembimbing')
        .select('id, is_active')
        .eq('bidang_id', bidangId)
        .eq('pembimbing_id', pembimbingId)
        .maybeSingle()

      if (checkError) {
        return { success: false, error: checkError.message }
      }

      if (existing) {
        // Jika sudah ada dan aktif, return info
        if (existing.is_active) {
          return { success: true, error: null }
        }
        // Jika sudah ada tetapi nonaktif, aktifkan kembali
        const { error: updateError } = await supabase
          .from('bidang_pembimbing')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (updateError) {
          return { success: false, error: updateError.message }
        }
        return { success: true, error: null }
      }

      // Jika belum ada, insert baru
      const { error: insertError } = await supabase.from('bidang_pembimbing').insert([
        {
          bidang_id: Number(bidangId),
          pembimbing_id: Number(pembimbingId),
          is_active: true,
        },
      ])

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      return { success: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungkan pembimbing.'
      return { success: false, error: msg }
    }
  },

  /**
   * Menghapus atau menonaktifkan penugasan pembimbing dari bidang
   */
  async removePembimbingAssignment(
    assignmentId: number | string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('bidang_pembimbing').delete().eq('id', assignmentId)

      if (error) {
        // Fallback ke update is_active = false jika delete diblokir foreign key
        const { error: fallbackError } = await supabase
          .from('bidang_pembimbing')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', assignmentId)

        if (fallbackError) {
          return { success: false, error: fallbackError.message }
        }
      }

      return { success: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melepaskan penugasan pembimbing.'
      return { success: false, error: msg }
    }
  },
}
