import { createClient } from '@/lib/supabase/client'
import { isPengajuanKelompok, getJumlahPeserta } from '@/lib/helpers/peserta.helper'
import type {
  AdminSKMPertanyaanItem,
  AdminSKMPertanyaanStats,
  AdminSKMStats,
  AdminSKMUnsurStat,
  AdminSKMTextItem,
  AdminSKMSubmissionItem,
  AdminSKMSubmissionDetail,
} from '@/types/admin-skm.types'
import type { SKMQuestionOption } from '@/types/skm.types'

export interface AdminSKMResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export const adminSKMService = {
  /**
   * Mengambil seluruh pertanyaan dari skm_pertanyaan untuk portal administrator
   */
  async getAllQuestions(): Promise<{ data: AdminSKMPertanyaanItem[]; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('skm_pertanyaan')
        .select('id, pertanyaan, unsur, urutan, tipe, opsi, is_active, created_at')
        .order('urutan', { ascending: true })

      if (error) {
        console.error('Error fetching admin skm_pertanyaan:', error)
        return { data: [], error: error.message || 'Gagal memuat konfigurasi pertanyaan.' }
      }

      const formatted: AdminSKMPertanyaanItem[] = (data || []).map((q: any) => ({
        ...q,
        tipe: q.tipe || 'pilihan',
        opsi: q.opsi || null,
      }))

      return { data: formatted, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat memuat pertanyaan.'
      return { data: [], error: msg }
    }
  },

  /**
   * Menghitung statistik ringkas butir pertanyaan SKM
   */
  async getQuestionStats(): Promise<{ data: AdminSKMPertanyaanStats; error: string | null }> {
    try {
      const { data: questions, error } = await this.getAllQuestions()
      if (error) {
        return {
          data: { totalPertanyaan: 0, totalPilihan: 0, totalTeks: 0, totalAktif: 0, totalNonaktif: 0 },
          error,
        }
      }

      const totalPertanyaan = questions.length
      const totalPilihan = questions.filter((q) => q.tipe === 'pilihan').length
      const totalTeks = questions.filter((q) => q.tipe === 'teks').length
      const totalAktif = questions.filter((q) => q.is_active).length
      const totalNonaktif = questions.filter((q) => !q.is_active).length

      return {
        data: {
          totalPertanyaan,
          totalPilihan,
          totalTeks,
          totalAktif,
          totalNonaktif,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghitung statistik butir pertanyaan.'
      return {
        data: { totalPertanyaan: 0, totalPilihan: 0, totalTeks: 0, totalAktif: 0, totalNonaktif: 0 },
        error: msg,
      }
    }
  },

  /**
   * Toggle status aktif/nonaktif pada butir pertanyaan skm_pertanyaan
   */
  async toggleQuestionStatus(id: number, currentActive: boolean): Promise<AdminSKMResponse> {
    try {
      const supabase = createClient()

      // Validasi sesi admin
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr || !user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        }
      }

      const newStatus = !currentActive
      const { data, error } = await supabase
        .from('skm_pertanyaan')
        .update({ is_active: newStatus })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error toggling question is_active:', error)
        return {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message || 'Gagal mengubah status pertanyaan.' },
        }
      }

