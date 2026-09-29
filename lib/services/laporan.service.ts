import { createClient } from '@/lib/supabase/client'
import type {
  LaporanFilterParams,
  LaporanSummaryStats,
  LaporanExportPackage,
  LaporanPengajuanRow,
  LaporanPesertaRow,
  LaporanBidangRow,
  LaporanPembimbingRow,
  LaporanStatusSummaryRow,
  LaporanSKMQuestionMeta,
  LaporanSKMRow,
  ExportDatasetCategory,
  ExportFormat,
} from '@/types/laporan.types'

/**
 * Helper untuk menyusun query filter tanggal yang inklusif dan tidak mendrop data valid
 */
function applyDateFilter(query: any, startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    const endInclusive = `${endDate}T23:59:59.999Z`
    const startInclusive = `${startDate}T00:00:00.000Z`
    // Mencakup pengajuan yang dibuat pada periode ini ATAU magang yang berlangsung pada periode ini
    return query.or(
      `and(created_at.gte.${startInclusive},created_at.lte.${endInclusive}),and(tanggal_mulai.lte.${endDate},tanggal_selesai.gte.${startDate})`
    )
  } else if (startDate) {
    const startInclusive = `${startDate}T00:00:00.000Z`
    return query.or(`created_at.gte.${startInclusive},tanggal_selesai.gte.${startDate}`)
  } else if (endDate) {
    const endInclusive = `${endDate}T23:59:59.999Z`
    return query.or(`created_at.lte.${endInclusive},tanggal_mulai.lte.${endDate}`)
  }
  return query
}

