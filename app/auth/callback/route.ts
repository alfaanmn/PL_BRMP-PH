import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '')
    const supabaseKey = (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    )

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
            // Handled in server context
          }
        },
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Validasi parameter `next` agar hanya path internal diawali "/" dan bukan "//" (cegah open redirect)
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null

      // Jika ada target rute khusus (seperti reset-password)
      if (safeNext) {
        return NextResponse.redirect(`${origin}${safeNext}`)
      }

      // Ambil profile role untuk penentuan redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single()

      if (profile && !profile.is_active) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=inactive`)
      }

      if (profile?.role === 'administrator') {
        return NextResponse.redirect(`${origin}/admin/dashboard`)
      }

      return NextResponse.redirect(`${origin}/pengguna/dashboard`)
    }
  }

  // Jika gagal tukar kode auth
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
