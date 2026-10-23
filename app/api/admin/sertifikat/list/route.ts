import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sertifikatService } from '@/lib/services/sertifikat.service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verifikasi Autentikasi Pengguna
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      )
    }

    // 2. Otorisasi Menggunakan is_admin()
    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin')
    if (adminErr || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Hanya administrator yang dapat melihat daftar sertifikat.' },
        { status: 403 }
      )
    }

    // 3. Ambil filter dari query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const skmStatus = searchParams.get('skmStatus') as any
    const sertifikatStatus = searchParams.get('sertifikatStatus') as any
    const notifikasiStatus = searchParams.get('notifikasiStatus') as any

    const result = await sertifikatService.getAdminSertifikatList({
      search,
      skmStatus,
      sertifikatStatus,
      notifikasiStatus,
    })

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat memuat data.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
