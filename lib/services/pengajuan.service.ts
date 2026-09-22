import { createClient } from '@/lib/supabase/client'
import { PengajuanInsertPayload } from '@/types/pengajuan.types'

export interface PengajuanResponse {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
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
          const pathname = urlObj.pathname // misal: /storage/v1/object/public/dokumen/USER/file.pdf

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

      // Hapus query parameters jika ada
      cleanPath = cleanPath.split('?')[0]

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
   * Menyimpan pengajuan magang baru ke tabel public.pengajuans
   * CATATAN: public_id dibiarkan default dari database PostgreSQL (jangan di-override di payload JS)
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

      const insertData: any = {
        user_id: user.id,
        bidang_id: Number(payload.bidang_id),
        nomor_surat: payload.nomor_surat,
        tanggal_surat: payload.tanggal_surat,
        jenjang: payload.jenjang === 'Siswa' ? 'Siswa' : 'Mahasiswa',
        asal_instansi: payload.asal_instansi,
        jurusan: payload.jurusan,
        tanggal_mulai: payload.tanggal_mulai,
        tanggal_selesai: payload.tanggal_selesai,
        durasi_bulan: payload.durasi_bulan,
        jumlah_anggota: payload.jumlah_anggota || 1,
        anggota: payload.jumlah_anggota > 1 ? payload.anggota : [],
        nama_lengkap: payload.nama_lengkap,
        nim_nis: payload.nim_nis,
        jenis_kelamin: payload.jenis_kelamin || null,
        no_hp: payload.no_hp || null,
        alamat: payload.alamat || null,
        foto_url: payload.foto_url || null,
        topik_magang: payload.topik_magang,
        surat_pengantar_url: payload.surat_pengantar_url,
        proposal_url: payload.proposal_url || null,
        dokumen_tambahan_url: payload.dokumen_tambahan_url || null,
        status: payload.status || 'Menunggu Verifikasi',
      }

      const { data, error: insertError } = await supabase
        .from('pengajuans')
        .insert([insertData])
        .select()
        .single()

      if (insertError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: insertError.message || 'Gagal menyimpan data pengajuan magang.',
          },
        }
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
   * Mengambil detail satu pengajuan magang
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
          )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return { data: null, error: error?.message || 'Pengajuan tidak ditemukan.' }
      }

      return { data, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengambil detail pengajuan.'
      return { data: null, error: msg }
    }
  },
}
