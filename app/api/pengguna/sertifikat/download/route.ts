import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const pengajuanIdStr = searchParams.get('pengajuan_id')
    const isDownload = searchParams.get('download') === 'true'
    const shouldRedirect = searchParams.get('redirect') === 'true' || searchParams.get('redirect') === '1'

    if (!pengajuanIdStr) {
      return NextResponse.json(
        { success: false, error: 'ID Pengajuan wajib disertakan.' },
        { status: 400 }
      )
    }

    const pengajuanId = parseInt(pengajuanIdStr, 10)
    if (isNaN(pengajuanId)) {
      return NextResponse.json(
        { success: false, error: 'ID Pengajuan tidak valid.' },
        { status: 400 }
      )
    }

    // 1. Verifikasi Autentikasi Pengguna
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Sesi Anda telah berakhir. Silakan masuk kembali.' },
        { status: 401 }
      )
    }

    // Cek apakah user adalah administrator
    const { data: isAdmin } = await supabase.rpc('is_admin')

    // 2. Ambil data pengajuan untuk validasi hak kepemilikan & status
    const { data: pengajuan, error: pErr } = await supabase
      .from('pengajuans')
      .select('id, user_id, status')
      .eq('id', pengajuanId)
      .maybeSingle()

    if (pErr || !pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Data pengajuan tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Syarat 1: Kepemilikan (Pemohon yang login atau Admin)
    if (!isAdmin && pengajuan.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses sertifikat ini.' },
        { status: 403 }
      )
    }

    // Syarat 2: Status pengajuan harus "Selesai" (Berlaku baik pemohon maupun admin untuk konsistensi bisnis)
    if (pengajuan.status !== 'Selesai') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sertifikat hanya dapat diakses setelah kegiatan magang berstatus "Selesai".',
        },
        { status: 403 }
      )
    }

    // Syarat 3: SKM harus sudah terisi (Dikecualikan sepenuhnya untuk admin agar bisa audit/pratinjau)
    if (!isAdmin) {
      const { data: skmCheck } = await supabase
        .from('skm_jawaban')
        .select('id')
        .eq('pengajuan_id', pengajuanId)
        .limit(1)

      if (!skmCheck || skmCheck.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sertifikat terkunci. Anda wajib melengkapi Survei Kepuasan Masyarakat (SKM) terlebih dahulu untuk mengunduh sertifikat.',
          },
          { status: 403 }
        )
      }
    }

    // 4. Ambil metadata berkas sertifikat menggunakan .maybeSingle()
    const { data: cert, error: certErr } = await supabase
      .from('sertifikats')
      .select('file_path, file_name')
      .eq('pengajuan_id', pengajuanId)
      .maybeSingle()

    if (certErr || !cert || !cert.file_path) {
      return NextResponse.json(
        {
          success: false,
          error: 'Berkas sertifikat sedang dalam proses penerbitan oleh administrator.',
        },
        { status: 404 }
      )
    }

    // 5. Inisialisasi Admin Client (Service Role) karena bucket 'sertifikat' bersifat privat tanpa policy pemohon
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error(
        '[DownloadSertifikat] createAdminClient() mengembalikan null. SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_SECRET_KEY belum disetel atau tidak valid di .env.local.'
      )
      return NextResponse.json(
        { success: false, error: 'Layanan sementara tidak tersedia.' },
        { status: 503 }
      )
    }

    // 6. Buat Signed URL berbatas waktu singkat (TTL: 300 detik / 5 menit) via admin client
    const expiresIn = 300
    const { data: signedData, error: signedErr } = await adminClient.storage
      .from('sertifikat')
      .createSignedUrl(
        cert.file_path,
        expiresIn,
        isDownload ? { download: cert.file_name } : undefined
      )

    if (signedErr || !signedData?.signedUrl) {
      console.error(
        `[DownloadSertifikat] Gagal createSignedUrl untuk file_path="${cert.file_path}". Error asli:`,
        signedErr
      )
      return NextResponse.json(
        { success: false, error: 'Gagal membuat tautan unduh sertifikat yang aman.' },
        { status: 500 }
      )
    }

    if (shouldRedirect) {
      return NextResponse.redirect(signedData.signedUrl)
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: signedData.signedUrl,
        fileName: cert.file_name,
        expiresIn,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat memproses sertifikat.'
    console.error('[DownloadSertifikat] Unexpected server error:', err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
