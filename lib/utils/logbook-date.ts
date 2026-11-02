/**
 * UTILITAS PERHITUNGAN MINGGU & PERIODE LOGBOOK
 * 
 * Standar Zona Waktu: Asia/Jakarta (WIB = UTC+7)
 * Definisi Minggu:
 * - Menggunakan tanggal_mulai dan tanggal_selesai dari baris pengajuan.
 * - Minggu ke-1 dimulai tepat pada tanggal_mulai.
 * - Setiap minggu berdurasi 7 hari kalender (hari ke-1 sampai hari ke-7).
 * - Periode selesai minggu terakhir dibatasi oleh tanggal_selesai pengajuan.
 */

export interface MingguPeriode {
  minggu_ke: number
  periode_mulai: string // 'YYYY-MM-DD'
  periode_selesai: string // 'YYYY-MM-DD'
  is_current: boolean
  is_future: boolean
  is_past: boolean
}

/**
 * Format Date object ke string 'YYYY-MM-DD' menurut zona waktu Asia/Jakarta
 */
export function formatJakartaDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Mendapatkan tanggal hari ini string 'YYYY-MM-DD' di Jakarta
 */
export function getJakartaTodayString(): string {
  return formatJakartaDate(new Date())
}

/**
 * Parse string 'YYYY-MM-DD' ke Date object UTC midnight agar perhitungan selisih hari konsisten
 */
export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/**
 * Menghitung selisih hari inklusif antara 2 tanggal
 */
export function getInclusiveDays(startDateStr: string, endDateStr: string): number {
  const start = parseDateOnly(startDateStr)
  const end = parseDateOnly(endDateStr)
  const diffMs = end.getTime() - start.getTime()
  if (diffMs < 0) return 0
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Menghasilkan daftar seluruh minggu (Minggu 1..N) untuk pengajuan magang
 */
export function calculateAllLogbookWeeks(
  tanggalMulaiStr: string,
  tanggalSelesaiStr: string,
  referenceDateStr?: string
): MingguPeriode[] {
  if (!tanggalMulaiStr || !tanggalSelesaiStr) return []

  const todayStr = referenceDateStr || getJakartaTodayString()
  const today = parseDateOnly(todayStr)
  const start = parseDateOnly(tanggalMulaiStr)
  const end = parseDateOnly(tanggalSelesaiStr)

  if (end < start) return []

  const totalDays = getInclusiveDays(tanggalMulaiStr, tanggalSelesaiStr)
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7))

  const weeks: MingguPeriode[] = []

  for (let m = 1; m <= totalWeeks; m++) {
    const weekStartOffsetDays = (m - 1) * 7
    const weekStartDate = new Date(start.getTime() + weekStartOffsetDays * 86400000)

    let weekEndDate = new Date(weekStartDate.getTime() + 6 * 86400000)
    if (weekEndDate > end) {
      weekEndDate = new Date(end.getTime())
    }

    const startStr = weekStartDate.toISOString().split('T')[0]
    const endStr = weekEndDate.toISOString().split('T')[0]

    const isPast = today > weekEndDate
    const isFuture = today < weekStartDate
    const isCurrent = today >= weekStartDate && today <= weekEndDate

    weeks.push({
      minggu_ke: m,
      periode_mulai: startStr,
      periode_selesai: endStr,
      is_current: isCurrent,
      is_future: isFuture,
      is_past: isPast,
    })
  }

  return weeks
}

/**
 * Menghitung minggu ke berapa hari ini berjalan.
 * Jika belum mulai -> 0
 * Jika sudah lewat selesai -> totalWeeks
 */
export function getCurrentWeekNumber(
  tanggalMulaiStr: string,
  tanggalSelesaiStr: string,
  referenceDateStr?: string
): number {
  const weeks = calculateAllLogbookWeeks(tanggalMulaiStr, tanggalSelesaiStr, referenceDateStr)
  if (weeks.length === 0) return 0

  const todayStr = referenceDateStr || getJakartaTodayString()
  const today = parseDateOnly(todayStr)
  const start = parseDateOnly(tanggalMulaiStr)
  const end = parseDateOnly(tanggalSelesaiStr)

  if (today < start) return 0
  if (today > end) return weeks.length

  const current = weeks.find((w) => w.is_current)
  return current ? current.minggu_ke : weeks.length
}
