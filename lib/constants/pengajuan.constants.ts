export const PENGAJUAN_CONFIG = {
  ALLOW_REAPPLY_AFTER_FINISHED: true, // Pemohon dengan status Selesai diperkenankan mendaftar kembali
  NIM_MIN_LENGTH: 5,
  NIM_MAX_LENGTH: 20,
  WA_MIN_LENGTH: 10,
  WA_MAX_LENGTH: 15,
}

/**
 * Normalisasi nomor WhatsApp ke standar numerik 62xxxxxxxxxx
 */
export function normalizeWhatsApp(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return ''
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.replace(/^\+/, '')
  }
  return cleaned
}

/**
 * Validasi apakah nomor NIM/NIS memenuhi format numerik 5-20 digit
 */
export function isValidNim(nim: string): boolean {
  if (!nim) return false
  const trimmed = nim.trim()
  return /^[0-9]{5,20}$/.test(trimmed)
}
