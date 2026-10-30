import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '')
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  )

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (!value || options?.maxAge === 0) {
              // Penghapusan cookie (misal signOut) - pertahankan maxAge: 0 dan path asli
              cookieStore.set(name, value, {
                ...options,
                maxAge: 0,
                path: options?.path || '/',
              })
            } else {
              // Session cookie murni: Hapus maxAge & expires agar terhapus otomatis saat browser ditutup
              const { maxAge: _m, expires: _e, ...sessionOptions } = options || {}
              cookieStore.set(name, value, {
                ...sessionOptions,
                path: options?.path || '/',
              })
            }
          })
        } catch {
          // Dipanggil dari Server Component, ignore jika tidak bisa set cookie
        }
      },
    },
  })
}
