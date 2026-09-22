// Test Error Mapping in auth.service.ts logic
function mapAuthError(error, cleanPhone) {
  let message = error.message || 'Gagal melakukan registrasi'
  const lowerMsg = error.message?.toLowerCase() || ''
  const errorCode = error.code || ''

  if (
    lowerMsg.includes('already registered') ||
    lowerMsg.includes('user already registered') ||
    errorCode === 'user_already_exists' ||
    lowerMsg.includes('duplicate key') ||
    lowerMsg.includes('unique constraint')
  ) {
    if (lowerMsg.includes('no_hp') || lowerMsg.includes('phone') || lowerMsg.includes('idx_profiles_unique_no_hp')) {
      message = 'Nomor HP sudah terdaftar. Silakan gunakan nomor HP lain.'
    } else {
      message = 'Email sudah terdaftar. Silakan login atau gunakan email lain.'
    }
  } else if (
    lowerMsg.includes('database error saving new user') ||
    lowerMsg.includes('error saving new user') ||
    (lowerMsg.includes('database error') && lowerMsg.includes('saving'))
  ) {
    if (cleanPhone) {
      message = 'Nomor HP sudah terdaftar. Silakan gunakan nomor HP lain.'
    } else {
      message = 'Terjadi kendala saat menyimpan data pendaftaran. Silakan gunakan data lain atau hubungi administrator.'
    }
  }
  return message
}

console.log('=== TEST ERROR MAPPING ===')
const errSupabase = { message: 'Database error saving new user', code: 'unexpected_failure' }
const mappedMsg = mapAuthError(errSupabase, '085163720894')
console.log('Mapped Result for "Database error saving new user":', mappedMsg)
console.log('Is correctly mapped:', mappedMsg === 'Nomor HP sudah terdaftar. Silakan gunakan nomor HP lain.' ? 'PASS' : 'FAIL')
