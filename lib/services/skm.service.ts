import { createClient } from '@/lib/supabase/client'
import type {
  SKMPertanyaan,
  SKMJawaban,
  SKMAnswerInput,
  SKMSubmissionPayload,
  SKMResponse,
} from '@/types/skm.types'

export const skmService = {
  /**
   * Mengambil seluruh pertanyaan SKM yang aktif dari tabel skm_pertanyaan
   * Diurutkan berdasarkan nomor urut (urutan ASC).
   * Database Supabase adalah source of truth utama.
   */
  async getActivePertanyaan(): Promise<{ data: SKMPertanyaan[]; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('skm_pertanyaan')
        .select('id, pertanyaan, unsur, urutan, tipe, opsi, is_active, created_at')
        .eq('is_active', true)
        .order('urutan', { ascending: true })

      if (error) {
        console.error('Error fetching skm_pertanyaan:', error)
        return { data: [], error: error.message || 'Gagal memuat daftar pertanyaan survei.' }
      }

      return { data: data || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat memuat pertanyaan survei.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengecek apakah pengajuan tertentu sudah pernah diisi kuesioner SKM-nya
   * Mencegah double-submission per pengajuan.
   */
  async checkHasSubmittedSKM(pengajuanId: number): Promise<{ hasSubmitted: boolean; error: string | null }> {
    try {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('skm_jawaban')
        .select('id', { count: 'exact', head: true })
        .eq('pengajuan_id', pengajuanId)

      if (error) {
        console.error('Error checking skm_jawaban:', error)
        return { hasSubmitted: false, error: error.message }
      }

      return { hasSubmitted: (count || 0) > 0, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memeriksa status survei.'
      return { hasSubmitted: false, error: msg }
    }
  },

  /**
   * Mengambil daftar pengajuan magang milik user beserta status pengisian SKM
   */
  async getUserPengajuansForSKM(userId: string): Promise<{
    data: Array<{
      id: number
      public_id: string | null
      status: string
      bidang_nama: string
      created_at: string
      hasSubmittedSKM: boolean
    }>
    error: string | null
  }> {
    try {
      const supabase = createClient()
      // Ambil pengajuan user
      const { data: pengajuans, error: pError } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          status,
          created_at,
          bidangs (
            id,
            nama
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (pError || !pengajuans) {
        return { data: [], error: pError?.message || 'Gagal memuat data pengajuan.' }
      }

      // Ambil pengajuan_ids yang sudah ada di skm_jawaban
      const pengajuanIds = pengajuans.map((p) => p.id)
      let submittedSet = new Set<number>()

      if (pengajuanIds.length > 0) {
        const { data: existingAnswers } = await supabase
          .from('skm_jawaban')
          .select('pengajuan_id')
          .in('pengajuan_id', pengajuanIds)

        if (existingAnswers) {
          existingAnswers.forEach((ans) => {
            if (ans.pengajuan_id) {
              submittedSet.add(ans.pengajuan_id)
            }
          })
        }
      }

      const formatted = pengajuans.map((p: any) => ({
        id: p.id,
        public_id: p.public_id,
        status: p.status,
        bidang_nama: p.bidangs?.nama || 'Bidang Magang BRMP',
        created_at: p.created_at,
        hasSubmittedSKM: submittedSet.has(p.id),
      }))

      return { data: formatted, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat status survei pengajuan.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menyimpan jawaban kuesioner SKM pengguna ke tabel skm_jawaban
   * Melakukan validasi autentikasi, kepemilikan pengajuan, pencegahan double submission,
   * dan batch insert seluruh butir jawaban.
   */
  async submitSKMJawaban(payload: SKMSubmissionPayload): Promise<SKMResponse> {
    try {
      const supabase = createClient()

      // 1. Verifikasi Sesi Pengguna
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesi Anda telah berakhir. Silakan login kembali.',
          },
        }
      }

      if (!payload.pengajuanId) {
        return {
          success: false,
          error: {
            code: 'INVALID_PENGAJUAN',
            message: 'ID Pengajuan magang tidak valid atau belum dipilih.',
          },
        }
      }

      // 2. Verifikasi Kepemilikan Pengajuan
      const { data: pengajuan, error: pengajuanErr } = await supabase
        .from('pengajuans')
        .select('id, user_id, status')
        .eq('id', payload.pengajuanId)
        .eq('user_id', user.id)
        .single()

      if (pengajuanErr || !pengajuan) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Anda tidak memiliki hak akses terhadap permohonan pengajuan ini.',
          },
        }
      }

      // 3. Verifikasi Pencegahan Double Submission
      const { hasSubmitted } = await this.checkHasSubmittedSKM(payload.pengajuanId)
      if (hasSubmitted) {
        return {
          success: false,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: 'Survei Kepuasan Masyarakat untuk pengajuan ini sudah pernah dikirim sebelumnya.',
          },
        }
      }

      // 4. Validasi Format & Kelengkapan Jawaban
      if (!payload.answers || payload.answers.length === 0) {
        return {
          success: false,
          error: {
            code: 'EMPTY_ANSWERS',
            message: 'Jawaban survei tidak boleh kosong.',
          },
        }
      }

      // Susun data untuk batch insert ke skm_jawaban
      const rowsToInsert = payload.answers.map((ans) => ({
        pengajuan_id: payload.pengajuanId,
        skm_pertanyaan_id: ans.skmPertanyaanId,
        jawaban: String(ans.jawaban ?? '').trim(),
      }))

      // 5. Simpan ke database Supabase
      const { data, error: insertError } = await supabase
        .from('skm_jawaban')
        .insert(rowsToInsert)
        .select()

      if (insertError) {
        console.error('Database error on insert skm_jawaban:', insertError)
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: insertError.message || 'Gagal menyimpan jawaban survei ke database.',
          },
        }
      }

      return {
        success: true,
        data,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengirim survei.'
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: msg,
        },
      }
    }
  },
}
