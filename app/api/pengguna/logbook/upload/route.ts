import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  validateLogbookFile,
  validateLogbookCatatan,
} from '@/lib/validations/logbook.schema'
import { calculateAllLogbookWeeks } from '@/lib/utils/logbook-date'

export const dynamic = 'force-dynamic'

/**
 * POST /api/pengguna/logbook/upload
 * Mengunggah atau mengganti (replace) berkas logbook mingguan magang.
 * - Format: PDF, JPG, JPEG, PNG
 * - Maksimal 2 MB
 * - Status pengajuan wajib: 'Sedang Magang'
 * - Minggu tidak boleh di masa depan
 * - Transaksi bebas orphan: upload berkas baru -> upsert baris DB -> hapus berkas lama
 */
export async function POST(request: NextRequest) {
  let uploadedNewFilePath: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' },
        { status: 401 }
      )
    }

    // 1. Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const pengajuanId = Number(formData.get('pengajuan_id'))
    const mingguKe = Number(formData.get('minggu_ke'))
    const rawCatatan = (formData.get('catatan') as string) || ''
    const catatan = rawCatatan.trim()

    if (!file || !pengajuanId || !mingguKe || mingguKe < 1) {
      return NextResponse.json(
        { success: false, error: 'Data formulir tidak lengkap (berkas, pengajuan_id, dan minggu_ke wajib diisi).' },
        { status: 400 }
      )
    }

    // 2. Validasi Catatan
    const catatanVal = validateLogbookCatatan(catatan)
    if (!catatanVal.valid) {
      return NextResponse.json({ success: false, error: catatanVal.error }, { status: 400 })
    }

    // 3. Verifikasi Pengajuan: Pemilik & Status 'Sedang Magang'
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: 'Admin client tidak tersedia pada server.' },
        { status: 500 }
      )
    }

    const { data: pengajuan, error: pError } = await adminClient
      .from('pengajuans')
      .select('id, user_id, status, tanggal_mulai, tanggal_selesai, nama_lengkap, asal_instansi, bidangs(nama)')
      .eq('id', pengajuanId)
      .single()

    if (pError || !pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan magang tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (pengajuan.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Pengajuan ini bukan milik akun Anda.' },
        { status: 403 }
      )
    }

    if (pengajuan.status !== 'Sedang Magang') {
      return NextResponse.json(
        {
          success: false,
          error: `Pengunggahan logbook hanya diizinkan untuk peserta yang berstatus "Sedang Magang". Status pengajuan saat ini: "${pengajuan.status}".`,
        },
        { status: 403 }
      )
    }

    // 4. Kalkulasi Matriks Minggu
    const weeks = calculateAllLogbookWeeks(
      pengajuan.tanggal_mulai || '',
      pengajuan.tanggal_selesai || ''
    )

    const targetWeek = weeks.find((w) => w.minggu_ke === mingguKe)
    if (!targetWeek) {
      return NextResponse.json(
        { success: false, error: `Minggu ke-${mingguKe} di luar rentang jadwal durasi magang.` },
        { status: 400 }
      )
    }

    // Cegah unggah untuk minggu yang belum berjalan (masa depan)
    if (targetWeek.is_future) {
      return NextResponse.json(
        {
          success: false,
          error: `Minggu ke-${mingguKe} (${targetWeek.periode_mulai} s/d ${targetWeek.periode_selesai}) belum dimulai. Anda belum dapat mengunggah logbook untuk minggu ini.`,
        },
        { status: 400 }
      )
    }

    // 5. Validasi Binary Berkas (Ukuran, Ekstensi, Magic Bytes)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const fileVal = validateLogbookFile(file.name, file.size, file.type, buffer)
    if (!fileVal.valid) {
      return NextResponse.json({ success: false, error: fileVal.error }, { status: 400 })
    }

    // 6. Cek Data Eksisting untuk Mendeteksi Replace
    const { data: existingLogbook } = await adminClient
      .from('logbooks')
      .select('id, file_path')
      .eq('pengajuan_id', pengajuanId)
      .eq('minggu_ke', mingguKe)
      .maybeSingle()

    const isReplace = Boolean(existingLogbook)
    const oldFilePath = existingLogbook?.file_path || null

    // 7. Generate Sanitized Server Path
    const cleanExt = fileVal.detectedExt || 'pdf'
    const newFilePath = `${user.id}/${pengajuanId}/minggu-${mingguKe}_${Date.now()}.${cleanExt}`

    // 8. Upload Berkas Baru ke Supabase Storage (Bucket 'logbook')
    const { error: uploadError } = await adminClient.storage
      .from('logbook')
      .upload(newFilePath, buffer, {
        contentType: fileVal.detectedMime,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('[Logbook Upload] Gagal unggah ke storage:', uploadError)
      return NextResponse.json(
        { success: false, error: `Gagal mengunggah berkas ke storage: ${uploadError.message}` },
        { status: 500 }
      )
    }

    uploadedNewFilePath = newFilePath

    // 9. Simpan / Perbarui Metadata ke Tabel public.logbooks
    const { data: savedLogbook, error: upsertError } = await adminClient
      .from('logbooks')
      .upsert(
        {
          pengajuan_id: pengajuanId,
          user_id: user.id,
          minggu_ke: mingguKe,
          periode_mulai: targetWeek.periode_mulai,
          periode_selesai: targetWeek.periode_selesai,
          file_path: newFilePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: fileVal.detectedMime!,
          catatan: catatan || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'pengajuan_id,minggu_ke' }
      )
      .select('id, minggu_ke, created_at, updated_at')
      .single()

    if (upsertError || !savedLogbook) {
      console.error('[Logbook Upload] Gagal upsert database:', upsertError)
      // Rollback: Hapus berkas baru yang baru saja diunggah agar tidak jadi berkas yatim
      await adminClient.storage.from('logbook').remove([newFilePath])
      return NextResponse.json(
        { success: false, error: `Gagal mencatat logbook ke database: ${upsertError?.message}` },
        { status: 500 }
      )
    }

    // 10. Jika merupakan replace: Hapus berkas lama dari storage secara aman via service role
    if (oldFilePath && oldFilePath !== newFilePath) {
      try {
        await adminClient.storage.from('logbook').remove([oldFilePath])
      } catch (cleanErr) {
        console.warn('[Logbook Upload] Gagal menghapus berkas lama:', cleanErr)
      }
    }

    // 11. Pemicu Asinkron Email Notifikasi ke Admin via after() Next.js 15
    const notifyAdminData = {
      namaPemohon: pengajuan.nama_lengkap || 'Peserta Magang',
      bidangNama: (pengajuan.bidangs as any)?.nama || 'Bidang Magang',
      mingguKe,
      periodeMulai: targetWeek.periode_mulai,
      periodeSelesai: targetWeek.periode_selesai,
      fileName: file.name,
      pengajuanId: pengajuan.id,
      isReplace,
    }

    after(async () => {
      try {
        const { sendLogbookUploadedAdminNotification } = await import(
          '@/lib/services/logbook-notify.service'
        )
        await sendLogbookUploadedAdminNotification(notifyAdminData)
      } catch (notifyErr) {
        console.error('[Logbook Upload] Background admin email notification failed:', notifyErr)
      }
    })

    return NextResponse.json({
      success: true,
      message: isReplace
        ? `Logbook Minggu ke-${mingguKe} berhasil diperbarui.`
        : `Logbook Minggu ke-${mingguKe} berhasil diunggah.`,
      logbook: savedLogbook,
    })
  } catch (err: unknown) {
    // Tangani kemungkinan error tak terduga dengan membersihkan file baru jika ada
    if (uploadedNewFilePath) {
      try {
        const adminClient = createAdminClient()
        if (adminClient) {
          await adminClient.storage.from('logbook').remove([uploadedNewFilePath])
        }
      } catch {}
    }
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan sistem.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
