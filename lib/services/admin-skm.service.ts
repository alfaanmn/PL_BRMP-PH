import { createClient } from '@/lib/supabase/client'
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
  async getRekapStats(periodFilter: string = 'all'): Promise<{ data: AdminSKMStats; error: string | null }> {
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
        .select('id, pengajuan_id, skm_pertanyaan_id, jawaban, created_at')

      // Filter periode tanggal jika dipilih
      if (periodFilter !== 'all') {
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

      // 3. Hitung Responden Unik (berdasarkan pengajuan_id)
      const respondentSet = new Set<number>()
      answersData.forEach((ans) => {
        if (ans.pengajuan_id) {
          respondentSet.add(ans.pengajuan_id)
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
   * Mengambil data respon masukan teks (Q14: Hal Memuaskan atau Q15: Saran/Masukan)
   */
  async getTextResponses(params: {
    type: 'memuaskan' | 'saran'
    page: number
    limit: number
    periodFilter?: string
  }): Promise<{ data: AdminSKMTextItem[]; totalCount: number; error: string | null }> {
    try {
      const supabase = createClient()

      // Cari pertanyaan bertipe 'teks' sesuai kategori masukan
      let qQuery = supabase
        .from('skm_pertanyaan')
        .select('id, unsur, urutan, tipe')
        .eq('tipe', 'teks')

      if (params.type === 'memuaskan') {
        qQuery = qQuery.or('urutan.eq.14,unsur.ilike.%memuaskan%')
      } else {
        qQuery = qQuery.or('urutan.eq.15,unsur.ilike.%saran%')
      }

      const { data: qList, error: qErr } = await qQuery.order('urutan', { ascending: true }).limit(1)

      if (qErr) {
        console.error('Error finding text question:', qErr)
        return { data: [], totalCount: 0, error: qErr.message }
      }

      const qData = qList && qList.length > 0 ? qList[0] : null

      if (!qData) {
        return { data: [], totalCount: 0, error: null }
      }

      // Query jawaban teks yang tidak kosong
      let query = supabase
        .from('skm_jawaban')
        .select(`
          id,
          pengajuan_id,
          jawaban,
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
      if (params.periodFilter && params.periodFilter !== 'all') {
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
        .map((row: any) => ({
          id: row.id,
          pengajuanId: row.pengajuan_id,
          namaPemohon: row.pengajuans?.nama_lengkap || 'Peserta Magang',
          asalInstansi: row.pengajuans?.asal_instansi || '-',
          bidangNama: row.pengajuans?.bidangs?.nama || 'Bidang Magang BRMP',
          teks: String(row.jawaban),
          createdAt: row.created_at,
        }))

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
  }): Promise<{ data: AdminSKMSubmissionItem[]; totalCount: number; error: string | null }> {
    try {
      const supabase = createClient()

      // 1. Ambil seluruh jawaban dengan relasi pengajuan
      const { data: allAnswers, error: aErr } = await supabase
        .from('skm_jawaban')
        .select(`
          pengajuan_id,
          skm_pertanyaan_id,
          jawaban,
          created_at,
          skm_pertanyaan (
            urutan,
            tipe
          ),
          pengajuans (
            id,
            public_id,
            nama_lengkap,
            nim_nis,
            asal_instansi,
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

      // 2. Kelompokkan berdasarkan pengajuan_id
      const groupedMap = new Map<
        number,
        {
          pengajuan: any
          submittedAt: string
          choiceScores: number[]
          totalAnswers: number
        }
      >()

      allAnswers.forEach((row: any) => {
        const pId = row.pengajuan_id
        if (!pId) return

        if (!groupedMap.has(pId)) {
          groupedMap.set(pId, {
            pengajuan: row.pengajuans,
            submittedAt: row.created_at,
            choiceScores: [],
            totalAnswers: 0,
          })
        }

        const group = groupedMap.get(pId)!
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
      groupedMap.forEach((val, pId) => {
        const p = val.pengajuan
        const avg =
          val.choiceScores.length > 0
            ? Number(
                (
                  val.choiceScores.reduce((a, b) => a + b, 0) /
                  val.choiceScores.length
                ).toFixed(2)
              )
            : null

        list.push({
          pengajuanId: pId,
          publicId: p?.public_id || null,
          namaPemohon: p?.nama_lengkap || 'Pemohon',
          nimNis: p?.nim_nis || null,
          asalInstansi: p?.asal_instansi || null,
          bidangNama: p?.bidangs?.nama || 'Bidang Magang BRMP',
          tanggalPengisian: val.submittedAt,
          rataRataSkor: avg,
          totalJawaban: val.totalAnswers,
        })
      })

      // 4. Terapkan Filter Periode jika ada
      if (params.periodFilter && params.periodFilter !== 'all') {
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

      // 6. Pagination
      const from = (params.page - 1) * params.limit
      const pagedList = list.slice(from, from + params.limit)

      return {
        data: pagedList,
        totalCount,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses daftar submission.'
      return { data: [], totalCount: 0, error: msg }
    }
  },

  /**
   * Mengambil rincian lengkap 15 jawaban untuk satu responden (pengajuan_id)
   */
  async getSubmissionDetail(pengajuanId: number): Promise<{ data: AdminSKMSubmissionDetail | null; error: string | null }> {
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
      const { data: answers, error: aErr } = await supabase
        .from('skm_jawaban')
        .select('id, skm_pertanyaan_id, jawaban, created_at')
        .eq('pengajuan_id', pengajuanId)

      if (aErr || !answers) {
        return { data: null, error: aErr?.message || 'Gagal memuat jawaban responden.' }
      }

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
            publicId: pengajuan.public_id,
            namaPemohon: pengajuan.nama_lengkap || 'Pemohon',
            nimNis: pengajuan.nim_nis,
            asalInstansi: pengajuan.asal_instansi,
            jurusan: pengajuan.jurusan,
            bidangNama: (pengajuan.bidangs as any)?.nama || 'Bidang Magang BRMP',
            status: pengajuan.status,
          },
          answers: detailedAnswers,
          rataRataSkor,
          submittedAt,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat detail jawaban.'
      return { data: null, error: msg }
    }
  },

  /**
   * Membuat konten CSV untuk diekspor oleh Administrator
   */
  async generateCSVData(periodFilter: string = 'all'): Promise<{ csvString: string; error: string | null }> {
    try {
      const { data: submissions, error: subErr } = await this.getSubmissionsList({
        page: 1,
        limit: 10000,
        periodFilter,
      })

      if (subErr || !submissions) {
        return { csvString: '', error: subErr || 'Gagal memuat data export.' }
      }

      const supabase = createClient()
      const { data: allAnswers } = await supabase
        .from('skm_jawaban')
        .select('pengajuan_id, skm_pertanyaan_id, jawaban, skm_pertanyaan(urutan)')

      const answerLookup = new Map<string, string>()
      if (allAnswers) {
        allAnswers.forEach((a: any) => {
          const u = a.skm_pertanyaan?.urutan
          if (a.pengajuan_id && u) {
            answerLookup.set(`${a.pengajuan_id}_${u}`, a.jawaban)
          }
        })
      }

      // Headers CSV
      const headers = [
        'No',
        'ID Pengajuan',
        'Public ID',
        'Tanggal Pengisian',
        'Nama Pemohon',
        'NIM/NIS',
        'Asal Instansi',
        'Bidang Magang',
        'Q1 (Persyaratan)',
        'Q2 (Prosedur)',
        'Q3 (Waktu Pelayanan)',
        'Q4 (Biaya/Tarif)',
        'Q5 (Produk Pelayanan)',
        'Q6 (Kompetensi Petugas)',
        'Q7 (Perilaku Petugas)',
        'Q8 (Sarana Prasarana)',
        'Q9 (Pengaduan)',
        'Q10 (Kejelasan Info)',
        'Q11 (Kemudahan Info)',
        'Q12 (Keterbukaan Info)',
        'Q13 (Kesesuaian Kebutuhan)',
        'Rata-Rata Skor',
        'Q14 (Hal Memuaskan)',
        'Q15 (Saran & Masukan)',
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
        for (let i = 1; i <= 15; i++) {
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
          escapeCSV(item.pengajuanId),
          escapeCSV(item.publicId || '-'),
          escapeCSV(dateStr),
          escapeCSV(item.namaPemohon),
          escapeCSV(item.nimNis || '-'),
          escapeCSV(item.asalInstansi || '-'),
          escapeCSV(item.bidangNama),
          ...qAnswers.slice(0, 13),
          escapeCSV(item.rataRataSkor !== null ? item.rataRataSkor.toFixed(2) : '-'),
          qAnswers[13] || '""',
          qAnswers[14] || '""',
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
