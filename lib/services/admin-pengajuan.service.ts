import { createClient } from '@/lib/supabase/client'

export interface AdminPengajuanFilterParams {
  status?: string
  bidangId?: string | number
  search?: string
  page?: number
  limit?: number
}

export interface AdminPengajuanListItem {
  id: number | string
  public_id: string
  user_id: string
  bidang_id: number | string
  pembimbing_id?: number | string | null
  nomor_surat: string
  tanggal_surat: string
  jenjang: string
  asal_instansi: string
  jurusan: string
  tanggal_mulai: string
  tanggal_selesai: string
  durasi_bulan: number
  jumlah_anggota: number
  nama_lengkap: string
  nim_nis: string
  status: string
  created_at: string
  bidangs?: {
    id: number | string
    nama: string
  } | null
  pembimbings?: {
    id: number | string
    nama: string
    nip?: string | null
    jabatan?: string | null
  } | null
}

export interface AdminPengajuanDetailItem extends AdminPengajuanListItem {
  anggota?: Array<{
    nama: string
    nim_nis: string
    no_hp?: string
    jurusan?: string
  }>
  jenis_kelamin?: string | null
  no_hp?: string | null
  alamat?: string | null
  foto_url?: string | null
  topik_magang?: string | null
  surat_pengantar_url?: string | null
  proposal_url?: string | null
  dokumen_tambahan_url?: string | null
  surat_balasan_url?: string | null
  sertifikat_url?: string | null
  alasan_penolakan?: string | null
  updated_at?: string | null
  profiles?: {
    id: string
    name: string
    email: string
    no_hp?: string | null
  } | null
}

export interface StatusLogItem {
  id: number | string
  pengajuan_id: number | string
  status: string
  catatan?: string | null
  created_by?: string | null
  created_at: string
}

export interface PembimbingOption {
  id: number | string
  nama: string
  nip?: string | null
  jabatan?: string | null
}

export interface VerifikasiPayload {
  pengajuanId: number | string
  userId: string
  status: 'Sedang Magang' | 'Ditolak' | 'Selesai'
  pembimbingId?: number | string | null
  alasanPenolakan?: string | null
  catatan?: string | null
  adminId?: string | null
}

