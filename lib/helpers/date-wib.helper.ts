/**
 * Helper Perhitungan Tanggal Presisi dengan Zona Waktu Indonesia Barat (WIB - Asia/Jakarta).
 * Mencegah masalah pergeseran 1 hari akibat toISOString() / UTC offset.
 */

export interface WibDateParts {
  year: number
  month: number // 1-12
  day: number // 1-31
}

/**
 * Mendapatkan komponen tanggal saat ini menurut zona waktu Asia/Jakarta
 */
export function getWibParts(date: Date = new Date()): WibDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = Number(parts.find((p) => p.type === 'year')?.value || date.getFullYear())
  const month = Number(parts.find((p) => p.type === 'month')?.value || date.getMonth() + 1)
  const day = Number(parts.find((p) => p.type === 'day')?.value || date.getDate())
  return { year, month, day }
}

/**
 * Format tanggal hari ini dalam format YYYY-MM-DD zona waktu Asia/Jakarta
 */
export function getWibTodayString(): string {
  const { year, month, day } = getWibParts()
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Menghitung rentang tanggal awal dan akhir untuk bulan & tahun tertentu (WIB)
 * @param year Tahun (contoh: 2026)
 * @param month Bulan 1-12 (1 = Januari, 12 = Desember)
 */
export function getWibMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const lastDay = new Date(year, month, 0).getDate()
  const startStr = `${year}-${String(month).padStart(2, '0')}-01`
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { startDate: startStr, endDate: endStr }
}

/**
 * Rentang tanggal bulan berjalan (WIB)
 */
export function getWibCurrentMonthRange(): { startDate: string; endDate: string } {
  const { year, month } = getWibParts()
  return getWibMonthRange(year, month)
}

/**
 * Rentang tanggal satu bulan sebelumnya (WIB)
 */
export function getWibPreviousMonthRange(): { startDate: string; endDate: string } {
  const { year, month } = getWibParts()
  let prevMonth = month - 1
  let prevYear = year
  if (prevMonth < 1) {
    prevMonth = 12
    prevYear -= 1
  }
  return getWibMonthRange(prevYear, prevMonth)
}

/**
 * Rentang tanggal satu tahun penuh (1 Januari s.d 31 Desember)
 */
export function getWibYearRange(year: number): { startDate: string; endDate: string } {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  }
}

/**
 * Mengubah string tanggal YYYY-MM-DD ke format ISO inklusif awal hari di WIB (+07:00)
 */
export function getInclusiveStartWib(dateStr: string): string {
  return `${dateStr}T00:00:00.000+07:00`
}

/**
 * Mengubah string tanggal YYYY-MM-DD ke format ISO inklusif akhir hari di WIB (+07:00)
 */
export function getInclusiveEndWib(dateStr: string): string {
  return `${dateStr}T23:59:59.999+07:00`
}

/**
 * Format tanggal ramah pengguna bahasa Indonesia (contoh: "16 Jan 2026")
 */
export function formatTanggalIndo(dateStr?: string | null, shortMonth: boolean = false): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: shortMonth ? 'short' : 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    })
  } catch {
    return dateStr
  }
}

export const NAMA_BULAN_INDO = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]