      return {
        success: true,
        data,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memperbarui status.'
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', message: msg },
      }
    }
  },

  /**
   * Menambahkan butir pertanyaan baru ke skm_pertanyaan
   */
  async createQuestion(payload: {
    unsur: string
    pertanyaan: string
    urutan: number
    tipe?: string
    opsi?: SKMQuestionOption[] | null
    is_active?: boolean
  }): Promise<AdminSKMResponse> {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr || !user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        }
      }

      if (!payload.pertanyaan || !payload.pertanyaan.trim()) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Teks pertanyaan wajib diisi.' },
        }
      }

      const isChoice = payload.tipe !== 'teks'

      const { data, error } = await supabase
        .from('skm_pertanyaan')
        .insert([
          {
            unsur: payload.unsur?.trim() || null,
            pertanyaan: payload.pertanyaan.trim(),
            urutan: Number(payload.urutan) || 1,
            tipe: isChoice ? 'pilihan' : 'teks',
            opsi: isChoice && payload.opsi ? payload.opsi : null,
            is_active: payload.is_active !== undefined ? payload.is_active : true,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating question:', error)
        return {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message || 'Gagal menambahkan pertanyaan baru.' },
        }
      }

      return {
        success: true,
        data,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', message: msg },
      }
    }
  },

  /**
   * Memperbarui butir pertanyaan di skm_pertanyaan
   */
  async updateQuestion(
    id: number,
    payload: {
      unsur: string
      pertanyaan: string
      urutan?: number
      tipe?: string
      opsi?: SKMQuestionOption[] | null
      is_active?: boolean
    }
  ): Promise<AdminSKMResponse> {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr || !user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        }
      }

      if (!payload.pertanyaan || !payload.pertanyaan.trim()) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Teks pertanyaan wajib diisi.' },
        }
      }

      const updateData: any = {
        unsur: payload.unsur?.trim() || null,
        pertanyaan: payload.pertanyaan.trim(),
      }
      if (payload.urutan !== undefined) updateData.urutan = Number(payload.urutan)
      if (payload.tipe !== undefined) {
        const isChoice = payload.tipe !== 'teks'
        updateData.tipe = isChoice ? 'pilihan' : 'teks'
        updateData.opsi = isChoice && payload.opsi ? payload.opsi : null
      } else if (payload.opsi !== undefined) {
        updateData.opsi = payload.opsi
      }
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active

      const { data, error } = await supabase
        .from('skm_pertanyaan')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating question:', error)
        return {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message || 'Gagal memperbarui pertanyaan.' },
        }
      }

      return {
        success: true,
        data,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', message: msg },
      }
    }
  },

  /**
   * Menghapus pertanyaan secara aman:
   * - Jika sudah ada jawaban responden di skm_jawaban: Soft-deactivate (is_active = false)
   * - Jika belum pernah ada jawaban: Hard-delete dari skm_pertanyaan
   */
  async deleteQuestionSafe(id: number): Promise<AdminSKMResponse<{ mode: 'deactivated' | 'deleted' }>> {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr || !user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        }
      }

      // Cek apakah pertanyaan ini sudah memiliki jawaban
      const { count, error: countErr } = await supabase
        .from('skm_jawaban')
        .select('id', { count: 'exact', head: true })
        .eq('skm_pertanyaan_id', id)

      if (countErr) {
        console.warn('Error checking answer count:', countErr)
      }

      const hasAnswers = (count || 0) > 0

      if (hasAnswers) {
        // Soft deactivate agar histori tidak rusak
        const { error: deactErr } = await supabase
          .from('skm_pertanyaan')
          .update({ is_active: false })
          .eq('id', id)

        if (deactErr) {
          return {
            success: false,
            error: { code: 'DATABASE_ERROR', message: deactErr.message || 'Gagal menonaktifkan pertanyaan.' },
          }
        }

        return {
          success: true,
          data: { mode: 'deactivated' },
        }
      } else {
        // Hard delete aman karena belum ada responden
        const { error: delErr } = await supabase
          .from('skm_pertanyaan')
          .delete()
          .eq('id', id)

        if (delErr) {
          return {
            success: false,
            error: { code: 'DATABASE_ERROR', message: delErr.message || 'Gagal menghapus pertanyaan.' },
          }
        }

        return {
          success: true,
          data: { mode: 'deleted' },
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menghapus pertanyaan.'
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', message: msg },
      }
    }
  },

  /**
   * Mengambil statistik rekapitulasi SKM lengkap:
   * - Total Responden (distinct pengajuan_id)
   * - Total Respons
   * - Nilai Rata-rata SKM (Hanya butir bertipe 'pilihan')
   * - Tingkat Kepuasan (% skor 3 & 4)
   * - Breakdown rata-rata & distribusi skor 1–4 per unsur
   */
  async getRekapStats(
    periodFilter: string = 'all',
    customRange?: { startDate?: string; endDate?: string }
  ): Promise<{ data: AdminSKMStats; error: string | null }> {
    try {
      const supabase = createClient()

      // 1. Ambil seluruh pertanyaan
      const { data: questionsData, error: qErr } = await supabase
        .from('skm_pertanyaan')
        .select('id, pertanyaan, unsur, urutan, tipe, is_active, created_at')
        .order('urutan', { ascending: true })

      if (qErr || !questionsData) {
        return {
          data: {
            totalResponden: 0,
            totalJawabanPilihan: 0,
            rataRataKeseluruhan: null,
            tingkatKepuasan: null,
            unsurStats: [],
          },
          error: qErr?.message || 'Gagal memuat pertanyaan SKM.',
        }
      }

      // 2. Query data jawaban dari skm_jawaban
      let query = supabase
        .from('skm_jawaban')
        .select('id, pengajuan_id, skm_pertanyaan_id, jawaban, peserta_nama, peserta_nim, created_at')

      // Filter periode tanggal jika dipilih
      if (periodFilter === 'custom' && customRange) {
        if (customRange.startDate) {
          const start = new Date(customRange.startDate)
          start.setHours(0, 0, 0, 0)
          query = query.gte('created_at', start.toISOString())
        }
        if (customRange.endDate) {
          const end = new Date(customRange.endDate)
          end.setHours(23, 59, 59, 999)
          query = query.lte('created_at', end.toISOString())
        }
      } else if (periodFilter !== 'all') {
        const now = new Date()
        let startDate: Date | null = null

        if (periodFilter === '30days') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else if (periodFilter === 'this_month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        } else if (periodFilter === 'this_year') {
          startDate = new Date(now.getFullYear(), 0, 1)
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString())
        }
      }

      const { data: answersData, error: aErr } = await query

      if (aErr || !answersData) {
        return {
          data: {
            totalResponden: 0,
            totalJawabanPilihan: 0,
            rataRataKeseluruhan: null,
            tingkatKepuasan: null,
            unsurStats: [],
          },
          error: aErr?.message || 'Gagal memuat data jawaban SKM.',
        }
      }

      // 3. Hitung Responden Unik (berdasarkan pengajuan_id + peserta_nama + peserta_nim)
      const respondentSet = new Set<string>()
      answersData.forEach((ans: any) => {
        if (ans.pengajuan_id) {
          const pNama = (ans.peserta_nama || '').trim().toLowerCase()
          const pNim = (ans.peserta_nim || '').trim().toLowerCase()
          respondentSet.add(`${ans.pengajuan_id}__${pNama}__${pNim}`)
        }
      })
      const totalResponden = respondentSet.size

      // Buat map pertanyaan berdasarkan ID
      const questionMap = new Map<number, (typeof questionsData)[0]>()
      questionsData.forEach((q) => questionMap.set(q.id, q))

      // 4. Hitung Statistik untuk butir bertipe 'pilihan'
      let totalSkorSemua = 0
      let totalJawabanPilihan = 0
      let totalSkorPuas = 0 // skor 3 dan 4

      // Struktur data per butir pertanyaan pilihan
      const unsurMap = new Map<
        number,
        {
          totalSkor: number
          count: number
          distribusi: { skor1: number; skor2: number; skor3: number; skor4: number }
        }
      >()

      // Inisialisasi struktur map untuk semua pertanyaan tipe 'pilihan'
      questionsData.forEach((q: any) => {
        if (q.tipe === 'pilihan') {
          unsurMap.set(q.id, {
            totalSkor: 0,
            count: 0,
            distribusi: { skor1: 0, skor2: 0, skor3: 0, skor4: 0 },
          })
        }
      })

      // Proses setiap jawaban
      answersData.forEach((ans) => {
        const q: any = questionMap.get(ans.skm_pertanyaan_id)
        if (!q || q.tipe !== 'pilihan') return // Lewati jika bukan tipe pilihan

        const numericScore = Number(ans.jawaban)
        if (numericScore >= 1 && numericScore <= 4) {
          totalSkorSemua += numericScore
          totalJawabanPilihan += 1

          if (numericScore === 3 || numericScore === 4) {
            totalSkorPuas += 1
          }

          const uStat = unsurMap.get(q.id)
          if (uStat) {
            uStat.totalSkor += numericScore
            uStat.count += 1
            if (numericScore === 1) uStat.distribusi.skor1 += 1
            else if (numericScore === 2) uStat.distribusi.skor2 += 1
            else if (numericScore === 3) uStat.distribusi.skor3 += 1
            else if (numericScore === 4) uStat.distribusi.skor4 += 1
          }
        }
      })

      // Rata-rata keseluruhan dan tingkat kepuasan
      const rataRataKeseluruhan =
        totalJawabanPilihan > 0 ? Number((totalSkorSemua / totalJawabanPilihan).toFixed(2)) : null

      const tingkatKepuasan =
        totalJawabanPilihan > 0 ? Number(((totalSkorPuas / totalJawabanPilihan) * 100).toFixed(1)) : null

      // Susun list statistik per unsur
      const unsurStats: AdminSKMUnsurStat[] = questionsData
        .filter((q: any) => q.tipe === 'pilihan')
        .map((q) => {
          const uStat = unsurMap.get(q.id) || {
            totalSkor: 0,
            count: 0,
            distribusi: { skor1: 0, skor2: 0, skor3: 0, skor4: 0 },
          }

          const count = uStat.count
          const rata = count > 0 ? Number((uStat.totalSkor / count).toFixed(2)) : 0

          const persentaseDistribusi = {
            skor1: count > 0 ? Number(((uStat.distribusi.skor1 / count) * 100).toFixed(1)) : 0,
            skor2: count > 0 ? Number(((uStat.distribusi.skor2 / count) * 100).toFixed(1)) : 0,
            skor3: count > 0 ? Number(((uStat.distribusi.skor3 / count) * 100).toFixed(1)) : 0,
            skor4: count > 0 ? Number(((uStat.distribusi.skor4 / count) * 100).toFixed(1)) : 0,
          }

          return {
            pertanyaanId: q.id,
            urutan: q.urutan,
            unsur: q.unsur || `Unsur #${q.urutan}`,
            pertanyaan: q.pertanyaan,
            totalJawaban: count,
            rataRata: rata,
            distribusi: uStat.distribusi,
            persentaseDistribusi,
          }
        })

      return {
        data: {
          totalResponden,
          totalJawabanPilihan,
          rataRataKeseluruhan,
          tingkatKepuasan,
          unsurStats,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses rekapitulasi SKM.'
      return {
        data: {
          totalResponden: 0,
          totalJawabanPilihan: 0,
          rataRataKeseluruhan: null,
          tingkatKepuasan: null,
          unsurStats: [],
        },
        error: msg,
      }
    }
  },

  /**
   * Mengambil data respon masukan teks (Q17: Saran dan Masukan)
   */
  async getTextResponses(params: {
    type?: 'memuaskan' | 'saran' | string
    page: number
    limit: number
    periodFilter?: string
    customRange?: { startDate?: string; endDate?: string }
  }): Promise<{ data: AdminSKMTextItem[]; totalCount: number; error: string | null }> {
    try {
      const supabase = createClient()

      // Cari pertanyaan bertipe 'teks' (Q17: Saran dan masukan)
      const { data: qList, error: qErr } = await supabase
        .from('skm_pertanyaan')
        .select('id, unsur, urutan, tipe')
        .eq('tipe', 'teks')
        .order('urutan', { ascending: true })
        .limit(1)

      if (qErr) {
        console.error('Error finding text question:', qErr)
        return { data: [], totalCount: 0, error: qErr.message }
      }

      const qData = qList && qList.length > 0 ? qList[0] : null

      if (!qData) {
        return { data: [], totalCount: 0, error: null }
      }      // Query jawaban teks yang tidak kosong
      let query = supabase
        .from('skm_jawaban')
        .select(`
          id,
          pengajuan_id,
          jawaban,
          is_anonim,
          created_at,
          pengajuans (
            id,
            nama_lengkap,
            asal_instansi,
            bidangs (
              nama
            )
          )
        `, { count: 'exact' })
        .eq('skm_pertanyaan_id', qData.id)
        .not('jawaban', 'is', null)
        .order('created_at', { ascending: false })

      // Filter periode
      if (params.periodFilter === 'custom' && params.customRange) {
        if (params.customRange.startDate) {
          const start = new Date(params.customRange.startDate)
          start.setHours(0, 0, 0, 0)
          query = query.gte('created_at', start.toISOString())
        }
        if (params.customRange.endDate) {
          const end = new Date(params.customRange.endDate)
          end.setHours(23, 59, 59, 999)
          query = query.lte('created_at', end.toISOString())
        }
      } else if (params.periodFilter && params.periodFilter !== 'all') {
        const now = new Date()
        let startDate: Date | null = null

        if (params.periodFilter === '30days') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        else if (params.periodFilter === 'this_month') startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        else if (params.periodFilter === 'this_year') startDate = new Date(now.getFullYear(), 0, 1)

        if (startDate) query = query.gte('created_at', startDate.toISOString())
      }

      // Pagination
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) {
        console.error('Error fetching text responses:', error)
        return { data: [], totalCount: 0, error: error.message }
      }

      const formatted: AdminSKMTextItem[] = (data || [])
        .filter((row: any) => row.jawaban !== null && String(row.jawaban).trim() !== '')
        .map((row: any) => {
          const isAnon = row.is_anonim !== false
          return {
            id: row.id,
            pengajuanId: row.pengajuan_id,
            namaPemohon: isAnon ? '🔒 Responden Anonim' : (row.pengajuans?.nama_lengkap || 'Peserta Magang'),
            asalInstansi: isAnon ? 'Peserta Magang' : (row.pengajuans?.asal_instansi || '-'),
            bidangNama: row.pengajuans?.bidangs?.nama || 'Bidang Magang BRMP',
            teks: String(row.jawaban),
            isAnonim: isAnon,
            createdAt: row.created_at,
          }
        })

      return {
        data: formatted,
        totalCount: count || 0,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat jawaban teks.'
      return { data: [], totalCount: 0, error: msg }
    }
  },

  /**
   * Mengambil daftar riwayat submission SKM per pengajuan
   */
  async getSubmissionsList(params: {
    page: number
    limit: number
    search?: string
    periodFilter?: string
    customRange?: { startDate?: string; endDate?: string }
  }): Promise<{ data: AdminSKMSubmissionItem[]; totalCount: number; error: string | null }> {
    try {
      const supabase = createClient()

      // 1. Ambil seluruh jawaban dengan relasi pengajuan
      const { data: allAnswers, error: aErr } = await supabase
        .from('skm_jawaban')
        .select(`
          id,
          pengajuan_id,
          skm_pertanyaan_id,
          jawaban,
          is_anonim,
          peserta_nama,
          peserta_nim,
          is_ketua,
          created_at,
          skm_pertanyaan (
            urutan,
            tipe
          ),
          pengajuans (
            id,
            public_id,
            user_id,
            nama_lengkap,
            nim_nis,
            jenis_kelamin,
            asal_instansi,
            anggota,
            jumlah_anggota,
            created_at,
            bidangs (
              nama
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (aErr || !allAnswers) {
        return { data: [], totalCount: 0, error: aErr?.message || 'Gagal memuat riwayat pengisian.' }
      }

      // Ambil user_id unik untuk profil (email & gender)
      const userIds = Array.from(
        new Set(
          allAnswers
            .map((r: any) => r.pengajuans?.user_id)
            .filter((uid: any) => typeof uid === 'string' && uid.length > 0)
        )
      )
      const profileMap = new Map<string, { gender: string; email: string }>()
      if (userIds.length > 0) {
        try {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, jenis_kelamin, email')
            .in('id', userIds)
          if (profs) {
            profs.forEach((p: any) => {
              if (p.id) {
                profileMap.set(p.id, {
                  gender: p.jenis_kelamin || '',
                  email: p.email || '',
                })
              }
            })
          }
        } catch {
          // ignore profile lookup failure
        }
      }

      // Helper normalisasi jenis kelamin
      const normalizeGender = (raw?: string | null): string => {
        if (!raw) return '-'
        const clean = raw.trim().toLowerCase()
        if (clean === 'l' || clean === 'laki-laki' || clean === 'pria' || clean === 'male') {
          return 'Laki-laki'
        }
        if (clean === 'p' || clean === 'perempuan' || clean === 'wanita' || clean === 'female') {
          return 'Perempuan'
        }
        return raw.trim() || '-'
      }

      // 2. Kelompokkan per responden unik: (pengajuan_id + peserta_nama + peserta_nim)
      const respondentMap = new Map<
        string,
        {
          pengajuanId: number
          pesertaNama: string
          pesertaNim: string
          isKetua: boolean
          pengajuan: any
          submittedAt: string
          choiceScores: number[]
          totalAnswers: number
          isAnonim: boolean
        }
      >()

      allAnswers.forEach((row: any) => {
        const pId = row.pengajuan_id
        if (!pId) return

        const pNama = (row.peserta_nama || row.pengajuans?.nama_lengkap || 'Responden').trim()
        const pNim = (row.peserta_nim || '').trim()
        const respKey = `${pId}__${pNama.toLowerCase()}__${pNim.toLowerCase()}`

        if (!respondentMap.has(respKey)) {
          respondentMap.set(respKey, {
            pengajuanId: pId,
            pesertaNama: pNama,
            pesertaNim: pNim,
            isKetua: Boolean(row.is_ketua),
            pengajuan: row.pengajuans,
            submittedAt: row.created_at,
            choiceScores: [],
            totalAnswers: 0,
            isAnonim: row.is_anonim !== false,
          })
        }

        const group = respondentMap.get(respKey)!
        group.totalAnswers += 1

        const isChoice = row.skm_pertanyaan?.tipe === 'pilihan'
        if (isChoice) {
          const score = Number(row.jawaban)
          if (score >= 1 && score <= 4) {
            group.choiceScores.push(score)
          }
        }
      })

      // 3. Format ke daftar submission item
      let list: AdminSKMSubmissionItem[] = []
      respondentMap.forEach((val) => {
        const p = val.pengajuan
        const isAnon = val.isAnonim !== false
        const avg =
          val.choiceScores.length > 0
            ? Number(
              (
                val.choiceScores.reduce((a, b) => a + b, 0) /
                val.choiceScores.length
              ).toFixed(2)
            )
            : null

        const prof = p?.user_id ? profileMap.get(p.user_id) : null
        let gender = '-'
        if (!isAnon) {
          const rawGender = p?.jenis_kelamin || prof?.gender
          gender = normalizeGender(rawGender)
        }

        const isKelompok = isPengajuanKelompok(p)
        const peran: 'Ketua' | 'Anggota' | 'Individu' = !isKelompok
          ? 'Individu'
          : val.isKetua
          ? 'Ketua'
          : 'Anggota'

        const emailKetua = prof?.email || '-'
        const namaKetua = p?.nama_lengkap || 'Ketua'
        const totalPeserta = getJumlahPeserta(p)

        list.push({
          pengajuanId: val.pengajuanId,
          publicId: isAnon ? null : (p?.public_id || null),
          namaResponden: val.pesertaNama,
          namaPemohon: val.pesertaNama,
          nimNis: isAnon ? null : (val.pesertaNim || null),
          peran,
          namaKetua,
          emailKetua,
          jumlahAnggota: totalPeserta,
          isKelompok,
          isKetua: val.isKetua,
          jenisKelamin: gender,
          asalInstansi: isAnon ? 'Peserta Magang' : (p?.asal_instansi || null),
          bidangNama: p?.bidangs?.nama || 'Bidang Magang BRMP',
          tanggalPengisian: val.submittedAt,
          rataRataSkor: avg,
          totalJawaban: val.totalAnswers,
          isAnonim: isAnon,
        })
      })

      // Kelompokkan baris satu kelompok berdekatan (Ketua dulu, lalu anggota)
      // Urutan antar kelompok mengikuti submission time (yang pertama mengisi di atas)
      const groupEarliestTime = new Map<number, number>()
      list.forEach((item) => {
        const t = new Date(item.tanggalPengisian).getTime()
        const existing = groupEarliestTime.get(item.pengajuanId)
        if (!existing || t < existing) {
          groupEarliestTime.set(item.pengajuanId, t)
        }
      })

      list.sort((a, b) => {
        // 1. Kelompok yang mengisi lebih awal berada di atas
        const timeA = groupEarliestTime.get(a.pengajuanId) || 0
        const timeB = groupEarliestTime.get(b.pengajuanId) || 0
        if (timeA !== timeB) {
          return timeB - timeA // terbaru di atas
        }
        // 2. Jika pengajuan sama: Ketua di atas
        if (a.isKetua !== b.isKetua) {
          return a.isKetua ? -1 : 1
        }
        // 3. Antar anggota: berdasarkan waktu isi
        return new Date(a.tanggalPengisian).getTime() - new Date(b.tanggalPengisian).getTime()
      })

      // 4. Terapkan Filter Periode jika ada
      if (params.periodFilter === 'custom' && params.customRange) {
        let startTime: number | null = null
        let endTime: number | null = null

        if (params.customRange.startDate) {
          const s = new Date(params.customRange.startDate)
          s.setHours(0, 0, 0, 0)
          startTime = s.getTime()
        }
        if (params.customRange.endDate) {
          const e = new Date(params.customRange.endDate)
          e.setHours(23, 59, 59, 999)
          endTime = e.getTime()
        }

        if (startTime !== null) {
          list = list.filter((item) => new Date(item.tanggalPengisian).getTime() >= startTime!)
        }
        if (endTime !== null) {
          list = list.filter((item) => new Date(item.tanggalPengisian).getTime() <= endTime!)
        }
      } else if (params.periodFilter && params.periodFilter !== 'all') {
        const now = new Date()
        let startDate: Date | null = null

        if (params.periodFilter === '30days') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        else if (params.periodFilter === 'this_month') startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        else if (params.periodFilter === 'this_year') startDate = new Date(now.getFullYear(), 0, 1)

        if (startDate) {
          const startTime = startDate.getTime()
          list = list.filter((item) => new Date(item.tanggalPengisian).getTime() >= startTime)
        }
      }

      // 4.1 Pastikan urutan selalu terurut kronologis (dari awal ke baru)
      list.sort((a, b) => new Date(a.tanggalPengisian).getTime() - new Date(b.tanggalPengisian).getTime() || a.pengajuanId - b.pengajuanId)

      // 5. Terapkan Search jika ada
      if (params.search && params.search.trim().length > 0) {
        const q = params.search.toLowerCase()
        list = list.filter(
          (item) =>
            item.namaPemohon.toLowerCase().includes(q) ||
            (item.asalInstansi && item.asalInstansi.toLowerCase().includes(q)) ||
            item.bidangNama.toLowerCase().includes(q) ||
            String(item.pengajuanId).includes(q) ||
            (item.publicId && item.publicId.toLowerCase().includes(q))
        )
      }

      const totalCount = list.length
      const from = (params.page - 1) * params.limit
      const to = from + params.limit
      const paginatedList = list.slice(from, to)

      return {
        data: paginatedList,
        totalCount,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar submission.'
      return { data: [], totalCount: 0, error: msg }
    }
  },

  /**
   * Mengambil rincian lengkap jawaban untuk satu responden (pengajuan_id & opsional pesertaNama)
   */
  async getSubmissionDetail(
    pengajuanId: number,
    pesertaNama?: string
  ): Promise<{ data: AdminSKMSubmissionDetail | null; error: string | null }> {
    try {
      const supabase = createClient()

      // Ambil data pengajuan
      const { data: pengajuan, error: pErr } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          nama_lengkap,
          nim_nis,
          asal_instansi,
          jurusan,
          status,
          bidangs (
            nama
          )
        `)
        .eq('id', pengajuanId)
        .single()

      if (pErr || !pengajuan) {
        return { data: null, error: pErr?.message || 'Pengajuan tidak ditemukan.' }
      }

      // Ambil seluruh pertanyaan
      const { data: questions, error: qErr } = await supabase
        .from('skm_pertanyaan')
        .select('*')
        .order('urutan', { ascending: true })

      if (qErr || !questions) {
        return { data: null, error: qErr?.message || 'Gagal memuat pertanyaan.' }
      }

      // Ambil jawaban untuk pengajuan ini
      let query = supabase
        .from('skm_jawaban')
        .select('id, skm_pertanyaan_id, jawaban, is_anonim, peserta_nama, peserta_nim, is_ketua, created_at')
        .eq('pengajuan_id', pengajuanId)

      if (pesertaNama && pesertaNama.trim().length > 0) {
        query = query.eq('peserta_nama', pesertaNama.trim())
      }

      const { data: rawAnswers, error: aErr } = await query

      if (aErr || !rawAnswers || rawAnswers.length === 0) {
        return { data: null, error: aErr?.message || 'Gagal memuat jawaban responden.' }
      }

      const answers = rawAnswers
      const targetPeserta = answers[0]
      const isAnon = answers[0].is_anonim !== false
      const answerMap = new Map<number, string>()
      let submittedAt = answers[0]?.created_at || new Date().toISOString()
      answers.forEach((ans) => {
        answerMap.set(ans.skm_pertanyaan_id, ans.jawaban)
      })

      const choiceScores: number[] = []
      const detailedAnswers = questions.map((q: any) => {
        const raw = answerMap.get(q.id) || ''
        const isChoice = q.tipe === 'pilihan'
        let skor: number | null = null
        let labelOpsi: string | null = null

        if (isChoice) {
          skor = Number(raw)
          if (skor >= 1 && skor <= 4) {
            choiceScores.push(skor)
            const opt = Array.isArray(q.opsi) ? q.opsi.find((o: any) => o.skor === skor) : null
            labelOpsi = opt?.label || `Skor ${skor}`
          }
        }

        return {
          pertanyaanId: q.id,
          urutan: q.urutan,
          unsur: q.unsur,
          pertanyaan: q.pertanyaan,
          tipe: isChoice ? ('Pilihan' as const) : ('Teks' as const),
          jawabanRaw: raw,
          skor,
          labelOpsi,
        }
      })

      const rataRataSkor =
        choiceScores.length > 0
          ? Number((choiceScores.reduce((a, b) => a + b, 0) / choiceScores.length).toFixed(2))
          : null

      return {
        data: {
          pengajuan: {
            id: pengajuan.id,
            publicId: isAnon ? null : pengajuan.public_id,
            namaPemohon: isAnon ? '🔒 Responden Anonim' : (targetPeserta?.peserta_nama || pengajuan.nama_lengkap || 'Pemohon'),
            nimNis: isAnon ? null : (targetPeserta?.peserta_nim || pengajuan.nim_nis || null),
            asalInstansi: isAnon ? 'Peserta Magang' : (pengajuan.asal_instansi || null),
            jurusan: isAnon ? null : (pengajuan.jurusan || null),
            bidangNama: (pengajuan.bidangs as any)?.nama || 'Bidang Magang BRMP',
            status: pengajuan.status,
          },
          answers: detailedAnswers,
          rataRataSkor,
          submittedAt,
          isAnonim: isAnon,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat detail jawaban.'
      return { data: null, error: msg }
    }
  },

  /**
   * Mengambil data terstruktur untuk ekspor SKM (beserta jawaban Q1-Q17 per responden)
   */
  async getExportData(
    periodFilter: string = 'all',
    customRange?: { startDate?: string; endDate?: string }
  ): Promise<{
    submissions: AdminSKMSubmissionItem[]
    answerLookup: Map<string, string>
    error: string | null
  }> {
    try {
      const { data: submissions, error: subErr } = await this.getSubmissionsList({
        page: 1,
        limit: 10000,
        periodFilter,
        customRange,
      })

      if (subErr || !submissions) {
        return { submissions: [], answerLookup: new Map(), error: subErr || 'Gagal memuat data export.' }
      }

      const supabase = createClient()
      const { data: allAnswers } = await supabase
        .from('skm_jawaban')
        .select('pengajuan_id, peserta_nama, peserta_nim, skm_pertanyaan_id, jawaban, skm_pertanyaan(urutan)')

      const answerLookup = new Map<string, string>()
      if (allAnswers) {
        allAnswers.forEach((a: any) => {
          const u = a.skm_pertanyaan?.urutan
          if (a.pengajuan_id && u) {
            const pNama = (a.peserta_nama || '').trim().toLowerCase()
            const pNim = (a.peserta_nim || '').trim().toLowerCase()
            answerLookup.set(`${a.pengajuan_id}_${pNama}_${pNim}_${u}`, a.jawaban)
          }
        })
      }

      return { submissions, answerLookup, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat dataset export.'
      return { submissions: [], answerLookup: new Map(), error: msg }
    }
  },

  /**
   * Menghasilkan berkas Excel asli (.xlsx) menggunakan pustaka xlsx
   */
  async generateXLSXBuffer(
    periodFilter: string = 'all',
    customRange?: { startDate?: string; endDate?: string }
  ): Promise<{ buffer: Uint8Array | null; error: string | null }> {
    try {
      const XLSX = await import('xlsx')
      const { submissions, answerLookup, error } = await this.getExportData(periodFilter, customRange)
      if (error) return { buffer: null, error }

      const headers = [
        'No',
        'ID Pengajuan',
        'Nama Responden',
        'NIM',
        'Peran',
        'Nama Ketua',
        'Email Akun (Ketua)',
        'Jumlah Anggota',
        'Waktu Isi SKM',
        'Asal Instansi',
        'Bidang Magang',
        'Q1 (Informasi Pelayanan)',
        'Q2 (Persyaratan Pelayanan)',
        'Q3 (Kejelasan Prosedur)',
        'Q4 (Kemudahan Prosedur)',
        'Q5 (Waktu Layanan)',
        'Q6 (Biaya Layanan)',
        'Q7 (Produk Layanan)',
        'Q8 (Kecepatan Respon)',
        'Q9 (Keramahan Petugas)',
        'Q10 (Akses Pengaduan)',
        'Q11 (Sarana Prasarana)',
        'Q12 (Keadilan Pelayanan)',
        'Q13 (Integritas Layanan)',
        'Q14 (Anti Gratifikasi)',
        'Q15 (Bebas Pungli)',
        'Q16 (Bebas Percaloan)',
        'Rata-Rata Skor (Skala 1-4)',
        'Q17 (Saran dan Masukan)',
      ]

      const rows: any[][] = [headers]

      submissions.forEach((item, idx) => {
        const qAnswers: string[] = []
        const pNama = (item.namaResponden || '').trim().toLowerCase()
        const pNim = (item.nimNis || '').trim().toLowerCase()

        for (let i = 1; i <= 17; i++) {
          const ans =
            answerLookup.get(`${item.pengajuanId}_${pNama}_${pNim}_${i}`) ||
            answerLookup.get(`${item.pengajuanId}___${i}`) ||
            '-'
          qAnswers.push(ans)
        }

        const dateStr = item.tanggalPengisian
          ? new Date(item.tanggalPengisian).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).replace(/\./g, ':')
          : '-'

        rows.push([
          idx + 1,
          item.isAnonim ? '-' : item.pengajuanId,
          item.namaResponden,
          item.nimNis || '-',
          item.peran,
          item.namaKetua,
          item.emailKetua,
          item.jumlahAnggota,
          dateStr,
          item.asalInstansi || '-',
          item.bidangNama,
          ...qAnswers.slice(0, 16),
          item.rataRataSkor !== null ? item.rataRataSkor.toFixed(2) : '-',
          qAnswers[16] || '-',
        ])
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)

      // Auto width
      const colWidths = headers.map((h, i) => {
        let maxLen = h.length
        rows.forEach((r) => {
          const valStr = String(r[i] ?? '')
          if (valStr.length > maxLen) maxLen = valStr.length
        })
        return { wch: Math.min(Math.max(maxLen + 2, 10), 40) }
      })
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi SKM')
      const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      return { buffer: new Uint8Array(buf), error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghasilkan berkas Excel.'
      return { buffer: null, error: msg }
    }
  },

  /**
   * Membuat konten CSV untuk diekspor oleh Administrator
   */
  async generateCSVData(periodFilter: string = 'all'): Promise<{ csvString: string; error: string | null }> {
    try {
      const { submissions, answerLookup, error } = await this.getExportData(periodFilter)
      if (error) return { csvString: '', error }

      // Headers CSV
      const headers = [
        'No',
        'ID Pengajuan',
        'Public ID',
        'Tanggal Pengisian',
        'Nama Pemohon',
        'Jenis Kelamin',
        'NIM/NIS',
        'Asal Instansi',
        'Bidang Magang',
        'Q1 (Informasi Pelayanan)',
        'Q2 (Persyaratan Pelayanan)',
        'Q3 (Kejelasan Prosedur)',
        'Q4 (Kemudahan Prosedur)',
        'Q5 (Waktu Layanan)',
        'Q6 (Biaya Layanan)',
        'Q7 (Produk Layanan)',
        'Q8 (Kecepatan Respon)',
        'Q9 (Keramahan Petugas)',
        'Q10 (Akses Pengaduan)',
        'Q11 (Sarana Prasarana)',
        'Q12 (Keadilan Pelayanan)',
        'Q13 (Integritas Layanan)',
        'Q14 (Anti Gratifikasi)',
        'Q15 (Bebas Pungli)',
        'Q16 (Bebas Percaloan)',
        'Rata-Rata Skor (Skala 1-4)',
        'Q17 (Saran dan Masukan)',
      ]

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      }

      const rows: string[] = []
      rows.push(headers.join(','))

      submissions.forEach((item, idx) => {
        const qAnswers: string[] = []
        for (let i = 1; i <= 17; i++) {
          const ans = answerLookup.get(`${item.pengajuanId}_${i}`) || ''
          qAnswers.push(escapeCSV(ans))
        }

        const dateStr = item.tanggalPengisian
          ? new Date(item.tanggalPengisian).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          : '-'

        const row = [
          idx + 1,
          escapeCSV(item.isAnonim ? '-' : item.pengajuanId),
          escapeCSV(item.publicId || '-'),
          escapeCSV(dateStr),
          escapeCSV(item.namaPemohon),
          escapeCSV(item.jenisKelamin || '-'),
          escapeCSV(item.nimNis || '-'),
          escapeCSV(item.asalInstansi || '-'),
          escapeCSV(item.bidangNama),
          ...qAnswers.slice(0, 16),
          escapeCSV(item.rataRataSkor !== null ? item.rataRataSkor.toFixed(2) : '-'),
          qAnswers[16] || '""',
        ]

        rows.push(row.join(','))
      })

      return {
        csvString: '\uFEFF' + rows.join('\r\n'), // UTF-8 BOM agar rapi di Excel
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghasilkan CSV.'
      return { csvString: '', error: msg }
    }
  },
}
