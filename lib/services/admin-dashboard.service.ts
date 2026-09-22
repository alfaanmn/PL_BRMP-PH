import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
  totalPengajuan: number
  menungguVerifikasi: number
  sedangMagang: number
  selesai: number
  ditolak: number
  totalPengguna: number
  skmAverage: number | null
}

export interface RecentPengajuanItem {
  id: number | string
  public_id?: string | null
  nomor_surat: string
  nama_lengkap: string
  asal_instansi: string
  jurusan: string
  status: string
  created_at: string
  bidang_nama?: string | null
}

export interface BidangSummaryItem {
  id: number | string
  nama: string
  kuota: number | null
  is_active: boolean | null
  peserta_count: number
  total_pendaftar: number
}

export interface MonthlyTrendItem {
  periode: string
  count: number
}

export const adminDashboardService = {
  /**
   * Mengambil statistik ringkas dashboard administrator dari data aktual
   */
  async getDashboardStats(): Promise<{ data: DashboardStats; error: string | null }> {
    try {
      const supabase = createClient()

      // 1. Ambil data status pengajuan
      const { data: pengajuans, error: pengajuanError } = await supabase
        .from('pengajuans')
        .select('status')

      if (pengajuanError) {
        return {
          data: {
            totalPengajuan: 0,
            menungguVerifikasi: 0,
            sedangMagang: 0,
            selesai: 0,
            ditolak: 0,
            totalPengguna: 0,
            skmAverage: null,
          },
          error: pengajuanError.message,
        }
      }

      // Hitung agregasi status
      const totalPengajuan = pengajuans?.length || 0
      const menungguVerifikasi = pengajuans?.filter((p: any) => p.status === 'Menunggu Verifikasi').length || 0
      const sedangMagang = pengajuans?.filter((p: any) => p.status === 'Sedang Magang').length || 0
      const selesai = pengajuans?.filter((p: any) => p.status === 'Selesai').length || 0
      const ditolak = pengajuans?.filter((p: any) => p.status === 'Ditolak').length || 0

      // 2. Ambil total pengguna dengan role = 'pengguna'
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'pengguna')

      const totalPengguna = userCount || 0

      if (userError) {
        console.warn('Gagal menghitung profil pengguna:', userError.message)
      }

      // 3. Ambil rata-rata SKM dari skm_jawaban secara akurat (hanya butir tipe pilihan)
      let skmAverage: number | null = null
      try {
        // Ambil ID butir pertanyaan yang bertipe 'pilihan'
        const { data: qData } = await supabase
          .from('skm_pertanyaan')
          .select('id')
          .eq('tipe', 'pilihan')

        const pilihanIdSet = new Set((qData || []).map((q: any) => q.id))

        const { data: skmData } = await supabase
          .from('skm_jawaban')
          .select('skm_pertanyaan_id, jawaban')

        if (skmData && skmData.length > 0) {
          const validScores: number[] = []
          for (const item of skmData) {
            // Saring hanya butir pilihan (atau jika data id cocok) dan konversi jawaban secara aman
            if (!pilihanIdSet.size || pilihanIdSet.has(item.skm_pertanyaan_id)) {
              const num = Number(item.jawaban)
              if (!isNaN(num) && num >= 1 && num <= 4) {
                validScores.push(num)
              }
            }
          }

          if (validScores.length > 0) {
            const totalSkor = validScores.reduce((acc: number, curr: number) => acc + curr, 0)
            skmAverage = Number((totalSkor / validScores.length).toFixed(2))
          }
        }
      } catch {
        skmAverage = null
      }

      return {
        data: {
          totalPengajuan,
          menungguVerifikasi,
          sedangMagang,
          selesai,
          ditolak,
          totalPengguna,
          skmAverage,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengambil statistik dashboard.'
      return {
        data: {
          totalPengajuan: 0,
          menungguVerifikasi: 0,
          sedangMagang: 0,
          selesai: 0,
          ditolak: 0,
          totalPengguna: 0,
          skmAverage: null,
        },
        error: msg,
      }
    }
  },

  /**
   * Mengambil tren pengajuan bulanan (untuk grafik garis)
   */
  async getMonthlyTrends(): Promise<{ data: MonthlyTrendItem[]; error: string | null }> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pengajuans')
        .select('created_at')
        .order('created_at', { ascending: true })

      if (error) return { data: [], error: error.message }

      const counts: Record<string, number> = {}
      for (const item of data || []) {
        if (item.created_at) {
          const period = item.created_at.substring(0, 7) // 'YYYY-MM'
          counts[period] = (counts[period] || 0) + 1
        }
      }

      const result: MonthlyTrendItem[] = Object.keys(counts).map((p) => ({
        periode: p,
        count: counts[p],
      }))

      // Jika data pengajuan masih sedikit, sediakan bulan berjalan
      if (result.length === 0) {
        const currentMonth = new Date().toISOString().substring(0, 7)
        result.push({ periode: currentMonth, count: 0 })
      }

      return { data: result, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat tren pengajuan.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil 6 antrean pengajuan magang terbaru
   */
  async getRecentPengajuans(limit = 6): Promise<{ data: RecentPengajuanItem[]; error: string | null }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          nomor_surat,
          nama_lengkap,
          asal_instansi,
          jurusan,
          status,
          created_at,
          bidangs (
            nama
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { data: [], error: error.message }
      }

      const formatted: RecentPengajuanItem[] = (data || []).map((item: any) => ({
        id: item.id,
        public_id: item.public_id,
        nomor_surat: item.nomor_surat || '-',
        nama_lengkap: item.nama_lengkap || 'Tanpa Nama',
        asal_instansi: item.asal_instansi || '-',
        jurusan: item.jurusan || '-',
        status: item.status || 'Menunggu Verifikasi',
        created_at: item.created_at,
        bidang_nama: item.bidangs?.nama || '-',
      }))

      return { data: formatted, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil data pengajuan terbaru.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil ringkasan kuota dan jumlah pendaftar per bidang
   */
  async getBidangSummary(): Promise<{ data: BidangSummaryItem[]; error: string | null }> {
    try {
      const supabase = createClient()

      // Ambil seluruh bidang
      const { data: bidangs, error: bidangError } = await supabase
        .from('bidangs')
        .select('id, nama, kuota, is_active')
        .order('id', { ascending: true })

      if (bidangError) {
        return { data: [], error: bidangError.message }
      }

      // Ambil seluruh pengajuan untuk menghitung pendaftar dan peserta aktif
      const { data: allPengajuans } = await supabase
        .from('pengajuans')
        .select('bidang_id, status')

      const activeMap: Record<string | number, number> = {}
      const totalPendaftarMap: Record<string | number, number> = {}

      if (allPengajuans) {
        for (const row of allPengajuans) {
          if (row.bidang_id) {
            totalPendaftarMap[row.bidang_id] = (totalPendaftarMap[row.bidang_id] || 0) + 1
            if (row.status === 'Sedang Magang') {
              activeMap[row.bidang_id] = (activeMap[row.bidang_id] || 0) + 1
            }
          }
        }
      }

      const summary: BidangSummaryItem[] = (bidangs || []).map((b: any) => ({
        id: b.id,
        nama: b.nama,
        kuota: b.kuota,
        is_active: b.is_active,
        peserta_count: activeMap[b.id] || 0,
        total_pendaftar: totalPendaftarMap[b.id] || 0,
      }))

      return { data: summary, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil ringkasan bidang.'
      return { data: [], error: msg }
    }
  },
}
