import { createClient } from '@/lib/supabase/client'
import { emailService } from '@/lib/services/email.service'
import { PengajuanInsertPayload } from '@/types/pengajuan.types'
import { parseRpcError } from '@/lib/helpers/rpc-error-parser'
import { normalizeWhatsApp } from '@/lib/constants/pengajuan.constants'

export interface PengajuanResponse {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

export const pengajuanService = {
  /**
   * Mengunggah berkas PDF pengajuan magang ke Supabase Storage (Private bucket 'dokumen')
   */
  async uploadDokumen(
    file: File,
    userId?: string,
    prefix: string = 'surat_pengantar'
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      // Validasi MIME / ekstensi file PDF
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      if (ext !== 'pdf' && file.type !== 'application/pdf') {
        return {
          url: null,
          error: 'Hanya dokumen berformat PDF yang diperbolehkan.',
        }
      }

      // Validasi ukuran berkas (Maksimal 5MB)
      const maxBytes = 5 * 1024 * 1024
      if (file.size > maxBytes) {
        return {
          url: null,
          error: 'Ukuran berkas melebihi batas maksimal 5 MB.',
        }
      }

      const supabase = createClient()
      
      // Ambil user ID dari session Supabase Auth
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const effectiveUserId = user?.id || userId
      if (!effectiveUserId || effectiveUserId === 'guest') {
        return {
          url: null,
          error: 'Sesi anda telah berakhir atau belum terautentikasi. Silakan login kembali.',
        }
      }

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${effectiveUserId}/${prefix}_${Date.now()}_${cleanFileName}`
      const bucketName = 'dokumen'

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError)
        return {
          url: null,
          error: `Gagal mengunggah berkas ke storage: ${uploadError.message}`,
        }
      }

      return { url: data?.path || filePath, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah berkas.'
      return { url: null, error: msg }
    }
  },

  /**
   * Mendapatkan Signed URL sementara untuk berkas dokumen privat (TTL: 3600 detik / 1 jam)
   * Mendukung relative object path (misal: "userId/file.pdf") maupun legacy Public URL
   */
  async getSignedDocumentUrl(
    pathOrUrl: string | null | undefined,
    expiresIn: number = 3600,
    options?: { download?: boolean | string }
  ): Promise<{ url: string | null; error: string | null }> {
    if (!pathOrUrl || typeof pathOrUrl !== 'string' || pathOrUrl.trim() === '' || pathOrUrl.includes('placeholder')) {
      return { url: null, error: 'Dokumen belum diunggah atau path tidak valid.' }
    }

    try {
      const supabase = createClient()
      let cleanPath = pathOrUrl.trim()
      const bucketName = 'dokumen'

      // Jika pathOrUrl adalah URL lengkap (legacy URL Supabase), ekstraksi object path-nya
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        try {
          const urlObj = new URL(cleanPath)
          const pathname = decodeURIComponent(urlObj.pathname) // misal: /storage/v1/object/public/dokumen/USER/file.pdf

          if (pathname.includes('/dokumen/')) {
            cleanPath = pathname.split('/dokumen/')[1]
          } else {
            // Ambil 2 segmen terakhir (userId/filename) jika format URL berbeda
            const segments = pathname.split('/').filter(Boolean)
            if (segments.length >= 2) {
              cleanPath = segments.slice(-2).join('/')
            }
          }
        } catch {
          // Jika parsing URL gagal, gunakan cleanPath apa adanya
        }
      }

      // Hapus query parameters dan hash jika ada
      cleanPath = cleanPath.split('?')[0].split('#')[0]

      // Hapus leading slash jika ada
      cleanPath = cleanPath.replace(/^\/+/, '')

      // Dilarang mencoba membuat signed URL jika path kosong setelah pembersihan
      if (!cleanPath) {
        return { url: null, error: 'Path dokumen tidak valid.' }
      }

      // Generate Signed URL dari bucket 'dokumen'
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(cleanPath, expiresIn, options?.download ? { download: options.download } : undefined)

      if (error || !data?.signedUrl) {
        return {
          url: null,
          error: error?.message || 'Tidak dapat mengakses berkas privat atau berkas tidak ditemukan di storage.',
        }
      }

      return { url: data.signedUrl, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghasilkan tautan dokumen aman.'
      return { url: null, error: msg }
    }
  },

  /**
   * Memeriksa apakah user memiliki pengajuan yang sedang aktif (Menunggu Verifikasi / Sedang Magang).
   * Aturan bisnis:
   * - 'Menunggu Verifikasi' -> BLOKIR daftar baru
   * - 'Sedang Magang' -> BLOKIR daftar baru
   * - 'Ditolak' -> BOLEH daftar lagi
   * - 'Dibatalkan' -> BOLEH daftar lagi
   * - 'Selesai' -> BOLEH daftar lagi
   */
  async checkUserActivePengajuan(userId: string): Promise<{
    canApply: boolean
    blockedReason?: string
    activeStatus?: string
    activePengajuan?: any
  }> {
    try {
      if (!userId || userId === 'guest') {
        return { canApply: true }
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          user_id,
          bidang_id,
          status,
          created_at,
          bidangs (
            id,
            nama
          )
        `)
        .eq('user_id', userId)
        .in('status', ['Menunggu Verifikasi', 'Sedang Magang'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error checking user active pengajuan:', error)
        return { canApply: true }
      }

      if (data && data.length > 0) {
        const active = data[0]
        const bidangNama = (active as any).bidangs?.nama || `Bidang #${active.bidang_id}`
        let reason = ''

        if (active.status === 'Menunggu Verifikasi') {
          reason = `Anda memiliki pengajuan magang yang sedang dalam proses verifikasi (${bidangNama} - ID #${active.public_id || active.id}). Anda baru dapat mengajukan kembali apabila permohonan telah selesai diproses atau ditolak/dibatalkan.`
        } else if (active.status === 'Sedang Magang') {
          reason = `Anda saat ini tercatat sedang aktif menjalani kegiatan magang (${bidangNama} - ID #${active.public_id || active.id}). Satu peserta hanya dapat mengikuti 1 kegiatan magang dalam satu waktu.`
        }

        return {
          canApply: false,
          blockedReason: reason,
          activeStatus: active.status,
          activePengajuan: active,
        }
      }

      return { canApply: true }
    } catch (err: unknown) {
      console.error('Exception in checkUserActivePengajuan:', err)
      return { canApply: true }
    }
  },