export const adminPengajuanService = {
  /**
   * Mengambil daftar seluruh pengajuan dengan filter, search, & pagination
   */
  async getAdminPengajuans(params: AdminPengajuanFilterParams = {}): Promise<{
    data: AdminPengajuanListItem[]
    totalCount: number
    page: number
    limit: number
    error: string | null
  }> {
    try {
      const supabase = createClient()
      const page = params.page && params.page > 0 ? params.page : 1
      const limit = params.limit && params.limit > 0 ? params.limit : 10
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          user_id,
          bidang_id,
          pembimbing_id,
          nomor_surat,
          tanggal_surat,
          jenjang,
          asal_instansi,
          jurusan,
          tanggal_mulai,
          tanggal_selesai,
          durasi_bulan,
          jumlah_anggota,
          nama_lengkap,
          nim_nis,
          status,
          created_at,
          bidangs (
            id,
            nama
          ),
          pembimbings (
            id,
            nama,
            nip,
            jabatan
          )
        `, { count: 'exact' })

      // Filter status
      if (params.status && params.status !== 'semua' && params.status !== 'All') {
        query = query.eq('status', params.status)
      }

      // Filter bidang
      if (params.bidangId && params.bidangId !== 'semua' && params.bidangId !== 'All') {
        query = query.eq('bidang_id', Number(params.bidangId))
      }

      // Search keyword pada nama_lengkap, nim_nis, asal_instansi, nomor_surat
      if (params.search && params.search.trim() !== '') {
        const term = params.search.trim()
        query = query.or(`nama_lengkap.ilike.%${term}%,nim_nis.ilike.%${term}%,asal_instansi.ilike.%${term}%,nomor_surat.ilike.%${term}%,public_id.ilike.%${term}%`)
      }

      query = query.order('created_at', { ascending: false }).range(from, to)

      const { data, count, error } = await query

      if (error) {
        return {
          data: [],
          totalCount: 0,
          page,
          limit,
          error: error.message,
        }
      }

      return {
        data: (data as any[]) || [],
        totalCount: count || 0,
        page,
        limit,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengajuan.'
      return {
        data: [],
        totalCount: 0,
        page: 1,
        limit: 10,
        error: msg,
      }
    }
  },

  /**
   * Mengambil rincian mendalam satu pengajuan berdasarkan public_id
   */
  async getAdminPengajuanDetail(publicId: string): Promise<{
    data: AdminPengajuanDetailItem | null
    error: string | null
  }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('pengajuans')
        .select(`
          *,
          bidangs (
            id,
            nama,
            deskripsi,
            kuota
          ),
          pembimbings (
            id,
            nama,
            nip,
            jabatan,
            email,
            no_hp
          ),
          profiles:user_id (
            id,
            name,
            email,
            no_hp
          )
        `)
        .eq('public_id', publicId)
        .single()

      if (error || !data) {
        return {
          data: null,
          error: error?.message || 'Pengajuan tidak ditemukan.',
        }
      }

      return {
        data: data as AdminPengajuanDetailItem,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil rincian pengajuan.'
      return {
        data: null,
        error: msg,
      }
    }
  },

  /**
   * Mengambil riwayat audit log status dari pengajuan_status_logs
   */
  async getPengajuanStatusLogs(pengajuanId: number | string): Promise<{
    data: StatusLogItem[]
    error: string | null
  }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('pengajuan_status_logs')
        .select('*')
        .eq('pengajuan_id', pengajuanId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error: error.message }
      }

      return {
        data: (data as StatusLogItem[]) || [],
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat riwayat status.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil daftar pembimbing yang terhubung dengan bidang tertentu
   */
  async getBidangPembimbings(bidangId: number | string): Promise<{
    data: PembimbingOption[]
    error: string | null
  }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('bidang_pembimbing')
        .select(`
          pembimbing_id,
          pembimbings (
            id,
            nama,
            nip,
            jabatan,
            is_active
          )
        `)
        .eq('bidang_id', bidangId)
        .eq('is_active', true)

      if (error) {
        // Fallback jika bidang_pembimbing kosong, ambil semua pembimbing aktif
        const { data: allPembimbing } = await supabase
          .from('pembimbings')
          .select('id, nama, nip, jabatan')
          .eq('is_active', true)

        return {
          data: (allPembimbing as PembimbingOption[]) || [],
          error: null,
        }
      }

      const pembimbings: PembimbingOption[] = (data || [])
        .map((item: any) => item.pembimbings)
        .filter((p: any) => p && p.is_active !== false)
        .map((p: any) => ({
          id: p.id,
          nama: p.nama,
          nip: p.nip,
          jabatan: p.jabatan,
        }))

      return { data: pembimbings, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat pembimbing bidang.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil daftar seluruh bidang magang untuk dropdown filter (Client-safe)
   */
  async getBidangList(): Promise<{ data: Array<{ id: number | string; nama: string }>; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bidangs')
        .select('id, nama')
        .order('id', { ascending: true })

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: (data as any[]) || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar bidang.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menjalankan mutasi verifikasi: Update pengajuans + Insert log + Insert notifikasi
   */
  async verifikasiPengajuan(payload: VerifikasiPayload): Promise<{
    success: boolean
    error: string | null
  }> {
    try {
      const supabase = createClient()

      // 1. Siapkan update data pada tabel pengajuans
      const updateData: any = {
        status: payload.status,
        updated_at: new Date().toISOString(),
      }

      if (payload.status === 'Sedang Magang' && payload.pembimbingId) {
        updateData.pembimbing_id = Number(payload.pembimbingId)
      }

      if (payload.status === 'Ditolak' && payload.alasanPenolakan) {
        updateData.alasan_penolakan = payload.alasanPenolakan.trim()
      }

      // Jalankan UPDATE ke pengajuans
      const { error: updateError } = await supabase
        .from('pengajuans')
        .update(updateData)
        .eq('id', payload.pengajuanId)

      if (updateError) {
        return {
          success: false,
          error: updateError.message || 'Gagal memperbarui status pengajuan.',
        }
      }

      // 2. Insert ke pengajuan_status_logs
      const logCatatan =
        payload.status === 'Ditolak'
          ? payload.alasanPenolakan || payload.catatan || 'Pengajuan ditolak oleh administrator'
          : payload.catatan || (payload.status === 'Sedang Magang' ? 'Pengajuan diterima & peserta sedang magang' : 'Periode magang telah diselesaikan')

      try {
        await supabase
          .from('pengajuan_status_logs')
          .insert([
            {
              pengajuan_id: payload.pengajuanId,
              status: payload.status,
              catatan: logCatatan,
              created_by: payload.adminId || null,
            },
          ])
      } catch (logErr) {
        console.warn('Gagal mencatat status log:', logErr)
      }

      // 3. Insert notifikasi ke akun pemohon
      let notifJudul = 'Update Status Pengajuan Magang'
      let notifPesan = `Status pengajuan magang Anda telah diperbarui menjadi "${payload.status}".`

      if (payload.status === 'Sedang Magang') {
        notifJudul = 'Pengajuan Magang Diterima'
        notifPesan = 'Selamat, permohonan magang Anda telah disetujui oleh BRMP PH. Anda kini berstatus Sedang Magang.'
      } else if (payload.status === 'Ditolak') {
        notifJudul = 'Pengajuan Magang Ditolak'
        notifPesan = `Mohon maaf, permohonan magang Anda belum dapat disetujui. Alasan: ${payload.alasanPenolakan || 'Persyaratan belum terpenuhi'}.`
      } else if (payload.status === 'Selesai') {
        notifJudul = 'Magang Telah Selesai'
        notifPesan = 'Selamat! Anda telah menyelesaikan seluruh rangkaian kegiatan magang di BRMP PH.'
      }

      try {
        await supabase
          .from('notifikasi')
          .insert([
            {
              user_id: payload.userId,
              judul: notifJudul,
              pesan: notifPesan,
              is_read: false,
            },
          ])
      } catch (notifErr) {
        console.warn('Gagal membuat entri notifikasi:', notifErr)
      }

      return {
        success: true,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan sistem saat memverifikasi pengajuan.'
      return {
        success: false,
        error: msg,
      }
    }
  },
}
