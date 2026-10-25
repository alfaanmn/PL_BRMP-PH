import { createClient } from '@/lib/supabase/client'
import { evaluateSKMCompletion } from '@/lib/helpers/peserta.helper'
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
   * Mengecek apakah pengajuan tertentu sudah selesai mengisi SKM
   */
  async checkHasSubmittedSKM(pengajuanId: number): Promise<{ hasSubmitted: boolean; error: string | null }> {
    try {
      const supabase = createClient()

      const [{ data: pengajuan }, { data: dbAnggotas }, { data: skmRows }] = await Promise.all([
        supabase
          .from('pengajuans')
          .select('id, nama_lengkap, nim_nis, anggota, jumlah_anggota')
          .eq('id', pengajuanId)
          .maybeSingle(),
        supabase
          .from('pengajuan_anggotas')
          .select('id, pengajuan_id, nama, nim_nis, is_ketua')
          .eq('pengajuan_id', pengajuanId),
        supabase
          .from('skm_jawaban')
          .select('peserta_nama, peserta_nim, is_ketua, is_legacy')
          .eq('pengajuan_id', pengajuanId),
      ])

      if (!pengajuan) {
        return { hasSubmitted: false, error: 'Pengajuan tidak ditemukan' }
      }

      const evalResult = evaluateSKMCompletion(pengajuan, dbAnggotas, skmRows)
      return { hasSubmitted: evalResult.isComplete, error: null }
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
      isKelompok: boolean
      submittedCount: number
      totalPeserta: number
      hasLegacy: boolean
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
          sertifikat_url,
          nama_lengkap,
          nim_nis,
          anggota,
          jumlah_anggota,
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

      const pengajuanIds = pengajuans.map((p) => p.id)
      let dbAnggotasMap = new Map<number, any[]>()
      let skmRowsMap = new Map<number, any[]>()

      if (pengajuanIds.length > 0) {
        const [{ data: dbAnggotas }, { data: existingAnswers }] = await Promise.all([
          supabase
            .from('pengajuan_anggotas')
            .select('id, pengajuan_id, nama, nim_nis, is_ketua')
            .in('pengajuan_id', pengajuanIds),
          supabase
            .from('skm_jawaban')
            .select('pengajuan_id, peserta_nama, peserta_nim, is_ketua, is_legacy')
            .in('pengajuan_id', pengajuanIds),
        ])

        if (dbAnggotas) {
          dbAnggotas.forEach((a) => {
            const arr = dbAnggotasMap.get(a.pengajuan_id) || []
            arr.push(a)
            dbAnggotasMap.set(a.pengajuan_id, arr)
          })
        }

        if (existingAnswers) {
          existingAnswers.forEach((ans) => {
            if (ans.pengajuan_id) {
              const arr = skmRowsMap.get(ans.pengajuan_id) || []
              arr.push(ans)
              skmRowsMap.set(ans.pengajuan_id, arr)
            }
          })
        }
      }

      const formatted = pengajuans.map((p: any) => {
        const dbAnggotas = dbAnggotasMap.get(p.id) || []
        const skmRows = skmRowsMap.get(p.id) || []
        const skmEval = evaluateSKMCompletion(p, dbAnggotas, skmRows)

        return {
          id: p.id,
          public_id: p.public_id,
          status: p.status,
          sertifikat_url: p.sertifikat_url || null,
          bidang_nama: p.bidangs?.nama || 'Bidang Magang BRMP',
          created_at: p.created_at,
          hasSubmittedSKM: skmEval.isComplete,
          isKelompok: skmEval.isKelompok,
          submittedCount: skmEval.submittedCount,
          totalPeserta: skmEval.totalPeserta,
          hasLegacy: skmEval.hasLegacy,
        }
      })

      return { data: formatted, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat status survei pengajuan.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menyimpan jawaban kuesioner SKM pengguna ke tabel skm_jawaban melalui Server Route resmi
   * Melakukan validasi autentikasi, kepemilikan pengajuan, pencegahan double submission,
   * dan batch insert seluruh butir jawaban di boundary server.
   */
  async submitSKMJawaban(payload: SKMSubmissionPayload): Promise<SKMResponse> {
    try {
      if (!payload.pengajuanId) {
        return {
          success: false,
          error: {
            code: 'INVALID_PENGAJUAN',
            message: 'ID Pengajuan magang tidak valid atau belum dipilih.',
          },
        }
      }

      if (!payload.answers || payload.answers.length === 0) {
        return {
          success: false,
          error: {
            code: 'EMPTY_ANSWERS',
            message: 'Jawaban survei tidak boleh kosong.',
          },
        }
      }

      // Panggil Server Route Handler resmi untuk memproses mutasi dengan aman
      const res = await fetch('/api/skm/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        console.error('[SKM Service] Submission failed from server route:', {
          status: res.status,
          success: result?.success,
          code: result?.error?.code,
          message: result?.error?.message,
          rawError: result?.error,
        })
        return {
          success: false,
          error: {
            code: result?.error?.code || 'SUBMISSION_FAILED',
            message: result?.error?.message || 'Gagal mengirim survei kepuasan. Silakan coba kembali.',
          },
        }
      }

      return {
        success: true,
        data: result.data,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menghubungi server.'
      console.error('[SKM Service] Network/Unhandled error on submitSKMJawaban:', err)
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: msg,
        },
      }
    }
  },
}
