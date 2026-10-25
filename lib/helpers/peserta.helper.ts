/**
 * Helper terpusat untuk resolusi peserta pengajuan magang dan evaluasi kelengkapan SKM
 * Kebal terhadap data null, kosong, atau inkonsisten antara pengajuans.anggota dan pengajuan_anggotas.
 */

export interface PesertaIdentitas {
  id?: number | null // id dari pengajuan_anggotas jika ada
  nama: string
  nim_nis: string
  is_ketua: boolean
}

/**
 * Menghasilkan daftar peserta definitif (Ketua selalu di indeks 0, disusul seluruh Anggota)
 */
export function getPesertaList(
  pengajuan: any,
  dbAnggotas?: any[] | null
): PesertaIdentitas[] {
  if (!pengajuan) return []

  const ketuaNama = (pengajuan.nama_lengkap || '').trim() || 'Pemohon Magang'
  const ketuaNim = (pengajuan.nim_nis || '').trim()

  const list: PesertaIdentitas[] = [
    {
      id: null,
      nama: ketuaNama,
      nim_nis: ketuaNim,
      is_ketua: true,
    },
  ]

  const ketuaNamaLower = ketuaNama.toLowerCase()
  const ketuaNimLower = ketuaNim.toLowerCase()

  // 1. Prioritas utama: data dari tabel pengajuan_anggotas
  if (dbAnggotas && Array.isArray(dbAnggotas) && dbAnggotas.length > 0) {
    dbAnggotas.forEach((a: any) => {
      const aNama = (a.nama || '').trim()
      const aNim = (a.nim_nis || '').trim()
      if (!aNama) return

      // Abaikan jika ditandai is_ketua atau nama & NIM sama persis dengan ketua
      if (a.is_ketua) return
      if (aNama.toLowerCase() === ketuaNamaLower && (!aNim || aNim.toLowerCase() === ketuaNimLower)) return

      list.push({
        id: a.id || null,
        nama: aNama,
        nim_nis: aNim,
        is_ketua: false,
      })
    })
    return list
  }

  // 2. Fallback: data dari kolom JSON pengajuans.anggota (format legacy atau submit form)
  let rawAnggota = pengajuan.anggota
  if (typeof rawAnggota === 'string') {
    try {
      rawAnggota = JSON.parse(rawAnggota)
    } catch {
      rawAnggota = null
    }
  }

  if (Array.isArray(rawAnggota) && rawAnggota.length > 0) {
    rawAnggota.forEach((a: any, idx: number) => {
      const aNama = (a.nama || a.nama_lengkap || '').trim()
      const aNim = (a.nim_nis || a.nim || '').trim()
      if (!aNama) return

      if (aNama.toLowerCase() === ketuaNamaLower && (!aNim || aNim.toLowerCase() === ketuaNimLower)) return

      list.push({
        id: idx + 1,
        nama: aNama,
        nim_nis: aNim,
        is_ketua: false,
      })
    })
  }

  return list
}

/**
 * Mengembalikan jumlah total peserta untuk suatu pengajuan (minimal 1)
 */
export function getJumlahPeserta(pengajuan: any, dbAnggotas?: any[] | null): number {
  return getPesertaList(pengajuan, dbAnggotas).length
}

/**
 * Menentukan apakah pengajuan bertipe kelompok (> 1 peserta)
 */
export function isPengajuanKelompok(pengajuan: any, dbAnggotas?: any[] | null): boolean {
  return getPesertaList(pengajuan, dbAnggotas).length > 1
}

export interface SKMCompletionStatus {
  isComplete: boolean
  isKelompok: boolean
  totalPeserta: number
  submittedCount: number
  hasLegacy: boolean
  pesertaList: PesertaIdentitas[]
  submittedPesertaKeys: Set<string>
  unsubmittedPesertas: PesertaIdentitas[]
}

/**
 * Evaluasi status kelengkapan SKM secara terpusat untuk semua modul:
 * - Individu (1 peserta): lengkap kalau ada minimal 1 responden (atau ada baris skm_jawaban)
 * - Kelompok: lengkap kalau jumlah responden unik >= jumlah peserta,
 *   ATAU pengajuan memiliki baris is_legacy = true (kelompok lama tetap lengkap)
 */
export function evaluateSKMCompletion(
  pengajuan: any,
  dbAnggotas: any[] | null | undefined,
  skmJawabanRows: Array<{
    peserta_nama?: string | null
    peserta_nim?: string | null
    is_ketua?: boolean | null
    is_legacy?: boolean | null
  }> | null | undefined
): SKMCompletionStatus {
  const pesertas = getPesertaList(pengajuan, dbAnggotas)
  const isKelompok = pesertas.length > 1
  const totalPeserta = pesertas.length

  const rows = skmJawabanRows || []
  const hasLegacy = rows.some((r) => r.is_legacy === true)

  // Hitung responden unik berdasarkan (peserta_nama + peserta_nim)
  const submittedPesertaKeys = new Set<string>()
  rows.forEach((r) => {
    const namaKey = (r.peserta_nama || '').trim().toLowerCase()
    const nimKey = (r.peserta_nim || '').trim().toLowerCase()
    if (namaKey) {
      submittedPesertaKeys.add(`${namaKey}__${nimKey}`)
    } else if (r.is_ketua) {
      // Baris legacy tanpa nama spesifik diasosiasikan ke ketua
      const kNama = (pengajuan?.nama_lengkap || '').trim().toLowerCase()
      const kNim = (pengajuan?.nim_nis || '').trim().toLowerCase()
      submittedPesertaKeys.add(`${kNama}__${kNim}`)
    }
  })

  // Raw count fallback jika ada baris tapi nama belum terpetakan
  const rawCount = submittedPesertaKeys.size > 0 ? submittedPesertaKeys.size : (rows.length > 0 ? 1 : 0)

  // Filter peserta yang belum mengisi
  const unsubmittedPesertas = pesertas.filter((p) => {
    const key = `${p.nama.trim().toLowerCase()}__${p.nim_nis.trim().toLowerCase()}`
    return !submittedPesertaKeys.has(key)
  })

  let isComplete = false
  if (!isKelompok) {
    // Individu (1 peserta): lengkap jika minimal 1 jawaban
    isComplete = rawCount >= 1 || rows.length > 0
  } else {
    // Kelompok: lengkap jika responden unik >= total peserta ATAU kelompok lama (is_legacy = true)
    isComplete = rawCount >= totalPeserta || hasLegacy
  }

  return {
    isComplete,
    isKelompok,
    totalPeserta,
    submittedCount: Math.min(rawCount, totalPeserta),
    hasLegacy,
    pesertaList: pesertas,
    submittedPesertaKeys,
    unsubmittedPesertas,
  }
}