export const laporanService = {
  /**
   * Mengambil daftar master bidang untuk dropdown filter
   */
  async getBidangList(client?: any): Promise<{ data: Array<{ id: number | string; nama: string }>; error: string | null }> {
    try {
      const supabase = client || createClient()
      const { data, error } = await supabase
        .from('bidangs')
        .select('id, nama')
        .order('nama', { ascending: true })

      if (error) return { data: [], error: error.message }
      return { data: (data as any[]) || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat opsi bidang.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil daftar master pembimbing untuk dropdown filter
   */
  async getPembimbingList(client?: any): Promise<{ data: Array<{ id: number | string; nama: string }>; error: string | null }> {
    try {
      const supabase = client || createClient()
      const { data, error } = await supabase
        .from('pembimbings')
        .select('id, nama')
        .order('nama', { ascending: true })

      if (error) return { data: [], error: error.message }
      return { data: (data as any[]) || [], error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat opsi pembimbing.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil ringkasan statistik komprehensif berdasarkan filter aktif
   */
  async getLaporanSummary(params: LaporanFilterParams = {}, client?: any): Promise<{
    data: LaporanSummaryStats
    error: string | null
  }> {
    try {
      const supabase = client || createClient()

      // 1. Query pengajuans dengan filter inklusif
      let query = supabase.from('pengajuans').select('id, jumlah_anggota, status, created_at, tanggal_mulai, tanggal_selesai, bidang_id, pembimbing_id')

      if (params.status && params.status !== 'semua' && params.status !== 'All') {
        if (params.status === 'Sedang Magang') {
          query = query.in('status', ['Sedang Magang', 'Disetujui'])
        } else {
          query = query.eq('status', params.status)
        }
      }
      if (params.bidangId && params.bidangId !== 'semua' && params.bidangId !== 'All') {
        query = query.eq('bidang_id', Number(params.bidangId))
      }
      if (params.pembimbingId && params.pembimbingId !== 'semua' && params.pembimbingId !== 'All') {
        query = query.eq('pembimbing_id', Number(params.pembimbingId))
      }

      query = applyDateFilter(query, params.startDate, params.endDate)

      const { data: pengajuans, error: pErr } = await query

      if (pErr) {
        return {
          data: {
            totalPengajuan: 0,
            totalPeserta: 0,
            totalBidang: 0,
            totalPembimbing: 0,
            rataRataSKM: null,
            statusCounts: {
              menungguVerifikasi: 0,
              sedangMagang: 0,
              selesai: 0,
              ditolak: 0,
              dibatalkan: 0,
            },
          },
          error: pErr.message,
        }
      }

      const rows: any[] = (pengajuans as any[]) || []
      const totalPengajuan = rows.length
      const totalPeserta = rows.reduce((sum: number, r: any) => sum + (Number(r.jumlah_anggota) || 1), 0)

      const statusCounts = {
        menungguVerifikasi: rows.filter((r: any) => r.status === 'Menunggu Verifikasi').length,
        sedangMagang: rows.filter((r: any) => r.status === 'Sedang Magang' || r.status === 'Disetujui').length,
        selesai: rows.filter((r: any) => r.status === 'Selesai').length,
        ditolak: rows.filter((r: any) => r.status === 'Ditolak').length,
        dibatalkan: rows.filter((r: any) => r.status === 'Dibatalkan').length,
      }

      // 2. Query master bidang & pembimbing aktif
      const [{ count: bidangCount }, { count: pembimbingCount }] = await Promise.all([
        supabase.from('bidangs').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('pembimbings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])

      // 3. Query rata-rata SKM secara dinamis (Hanya pertanyaan bertipe 'pilihan' yang dihitung)
      const { data: skmScores } = await supabase
        .from('skm_jawaban')
        .select(`
          jawaban,
          skm_pertanyaan (
            tipe
          )
        `)

      let rataRataSKM: number | null = null
      if (skmScores && skmScores.length > 0) {
        const validNumericScores = (skmScores as any[])
          .filter((item: any) => item.skm_pertanyaan?.tipe === 'pilihan')
          .map((item: any) => Number(item.jawaban))
          .filter((score: number) => !isNaN(score) && score >= 1 && score <= 4)

        if (validNumericScores.length > 0) {
          const sum = validNumericScores.reduce((acc: number, curr: number) => acc + curr, 0)
          rataRataSKM = Number((sum / validNumericScores.length).toFixed(2))
        }
      }

      return {
        data: {
          totalPengajuan,
          totalPeserta,
          totalBidang: bidangCount || 0,
          totalPembimbing: pembimbingCount || 0,
          rataRataSKM,
          statusCounts,
        },
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat ringkasan laporan.'
      return {
        data: {
          totalPengajuan: 0,
          totalPeserta: 0,
          totalBidang: 0,
          totalPembimbing: 0,
          rataRataSKM: null,
          statusCounts: {
            menungguVerifikasi: 0,
            sedangMagang: 0,
            selesai: 0,
            ditolak: 0,
            dibatalkan: 0,
          },
        },
        error: msg,
      }
    }
  },

  /**
   * Mengambil daftar data pengajuan dengan filter & pagination untuk tabel preview di UI
   */
  async getLaporanPengajuans(params: LaporanFilterParams = {}, client?: any): Promise<{
    data: LaporanPengajuanRow[]
    totalCount: number
    page: number
    limit: number
    error: string | null
  }> {
    try {
      const supabase = client || createClient()
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
          no_hp,
          topik_magang,
          status,
          created_at,
          updated_at,
          bidangs (
            id,
            nama
          ),
          pembimbings (
            id,
            nama,
            nip
          )
        `, { count: 'exact' })

      if (params.status && params.status !== 'semua' && params.status !== 'All') {
        if (params.status === 'Sedang Magang') {
          query = query.in('status', ['Sedang Magang', 'Disetujui'])
        } else {
          query = query.eq('status', params.status)
        }
      }
      if (params.bidangId && params.bidangId !== 'semua' && params.bidangId !== 'All') {
        query = query.eq('bidang_id', Number(params.bidangId))
      }
      if (params.pembimbingId && params.pembimbingId !== 'semua' && params.pembimbingId !== 'All') {
        query = query.eq('pembimbing_id', Number(params.pembimbingId))
      }

      query = applyDateFilter(query, params.startDate, params.endDate)

      if (params.search && params.search.trim()) {
        const term = params.search.trim()
        query = query.or(`nama_lengkap.ilike.%${term}%,nim_nis.ilike.%${term}%,asal_instansi.ilike.%${term}%,nomor_surat.ilike.%${term}%,public_id.ilike.%${term}%`)
      }

      query = query.order('created_at', { ascending: false }).range(from, to)

      const { data, count, error } = await query

      if (error) {
        return { data: [], totalCount: 0, page, limit, error: error.message }
      }

      const rows: LaporanPengajuanRow[] = (data || []).map((item: any, idx: number) => ({
        no: from + idx + 1,
        publicId: item.public_id || String(item.id),
        dbId: item.id,
        namaPemohon: item.nama_lengkap || 'Pemohon',
        email: '-',
        noHp: item.no_hp || '-',
        nimNis: item.nim_nis || '-',
        asalInstansi: item.asal_instansi || '-',
        jurusan: item.jurusan || '-',
        jenjang: item.jenjang || '-',
        topikMagang: item.topikMagang || item.topik_magang || '-',
        bidangNama: item.bidangs?.nama || '-',
        pembimbingNama: item.pembimbings?.nama || '-',
        pembimbingNip: item.pembimbings?.nip || '-',
        jumlahAnggota: Number(item.jumlah_anggota) || 1,
        nomorSurat: item.nomor_surat || '-',
        tanggalSurat: item.tanggal_surat || '-',
        tanggalMulai: item.tanggal_mulai || '-',
        tanggalSelesai: item.tanggal_selesai || '-',
        durasiBulan: Number(item.durasi_bulan) || 0,
        status: item.status,
        tanggalPengajuan: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '-',
        tanggalUpdate: item.updated_at ? new Date(item.updated_at).toISOString().split('T')[0] : '-',
      }))

      return {
        data: rows,
        totalCount: count || 0,
        page,
        limit,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data laporan pengajuan.'
      return { data: [], totalCount: 0, page: 1, limit: 10, error: msg }
    }
  },

  /**
   * Mengumpulkan dan mengolah seluruh dataset laporan untuk paket export Excel 7-Worksheet / CSV
   */
  async buildExportPackage(
    params: LaporanFilterParams = {},
    category: ExportDatasetCategory = 'all',
    format: ExportFormat = 'xlsx',
    client?: any
  ): Promise<{ data: LaporanExportPackage | null; error: string | null }> {
    try {
      const supabase = client || createClient()

      // 1. Query master pertanyaan SKM sebagai Single Source of Truth
      const { data: skmQuestionsRaw, error: qErr } = await supabase
        .from('skm_pertanyaan')
        .select('id, urutan, unsur, pertanyaan, tipe, is_active')
        .order('urutan', { ascending: true })

      if (qErr) {
        console.warn('Error fetching skm_pertanyaan:', qErr)
      }

      const skmQuestions: LaporanSKMQuestionMeta[] = (skmQuestionsRaw || []).map((q: any) => ({
        id: q.id,
        urutan: q.urutan,
        unsur: q.unsur,
        pertanyaan: q.pertanyaan,
        tipe: q.tipe || 'pilihan',
      }))

      // 2. Query seluruh pengajuans yang sesuai filter aktif (sebagai DATASET MASTER)
      let pQuery = supabase
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
          no_hp,
          topik_magang,
          status,
          anggota,
          created_at,
          updated_at,
          bidangs (
            id,
            nama,
            kuota
          ),
          pembimbings (
            id,
            nama,
            nip,
            jabatan,
            email,
            no_hp,
            kuota_default
          )
        `)

      if (params.status && params.status !== 'semua' && params.status !== 'All') {
        if (params.status === 'Sedang Magang') {
          pQuery = pQuery.in('status', ['Sedang Magang', 'Disetujui'])
        } else {
          pQuery = pQuery.eq('status', params.status)
        }
      }
      if (params.bidangId && params.bidangId !== 'semua' && params.bidangId !== 'All') {
        pQuery = pQuery.eq('bidang_id', Number(params.bidangId))
      }
      if (params.pembimbingId && params.pembimbingId !== 'semua' && params.pembimbingId !== 'All') {
        pQuery = pQuery.eq('pembimbing_id', Number(params.pembimbingId))
      }

      pQuery = applyDateFilter(pQuery, params.startDate, params.endDate)

      if (params.search && params.search.trim()) {
        const term = params.search.trim()
        pQuery = pQuery.or(`nama_lengkap.ilike.%${term}%,nim_nis.ilike.%${term}%,asal_instansi.ilike.%${term}%,nomor_surat.ilike.%${term}%,public_id.ilike.%${term}%`)
      }

      pQuery = pQuery.order('created_at', { ascending: false })

      const { data: rawPengajuans, error: pErr } = await pQuery

      if (pErr) {
        return { data: null, error: pErr.message }
      }

      const allPengajuans: any[] = (rawPengajuans as any[]) || []
      const matchingPengajuanIds = new Set(allPengajuans.map((p: any) => p.id))
      const pengajuanMapById = new Map<number | string, any>()
      allPengajuans.forEach((p: any) => {
        pengajuanMapById.set(p.id, p)
        if (p.id) pengajuanMapById.set(Number(p.id), p)
      })

      // Query profil email pemohon secara aman (tanpa memaksa join yang membuang baris)
      const userIds = Array.from(new Set(allPengajuans.map((p) => p.user_id).filter(Boolean)))
      const profileEmailMap = new Map<string, string>()
      if (userIds.length > 0) {
        try {
          const { data: userProfiles } = await supabase
            .from('profiles')
            .select('id, email, no_hp')
            .in('id', userIds)
          if (userProfiles) {
            userProfiles.forEach((prof: any) => {
              if (prof.id) profileEmailMap.set(String(prof.id), prof.email || '')
            })
          }
        } catch {
          // ignore profile fetch error
        }
      }

      // --- A. Dataset 1: Pengajuan Magang ---
      const pengajuanData: LaporanPengajuanRow[] = allPengajuans.map((item: any, idx: number) => {
        const email = profileEmailMap.get(String(item.user_id)) || '-'
        return {
          no: idx + 1,
          publicId: item.public_id || String(item.id),
          dbId: item.id,
          namaPemohon: item.nama_lengkap || 'Pemohon',
          email,
          noHp: item.no_hp || '-',
          nimNis: item.nim_nis || '-',
          asalInstansi: item.asal_instansi || '-',
          jurusan: item.jurusan || '-',
          jenjang: item.jenjang || '-',
          topikMagang: item.topikMagang || item.topik_magang || '-',
          bidangNama: item.bidangs?.nama || '-',
          pembimbingNama: item.pembimbings?.nama || '-',
          pembimbingNip: item.pembimbings?.nip || '-',
          jumlahAnggota: Number(item.jumlah_anggota) || 1,
          nomorSurat: item.nomor_surat || '-',
          tanggalSurat: item.tanggal_surat || '-',
          tanggalMulai: item.tanggal_mulai || '-',
          tanggalSelesai: item.tanggal_selesai || '-',
          durasiBulan: Number(item.durasi_bulan) || 0,
          status: item.status,
          tanggalPengajuan: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '-',
          tanggalUpdate: item.updated_at ? new Date(item.updated_at).toISOString().split('T')[0] : '-',
        }
      })

      // --- B. Dataset 2: Rekap Peserta & Anggota ---
      const pesertaData: LaporanPesertaRow[] = []
      let pesertaCounter = 1

      for (const p of allPengajuans) {
        const email = profileEmailMap.get(String(p.user_id)) || '-'

        // 1. Ketua / Pemohon
        pesertaData.push({
          no: pesertaCounter++,
          publicId: p.public_id || String(p.id),
          namaPeserta: p.nama_lengkap || 'Pemohon',
          peran: 'Ketua / Pemohon',
          nimNis: p.nim_nis || '-',
          email,
          noHp: p.no_hp || '-',
          jurusan: p.jurusan || '-',
          asalInstansi: p.asal_instansi || '-',
          bidangNama: (p.bidangs as any)?.nama || '-',
          pembimbingNama: (p.pembimbings as any)?.nama || '-',
          statusPengajuan: p.status,
          tanggalMulai: p.tanggal_mulai || '-',
          tanggalSelesai: p.tanggal_selesai || '-',
        })

        // 2. Anggota kelompok dari JSONB
        if (Array.isArray(p.anggota)) {
          for (const member of p.anggota) {
            if (member && (member.nama || member.nim_nis)) {
              pesertaData.push({
                no: pesertaCounter++,
                publicId: p.public_id || String(p.id),
                namaPeserta: member.nama || 'Anggota',
                peran: 'Anggota',
                nimNis: member.nim_nis || '-',
                email: member.email || '-',
                noHp: member.no_hp || '-',
                jurusan: member.jurusan || p.jurusan || '-',
                asalInstansi: p.asal_instansi || '-',
                bidangNama: (p.bidangs as any)?.nama || '-',
                pembimbingNama: (p.pembimbings as any)?.nama || '-',
                statusPengajuan: p.status,
                tanggalMulai: p.tanggal_mulai || '-',
                tanggalSelesai: p.tanggal_selesai || '-',
              })
            }
          }
        }
      }

      // --- C. Dataset 3: Rekap Bidang ---
      const { data: allBidangs } = await supabase
        .from('bidangs')
        .select(`
          id,
          nama,
          kuota,
          terisi,
          is_active,
          bidang_pembimbing (
            id,
            is_active
          )
        `)
        .order('id', { ascending: true })

      // Hitung peserta aktif riil dari database (status Sedang Magang / Disetujui)
      const { data: activePengajuans } = await supabase
        .from('pengajuans')
        .select('bidang_id, pembimbing_id, jumlah_anggota, status')
        .in('status', ['Sedang Magang', 'Disetujui'])

      const bidangActiveMap = new Map<string, number>()
      const pembimbingActiveMap = new Map<string, number>()

      if (activePengajuans) {
        for (const ap of activePengajuans) {
          const count = Number(ap.jumlah_anggota) || 1
          if (ap.bidang_id !== null && ap.bidang_id !== undefined) {
            const bKey = String(ap.bidang_id)
            bidangActiveMap.set(bKey, (bidangActiveMap.get(bKey) || 0) + count)
          }
          if (ap.pembimbing_id !== null && ap.pembimbing_id !== undefined) {
            const pKey = String(ap.pembimbing_id)
            pembimbingActiveMap.set(pKey, (pembimbingActiveMap.get(pKey) || 0) + count)
          }
        }
      }

      const bidangData: LaporanBidangRow[] = (allBidangs || []).map((b: any, idx: number) => {
        const kuota = Number(b.kuota) || 0
        const active = bidangActiveMap.get(String(b.id)) || 0
        const terisi = Math.max(Number(b.terisi) || 0, active)
        const sisa = Math.max(0, kuota - terisi)
        const pCount = Array.isArray(b.bidang_pembimbing)
          ? b.bidang_pembimbing.filter((bp: any) => bp.is_active).length
          : 0

        return {
          no: idx + 1,
          id: b.id,
          namaBidang: b.nama,
          kuotaMaksimal: kuota,
          pesertaAktif: terisi,
          sisaKuota: sisa,
          jumlahPembimbing: pCount,
          statusAktif: b.is_active !== false ? 'Aktif' : 'Nonaktif',
        }
      })

      // --- D. Dataset 4: Rekap Pembimbing ---
      const { data: allPembimbings } = await supabase
        .from('pembimbings')
        .select(`
          id,
          nama,
          nip,
          jabatan,
          email,
          no_hp,
          kuota_default,
          is_active,
          bidang_pembimbing (
            bidangs (
              nama
            )
          )
        `)
        .order('id', { ascending: true })

      const pembimbingData: LaporanPembimbingRow[] = (allPembimbings || []).map((p: any, idx: number) => {
        const kapasitas = Number(p.kuota_default) || 0
        const bKey = String(p.id)
        const bimbingan = pembimbingActiveMap.get(bKey) || 0
        const sisa = Math.max(0, kapasitas - bimbingan)
        const bidangNames = Array.isArray(p.bidang_pembimbing)
          ? p.bidang_pembimbing.map((bp: any) => bp.bidangs?.nama).filter(Boolean).join(', ')
          : '-'

        return {
          no: idx + 1,
          id: p.id,
          namaPembimbing: p.nama,
          nip: p.nip || '-',
          jabatan: p.jabatan || '-',
          email: p.email || '-',
          noHp: p.no_hp || '-',
          kuotaKapasitas: kapasitas,
          bimbinganAktif: bimbingan,
          sisaKapasitas: sisa,
          bidangDiampu: bidangNames || '-',
          statusAktif: p.is_active !== false ? 'Aktif' : 'Nonaktif',
        }
      })

      // --- E. Dataset 5: Rekap Distribusi Status ---
      const statusList = [
        'Menunggu Verifikasi',
        'Sedang Magang',
        'Selesai',
        'Ditolak',
        'Dibatalkan',
      ]
      const totalAll = allPengajuans.length
      const statusData: LaporanStatusSummaryRow[] = statusList.map((st, idx) => {
        const matched = allPengajuans.filter((p) => {
          if (st === 'Sedang Magang') return p.status === 'Sedang Magang' || p.status === 'Disetujui'
          return p.status === st
        })
        const totalP = matched.length
        const totalOrang = matched.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_anggota) || 1), 0)
        const pct = totalAll > 0 ? ((totalP / totalAll) * 100).toFixed(1) + '%' : '0.0%'

        return {
          no: idx + 1,
          status: st,
          totalPengajuan: totalP,
          totalPeserta: totalOrang,
          persentase: pct,
        }
      })

      // --- F. Dataset 6: Rekapitulasi SKM Dinamis ---
      const { data: skmAnswers } = await supabase
        .from('skm_jawaban')
        .select(`
          id,
          pengajuan_id,
          skm_pertanyaan_id,
          jawaban,
          is_anonim,
          created_at,
          skm_pertanyaan (
            urutan,
            tipe,
            pertanyaan,
            unsur
          )
        `)
        .order('created_at', { ascending: false })

      // Buat map pertanyaan berdasarkan id untuk fallback
      const qMapById = new Map<number, LaporanSKMQuestionMeta>()
      skmQuestions.forEach((q) => qMapById.set(q.id, q))

      const skmMap = new Map<number, any>()
      if (skmAnswers && skmAnswers.length > 0) {
        for (const ans of skmAnswers as any[]) {
          const pId = ans.pengajuan_id
          if (!pId) continue

          // Jika pengajuan ada di database/filter, kaitkan
          const pInfo = pengajuanMapById.get(pId) || pengajuanMapById.get(Number(pId))

          // Filter SKM konsisten: Jika ada filter aktif yang mengecualikan pengajuan ini, lewati
          if (matchingPengajuanIds.size > 0 && !matchingPengajuanIds.has(pId) && !matchingPengajuanIds.has(Number(pId))) {
            continue
          }

          const qInfo = ans.skm_pertanyaan || qMapById.get(ans.skm_pertanyaan_id)

          if (!skmMap.has(pId)) {
            skmMap.set(pId, {
              pengajuanId: pId,
              publicId: pInfo?.public_id || String(pId),
              namaPemohon: ans.is_anonim ? '🔒 Responden Anonim' : (pInfo?.nama_lengkap || 'Pemohon'),
              asalInstansi: ans.is_anonim ? 'Peserta Magang' : (pInfo?.asal_instansi || '-'),
              bidangNama: pInfo?.bidangs?.nama || '-',
              tanggalPengisian: ans.created_at ? new Date(ans.created_at).toISOString().split('T')[0] : '-',
              statusSKM: 'Selesai',
              choiceScores: [] as number[],
              answers: {} as Record<number, string>,
            })
          }

          const entry = skmMap.get(pId)!
          const urutan = qInfo?.urutan || ans.skm_pertanyaan_id
          if (urutan) {
            entry.answers[urutan] = ans.jawaban || ''
            // Hanya pertanyaan bertipe 'pilihan' yang masuk perhitungan rata-rata
            if (qInfo?.tipe === 'pilihan') {
              const score = Number(ans.jawaban)
              if (!isNaN(score) && score >= 1 && score <= 4) {
                entry.choiceScores.push(score)
              }
            }
          }
        }
      }

      const skmData: LaporanSKMRow[] = []
      let skmCounter = 1
      skmMap.forEach((entry, pId) => {
        const avg =
          entry.choiceScores.length > 0
            ? (entry.choiceScores.reduce((a: number, b: number) => a + b, 0) / entry.choiceScores.length).toFixed(2)
            : '-'

        skmData.push({
          no: skmCounter++,
          idPermohonan: pId,
          publicId: entry.publicId,
          tanggalPengisian: entry.tanggalPengisian,
          namaPemohon: entry.namaPemohon,
          asalInstansi: entry.asalInstansi,
          bidangNama: entry.bidangNama,
          rataRataSkor: avg,
          statusSKM: entry.statusSKM,
          answers: entry.answers,
        })
      })

      // Hitung Summary Stats untuk Sheet 1
      const totalPesertaAll = allPengajuans.reduce((sum: number, r: any) => sum + (Number(r.jumlah_anggota) || 1), 0)
      const allChoiceScores: number[] = []
      skmMap.forEach((entry) => {
        allChoiceScores.push(...entry.choiceScores)
      })
      const avgSKMGlobal =
        allChoiceScores.length > 0
          ? Number((allChoiceScores.reduce((a, b) => a + b, 0) / allChoiceScores.length).toFixed(2))
          : null

      const summaryStats: LaporanSummaryStats = {
        totalPengajuan: allPengajuans.length,
        totalPeserta: totalPesertaAll,
        totalBidang: (allBidangs || []).filter((b: any) => b.is_active).length,
        totalPembimbing: (allPembimbings || []).filter((p: any) => p.is_active).length,
        rataRataSKM: avgSKMGlobal,
        statusCounts: {
          menungguVerifikasi: allPengajuans.filter((p: any) => p.status === 'Menunggu Verifikasi').length,
          sedangMagang: allPengajuans.filter((p: any) => p.status === 'Sedang Magang' || p.status === 'Disetujui').length,
          selesai: allPengajuans.filter((p: any) => p.status === 'Selesai').length,
          ditolak: allPengajuans.filter((p: any) => p.status === 'Ditolak').length,
          dibatalkan: allPengajuans.filter((p: any) => p.status === 'Dibatalkan').length,
        },
      }

      // Generate Nama File Standar: SIM-Magang_BRMP_Laporan_[Tahun/Periode].xlsx
      let periodLabel = new Date().getFullYear().toString()
      if (params.startDate && params.endDate) {
        periodLabel = `${params.startDate}_sd_${params.endDate}`
      } else if (params.startDate) {
        periodLabel = `sejak_${params.startDate}`
      }

      const ext = format === 'csv' ? 'csv' : 'xlsx'
      const filename =
        category === 'all'
          ? `SIM-Magang_BRMP_Laporan_${periodLabel}.${ext}`
          : `SIM-Magang_BRMP_Rekap_${category}_${periodLabel}.${ext}`

      const exportPkg: LaporanExportPackage = {
        filename,
        category,
        format,
        generatedAt: new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }),
        filterSummary: {
          status: params.status && params.status !== 'semua' ? params.status : 'Semua Status',
          bidang: params.bidangId && params.bidangId !== 'semua' ? `ID Bidang ${params.bidangId}` : 'Semua Bidang',
          pembimbing:
            params.pembimbingId && params.pembimbingId !== 'semua'
              ? `ID Pembimbing ${params.pembimbingId}`
              : 'Semua Pembimbing',
          dateRange:
            params.startDate || params.endDate
              ? `${params.startDate || 'Awal'} s.d ${params.endDate || 'Akhir'}`
              : 'Semua Periode',
          keyword: params.search && params.search.trim() ? params.search : '(Semua)',
        },
        summaryStats,
        pengajuanData,
        pesertaData,
        bidangData,
        pembimbingData,
        statusData,
        skmQuestions,
        skmData,
      }

      return { data: exportPkg, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyusun paket ekspor data.'
      return { data: null, error: msg }
    }
  },
}
