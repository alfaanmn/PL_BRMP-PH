/**
 * Normalisasi format nomor HP Indonesia ke format canonical string '08xxxxxxxxxx'
 * Mendukung: '08...', '+628...', '628...', spasi, dan tanda hubung
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return ''
  let clean = phone.replace(/[\s\-().+]/g, '')
  if (clean.startsWith('62')) {
    clean = '0' + clean.slice(2)
  } else if (!clean.startsWith('0') && clean.length > 0) {
    clean = '0' + clean
  }
  return clean
}

export function validatePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone || !phone.trim()) {
    return 'Nomor HP / WhatsApp wajib diisi'
  }
  const normalized = normalizePhoneNumber(phone)
  // Format nomor HP Indonesia standar: diawali 08 dan memiliki panjang 10-14 digit
  if (!/^08\d{8,12}$/.test(normalized)) {
    return 'Nomor HP tidak valid. Gunakan format Indonesia yang valid (contoh: 081234567890)'
  }
  return null
}

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email wajib diisi'
  }
  const cleanEmail = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    return 'Format email tidak valid'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password wajib diisi'
  }
  if (password.length < 6) {
    return 'Password minimal 6 karakter'
  }
  return null
}

export function validateName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Nama lengkap wajib diisi'
  }
  if (name.trim().length < 2) {
    return 'Nama minimal 2 karakter'
  }
  return null
}

export function validateRegister(data: {
  name: string
  email: string
  password: string
  confirmPassword?: string
  no_hp?: string
  asal_instansi?: string
  jurusan?: string
  jenis_kelamin?: string
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // 1. Nama Lengkap (Wajib)
  const nameError = validateName(data.name)
  if (nameError) errors.name = nameError

  // 2. Email Aktif (Wajib)
  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  // 3. Nomor HP / WhatsApp (Wajib)
  const phoneError = validatePhoneNumber(data.no_hp)
  if (phoneError) errors.no_hp = phoneError

  // 4. Jenis Kelamin (Wajib)
  if (!data.jenis_kelamin || !data.jenis_kelamin.trim()) {
    errors.jenis_kelamin = 'Jenis kelamin wajib dipilih'
  }

  // 5. Asal Instansi (Wajib)
  if (!data.asal_instansi || !data.asal_instansi.trim()) {
    errors.asal_instansi = 'Asal instansi / sekolah / kampus wajib diisi'
  } else if (data.asal_instansi.trim().length < 2) {
    errors.asal_instansi = 'Asal instansi minimal 2 karakter'
  }

  // 6. Program Studi / Jurusan (Wajib)
  if (!data.jurusan || !data.jurusan.trim()) {
    errors.jurusan = 'Program studi / jurusan wajib diisi'
  } else if (data.jurusan.trim().length < 2) {
    errors.jurusan = 'Program studi / jurusan minimal 2 karakter'
  }

  // 7. Password (Wajib, Min. 6 Karakter)
  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError

  // 8. Konfirmasi Password (Wajib & Cocok)
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak cocok'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateResetPassword(data: {
  password: string
  confirmPassword: string
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak cocok'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateOtp(token: string): string | null {
  if (!token || !token.trim()) {
    return 'Kode OTP wajib diisi'
  }
  const clean = token.trim()
  if (!/^\d{6,8}$/.test(clean)) {
    return 'Kode OTP harus berupa 6 hingga 8 digit angka'
  }
  return null
}
