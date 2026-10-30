import { createClient } from '@/lib/supabase/client'
import type { AppRole } from '@/types/auth.types'
import { ACTIVE_PENGAJUAN_STATUSES } from '@/lib/constants/status'

export interface AdminUserListItem {
  id: string
  name: string
  email: string
  role: AppRole
  no_hp: string | null
  asal_instansi: string | null
  jurusan: string | null
  jenis_kelamin: string | null
  avatar: string | null
  is_active: boolean
  status_peserta: 'Mahasiswa' | 'Siswa' | null
  created_at: string | null
  updated_at: string | null
  total_pengajuan?: number
  pengajuan_aktif?: number
}

export interface AdminUserPengajuanHistoryItem {
  id: number | string
  public_id: string
  status: string
  nomor_surat?: string | null
  created_at: string
  tanggal_mulai?: string | null
  tanggal_selesai?: string | null
  durasi_bulan?: number | null
  jumlah_anggota?: number | null
  bidang_nama?: string | null
  pembimbing_nama?: string | null
}

export interface AdminUserDetailItem {
  profile: AdminUserListItem
  pengajuanStats: {
    total: number
    menungguVerifikasi: number
    sedangMagang: number
    selesai: number
    ditolak: number
    dibatalkan: number
  }
  pengajuanList: AdminUserPengajuanHistoryItem[]
}

export interface AdminUserFilterParams {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  role?: 'all' | 'pengguna' | 'administrator'
  status_peserta?: 'all' | 'Mahasiswa' | 'Siswa' | 'null'
  page?: number
  limit?: number
}

export interface AdminUserStats {
  totalUser: number
  activeUser: number
  inactiveUser: number
  totalPengguna: number
  totalAdmin: number
}

