import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh token session Supabase
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Path pengecualian / publik
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  const isResetPasswordPage = pathname === '/reset-password'
  const isCallbackPage = pathname.startsWith('/auth/callback') || pathname.startsWith('/callback')
  const isAdminRoute = pathname.startsWith('/admin')
  const isPenggunaRoute = pathname.startsWith('/pengguna')

  // 1. JIKA BELUM LOGIN
  if (!user) {
    if (isAdminRoute || isPenggunaRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 2. JIKA SUDAH LOGIN, AMBIL PROFIL & ROLE DARI DATABASE
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // Handle jika akun inactive
  if (profile && !profile.is_active) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'inactive')
    return NextResponse.redirect(url)
  }

  const role = profile?.role

  // Handle redirect jika user yang sudah login mengakses halaman auth (/login, /register, /forgot-password)
  if (isAuthPage) {
    const url = request.nextUrl.clone()
    if (role === 'administrator') {
      url.pathname = '/admin/dashboard'
    } else {
      url.pathname = '/pengguna/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // Handle Role Protection: /admin/* hanya boleh diakses oleh administrator
  if (isAdminRoute) {
    if (role !== 'administrator') {
      const url = request.nextUrl.clone()
      url.pathname = '/pengguna/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Handle Role Protection: /pengguna/* jika diakses administrator diarahkan ke /admin/dashboard
  if (isPenggunaRoute) {
    if (role === 'administrator') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
