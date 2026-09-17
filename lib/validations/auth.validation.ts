export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email wajib diisi'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
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
  if (!data.no_hp || !data.no_hp.trim()) {
    errors.no_hp = 'Nomor HP / WhatsApp wajib diisi'
  } else {
    const phoneRegex = /^[0-9+() -]{8,20}$/
    if (!phoneRegex.test(data.no_hp.trim())) {
      errors.no_hp = 'Format nomor HP/WA tidak valid'
    }
  }

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
