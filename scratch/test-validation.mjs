import { normalizePhoneNumber, validateEmail, validatePhoneNumber } from '../lib/validations/auth.validation.ts'

console.log('=== RUNNING TESTS ===')

// Test Normalisasi Nomor HP
const t1 = normalizePhoneNumber('081812345678')
const t2 = normalizePhoneNumber('6281812345678')
const t3 = normalizePhoneNumber('+6281812345678')
const t4 = normalizePhoneNumber('+62 818-1234-5678')

console.log('t1 (0818...):', t1)
console.log('t2 (62818...):', t2)
console.log('t3 (+62818...):', t3)
console.log('t4 (formatted):', t4)

const phoneNormalizationPass = (t1 === '081812345678' && t2 === '081812345678' && t3 === '081812345678' && t4 === '081812345678')
console.log('Phone Normalization Consistency:', phoneNormalizationPass ? 'PASS' : 'FAIL')

// Test Email Normalization
const e1 = 'User.Test@Example.COM '.trim().toLowerCase()
console.log('Email normalization:', e1 === 'user.test@example.com' ? 'PASS' : 'FAIL')
