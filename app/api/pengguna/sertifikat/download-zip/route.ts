import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateSKMCompletion } from '@/lib/helpers/peserta.helper'

export const runtime = 'nodejs'

// Batas aman pemrosesan Serverless Vercel (Memori aman < 100MB, durasi execution < 10s)
const MAX_CERTIFICATE_FILES = 20
const MAX_TOTAL_BYTES = 50 * 1024 * 1024 // 50 MB

function sanitizeFilenamePart(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\\/:*?"<>|\r\n\t]/g, '_')
    .replace(/\s+/g, '_')
    .trim()
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('public_id')

    if (!publicId || typeof publicId !== 'string' || publicId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Parameter public_id pengajuan wajib disertakan.' },
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

    // 2. Verifikasi Peran (Administrator vs Pengguna)
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

    // 3. Ambil Data Pengajuan berdasarkan public_id (Strict database lookup)
    const { data: pengajuan, error: pErr } = await supabase
      .from('pengajuans')
      .select('id, public_id, user_id, status, tipe_pengajuan, nama_lengkap, nim_nis, anggota, jumlah_anggota')
      .eq('public_id', publicId)
      .maybeSingle()

    if (pErr || !pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Data pengajuan tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 4. Validasi Otorisasi Kepemilikan (Pengguna biasa hanya boleh mengunduh pengajuan miliknya)
    if (!isAdmin && pengajuan.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Anda tidak berhak mengunduh berkas pengajuan ini.' },
        { status: 403 }
      )
    }

    // 5. Validasi Status Pengajuan (Khusus pengguna biasa harus berstatus Selesai)
    if (!isAdmin && pengajuan.status !== 'Selesai') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sertifikat hanya dapat diunduh setelah kegiatan magang berstatus "Selesai".',
        },
        { status: 403 }
      )
    }

    // 6. Validasi SKM (Khusus pengguna biasa wajib sudah melengkapi SKM)
    if (!isAdmin) {
      const [{ data: dbAnggotas }, { data: skmRows }] = await Promise.all([
        supabase
          .from('pengajuan_anggotas')
          .select('id, pengajuan_id, nama, nim_nis, is_ketua')
          .eq('pengajuan_id', pengajuan.id),
        supabase
          .from('skm_jawaban')
          .select('peserta_nama, peserta_nim, is_ketua, is_legacy')
          .eq('pengajuan_id', pengajuan.id),
      ])

      const skmEval = evaluateSKMCompletion(pengajuan, dbAnggotas, skmRows)
      if (!skmEval.isComplete) {
        const errorMsg = skmEval.isKelompok
          ? `Sertifikat terkunci. Seluruh anggota kelompok wajib mengisi Survei Kepuasan Masyarakat (SKM) terlebih dahulu (Progres: ${skmEval.submittedCount}/${skmEval.totalPeserta}).`
          : 'Sertifikat terkunci. Anda wajib melengkapi Survei Kepuasan Masyarakat (SKM) terlebih dahulu.'
        return NextResponse.json(
          {
            success: false,
            error: errorMsg,
          },
          { status: 403 }
        )
      }
    }

    // 7. Ambil Seluruh Daftar Sertifikat dari Database
    const { data: certs, error: certsErr } = await supabase
      .from('sertifikats')
      .select('id, pengajuan_id, file_path, file_name, file_size, mime_type, peserta_nama, peserta_nim, is_ketua')
      .eq('pengajuan_id', pengajuan.id)
      .order('is_ketua', { ascending: false })
      .order('id', { ascending: true })

    if (certsErr || !certs || certs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Belum ada berkas sertifikat yang diunggah untuk pengajuan ini.',
        },
        { status: 404 }
      )
    }

    // 8. Validasi Batas Jumlah File dan Total Ukuran
    if (certs.length > MAX_CERTIFICATE_FILES) {
      return NextResponse.json(
        {
          success: false,
          error: `Jumlah berkas sertifikat (${certs.length}) melebihi batas wajar (${MAX_CERTIFICATE_FILES} berkas).`,
        },
        { status: 400 }
      )
    }

    const totalEstimatedSize = certs.reduce((acc, c) => acc + (c.file_size || 0), 0)
    if (totalEstimatedSize > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Total ukuran berkas sertifikat (${(totalEstimatedSize / (1024 * 1024)).toFixed(1)} MB) melebihi batas server (${MAX_TOTAL_BYTES / (1024 * 1024)} MB). Silakan unduh satu per satu.`,
        },
        { status: 400 }
      )
    }

    // 9. Ambil File dari Private Supabase Storage via Admin Client (Service Role)
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error('[DownloadZipSertifikat] createAdminClient() mengembalikan null.')
      return NextResponse.json(
        { success: false, error: 'Layanan penyimpanan berkas internal sementara tidak tersedia.' },
        { status: 503 }
      )
    }

    const zip = new JSZip()
    const usedFilenames = new Set<string>()

    for (let i = 0; i < certs.length; i++) {
      const cert = certs[i]

      // Download binary buffer langsung dari bucket privat
      const { data: fileBlob, error: downloadErr } = await adminClient.storage
        .from('sertifikat')
        .download(cert.file_path)

      if (downloadErr || !fileBlob) {
        console.error(`[DownloadZipSertifikat] Gagal mengunduh file_path="${cert.file_path}":`, downloadErr)
        // ATURAN INTEGRITAS: Jika satu file gagal diambil, batalkan dan kembalikan JSON error (jangan kirim ZIP parsial/rusak!)
        return NextResponse.json(
          {
            success: false,
            error: `Gagal mengambil berkas sertifikat untuk peserta "${cert.peserta_nama}". Proses pembuatan ZIP dibatalkan untuk menjaga keutuhan berkas. Silakan coba kembali atau hubungi administrator.`,
          },
          { status: 500 }
        )
      }

      const arrayBuffer = await fileBlob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 10. Format dan Sanitasi Nama File di dalam ZIP: Sertifikat_<NIM>_<Nama>.pdf
      const safeNim = sanitizeFilenamePart(cert.peserta_nim) || 'TanpaNIM'
      const safeNama = sanitizeFilenamePart(cert.peserta_nama) || `Peserta_${i + 1}`

      // Ekstensi file
      let ext = '.pdf'
      if (cert.file_name && cert.file_name.toLowerCase().endsWith('.jpg')) ext = '.jpg'
      else if (cert.file_name && cert.file_name.toLowerCase().endsWith('.jpeg')) ext = '.jpeg'
      else if (cert.mime_type === 'image/jpeg') ext = '.jpg'

      let candidateFilename = `Sertifikat_${safeNim}_${safeNama}${ext}`

      // Pastikan nama file unik di dalam ZIP jika ada peserta dengan nama/NIM serupa
      let counter = 1
      while (usedFilenames.has(candidateFilename.toLowerCase())) {
        candidateFilename = `Sertifikat_${safeNim}_${safeNama}_(${counter})${ext}`
        counter++
      }
      usedFilenames.add(candidateFilename.toLowerCase())

      zip.file(candidateFilename, buffer)
    }

    // 11. Hasilkan Binary ZIP Buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    })

    const zipFilename = `Sertifikat_Kelompok_${publicId}.zip`

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat membuat arsip ZIP sertifikat.'
    console.error('[DownloadZipSertifikat] Unexpected error:', err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
