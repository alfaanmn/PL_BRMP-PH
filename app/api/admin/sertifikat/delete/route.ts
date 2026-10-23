import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
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
        { success: false, error: 'Akses ditolak. Hanya administrator yang dapat menghapus sertifikat.' },
        { status: 403 }
      )
    }

    const { pengajuan_id } = await request.json()
    const pengajuanId = parseInt(String(pengajuan_id), 10)

    if (isNaN(pengajuanId)) {
      return NextResponse.json(
        { success: false, error: 'ID Pengajuan tidak valid.' },
        { status: 400 }
      )
    }

    // 3. Ambil berkas eksisting
    const { data: cert } = await supabase
      .from('sertifikats')
      .select('id, file_path')
      .eq('pengajuan_id', pengajuanId)
      .maybeSingle()

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Data sertifikat tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 4. Hapus dari Supabase Storage
    if (cert.file_path) {
      try {
        await supabase.storage.from('sertifikat').remove([cert.file_path])
      } catch (delErr) {
        console.warn('[DeleteSertifikat] Gagal menghapus file dari storage:', delErr)
      }
    }

    // 5. Hapus dari tabel sertifikats
    const { error: delDbErr } = await supabase
      .from('sertifikats')
      .delete()
      .eq('id', cert.id)

    if (delDbErr) {
      console.error('[DeleteSertifikat] Gagal hapus record sertifikats:', delDbErr)
      return NextResponse.json(
        { success: false, error: `Gagal menghapus data sertifikat: ${delDbErr.message}` },
        { status: 500 }
      )
    }

    // 6. Reset kolom sertifikat_url di pengajuans
    await supabase
      .from('pengajuans')
      .update({ sertifikat_url: null })
      .eq('id', pengajuanId)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat menghapus sertifikat.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
