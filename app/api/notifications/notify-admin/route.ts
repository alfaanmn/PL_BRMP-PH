import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verifikasi bahwa pengirim request terautentikasi
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak valid' },
        { status: 401 }
      )
    }

    // 2. Parse payload notifikasi
    const body = await request.json()
    const { judul, pesan, link } = body

    if (!judul || !pesan) {
      return NextResponse.json(
        { success: false, error: 'Judul dan pesan notifikasi wajib diisi' },
        { status: 400 }
      )
    }

    // 3. Gunakan client yang tepat untuk mengambil daftar administrator aktif
    // Prioritaskan adminClient jika secret key tersedia untuk bypass RLS profil
    const adminClient = createAdminClient()
    const queryClient = adminClient || supabase

    const { data: adminProfiles, error: adminErr } = await queryClient
      .from('profiles')
      .select('id')
      .eq('role', 'administrator')
      .eq('is_active', true)

    if (adminErr) {
      console.error('[NotifyAdmin API] Gagal memuat profil administrator:', adminErr)
      return NextResponse.json(
        { success: false, error: 'Gagal mencari daftar administrator' },
        { status: 500 }
      )
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada administrator aktif yang ditemukan',
        count: 0,
      })
    }

    // 4. Batch insert entri notifikasi ke setiap administrator
    const rowsToInsert = adminProfiles.map((adm) => ({
      user_id: adm.id,
      judul: String(judul).trim(),
      pesan: String(pesan).trim(),
      link: link ? String(link).trim() : null,
      is_read: false,
    }))

    const { error: insertErr } = await queryClient
      .from('notifikasi')
      .insert(rowsToInsert)

    if (insertErr) {
      console.error('[NotifyAdmin API] Gagal menyimpan notifikasi ke tabel:', insertErr)
      return NextResponse.json(
        { success: false, error: 'Gagal membuat notifikasi di database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: rowsToInsert.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[NotifyAdmin API] Exception:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
