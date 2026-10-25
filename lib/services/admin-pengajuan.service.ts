import { createClient } from '@/lib/supabase/client'
import { emailService } from '@/lib/services/email.service'
import { notifikasiService } from '@/lib/services/notifikasi.service'
import { parseRpcError } from '@/lib/helpers/rpc-error-parser'

export interface AdminPengajuanFilterParams {
  status?: string
  bidangId?: string | number
  pembimbingId?: string | number
  jenjang?: string
  startDate?: string
  endDate?: string
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
  kuota_default: number
  terisi: number
  slot_tersedia: number
  is_active?: boolean
  is_full: boolean
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

export interface VerifikasiKelompokPayload {
  pengajuanId: number | string
  statusTarget: 'Sedang Magang' | 'Disetujui'
  pembimbingId?: number | string | null
  keputusanAnggota: Array<{
    id: number
    status: 'diterima' | 'ditolak'
    alasan?: string | null
  }>
  alasanPenolakanGlobal?: string | null
  suratBalasanUrl?: string | null
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

      // 1. Filter status
      if (params.status && params.status !== 'semua' && params.status !== 'All') {
        if (params.status === 'Sedang Magang') {
          query = query.in('status', ['Sedang Magang', 'Disetujui'])
        } else {
          query = query.eq('status', params.status)
        }
      }

      // 2. Filter bidang
      if (params.bidangId && params.bidangId !== 'semua' && params.bidangId !== 'All') {
        query = query.eq('bidang_id', Number(params.bidangId))
      }

      // 3. Filter pembimbing
      if (params.pembimbingId && params.pembimbingId !== 'semua' && params.pembimbingId !== 'All') {
        query = query.eq('pembimbing_id', Number(params.pembimbingId))
      }

      // 4. Filter jenjang
      if (params.jenjang && params.jenjang !== 'semua' && params.jenjang !== 'All') {
        query = query.eq('jenjang', params.jenjang)
      }

      // 5. Filter periode tanggal inklusif
      if (params.startDate && params.endDate) {
        const endInclusive = `${params.endDate}T23:59:59.999Z`
        const startInclusive = `${params.startDate}T00:00:00.000Z`
        query = query.or(
          `and(created_at.gte.${startInclusive},created_at.lte.${endInclusive}),and(tanggal_mulai.lte.${params.endDate},tanggal_selesai.gte.${params.startDate})`
        )
      } else if (params.startDate) {
        const startInclusive = `${params.startDate}T00:00:00.000Z`
        query = query.or(`created_at.gte.${startInclusive},tanggal_selesai.gte.${params.startDate}`)
      } else if (params.endDate) {
        const endInclusive = `${params.endDate}T23:59:59.999Z`
        query = query.or(`created_at.lte.${endInclusive},tanggal_mulai.lte.${params.endDate}`)
      }

      // 6. Multi-field Server-Side Search Keyword (nama, NIM, instansi, jurusan, no surat, public id)
      if (params.search && params.search.trim() !== '') {
        const term = params.search.trim()
        query = query.or(`nama_lengkap.ilike.%${term}%,nim_nis.ilike.%${term}%,asal_instansi.ilike.%${term}%,jurusan.ilike.%${term}%,nomor_surat.ilike.%${term}%,public_id.ilike.%${term}%`)
      }

      query = query.order('created_at', { ascending: true }).range(from, to)

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
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

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

      // 1. Ambil relasi bidang_pembimbing yang aktif beserta data pembimbing
      const { data, error } = await supabase
        .from('bidang_pembimbing')
        .select(`
          pembimbing_id,
          pembimbings (
            id,
            nama,
            nip,
            jabatan,
            kuota_default,
            is_active,
            created_at
          )
        `)
        .eq('bidang_id', bidangId)
        .eq('is_active', true)

      let rawPembimbings: any[] = []

      if (error || !data || data.length === 0) {
        // Fallback jika bidang_pembimbing kosong, ambil semua pembimbing aktif
        const { data: allPembimbing } = await supabase
          .from('pembimbings')
          .select('id, nama, nip, jabatan, kuota_default, is_active, created_at')
          .eq('is_active', true)

        rawPembimbings = allPembimbing || []
      } else {
        rawPembimbings = (data || [])
          .map((item: any) => item.pembimbings)
          .filter((p: any) => p && p.is_active !== false)
      }

      // Urutkan stabil: created_at ascending lalu nama
      rawPembimbings.sort((a: any, b: any) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        if (dateA !== dateB) return dateA - dateB
        return (a.nama || '').localeCompare(b.nama || '')
      })

