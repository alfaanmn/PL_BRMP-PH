import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateSKMCompletion } from '@/lib/helpers/peserta.helper'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sertifikatIdStr = searchParams.get('sertifikat_id')
    const pengajuanIdStr = searchParams.get('pengajuan_id')
    const isDownload = searchParams.get('download') === 'true'
    const shouldRedirect = searchParams.get('redirect') === 'true' || searchParams.get('redirect') === '1'
    const isListMode = searchParams.get('list') === 'true'

    const sertifikatId = sertifikatIdStr ? parseInt(sertifikatIdStr, 10) : null
    const pengajuanId = pengajuanIdStr ? parseInt(pengajuanIdStr, 10) : null

    if (!sertifikatId && !pengajuanId) {
      return NextResponse.json(
        { success: false, error: 'ID Sertifikat atau ID Pengajuan wajib disertakan.' },
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

    // Cek peran administrator (RPC + profile fallback)
    let isAdmin = false
    const { data: isAdminRpc } = await supabase.rpc('is_admin')
    if (isAdminRpc) {
      isAdmin = true
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.role === 'administrator') {
        isAdmin = true
      }
    }

    // 2. KASUS A: Mode List (Mengambil daftar sertifikat yang tersedia untuk pengajuan)
    if (isListMode && pengajuanId) {
      const { data: pengajuan, error: pErr } = await supabase
        .from('pengajuans')
        .select('id, user_id, status, nama_lengkap, nim_nis, anggota, jumlah_anggota')
        .eq('id', pengajuanId)
        .maybeSingle()

      if (pErr || !pengajuan) {
        return NextResponse.json({ success: false, error: 'Data pengajuan tidak ditemukan.' }, { status: 404 })
      }

      if (!isAdmin && pengajuan.user_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 })
      }

      if (!isAdmin && pengajuan.status !== 'Selesai') {
        return NextResponse.json(
          { success: false, error: 'Sertifikat hanya dapat diakses setelah kegiatan magang berstatus Selesai.' },
          { status: 403 }
        )
      }

      if (!isAdmin) {
        const [{ data: dbAnggotas }, { data: skmRows }] = await Promise.all([
          supabase
            .from('pengajuan_anggotas')
            .select('id, pengajuan_id, nama, nim_nis, is_ketua')
            .eq('pengajuan_id', pengajuanId),
          supabase
            .from('skm_jawaban')
            .select('peserta_nama, peserta_nim, is_ketua, is_legacy')
            .eq('pengajuan_id', pengajuanId),
        ])

        const skmEval = evaluateSKMCompletion(pengajuan, dbAnggotas, skmRows)
        if (!skmEval.isComplete) {
          const progressMsg = skmEval.isKelompok
            ? `Wajib melengkapi SKM seluruh anggota terlebih dahulu (${skmEval.submittedCount}/${skmEval.totalPeserta} terisi).`
            : 'Wajib mengisi SKM terlebih dahulu untuk membuka akses sertifikat.'
          return NextResponse.json(
            { success: false, error: progressMsg },
            { status: 403 }
          )
        }
      }

      const { data: certs, error: certsErr } = await supabase
        .from('sertifikats')
        .select('id, pengajuan_id, file_name, file_size, mime_type, peserta_nama, peserta_nim, is_ketua, anggota_id, uploaded_at')
        .eq('pengajuan_id', pengajuanId)
        .order('is_ketua', { ascending: false })
        .order('id', { ascending: true })

      if (certsErr) {
        return NextResponse.json({ success: false, error: certsErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: certs || [] })
    }

    // 3. KASUS B: Unduh / Pratinjau Berkas Spesifik
    let targetCert: {
      id: number
      pengajuan_id: number
      file_path: string
      file_name: string
      peserta_nama: string
      is_ketua: boolean
    } | null = null

    if (sertifikatId) {
      // Identifikasi berkas dari ID sertifikat di database (BUKAN path dari client!)
      const { data: cert, error: certErr } = await supabase
        .from('sertifikats')
        .select('id, pengajuan_id, file_path, file_name, peserta_nama, is_ketua')
        .eq('id', sertifikatId)
        .maybeSingle()

      if (certErr || !cert) {
        return NextResponse.json({ success: false, error: 'Berkas sertifikat tidak ditemukan.' }, { status: 404 })
      }
      targetCert = cert
    } else if (pengajuanId) {
      // Fallback untuk backward compatibility: Ambil sertifikat ketua atau sertifikat pertama
      const { data: certs, error: certsErr } = await supabase
        .from('sertifikats')
        .select('id, pengajuan_id, file_path, file_name, peserta_nama, is_ketua')
        .eq('pengajuan_id', pengajuanId)

      if (certsErr || !certs || certs.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Berkas sertifikat sedang dalam proses penerbitan oleh administrator.' },
          { status: 404 }
        )
      }
      targetCert = certs.find((c) => c.is_ketua) || certs[0]
    }

    if (!targetCert || !targetCert.file_path) {
      return NextResponse.json({ success: false, error: 'Berkas sertifikat tidak valid.' }, { status: 404 })
    }

    // 4. Validasi Server: Pastikan sertifikat ini milik pengajuan dengan user_id = user login
    const { data: pengajuan, error: pErr } = await supabase
      .from('pengajuans')
      .select('id, user_id, status, nama_lengkap, nim_nis, anggota, jumlah_anggota')
      .eq('id', targetCert.pengajuan_id)
      .maybeSingle()

    if (pErr || !pengajuan) {
      return NextResponse.json({ success: false, error: 'Data pengajuan tidak ditemukan.' }, { status: 404 })
    }

    if (!isAdmin && pengajuan.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses sertifikat ini.' },
        { status: 403 }
      )
    }

    if (!isAdmin && pengajuan.status !== 'Selesai') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sertifikat hanya dapat diakses setelah kegiatan magang berstatus "Selesai".',
        },
        { status: 403 }
      )
    }

    if (!isAdmin) {
      const [{ data: dbAnggotas }, { data: skmRows }] = await Promise.all([
        supabase
          .from('pengajuan_anggotas')
          .select('id, pengajuan_id, nama, nim_nis, is_ketua')
          .eq('pengajuan_id', targetCert.pengajuan_id),
        supabase
          .from('skm_jawaban')
          .select('peserta_nama, peserta_nim, is_ketua, is_legacy')
          .eq('pengajuan_id', targetCert.pengajuan_id),
      ])

      const skmEval = evaluateSKMCompletion(pengajuan, dbAnggotas, skmRows)
      if (!skmEval.isComplete) {
        const progressMsg = skmEval.isKelompok
          ? `Sertifikat terkunci. Seluruh anggota kelompok wajib mengisi Survei Kepuasan Masyarakat (SKM) terlebih dahulu (Progres: ${skmEval.submittedCount}/${skmEval.totalPeserta}).`
          : 'Sertifikat terkunci. Anda wajib melengkapi Survei Kepuasan Masyarakat (SKM) terlebih dahulu untuk mengunduh sertifikat.'
        return NextResponse.json(
          {
            success: false,
            error: progressMsg,
          },
          { status: 403 }
        )
      }
    }

    // 5. Inisialisasi Admin Client (Service Role) karena bucket privat
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error(
        '[DownloadSertifikat] createAdminClient() mengembalikan null. SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_SECRET_KEY belum disetel atau tidak valid di .env.local.'
      )
      return NextResponse.json({ success: false, error: 'Layanan sementara tidak tersedia.' }, { status: 503 })
    }

    // 6. Buat Signed URL berbatas waktu singkat (TTL: 300 detik / 5 menit)
    const expiresIn = 300
    const { data: signedData, error: signedErr } = await adminClient.storage
      .from('sertifikat')
      .createSignedUrl(
        targetCert.file_path,
        expiresIn,
        isDownload ? { download: targetCert.file_name } : undefined
      )

    if (signedErr || !signedData?.signedUrl) {
      console.error(
        `[DownloadSertifikat] Gagal createSignedUrl untuk file_path="${targetCert.file_path}". Error asli:`,
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
        expiresIn,
        fileName: targetCert.file_name,
        pesertaNama: targetCert.peserta_nama,
        isKetua: targetCert.is_ketua,
        sertifikatId: targetCert.id,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat memproses sertifikat.'
    console.error('[DownloadSertifikat] Unexpected server error:', err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
