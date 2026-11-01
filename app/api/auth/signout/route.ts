import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * Route Handler Server-Side untuk Sign Out Bersih
 * Memanggil signOut pada Supabase Auth dan menghapus seluruh cookie auth (sb-*)
 * dari header response HTTP secara definitif di sisi server.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    // Sapu bersih seluruh cookie auth Supabase dan cookie penanda jembatan
    allCookies.forEach((c) => {
      if (
        c.name.startsWith('sb-') ||
        c.name.includes('auth-token') ||
        c.name === 'simpul_tab_bridge'
      ) {
        cookieStore.set(c.name, '', {
          maxAge: 0,
          path: '/',
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses sign out server'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

