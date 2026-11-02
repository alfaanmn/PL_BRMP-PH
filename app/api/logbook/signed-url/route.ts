import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/logbook/signed-url?id=<logbook_uuid>
 * Menghasilkan Signed URL privat berumur 60 detik untuk berkas logbook.
 * Otorisasi: Pemilik pengajuan ATAU administrator.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const logbookId = searchParams.get('id')?.trim()

    if (!logbookId) {
      return NextResponse.json(
        { success: false, error: 'Parameter id logbook wajib disertakan.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid atau telah berakhir.' },
        { status: 401 }
      )
    }

    // 1. Ambil data profil pengguna untuk pengecekan role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'administrator'

    // 2. Ambil baris logbook menggunakan Admin Client (Service Role)
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: 'Admin client tidak tersedia pada server.' },
        { status: 500 }
      )
    }

    const { data: logbook, error: logbookError } = await adminClient
      .from('logbooks')
      .select('id, user_id, pengajuan_id, file_path, file_name')
      .eq('id', logbookId)
      .single()

    if (logbookError || !logbook) {
      return NextResponse.json(
        { success: false, error: 'Data logbook tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 3. Verifikasi hak akses: Pemilik sendiri ATAU Administrator
    if (!isAdmin && logbook.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak akses untuk membuka berkas logbook ini.' },
        { status: 403 }
      )
    }

    // 4. Generate Signed URL berumur pendek (60 detik)
    const { data: signedData, error: signedError } = await adminClient.storage
      .from('logbook')
      .createSignedUrl(logbook.file_path, 60)

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat URL akses berkas logbook.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      fileName: logbook.file_name,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
