import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sertifikatService,
  validateFileMagicBytes,
} from '@/lib/services/sertifikat.service'
import crypto from 'crypto'

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

    // 2. Otorisasi Menggunakan is_admin() (Sesuai Koreksi 4)
    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin')
    if (adminErr || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Hanya administrator yang dapat mengunggah sertifikat.' },
        { status: 403 }
      )
    }

    // 3. Baca Form Data
    const formData = await request.formData()
    const pengajuanIdStr = formData.get('pengajuan_id') as string | null
    const file = formData.get('file') as File | null

    if (!pengajuanIdStr || !file) {
      return NextResponse.json(
        { success: false, error: 'ID Pengajuan dan berkas sertifikat wajib disertakan.' },
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

    // 4. Verifikasi status pengajuan = 'Selesai'
    const { data: pengajuan, error: pErr } = await supabase
      .from('pengajuans')
      .select('id, status, public_id, user_id')
      .eq('id', pengajuanId)
      .single()

    if (pErr || !pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Data pengajuan tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (pengajuan.status !== 'Selesai') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sertifikat hanya dapat diunggah untuk pengajuan yang berstatus "Selesai".',
        },
        { status: 400 }
      )
    }

    // 5. Validasi Ukuran Berkas (Maksimal 5 MB)
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, error: 'Ukuran berkas melebihi batas maksimal 5 MB.' },
        { status: 400 }
      )
    }

    // 6. Validasi Magic Bytes (PDF atau JPEG saja, tanpa PNG)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const magicCheck = validateFileMagicBytes(buffer)

    if (!magicCheck.valid || !magicCheck.mimeType) {
      return NextResponse.json(
        {
          success: false,
          error: magicCheck.error || 'Berkas bukan PDF atau JPEG yang valid.',
        },
        { status: 400 }
      )
    }

    const detectedMime = magicCheck.mimeType
    const ext = detectedMime === 'application/pdf' ? 'pdf' : 'jpg'
    const randomHex = crypto.randomBytes(6).toString('hex')
    const storagePath = `${pengajuanId}/${Date.now()}_${randomHex}.${ext}`

    // 7. Ambil berkas eksisting (jika ada) untuk penanganan ganti berkas (re-upload)
    const { data: existingCert } = await supabase
      .from('sertifikats')
      .select('id, file_path, notified_at')
      .eq('pengajuan_id', pengajuanId)
      .maybeSingle()

    // 8. Unggah Berkas ke Bucket Privat 'sertifikat'
    const { error: uploadErr } = await supabase.storage
      .from('sertifikat')
      .upload(storagePath, buffer, {
        contentType: detectedMime,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadErr) {
      console.error('[UploadSertifikat] Gagal mengunggah ke storage:', uploadErr)
      return NextResponse.json(
        { success: false, error: `Gagal mengunggah berkas ke storage: ${uploadErr.message}` },
        { status: 500 }
      )
    }

    const nowIso = new Date().toISOString()

    // 9. Simpan / Perbarui Metadata di Tabel sertifikats
    if (existingCert) {
      // Re-upload: Update kolom file saja, TIDAK menyentuh notified_at (Sesuai Koreksi 2)
      const { error: updateErr } = await supabase
        .from('sertifikats')
        .update({
          file_path: storagePath,
          file_name: file.name,
          mime_type: detectedMime,
          file_size: file.size,
          uploaded_by: user.id,
          uploaded_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', existingCert.id)

      if (updateErr) {
        console.error('[UploadSertifikat] Gagal update tabel sertifikats:', updateErr)
        return NextResponse.json(
          { success: false, error: `Gagal memperbarui data sertifikat: ${updateErr.message}` },
          { status: 500 }
        )
      }

      // Hapus berkas lama dari storage jika path berbeda
      if (existingCert.file_path && existingCert.file_path !== storagePath) {
        try {
          await supabase.storage.from('sertifikat').remove([existingCert.file_path])
        } catch (delErr) {
          console.warn('[UploadSertifikat] Gagal menghapus berkas lama di storage:', delErr)
        }
      }
    } else {
      // Berkas Baru: Masukkan baris baru dengan notified_at = NULL
      const { error: insertErr } = await supabase.from('sertifikats').insert([
        {
          pengajuan_id: pengajuanId,
          file_path: storagePath,
          file_name: file.name,
          mime_type: detectedMime,
          file_size: file.size,
          uploaded_by: user.id,
          uploaded_at: nowIso,
          notified_at: null,
          created_at: nowIso,
          updated_at: nowIso,
        },
      ])

      if (insertErr) {
        console.error('[UploadSertifikat] Gagal insert tabel sertifikats:', insertErr)
        return NextResponse.json(
          { success: false, error: `Gagal menyimpan metadata sertifikat: ${insertErr.message}` },
          { status: 500 }
        )
      }
    }

    // 10. Update marker di pengajuans.sertifikat_url
    await supabase
      .from('pengajuans')
      .update({ sertifikat_url: 'sertifikat-tersedia' })
      .eq('id', pengajuanId)

    // 11. Pemicu pengecekan notifikasi otomatis (Klaim atomik jika SKM sudah terisi)
    try {
      await sertifikatService.checkAndTriggerNotification(pengajuanId)
    } catch (notifErr) {
      console.warn('[UploadSertifikat] Pengecekan notifikasi dilewati secara aman:', notifErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        pengajuanId,
        fileName: file.name,
        filePath: storagePath,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat mengunggah.'
    console.error('[UploadSertifikat] Exception:', err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