      if (rawPembimbings.length === 0) {
        return { data: [], error: null }
      }

      const pembimbingIds = rawPembimbings.map((p) => p.id)

      // 2. Ambil seluruh pengajuan aktif yang dibimbing oleh pembimbing ini
      const { data: activePengajuans } = await supabase
        .from('pengajuans')
        .select('pembimbing_id, jumlah_anggota, status')
        .in('status', ['Sedang Magang', 'Disetujui'])
        .in('pembimbing_id', pembimbingIds)

      // 3. Hitung total peserta aktif per pembimbing (SUM jumlah_anggota, bukan count row)
      const terisiMap = new Map<number | string, number>()
      if (activePengajuans) {
        for (const row of activePengajuans) {
          const pId = row.pembimbing_id
          const count = Number(row.jumlah_anggota) || 1
          terisiMap.set(pId, (terisiMap.get(pId) || 0) + count)
        }
      }

      // 4. Susun PembimbingOption dengan kuota asli database (tanpa fallback angka 5 palsu)
      const pembimbings: PembimbingOption[] = rawPembimbings.map((p: any) => {
        const kuota =
          p.kuota_default !== null && p.kuota_default !== undefined
            ? Number(p.kuota_default)
            : 0
        const terisi = terisiMap.get(p.id) || 0
        const slotTersedia = Math.max(0, kuota - terisi)
        const isFull = slotTersedia <= 0

        return {
          id: p.id,
          nama: p.nama,
          nip: p.nip || null,
          jabatan: p.jabatan || null,
          kuota_default: kuota,
          terisi,
          slot_tersedia: slotTersedia,
          is_active: p.is_active !== false,
          is_full: isFull,
        }
      })

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

      // 0. Validasi Kuota Bidang Sebelum Menerima Pengajuan
      if (payload.status === 'Sedang Magang') {
        const { data: pengajuanData, error: pengajuanErr } = await supabase
          .from('pengajuans')
          .select('id, bidang_id, jumlah_anggota')
          .eq('id', payload.pengajuanId)
          .single()

        if (pengajuanErr || !pengajuanData) {
          return {
            success: false,
            error: 'Data pengajuan tidak ditemukan.',
          }
        }

        if (pengajuanData.bidang_id) {
          const { data: bidangData, error: bidangErr } = await supabase
            .from('bidangs')
            .select('id, nama, kuota, terisi')
            .eq('id', pengajuanData.bidang_id)
            .single()

          if (!bidangErr && bidangData) {
            const kuota = Number(bidangData.kuota) || 0
            const terisi = Number(bidangData.terisi) || 0
            const requiredSlots = Number(pengajuanData.jumlah_anggota) || 1

            if (terisi >= kuota || (terisi + requiredSlots) > kuota) {
              const sisa = Math.max(0, kuota - terisi)
              return {
                success: false,
                error: `Tidak dapat menerima pengajuan: Kuota pada bidang "${bidangData.nama}" tidak mencukupi (Tersisa ${sisa} dari ${kuota} slot, pengajuan ini membutuhkan ${requiredSlots} slot).`,
              }
            }
          }
        }
      }

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

      let notifLink: string | null = '/pengguna/riwayat'

      if (payload.status === 'Sedang Magang') {
        notifJudul = 'Pengajuan Magang Diterima'
        notifPesan = 'Selamat, permohonan magang Anda telah disetujui oleh BRMP PH. Anda kini berstatus Sedang Magang.'
        notifLink = '/pengguna/riwayat'
      } else if (payload.status === 'Ditolak') {
        notifJudul = 'Pengajuan Magang Ditolak'
        notifPesan = `Mohon maaf, permohonan magang Anda belum dapat disetujui. Alasan: ${payload.alasanPenolakan || 'Persyaratan belum terpenuhi'}.`
        notifLink = '/pengguna/riwayat'
      } else if (payload.status === 'Selesai') {
        notifJudul = 'Magang Telah Selesai'
        notifPesan = 'Selamat! Anda telah menyelesaikan seluruh rangkaian kegiatan magang di BRMP PH. Silakan isi SKM untuk penerbitan sertifikat.'
        notifLink = `/pengguna/skm?pengajuan_id=${payload.pengajuanId}`
      }

