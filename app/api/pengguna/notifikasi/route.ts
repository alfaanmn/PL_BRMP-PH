import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pengguna/notifikasi
 * Mengambil daftar notifikasi milik pengguna biasa (user) yang sedang login
 * Filter eksplisit: user_id = user.id, diurutkan created_at DESC, limit 20
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi pengguna tidak ditemukan' },
        { status: 401 }
      )
    }

    // Ambil notifikasi khusus milik user yang sedang login
    const { data: notifications, error } = await supabase
      .from('notifikasi')
      .select('id, user_id, judul, pesan, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[PenggunaNotifikasi GET] Database error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications || [],
        unreadCount,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[PenggunaNotifikasi GET] Exception:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

/**
 * PATCH /api/pengguna/notifikasi
 * Menandai notifikasi milik pengguna yang sedang login sebagai telah dibaca
 * Body: { id?: number, markAll?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi pengguna tidak ditemukan' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { id, markAll } = body

    if (markAll) {
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('[PenggunaNotifikasi PATCH markAll] Error:', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Seluruh notifikasi ditandai dibaca' })
    }

    if (id) {
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('[PenggunaNotifikasi PATCH] Error:', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Notifikasi ditandai dibaca' })
    }

    return NextResponse.json(
      { success: false, error: 'Parameter id atau markAll wajib disediakan' },
      { status: 400 }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[PenggunaNotifikasi PATCH] Exception:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
