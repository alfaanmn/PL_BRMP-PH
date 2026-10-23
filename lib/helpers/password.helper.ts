/**
 * Helper dan tipe data untuk kriteria kekuatan password.
 * Syarat:
 * 1. Minimal 8 karakter
 * 2. Mengandung setidaknya 1 huruf besar (A-Z)
 * 3. Mengandung setidaknya 1 angka (0-9)
 * 4. Mengandung setidaknya 1 simbol (karakter khusus di luar huruf, angka, dan spasi)
 * 5. Tidak boleh mengandung spasi
 */

export interface PasswordCriteriaResult {
  hasMinLength: boolean
  hasUpperCase: boolean
  hasNumber: boolean
  hasSymbol: boolean
  hasNoSpace: boolean
  isValid: boolean
  missingCriteria: string[]
}

export function checkPasswordCriteria(password: string): PasswordCriteriaResult {
  const p = password || ''
  const hasMinLength = p.length >= 8
  const hasUpperCase = /[A-Z]/.test(p)
  const hasNumber = /[0-9]/.test(p)
  const hasSymbol = /[^A-Za-z0-9\s]/.test(p)
  const hasNoSpace = p.length > 0 && !/\s/.test(p)

  const missingCriteria: string[] = []
  if (!hasMinLength) missingCriteria.push('minimal 8 karakter')
  if (!hasUpperCase) missingCriteria.push('huruf kapital (A-Z)')
  if (!hasNumber) missingCriteria.push('angka (0-9)')
  if (!hasSymbol) missingCriteria.push('simbol khusus')
  if (!hasNoSpace && /\s/.test(p)) missingCriteria.push('tidak boleh mengandung spasi')

  const isValid = hasMinLength && hasUpperCase && hasNumber && hasSymbol && hasNoSpace

  return {
    hasMinLength,
    hasUpperCase,
    hasNumber,
    hasSymbol,
    hasNoSpace,
    isValid,
    missingCriteria,
  }
}
