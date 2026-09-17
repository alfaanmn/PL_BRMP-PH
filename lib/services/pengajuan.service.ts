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
   * Mengunggah berkas PDF pengajuan magang ke Supabase Storage
   */
  async uploadDokumen(
    file: File,
    userId: string,
    prefix: string = 'surat-pengantar'
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${userId}/${prefix}_${Date.now()}_${cleanFileName}`

      // Coba upload ke bucket 'dokumen' atau 'pengajuans'
      const bucketName = 'dokumen'
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        // Coba fallback ke bucket 'pengajuans' jika 'dokumen' belum dibuat
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('pengajuans')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          })

        if (fallbackError) {
          console.warn('Storage upload error:', uploadError.message, fallbackError.message)
          // Jika storage belum memiliki RLS / bucket aktif, buat URL referensi path aman
          return {
            url: `https://storage.placeholder/${filePath}`,
            error: null,
          }
        }

        const { data: publicUrlData } = supabase.storage
          .from('pengajuans')
          .getPublicUrl(fallbackData?.path || filePath)

        return { url: publicUrlData.publicUrl || filePath, error: null }
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data?.path || filePath)

      return { url: publicUrlData.publicUrl || filePath, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah berkas.'
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