export const adminUserService = {
  /**
   * Mengambil statistik ringkas pengguna untuk kartu metrik
   */
  async getUserStats(): Promise<{ data: AdminUserStats; error: string | null }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_active')

      if (error) {
        return {
          data: {
            totalUser: 0,
            activeUser: 0,
            inactiveUser: 0,
            totalPengguna: 0,
            totalAdmin: 0,
          },
          error: error.message,
        }
      }

      const totalUser = data?.length || 0
      const activeUser = data?.filter((u) => u.is_active !== false).length || 0
      const inactiveUser = data?.filter((u) => u.is_active === false).length || 0
      const totalPengguna = data?.filter((u) => u.role === 'pengguna').length || 0
      const totalAdmin = data?.filter((u) => u.role === 'administrator').length || 0

      return {
        data: {
          totalUser,
          activeUser,
          inactiveUser,
          totalPengguna,
          totalAdmin,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat statistik pengguna.'
      return {
        data: {
          totalUser: 0,
          activeUser: 0,
          inactiveUser: 0,
          totalPengguna: 0,
          totalAdmin: 0,
        },
        error: msg,
      }
    }
  },

  /**
   * Mengambil daftar pengguna terdaftar dengan filter, pencarian, dan pagination
   */
  async getAdminUsers(params: AdminUserFilterParams = {}): Promise<{
    data: AdminUserListItem[]
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
        .from('profiles')
        .select(
          'id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at, status_peserta',
          { count: 'exact' }
        )

      // Filter Role
      if (params.role && params.role !== 'all') {
        query = query.eq('role', params.role)
      }

      // Filter Status Akun
      if (params.status === 'active') {
        query = query.eq('is_active', true)
      } else if (params.status === 'inactive') {
        query = query.eq('is_active', false)
      }

      // Filter Status Peserta (Mahasiswa / Siswa / Belum Ditentukan)
      if (params.status_peserta && params.status_peserta !== 'all') {
        if (params.status_peserta === 'null') {
          query = query.is('status_peserta', null)
        } else {
          query = query.eq('status_peserta', params.status_peserta)
        }
      }

      // Search keyword pada name, email, asal_instansi, jurusan
      if (params.search && params.search.trim() !== '') {
        const term = params.search.trim()
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,asal_instansi.ilike.%${term}%,jurusan.ilike.%${term}%`)
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

      const users: AdminUserListItem[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name || 'Tanpa Nama',
        email: row.email,
        role: row.role as AppRole,
        no_hp: row.no_hp || null,
        asal_instansi: row.asal_instansi || null,
        jurusan: row.jurusan || null,
        jenis_kelamin: row.jenis_kelamin || null,
        avatar: row.avatar || null,
        is_active: row.is_active ?? true,
        status_peserta: (row.status_peserta as 'Mahasiswa' | 'Siswa' | null) || null,
        created_at: row.created_at || null,
        updated_at: row.updated_at || null,
      }))

      // Ambil ringkasan jumlah pengajuan per user (batch query)
      if (users.length > 0) {
        const userIds = users.map((u) => u.id)
        const { data: pengajuanSummary, error: summaryError } = await supabase
          .from('pengajuans')
          .select('user_id, status')
          .in('user_id', userIds)

        if (!summaryError && pengajuanSummary) {
          const totalMap: Record<string, number> = {}
          const activeMap: Record<string, number> = {}

          for (const item of pengajuanSummary) {
            const uid = item.user_id
            if (uid) {
              totalMap[uid] = (totalMap[uid] || 0) + 1
              if (item.status === 'Sedang Magang' || item.status === 'Disetujui') {
                activeMap[uid] = (activeMap[uid] || 0) + 1
              }
            }
          }

          users.forEach((u) => {
            u.total_pengajuan = totalMap[u.id] || 0
            u.pengajuan_aktif = activeMap[u.id] || 0
          })
        }
      }

      return {
        data: users,
        totalCount: count || 0,
        page,
        limit,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengguna.'
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
   * Mengambil detail profil pengguna beserta riwayat pengajuan magangnya
   */
  async getAdminUserDetail(userId: string): Promise<{
    data: AdminUserDetailItem | null
    error: string | null
  }> {
    try {
      const supabase = createClient()

      // 1. Ambil data profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at, status_peserta')
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        return {
          data: null,
          error: profileError?.message || 'Data pengguna tidak ditemukan.',
        }
      }

      // 2. Ambil riwayat pengajuan user dari tabel pengajuans
      const { data: pengajuansData, error: pengajuansError } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          status,
          nomor_surat,
          created_at,
          tanggal_mulai,
          tanggal_selesai,
          durasi_bulan,
          jumlah_anggota,
          bidangs (
            nama
          ),
          pembimbings (
            nama
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (pengajuansError) {
        console.warn('Gagal memuat histori pengajuan user:', pengajuansError.message)
      }

      const rawPengajuans = pengajuansData || []

      // Hitung agregasi status pengajuan
      const stats = {
        total: rawPengajuans.length,
        menungguVerifikasi: rawPengajuans.filter((p: any) => p.status === 'Menunggu Verifikasi').length,
        sedangMagang: rawPengajuans.filter((p: any) => p.status === 'Sedang Magang' || p.status === 'Disetujui').length,
        selesai: rawPengajuans.filter((p: any) => p.status === 'Selesai').length,
        ditolak: rawPengajuans.filter((p: any) => p.status === 'Ditolak').length,
        dibatalkan: rawPengajuans.filter((p: any) => p.status === 'Dibatalkan').length,
      }

      const pengajuanList: AdminUserPengajuanHistoryItem[] = rawPengajuans.map((p: any) => ({
        id: p.id,
        public_id: p.public_id,
        status: p.status,
        nomor_surat: p.nomor_surat || null,
        created_at: p.created_at,
        tanggal_mulai: p.tanggal_mulai || null,
        tanggal_selesai: p.tanggal_selesai || null,
        durasi_bulan: p.durasi_bulan || 1,
        jumlah_anggota: p.jumlah_anggota || 1,
        bidang_nama: p.bidangs?.nama || '-',
        pembimbing_nama: p.pembimbings?.nama || '-',
      }))

      return {
        data: {
          profile: {
            id: profileData.id,
            name: profileData.name || 'Tanpa Nama',
            email: profileData.email,
            role: profileData.role as AppRole,
            no_hp: profileData.no_hp || null,
            asal_instansi: profileData.asal_instansi || null,
            jurusan: profileData.jurusan || null,
            jenis_kelamin: profileData.jenis_kelamin || null,
            avatar: profileData.avatar || null,
            is_active: profileData.is_active ?? true,
            status_peserta: (profileData.status_peserta as 'Mahasiswa' | 'Siswa' | null) || null,
            created_at: profileData.created_at || null,
            updated_at: profileData.updated_at || null,
          },
          pengajuanStats: stats,
          pengajuanList,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil detail pengguna.'
      return {
        data: null,
        error: msg,
      }
    }
  },

  /**
   * Mengubah status aktif / nonaktif akun pengguna
   * Proteksi: Administrator tidak diizinkan menonaktifkan akun miliknya sendiri.
   */
  async toggleUserActiveStatus(
    targetUserId: string,
    currentAdminId: string,
    isActive: boolean
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!targetUserId) {
        return { success: false, error: 'ID Pengguna tidak valid.' }
      }

      // Proteksi akun admin sendiri
      if (targetUserId === currentAdminId && !isActive) {
        return {
          success: false,
          error: 'Tindakan ditolak: Administrator tidak dapat menonaktifkan akun miliknya sendiri.',
        }
      }

      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status aktif pengguna.'
      return { success: false, error: msg }
    }
  },

  /**
   * Cek apakah pengguna memiliki pengajuan magang yang masih aktif / berjalan
   * Berbasis konstanta ACTIVE_PENGAJUAN_STATUSES ('Menunggu Verifikasi', 'Disetujui', 'Sedang Magang')
   */
  async checkUserActivePengajuan(userId: string): Promise<{
    hasActive: boolean
    activeCount: number
    activeList: { id: number | string; public_id: string; status: string; bidang_nama?: string }[]
    error: string | null
  }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pengajuans')
        .select('id, public_id, status, bidangs(nama)')
        .eq('user_id', userId)
        .in('status', ACTIVE_PENGAJUAN_STATUSES as unknown as string[])

      if (error) {
        return { hasActive: false, activeCount: 0, activeList: [], error: error.message }
      }

      const activeList = (data || []).map((item: any) => ({
        id: item.id,
        public_id: item.public_id,
        status: item.status,
        bidang_nama: item.bidangs?.nama || '-',
      }))

      return {
        hasActive: activeList.length > 0,
        activeCount: activeList.length,
        activeList,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memeriksa pengajuan aktif.'
      return { hasActive: false, activeCount: 0, activeList: [], error: msg }
    }
  },

  /**
   * Mengubah status peserta dan/atau role akun pengguna via RPC resmi admin_update_user_account
   * Jalur resmi aman:
   * - Menghapus seluruh mutasi langsung ke profiles.role / profiles.status_peserta
   * - Validasi role pemanggil adalah administrator di server/PostgreSQL
   * - Guard self-demotion (admin tidak dapat menurunkan role sendiri)
   * - Guard proteksi administrator aktif terakhir
   * - Pencatatan audit trail ke public.user_audit_logs
   */
  async updateUserAccount(
    targetUserId: string,
    payload: {
      role?: AppRole
      status_peserta?: 'Mahasiswa' | 'Siswa'
    }
  ): Promise<{ success: boolean; error: string | null; updatedFields?: string[] }> {
    try {
      if (!targetUserId) {
        return { success: false, error: 'ID Pengguna tidak valid.' }
      }

      const supabase = createClient()

      const { data, error } = await supabase.rpc('admin_update_user_account', {
        p_target_user_id: targetUserId,
        p_new_role: payload.role || null,
        p_new_status_peserta: payload.status_peserta || null,
      })

      if (error) {
        const friendlyMessage = mapAdminRpcErrorMessage(error.message)
        return { success: false, error: friendlyMessage }
      }

      const res = data as any
      if (res && res.success === false) {
        return { success: false, error: mapAdminRpcErrorMessage(res.message || '') }
      }

      return {
        success: true,
        error: null,
        updatedFields: res?.updated_fields || [],
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      return { success: false, error: mapAdminRpcErrorMessage(rawMsg) }
    }
  },

  /**
   * Mengubah status peserta (Mahasiswa / Siswa) oleh Administrator via RPC resmi
   */
  async updateUserStatusPeserta(
    targetUserId: string,
    newStatusPeserta: 'Mahasiswa' | 'Siswa'
  ): Promise<{ success: boolean; error: string | null }> {
    return this.updateUserAccount(targetUserId, { status_peserta: newStatusPeserta })
  },
}

/**
 * Pemetaan kode error PostgreSQL/RPC admin_update_user_account ke pesan ramah bahasa Indonesia.
 * Prioritas: Mengecek kode paling spesifik terlebih dahulu (SELF_DEMOTION_FORBIDDEN dan LAST_ADMIN_PROTECTION sebelum FORBIDDEN).
 * Fallback aman: Menghindari eksposur error database mentah ke antarmuka pengguna.
 */
export function mapAdminRpcErrorMessage(rawError: string): string {
  console.error('[adminUserService] Detail error RPC admin_update_user_account:', rawError)
  const err = (rawError || '').toUpperCase()

  // 1. Kode Paling Spesifik (Wajib dicek sebelum FORBIDDEN)
  if (err.includes('SELF_DEMOTION_FORBIDDEN')) {
    return 'Tindakan ditolak: Administrator tidak dapat menurunkan role akun miliknya sendiri.'
  }
  if (err.includes('LAST_ADMIN_PROTECTION')) {
    return 'Tindakan ditolak: Sistem wajib memiliki minimal satu administrator aktif.'
  }

  // 2. Kode Autentikasi & Otorisasi
  if (err.includes('UNAUTHORIZED')) {
    return 'Sesi login Anda tidak valid atau telah berakhir. Silakan login kembali.'
  }
  if (err.includes('FORBIDDEN')) {
    return 'Akses ditolak: Hanya administrator yang berwenang mengubah status atau role akun.'
  }

  // 3. Kode Validasi Input & Entitas
  if (err.includes('INVALID_ROLE')) {
    return 'Role yang dipilih tidak valid. Role harus berupa pengguna atau administrator.'
  }
  if (err.includes('INVALID_STATUS')) {
    return 'Status peserta tidak valid. Status harus berupa Mahasiswa atau Siswa.'
  }
  if (err.includes('NOT_FOUND')) {
    return 'Data pengguna target tidak ditemukan di sistem.'
  }
  if (err.includes('INVALID_INPUT')) {
    return 'Parameter input yang dikirimkan tidak valid atau tidak lengkap.'
  }

  // 4. Default Fallback Generik Ramah Pengguna
  return 'Terjadi kesalahan sistem saat memperbarui akun pengguna. Silakan coba beberapa saat lagi.'
}