      // Simpan web notifikasi pemohon dengan deduplikasi link untuk status 'Selesai'
      try {
        if (typeof window === 'undefined') {
          const { createNotificationServer } = await import('@/lib/services/server-notifikasi')
          const { createAdminClient } = await import('@/lib/supabase/admin')
          const adminClient = createAdminClient()

          let isDuplicate = false
          if (payload.status === 'Selesai' && adminClient) {
            const { data: existingNotif } = await adminClient
              .from('notifikasi')
              .select('id')
              .eq('user_id', payload.userId)
              .eq('link', notifLink)
              .limit(1)

            if (existingNotif && existingNotif.length > 0) {
              isDuplicate = true
            }
          }

          if (!isDuplicate) {
            await createNotificationServer({
              userId: payload.userId,
              judul: notifJudul,
              pesan: notifPesan,
              link: notifLink,
            })
          }
        }
      } catch (notifErr) {
        console.warn('Gagal membuat entri notifikasi user:', notifErr)
      }

      // 4. Kirim Notifikasi Email Otomatis (Asynchronous & Graceful)
      try {
        const { data: pData } = await supabase
          .from('pengajuans')
          .select(`
            id,
            public_id,
            user_id,
            tanggal_mulai,
            tanggal_selesai,
            asal_instansi,
            profiles:user_id (
              id,
              name,
              email
            ),
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
          `)
          .eq('id', payload.pengajuanId)
          .single()

        if (pData && (pData as any).profiles?.email) {
          const userProfile = (pData as any).profiles
          const bidangInfo = (pData as any).bidangs
          const pembimbingInfo = (pData as any).pembimbings

          let emailContext: any = null
          try {
            const { getPengajuanEmailContext } = await import('@/lib/services/email-context.service')
            emailContext = await getPengajuanEmailContext(pData.id)
          } catch (ctxErr) {
            console.warn('[AdminPengajuanService] Gagal load email context:', ctxErr)
          }

          const basePengajuanData = {
            id: pData.id,
            publicId: pData.public_id || String(pData.id),
            bidangNama: bidangInfo?.nama,
            asalInstansi: pData.asal_instansi,
            tanggalMulai: pData.tanggal_mulai,
            tanggalSelesai: pData.tanggal_selesai,
            ...(emailContext?.pengajuan || {}),
          }

          if (payload.status === 'Selesai') {
            // Jalur Pengajuan Selesai: Klaim atomik skm_reminder_sent_at untuk cegah pengiriman email ganda
            const { data: claimed, error: claimErr } = await supabase
              .from('pengajuans')
              .update({ skm_reminder_sent_at: new Date().toISOString() })
              .eq('id', payload.pengajuanId)
              .is('skm_reminder_sent_at', null)
              .select('id')

            if (!claimErr && claimed && claimed.length > 0) {
              const emailTasks: Promise<any>[] = []

              // Email ke Peserta Pemohon
              emailTasks.push(
                emailService.sendNotification({
                  event: 'pengajuan_completed',
                  recipientRole: 'user',
                  recipient: {
                    email: userProfile.email,
                    name: userProfile.name || 'Peserta Magang',
                  },
                  pengajuan: basePengajuanData,
                  pembimbing: pembimbingInfo
                    ? {
                      nama: pembimbingInfo.nama,
                      nip: pembimbingInfo.nip,
                      jabatan: pembimbingInfo.jabatan,
                    }
                    : null,
                  catatan: payload.catatan || 'Periode magang telah diselesaikan',
                })
              )

              // Email ke Admin Pengelola
              const getAdminEmail = async () => {
                if (typeof window === 'undefined') {
                  const { getAdminEmailAddress } = await import('@/lib/services/server-mailer')
                  return getAdminEmailAddress()
                }
                return 'simpulbrmpph@gmail.com'
              }

              emailTasks.push(
                getAdminEmail().then((admEmail) =>
                  emailService.sendNotification({
                    event: 'pengajuan_completed',
                    recipientRole: 'admin',
                    recipient: {
                      email: admEmail,
                      name: 'Admin SIMPUL',
                    },
                    pengajuan: basePengajuanData,
                    catatan: `Status pengajuan atas nama ${userProfile.name || 'Peserta'} telah diubah ke 'Selesai'.`,
                  })
                )
              )

              // Web notifikasi admin
              notifikasiService.notifyAdmins({
                judul: 'Kegiatan Magang Selesai',
                pesan: `Kegiatan magang #${pData.public_id || pData.id} (${bidangInfo?.nama || '-'}) atas nama ${userProfile.name || 'Peserta'} telah selesai.`,
                link: `/admin/riwayat-pengajuan/${pData.public_id || pData.id}`,
              }).catch((e: unknown) => console.warn('Gagal notif admin magang selesai:', e))

              const results = await Promise.allSettled(emailTasks)
              const emailRes = results[0]?.status === 'fulfilled' ? (results[0].value as any) : { success: false }

              if (!emailRes.success) {
                console.error('[AdminPengajuanService] Gagal kirim email pengajuan_completed, rollback skm_reminder_sent_at:', emailRes.error)
                await supabase
                  .from('pengajuans')
                  .update({ skm_reminder_sent_at: null })
                  .eq('id', payload.pengajuanId)
              }
            }
          } else {
            // Jalur Disetujui / Ditolak
            const eventType: 'pengajuan_approved' | 'pengajuan_rejected' =
              payload.status === 'Ditolak' ? 'pengajuan_rejected' : 'pengajuan_approved'

            await emailService.sendNotification({
              event: eventType,
              recipientRole: 'user',
              recipient: {
                email: userProfile.email,
                name: userProfile.name || 'Peserta Magang',
              },
              pengajuan: basePengajuanData,
              pembimbing: pembimbingInfo
                ? {
                  nama: pembimbingInfo.nama,
                  nip: pembimbingInfo.nip,
                  jabatan: pembimbingInfo.jabatan,
                }
                : null,
              alasanPenolakan: payload.alasanPenolakan,
              catatan: payload.catatan,
            })
          }
        }
      } catch (emailErr) {
        console.warn('[AdminPengajuanService] Gagal memicu notifikasi email:', emailErr)
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

  /**
   * Mengambil daftar seluruh master pembimbing aktif untuk opsi dropdown filter
   */
  async getPembimbingList(): Promise<{ data: Array<{ id: number | string; nama: string }>; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pembimbings')
        .select('id, nama')
        .eq('is_active', true)
        .order('nama', { ascending: true })

      if (error) return { data: [], error: error.message }
      return { data: data || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pembimbing.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil status kuota aktual pada tabel bidangs
   */
  async getBidangQuota(bidangId: number | string): Promise<{
    kuota: number
    terisi: number
    sisa: number
    error: string | null
  }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bidangs')
        .select('kuota, terisi')
        .eq('id', Number(bidangId))
        .single()

      if (error || !data) {
        return { kuota: 0, terisi: 0, sisa: 0, error: error?.message || 'Bidang tidak ditemukan' }
      }

      const kuota = Number(data.kuota) || 0
      const terisi = Number(data.terisi) || 0
      const sisa = Math.max(0, kuota - terisi)
      return { kuota, terisi, sisa, error: null }
    } catch (err: unknown) {
      return { kuota: 0, terisi: 0, sisa: 0, error: err instanceof Error ? err.message : 'Gagal' }
    }
  },

  /**
   * Mengambil daftar anggota pengajuan dari tabel pengajuan_anggotas
   */
  async getPengajuanAnggotas(pengajuanId: number | string): Promise<{
    data: any[]
    error: string | null
  }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pengajuan_anggotas')
        .select('*')
        .eq('pengajuan_id', Number(pengajuanId))
        .order('is_ketua', { ascending: false })
        .order('id', { ascending: true })

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : 'Gagal memuat anggota' }
    }
  },

  /**
   * Verifikasi pengajuan awal (Menunggu Verifikasi -> Sedang Magang / Ditolak) secara atomik
   * Memanggil RPC admin_verifikasi_anggota_atomic dan mengirim notifikasi email
   */
  async verifikasiAnggotaKelompok(payload: VerifikasiKelompokPayload): Promise<{
    success: boolean
    error: string | null
    data?: any
  }> {
    try {
      const supabase = createClient()

      // 1. Eksekusi RPC admin_verifikasi_anggota_atomic (6 parameter persis)
      const { data: rpcRes, error: rpcError } = await supabase.rpc('admin_verifikasi_anggota_atomic', {
        p_pengajuan_id: Number(payload.pengajuanId),
        p_pembimbing_id: payload.pembimbingId ? Number(payload.pembimbingId) : null,
        p_status_target: payload.statusTarget || 'Sedang Magang',
        p_keputusan_anggota: payload.keputusanAnggota,
        p_alasan_penolakan_global: payload.alasanPenolakanGlobal || null,
        p_surat_balasan_url: payload.suratBalasanUrl || null,
      })

      if (rpcError) {
        const parsed = parseRpcError(rpcError, 'admin')
        return {
          success: false,
          error: parsed.message,
        }
      }

      // 2. Ambil data baris pengajuans teraktual dari DB untuk keperluan email & audit
      const { data: pData } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          status,
          jumlah_anggota,
          jumlah_diajukan,
          alasan_penolakan,
          user_id,
          tanggal_mulai,
          tanggal_selesai,
          asal_instansi,
          profiles:user_id (
            id,
            name,
            email
          ),
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
        `)
        .eq('id', Number(payload.pengajuanId))
        .single()

      if (pData && (pData as any).profiles?.email) {
        const userProfile = (pData as any).profiles
        const bidangInfo = (pData as any).bidangs
        const pembimbingInfo = (pData as any).pembimbings

        const totalDiajukan = Number(pData.jumlah_diajukan) || Number(pData.jumlah_anggota) || 1
        const totalDiterima = Number(pData.jumlah_anggota) || 0
        const totalDitolak = Math.max(0, totalDiajukan - totalDiterima)

        if (pData.status === 'Sedang Magang') {
          // Kasus Disetujui (baik penuh maupun sebagian)
          let catatanText: string | null = null
          if (totalDitolak > 0) {
            catatanText = `Pengajuan disetujui sebagian: ${totalDiterima} anggota diterima dan ${totalDitolak} anggota tidak lolos.`
          } else if (payload.catatan) {
            catatanText = payload.catatan
          }

          // 1. Web Notifikasi untuk User Pemohon
          try {
            if (typeof window === 'undefined') {
              const { createNotificationServer } = await import('@/lib/services/server-notifikasi')
              await createNotificationServer({
                userId: pData.user_id,
                judul: 'Pengajuan Magang Disetujui',
                pesan: `Selamat! Permohonan magang Anda (#${pData.public_id || pData.id}) untuk bidang ${bidangInfo?.nama || '-'} telah disetujui.`,
                link: '/pengguna/riwayat',
              })
            }
          } catch (notifErr) {
            console.warn('[AdminPengajuanService] Gagal buat web notifikasi disetujui:', notifErr)
          }

          // 2. Email Notifikasi
          try {
            await emailService.sendNotification({
              event: 'pengajuan_approved',
              recipient: {
                email: userProfile.email,
                name: userProfile.name || 'Peserta Magang',
              },
              pengajuan: {
                id: pData.id,
                publicId: pData.public_id || String(pData.id),
                bidangNama: bidangInfo?.nama,
                asalInstansi: pData.asal_instansi,
                tanggalMulai: pData.tanggal_mulai,
                tanggalSelesai: pData.tanggal_selesai,
              },
              pembimbing: pembimbingInfo
                ? {
                  nama: pembimbingInfo.nama,
                  nip: pembimbingInfo.nip,
                  jabatan: pembimbingInfo.jabatan,
                }
                : null,
              catatan: catatanText,
            })
          } catch (emailErr) {
            console.warn('[AdminPengajuanService] Gagal kirim email pengajuan_approved:', emailErr)
          }
        } else if (pData.status === 'Ditolak') {
          // Kasus Ditolak (ambil alasan dari pData.alasan_penolakan dari DB)
          const alasanDB = pData.alasan_penolakan || 'Seluruh anggota kelompok belum memenuhi kriteria penerimaan.'

          // 1. Web Notifikasi untuk User Pemohon
          try {
            if (typeof window === 'undefined') {
              const { createNotificationServer } = await import('@/lib/services/server-notifikasi')
              await createNotificationServer({
                userId: pData.user_id,
                judul: 'Pengajuan Magang Belum Disetujui',
                pesan: `Mohon maaf, permohonan magang Anda (#${pData.public_id || pData.id}) belum dapat disetujui. Alasan: ${alasanDB}.`,
                link: '/pengguna/riwayat',
              })
            }
          } catch (notifErr) {
            console.warn('[AdminPengajuanService] Gagal buat web notifikasi ditolak:', notifErr)
          }

          // 2. Email Notifikasi
          try {
            await emailService.sendNotification({
              event: 'pengajuan_rejected',
              recipient: {
                email: userProfile.email,
                name: userProfile.name || 'Peserta Magang',
              },
              pengajuan: {
                id: pData.id,
                publicId: pData.public_id || String(pData.id),
                bidangNama: bidangInfo?.nama,
                asalInstansi: pData.asal_instansi,
                tanggalMulai: pData.tanggal_mulai,
                tanggalSelesai: pData.tanggal_selesai,
              },
              alasanPenolakan: alasanDB,
              catatan: payload.catatan || 'Pengajuan ditolak oleh administrator',
            })
          } catch (emailErr) {
            console.warn('[AdminPengajuanService] Gagal kirim email pengajuan_rejected:', emailErr)
          }
        }
      }

      return {
        success: true,
        error: null,
        data: rpcRes,
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
