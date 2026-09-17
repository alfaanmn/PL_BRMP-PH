import { createClient } from '@/lib/supabase/client'

export interface AdminPembimbingListItem {
  id: number | string
  nama: string
  nip?: string | null
  jabatan?: string | null
  email?: string | null
  no_hp?: string | null
  spesialisasi?: string | null
  kuota_default: number
  peserta_aktif_count: number
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
  bidang_count: number
  bidang_list: Array<{
    assignment_id: number | string
    bidang_id: number | string
    nama: string
    kuota?: number
    is_active: boolean
  }>
}

export interface CreatePembimbingPayload {
  nama: string
  nip?: string | null
  jabatan?: string | null
  email?: string | null
  no_hp?: string | null
  spesialisasi?: string | null
  kuota_default?: number
  is_active?: boolean
}

export interface UpdatePembimbingPayload {
  nama?: string
  nip?: string | null
  jabatan?: string | null
  email?: string | null
  no_hp?: string | null
  spesialisasi?: string | null
  kuota_default?: number
  is_active?: boolean
}

export interface AdminPembimbingStats {
  totalPembimbing: number
  activePembimbing: number
  totalKapasitas: number
  totalBimbinganAktif: number
}

export const adminPembimbingService = {
  /**
   * Mengambil daftar master pembimbing lapangan beserta bidang terkait dan jumlah bimbingan aktif
   */
  async getPembimbingList(params?: {
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }): Promise<{ data: AdminPembimbingListItem[]; error: string | null }> {
    try {
      const supabase = createClient()

      // 1. Query master pembimbings
      let query = supabase.from('pembimbings').select('*').order('id', { ascending: true })

      if (params?.status === 'active') {
        query = query.eq('is_active', true)
      } else if (params?.status === 'inactive') {
        query = query.eq('is_active', false)
      }

      if (params?.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`
        query = query.or(`nama.ilike.${term},nip.ilike.${term},jabatan.ilike.${term},email.ilike.${term}`)
      }

      const { data: pembimbingsData, error: pembimbingsError } = await query

      if (pembimbingsError) {
        return { data: [], error: pembimbingsError.message }
      }

      if (!pembimbingsData || pembimbingsData.length === 0) {
        return { data: [], error: null }
      }

      const pembimbingIds = pembimbingsData.map((p) => p.id)

      // 2. Ambil penugasan bidang_pembimbing
      const { data: relationsData, error: relationsError } = await supabase
        .from('bidang_pembimbing')
        .select(`
          id,
          bidang_id,
          pembimbing_id,
          is_active,
          bidangs (
            id,
            nama,
            kuota,
            is_active
          )
        `)
        .in('pembimbing_id', pembimbingIds)

      if (relationsError) {
        console.warn('Gagal memuat relasi bidang_pembimbing:', relationsError.message)
      }

      // 3. Ambil pengajuan aktif yang dibimbing oleh pembimbing ini
      const { data: pengajuansData, error: pengajuansError } = await supabase
        .from('pengajuans')
        .select('id, pembimbing_id, jumlah_anggota, status')
        .in('status', ['Sedang Magang', 'Disetujui'])
        .in('pembimbing_id', pembimbingIds)

      if (pengajuansError) {
        console.warn('Gagal memuat pengajuan aktif bimbingan:', pengajuansError.message)
      }

      // Map relasi bidang per pembimbing
      const relationsMap = new Map<number | string, any[]>()
      if (relationsData) {
        for (const rel of relationsData) {
          const pId = rel.pembimbing_id
          if (!relationsMap.has(pId)) {
            relationsMap.set(pId, [])
          }
          if (rel.bidangs) {
            relationsMap.get(pId)!.push({
              assignment_id: rel.id,
              bidang_id: rel.bidang_id,
              nama: (rel.bidangs as any).nama,
              kuota: (rel.bidangs as any).kuota,
              is_active: rel.is_active && (rel.bidangs as any).is_active !== false,
            })
          }
        }
      }

      // Map peserta aktif per pembimbing
      const activePesertaMap = new Map<number | string, number>()
      if (pengajuansData) {
        for (const p of pengajuansData) {
          const pId = p.pembimbing_id
          if (pId) {
            const current = activePesertaMap.get(pId) || 0
            const count = Number(p.jumlah_anggota) || 1
            activePesertaMap.set(pId, current + count)
          }
        }
      }

      // Format data list
      const formatted: AdminPembimbingListItem[] = pembimbingsData.map((p) => {
        const bList = relationsMap.get(p.id) || []
        const activePeserta = activePesertaMap.get(p.id) || 0

        return {
          id: p.id,
          nama: p.nama,
          nip: p.nip || null,
          jabatan: p.jabatan || null,
          email: p.email || null,
          no_hp: p.no_hp || null,
          spesialisasi: p.spesialisasi || null,
          kuota_default: Number(p.kuota_default) || 0,
          peserta_aktif_count: activePeserta,
          is_active: p.is_active ?? true,
          created_at: p.created_at || null,
          updated_at: p.updated_at || null,
          bidang_count: bList.filter((b) => b.is_active).length,
          bidang_list: bList,
        }
      })

      return { data: formatted, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat master pembimbing.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menambah pembimbing baru
   */
  async createPembimbing(payload: CreatePembimbingPayload): Promise<{ data: any; error: string | null }> {
    try {
      if (!payload.nama || !payload.nama.trim()) {
        return { data: null, error: 'Nama pembimbing wajib diisi.' }
      }

      const supabase = createClient()
      const insertData = {
        nama: payload.nama.trim(),
        nip: payload.nip?.trim() || null,
        jabatan: payload.jabatan?.trim() || null,
        email: payload.email?.trim() || null,
        no_hp: payload.no_hp?.trim() || null,
        spesialisasi: payload.spesialisasi?.trim() || null,
        kuota_default: Number(payload.kuota_default) || 5,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
      }

      const { data, error } = await supabase.from('pembimbings').insert([insertData]).select().single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan pembimbing.'
      return { data: null, error: msg }
    }
  },

  /**
   * Mengedit data pembimbing
   */
  async updatePembimbing(
    id: number | string,
    payload: UpdatePembimbingPayload
  ): Promise<{ data: any; error: string | null }> {
    try {
      if (payload.nama !== undefined && !payload.nama.trim()) {
        return { data: null, error: 'Nama pembimbing tidak boleh kosong.' }
      }

      const supabase = createClient()
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }

      if (payload.nama !== undefined) updateData.nama = payload.nama.trim()
      if (payload.nip !== undefined) updateData.nip = payload.nip?.trim() || null
      if (payload.jabatan !== undefined) updateData.jabatan = payload.jabatan?.trim() || null
      if (payload.email !== undefined) updateData.email = payload.email?.trim() || null
      if (payload.no_hp !== undefined) updateData.no_hp = payload.no_hp?.trim() || null
      if (payload.spesialisasi !== undefined) updateData.spesialisasi = payload.spesialisasi?.trim() || null
      if (payload.kuota_default !== undefined) updateData.kuota_default = Number(payload.kuota_default) || 0
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active

      const { data, error } = await supabase.from('pembimbings').update(updateData).eq('id', id).select().single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui pembimbing.'
      return { data: null, error: msg }
    }
  },

  /**
   * Mengubah status aktif/nonaktif pembimbing
   */
  async toggleStatus(id: number | string, is_active: boolean): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('pembimbings')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status pembimbing.'
      return { success: false, error: msg }
    }
  },

  /**
   * Mengambil semua master bidang aktif untuk pilihan dropdown penugasan
   */
  async getAvailableBidangs(): Promise<{
    data: Array<{ id: number | string; nama: string; kuota: number }>;
    error: string | null;
  }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bidangs')
        .select('id, nama, kuota')
        .eq('is_active', true)
        .order('nama', { ascending: true })

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat bidang.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menugaskan bidang ke pembimbing
   */
  async assignBidang(
    pembimbingId: number | string,
    bidangId: number | string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = createClient()

      // Cek apakah relasi sudah ada
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
        if (existing.is_active) {
          return { success: true, error: null }
        }
        const { error: updateError } = await supabase
          .from('bidang_pembimbing')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (updateError) {
          return { success: false, error: updateError.message }
        }
        return { success: true, error: null }
      }

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
      const msg = err instanceof Error ? err.message : 'Gagal menugaskan bidang ke pembimbing.'
      return { success: false, error: msg }
    }
  },

  /**
   * Menghapus atau menonaktifkan penugasan bidang dari pembimbing
   */
  async removeBidangAssignment(assignmentId: number | string): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('bidang_pembimbing').delete().eq('id', assignmentId)

      if (error) {
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
      const msg = err instanceof Error ? err.message : 'Gagal melepaskan bidang dari pembimbing.'
      return { success: false, error: msg }
    }
  },

  /**
   * Menghapus pembimbing dengan proteksi foreign key pengajuan magang
   */
  async deletePembimbing(id: number | string): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = createClient()

      // 1. Pre-check apakah pembimbing terikat pada data pengajuan magang
      const { data: pengajuans, error: checkPengajuanError } = await supabase
        .from('pengajuans')
        .select('id')
        .eq('pembimbing_id', id)
        .limit(1)

      if (checkPengajuanError) {
        return { success: false, error: 'Gagal memverifikasi relasi bimbingan: ' + checkPengajuanError.message }
      }

      if (pengajuans && pengajuans.length > 0) {
        return {
          success: false,
          error: 'Pembimbing ini tidak dapat dihapus karena masih tercatat membimbing data pengajuan magang peserta. Silakan gunakan opsi "Nonaktifkan" jika pembimbing sedang tidak aktif.',
        }
      }

      // 2. Hapus relasi penugasan di bidang_pembimbing
      const { error: relError } = await supabase
        .from('bidang_pembimbing')
        .delete()
        .eq('pembimbing_id', id)

      if (relError) {
        console.warn('Gagal membersihkan relasi bidang_pembimbing:', relError.message)
      }

      // 3. Eksekusi DELETE pada master pembimbings (proteksi FK database sebagai lapisan terakhir)
      const { error: deleteError } = await supabase
        .from('pembimbings')
        .delete()
        .eq('id', id)

      if (deleteError) {
        if (deleteError.code === '23503' || deleteError.message?.toLowerCase().includes('foreign key')) {
          return {
            success: false,
            error: 'Tidak dapat menghapus pembimbing karena masih terdapat data yang terhubung di sistem (Foreign Key constraint). Silakan gunakan opsi "Nonaktifkan".',
          }
        }
        return { success: false, error: deleteError.message }
      }

      return { success: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus pembimbing.'
      return { success: false, error: msg }
    }
  },

  /**
   * Mengambil statistik global pembimbing secara terpisah dan dinamis (tidak terpengaruh search/filter)
   */
  async getPembimbingStats(): Promise<{ data: AdminPembimbingStats | null; error: string | null }> {
    try {
      const supabase = createClient()

      // Ambil seluruh master pembimbing
      const { data: allPembimbings, error: pembimbingError } = await supabase
        .from('pembimbings')
        .select('id, kuota_default, is_active')

      if (pembimbingError) {
        return { data: null, error: pembimbingError.message }
      }

      // Ambil pengajuan aktif yang sudah memiliki pembimbing
      const { data: activePengajuans, error: pengajuanError } = await supabase
        .from('pengajuans')
        .select('jumlah_anggota')
        .in('status', ['Sedang Magang', 'Disetujui'])
        .not('pembimbing_id', 'is', null)

      if (pengajuanError) {
        console.warn('Gagal menghitung bimbingan aktif:', pengajuanError.message)
      }

      const totalPembimbing = (allPembimbings || []).length
      const activePembimbing = (allPembimbings || []).filter((p) => p.is_active).length
      const totalKapasitas = (allPembimbings || []).reduce(
        (acc, p) => acc + (Number(p.kuota_default) || 0),
        0
      )
      const totalBimbinganAktif = (activePengajuans || []).reduce(
        (acc, p) => acc + (Number(p.jumlah_anggota) || 1),
        0
      )

      return {
        data: {
          totalPembimbing,
          activePembimbing,
          totalKapasitas,
          totalBimbinganAktif,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat statistik pembimbing.'
      return { data: null, error: msg }
    }
  },
}

