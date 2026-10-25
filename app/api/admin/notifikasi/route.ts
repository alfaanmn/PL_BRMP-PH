import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Verifikasi autentikasi user
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak ditemukan' },
        { status: 401 }
      )
    }

    // 2. Verifikasi hak akses administrator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'administrator') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Hanya untuk administrator' },
        { status: 403 }
      )
    }

    // 3. Ambil daftar notifikasi untuk admin ini
    const adminClient = createAdminClient()
    const queryClient = adminClient || supabase

    const { data: notifications, error: notifErr } = await queryClient
      .from('notifikasi')
      .select('id, user_id, judul, pesan, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (notifErr) {
      console.error('[AdminNotifikasi API] Error loading notifications:', notifErr)
      return NextResponse.json(
        { success: false, error: 'Gagal memuat notifikasi' },
        { status: 500 }
      )
    }

    const items = notifications || []
    const unreadCount = items.filter((n) => !n.is_read).length

    return NextResponse.json({
      success: true,
      data: {
        notifications: items,
        unreadCount,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verifikasi autentikasi user
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak ditemukan' },
        { status: 401 }
      )
    }

    // 2. Verifikasi hak akses administrator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'administrator') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Hanya untuk administrator' },
        { status: 403 }
      )
    }

    // 3. Parse aksi pembacaan
    const body = await request.json()
    const { id, markAll } = body

    const adminClient = createAdminClient()
    const queryClient = adminClient || supabase

    if (markAll) {
      // Tandai seluruh notifikasi admin ini sebagai telah dibaca
      const { error: updateErr } = await queryClient
        .from('notifikasi')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateErr) {
        console.error('[AdminNotifikasi API] Error marking all read:', updateErr)
        return NextResponse.json(
          { success: false, error: 'Gagal memperbarui status notifikasi' },
          { status: 500 }
        )
      }
    } else if (id) {
      // Tandai 1 notifikasi spesifik
      const { error: updateErr } = await queryClient
        .from('notifikasi')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateErr) {
        console.error('[AdminNotifikasi API] Error marking single read:', updateErr)
        return NextResponse.json(
          { success: false, error: 'Gagal memperbarui notifikasi' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Parameter id atau markAll wajib diisi' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