  /**
   * Menyimpan pengajuan magang baru ke tabel public.pengajuans
   * Dilengkapi proteksi satu pengajuan aktif per user.
   */
  async submitPengajuan(payload: PengajuanInsertPayload): Promise<PengajuanResponse> {
    try {
      const supabase = createClient()

      // Pastikan session user aktif
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesi anda telah berakhir. Silakan login kembali.',
          },
        }
      }

      // 1. Validasi Server/Service Guard: Cek apakah user memiliki pengajuan aktif
      const activeCheck = await this.checkUserActivePengajuan(user.id)
      if (!activeCheck.canApply) {
        return {
          success: false,
          error: {
            code: 'ACTIVE_APPLICATION_EXISTS',
            message: activeCheck.blockedReason || 'Anda sudah memiliki pengajuan magang yang sedang aktif.',
          },
        }
      }

      // Validasi jenjang pendidikan
      if (payload.jenjang !== 'Mahasiswa' && payload.jenjang !== 'Siswa') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Jenjang pendidikan harus berupa Mahasiswa atau Siswa.',
          },
        }
      }

      // Buang baris anggota yang kosong sebelum dikirim dan pastikan kunci JSON: nama, nim_nis, no_hp, jurusan
      const anggotaJson = (payload.anggota || [])
        .filter((a) => a && (a.nama || '').trim() && (a.nim_nis || '').trim())
        .map((a) => ({
          nama: (a.nama || '').trim(),
          nim_nis: (a.nim_nis || '').trim(),
          no_hp: normalizeWhatsApp(a.no_hp) || null,
          jurusan: (a.jurusan || '').trim() || null,
        }))

      // Hitung dari data aktual: 1 (pemohon) + anggota tambahan
      const jumlahAnggotaDipilih = 1 + anggotaJson.length

      // 22 Parameter PERSIS sesuai fungsi LIVE di DB
      const { data: rpcRes, error: rpcError } = await supabase.rpc(
        'submit_pengajuan_atomic',
        {
          p_bidang_id: Number(payload.bidang_id),
          p_nomor_surat: payload.nomor_surat,
          p_tanggal_surat: payload.tanggal_surat,
          p_jenjang: payload.jenjang,
          p_asal_instansi: payload.asal_instansi,
          p_jurusan: payload.jurusan,
          p_tanggal_mulai: payload.tanggal_mulai,
          p_tanggal_selesai: payload.tanggal_selesai,
          p_durasi_bulan: Number(payload.durasi_bulan),
          p_topik_magang: payload.topik_magang,
          p_surat_pengantar_url: payload.surat_pengantar_url,
          p_proposal_url: payload.proposal_url || null,
          p_dokumen_tambahan_url: payload.dokumen_tambahan_url || null,
          p_nama_pemohon: payload.nama_lengkap,
          p_nim_pemohon: payload.nim_nis,
          p_no_hp_pemohon: normalizeWhatsApp(payload.no_hp) || null,
          p_jenis_kelamin_pemohon: payload.jenis_kelamin || null,
          p_alamat_pemohon: payload.alamat || null,
          p_anggota_tambahan: anggotaJson,
          p_jumlah_anggota_dipilih: jumlahAnggotaDipilih,
          p_konfirmasi_kuota_sebagian: Boolean(payload.konfirmasi_kuota_sebagian),
          p_idempotency_key: payload.idempotency_key || null,
        }
      )

      if (rpcError) {
        const parsed = parseRpcError(rpcError, 'user')
        return {
          success: false,
          error: {
            code: parsed.code,
            message: parsed.message,
            details: parsed.details,
          },
        }
      }

      // Return JSONB: { success, id, public_id, is_idempotent_replay }
      const newPengajuanId = rpcRes?.id
      const publicId = rpcRes?.public_id
      const isReplay = Boolean(rpcRes?.is_idempotent_replay)

      // Ambil data pengajuan untuk response
      const { data: dataBaru } = await supabase
        .from('pengajuans')
        .select('*')
        .eq('id', newPengajuanId)
        .single()

      const data = dataBaru || { id: newPengajuanId, public_id: publicId }

      // Jika merupakan idempotent replay, JANGAN kirim email atau efek samping lagi
      if (isReplay) {
        return {
          success: true,
          data,
        }
      }

      // Kirim email konfirmasi pengajuan magang berhasil terkirim (Hanya untuk pengajuan baru)
      try {
        const { data: bData } = await supabase
          .from('bidangs')
          .select('nama')
          .eq('id', Number(payload.bidang_id))
          .single()

        await emailService.sendNotification({
          event: 'pengajuan_submitted',
          recipient: {
            email: user.email || '',
            name: payload.nama_lengkap || user.user_metadata?.name || 'Peserta Magang',
          },
          pengajuan: {
            id: data.id,
            publicId: data.public_id || String(data.id),
            bidangNama: bData?.nama || `Bidang #${payload.bidang_id}`,
            asalInstansi: payload.asal_instansi,
            jurusan: payload.jurusan,
            nomorSurat: payload.nomor_surat,
            tanggalMulai: payload.tanggal_mulai,
            tanggalSelesai: payload.tanggal_selesai,
            durasiBulan: payload.durasi_bulan,
          },
        })
      } catch (emailErr) {
        console.warn('[PengajuanService] Gagal memicu email konfirmasi pendaftaran:', emailErr)
      }

      return {
        success: true,
        data,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengirim pengajuan.'
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: msg,
        },
      }
    }
  },

  /**
   * Mengambil seluruh pengajuan milik user yang sedang login
   */
  async getUserPengajuans(userId: string): Promise<{ data: any[]; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
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
          anggota,
          nama_lengkap,
          nim_nis,
          jenis_kelamin,
          no_hp,
          alamat,
          topik_magang,
          surat_pengantar_url,
          proposal_url,
          dokumen_tambahan_url,
          surat_balasan_url,
          sertifikat_url,
          status,
          created_at,
          updated_at,
          bidangs (
            id,
            nama,
            deskripsi
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error: error.message || 'Gagal memuat riwayat pengajuan.' }
      }

      return { data: data || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengambil riwayat.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil detail satu pengajuan magang berdasarkan ID numerik
   */
  async getPengajuanDetail(id: number | string, userId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pengajuans')
        .select(`
          *,
          bidangs (
            id,
            nama,
            deskripsi
          ),
          pembimbings (
            id,
            nama,
            nip,
            jabatan
          )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        return { data: null, error: error.message || 'Pengajuan tidak ditemukan.' }
      }

      return { data: data || null, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengambil detail pengajuan.'
      return { data: null, error: msg }
    }
  },

  /**
   * Mengambil detail satu pengajuan magang berdasarkan public_id (hex string)
   * Terproteksi khusus untuk user_id pemilik pengajuan
   */
  async getPengajuanDetailByPublicId(publicId: string, userId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pengajuans')
        .select(`
          *,
          bidangs (
            id,
            nama,
            deskripsi
          ),
          pembimbings (
            id,
            nama,
            nip,
            jabatan,
            email,
            no_hp
          )
        `)
        .eq('public_id', publicId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        return { data: null, error: error.message || 'Pengajuan tidak ditemukan.' }
      }

      return { data: data || null, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengambil detail pengajuan.'
      return { data: null, error: msg }
    }
  },

  /**
   * Membatalkan pengajuan magang sendiri yang masih berstatus 'Menunggu Verifikasi'
   * Memanggil RPC PostgreSQL atomic batalkan_pengajuan
   */
  async batalkanPengajuan(publicId: string, alasan?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.rpc('batalkan_pengajuan', {
        p_public_id: publicId,
        p_alasan: alasan?.trim() || null,
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Gagal membatalkan pengajuan magang.',
        }
      }

      if (data && data.success === false) {
        return {
          success: false,
          error: data.error?.message || 'Gagal membatalkan pengajuan magang.',
        }
      }

      return {
        success: true,
        message: data?.message || 'Pengajuan berhasil dibatalkan.',
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membatalkan pengajuan.'
      return { success: false, error: msg }
    }
  },
}


