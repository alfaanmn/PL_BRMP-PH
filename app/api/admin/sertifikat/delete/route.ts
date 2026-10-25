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

    const body = await request.json()
    const sertifikatId = body.sertifikat_id ? parseInt(String(body.sertifikat_id), 10) : null
    const pengajuanId = body.pengajuan_id ? parseInt(String(body.pengajuan_id), 10) : null

    if (!sertifikatId && !pengajuanId) {
      return NextResponse.json(
        { success: false, error: 'ID Sertifikat atau ID Pengajuan wajib disertakan.' },
        { status: 400 }
      )
    }

    if (sertifikatId) {
      // Hapus 1 sertifikat spesifik berdasarkan ID
      const { data: cert, error: cErr } = await supabase
        .from('sertifikats')
        .select('id, pengajuan_id, file_path')
        .eq('id', sertifikatId)
        .maybeSingle()

      if (cErr || !cert) {
        return NextResponse.json(
          { success: false, error: 'Data sertifikat tidak ditemukan.' },
          { status: 404 }
        )
      }

      // Hapus dari Supabase Storage
      if (cert.file_path) {
        try {
          await supabase.storage.from('sertifikat').remove([cert.file_path])
        } catch (delErr) {
          console.warn('[DeleteSertifikat] Gagal menghapus file dari storage:', delErr)
        }
      }

      // Hapus dari tabel sertifikats
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

      // Cek apakah masih ada sertifikat lain untuk pengajuan ini
      const { count } = await supabase
        .from('sertifikats')
        .select('id', { count: 'exact', head: true })
        .eq('pengajuan_id', cert.pengajuan_id)

      if (count === 0) {
        await supabase
          .from('pengajuans')
          .update({ sertifikat_url: null })
          .eq('id', cert.pengajuan_id)
      }

      return NextResponse.json({ success: true })
    }

    // Jika pengajuanId diberikan: Hapus SEMUA sertifikat untuk pengajuan tersebut
    const { data: certList } = await supabase
      .from('sertifikats')
      .select('id, file_path')
      .eq('pengajuan_id', pengajuanId!)

    if (!certList || certList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data sertifikat tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Hapus semua file dari storage
    const filePaths = certList.map((c) => c.file_path).filter(Boolean) as string[]
    if (filePaths.length > 0) {
      try {
        await supabase.storage.from('sertifikat').remove(filePaths)
      } catch (delErr) {
        console.warn('[DeleteSertifikat] Gagal menghapus file dari storage:', delErr)
      }
    }

    // Hapus semua baris sertifikat
    const { error: delAllErr } = await supabase
      .from('sertifikats')
      .delete()
      .eq('pengajuan_id', pengajuanId!)

    if (delAllErr) {
      console.error('[DeleteSertifikat] Gagal hapus record sertifikats:', delAllErr)
      return NextResponse.json(
        { success: false, error: `Gagal menghapus data sertifikat: ${delAllErr.message}` },
        { status: 500 }
      )
    }

    await supabase
      .from('pengajuans')
      .update({ sertifikat_url: null })
      .eq('id', pengajuanId!)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat menghapus sertifikat.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
