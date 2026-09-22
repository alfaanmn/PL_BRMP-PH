import { createClient } from '@supabase/supabase-js'

/**
 * Helper Supabase Admin Client
 * KHUSUS UNTUK PENGGUNAAN SERVER-SIDE (Route Handler / Server Actions).
 * JANGAN PERNAH DI-IMPORT ATAU DIGUNAKAN DI CLIENT COMPONENT ('use client').
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '')
  
  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''

  // Pastikan secret key valid dan bukan placeholder kosong
  if (!supabaseUrl || !secretKey || secretKey.includes('xxxxxxxxxxxxxxxxx')) {
    return null
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
