import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getEmailSubject,
  renderEmailHtml,
  renderEmailPlainText,
} from '@/lib/templates/email-templates'
import type { EmailNotificationPayload } from '@/types/email.types'
import type {
  SertifikatRecord,
  AdminSertifikatListItem,
  UserSertifikatItem,
} from '@/types/sertifikat.types'

/**
 * Validasi Magic Bytes untuk file berkas (PDF & JPEG saja)
 * PDF: 0x25 0x50 0x44 0x46 (%PDF)
 * JPEG: 0xFF 0xD8 0xFF
 */
export function validateFileMagicBytes(buffer: Buffer): {
  valid: boolean
  mimeType: 'application/pdf' | 'image/jpeg' | null
  error?: string
} {
  if (!buffer || buffer.length < 4) {
    return { valid: false, mimeType: null, error: 'Berkas kosong atau rusak.' }
  }

  // Cek PDF
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, mimeType: 'application/pdf' }
  }

  // Cek JPEG / JPG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' }
  }

  return {
    valid: false,
    mimeType: null,
    error: 'Format berkas tidak diizinkan. Hanya berkas PDF dan JPG/JPEG asli yang diperbolehkan.',
  }
}

export const sertifikatService = {
  /**
   * Mengambil daftar peserta magang berstatus "Selesai" untuk admin
   */
  async getAdminSertifikatList(filters?: {
    search?: string
    skmStatus?: 'semua' | 'sudah' | 'belum'
    sertifikatStatus?: 'semua' | 'sudah' | 'belum'
    notifikasiStatus?: 'semua' | 'sudah' | 'belum'
  }): Promise<{ data: AdminSertifikatListItem[]; error: string | null }> {
    try {
      const supabase = await createClient()

      // 1. Ambil seluruh pengajuan dengan status "Selesai"
      let query = supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          nama_lengkap,
          nim_nis,
          asal_instansi,
          jurusan,
          tanggal_mulai,
          tanggal_selesai,
          durasi_bulan,
          status,
          user_id,
          bidangs (
            id,
            nama
          )
        `)
        .eq('status', 'Selesai')
        .order('id', { ascending: false })

      const { data: pengajuans, error: pErr } = await query

      if (pErr) {
        return { data: [], error: `Gagal memuat daftar pengajuan: ${pErr.message}` }
      }

      if (!pengajuans || pengajuans.length === 0) {
        return { data: [], error: null }
      }

      const pengajuanIds = pengajuans.map((p) => p.id)

      // 2. Ambil data sertifikat yang sudah ada
      const { data: sertifikats, error: sErr } = await supabase
        .from('sertifikats')
        .select('*')
        .in('pengajuan_id', pengajuanIds)

      if (sErr) {
        console.warn('Gagal memuat sertifikats:', sErr.message)
      }

      const sertifikatMap = new Map<number, SertifikatRecord>()
      sertifikats?.forEach((s: any) => {
        sertifikatMap.set(s.pengajuan_id, s as SertifikatRecord)
      })

      // 3. Ambil data status SKM dari tabel skm_jawaban
      const { data: skmRows, error: skmErr } = await supabase
        .from('skm_jawaban')
        .select('pengajuan_id, created_at')
        .in('pengajuan_id', pengajuanIds)

      if (skmErr) {
        console.warn('Gagal memuat skm_jawaban:', skmErr.message)
      }

      const skmMap = new Map<number, string>()
      skmRows?.forEach((r: any) => {
        if (r.pengajuan_id) {
          skmMap.set(r.pengajuan_id, r.created_at || 'filled')
        }
      })

      // 4. Susun list item
      let list: AdminSertifikatListItem[] = pengajuans.map((p: any) => {
        const sertifikat = sertifikatMap.get(p.id) || null
        const skmSubmittedAt = skmMap.get(p.id) || null
        const hasSubmittedSKM = Boolean(skmSubmittedAt)

        return {
          pengajuanId: p.id,
          publicId: p.public_id || String(p.id),
          namaPemohon: p.nama_lengkap || 'Tanpa Nama',
          nimNis: p.nim_nis || '-',
          asalInstansi: p.asal_instansi || '-',
          jurusan: p.jurusan || '-',
          bidangNama: p.bidangs?.nama || '-',
          tanggalMulai: p.tanggal_mulai || '',
          tanggalSelesai: p.tanggal_selesai || '',
          durasiBulan: p.durasi_bulan || 1,
          hasSubmittedSKM,
          skmSubmittedAt,
          sertifikat,
          notifiedAt: sertifikat?.notified_at || null,
        }
      })

      // 5. Terapkan filter di memory
      if (filters?.search) {
        const kw = filters.search.toLowerCase().trim()
        list = list.filter(
          (item) =>
            item.namaPemohon.toLowerCase().includes(kw) ||
            item.publicId.toLowerCase().includes(kw) ||
            item.asalInstansi.toLowerCase().includes(kw) ||
            item.nimNis.toLowerCase().includes(kw) ||
            item.bidangNama.toLowerCase().includes(kw)
        )
      }

      if (filters?.skmStatus && filters.skmStatus !== 'semua') {
        const needSubmitted = filters.skmStatus === 'sudah'
        list = list.filter((item) => item.hasSubmittedSKM === needSubmitted)
      }

      if (filters?.sertifikatStatus && filters.sertifikatStatus !== 'semua') {
        const needUploaded = filters.sertifikatStatus === 'sudah'
        list = list.filter((item) => Boolean(item.sertifikat) === needUploaded)
      }

      if (filters?.notifikasiStatus && filters.notifikasiStatus !== 'semua') {
        const needNotified = filters.notifikasiStatus === 'sudah'
        list = list.filter((item) => Boolean(item.notifiedAt) === needNotified)
      }

      return { data: list, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil daftar sertifikat untuk portal pengguna
   */
  async getUserSertifikatList(userId: string): Promise<{
    data: UserSertifikatItem[]
    error: string | null
  }> {
    try {
      const supabase = await createClient()

      // Ambil seluruh pengajuan milik user
      const { data: pengajuans, error: pErr } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          topik_magang,
          asal_instansi,
          tanggal_mulai,
          tanggal_selesai,
          status,
          bidangs (
            id,
            nama
          )
        `)
        .eq('user_id', userId)
        .order('id', { ascending: false })

      if (pErr) {
        return { data: [], error: `Gagal memuat data pengajuan: ${pErr.message}` }
      }

      if (!pengajuans || pengajuans.length === 0) {
        return { data: [], error: null }
      }

      const pengajuanIds = pengajuans.map((p) => p.id)

      // Cek SKM jawaban
      const { data: skmRows } = await supabase
        .from('skm_jawaban')
        .select('pengajuan_id')
        .in('pengajuan_id', pengajuanIds)

      const skmSet = new Set<number>()
      skmRows?.forEach((r: any) => {
        if (r.pengajuan_id) skmSet.add(r.pengajuan_id)
      })

      // Cek sertifikats
      const { data: sertifikats } = await supabase
        .from('sertifikats')
        .select('pengajuan_id, file_name, uploaded_at')
        .in('pengajuan_id', pengajuanIds)

      const sertifikatMap = new Map<number, { file_name: string; uploaded_at: string }>()
      sertifikats?.forEach((s: any) => {
        sertifikatMap.set(s.pengajuan_id, {
          file_name: s.file_name,
          uploaded_at: s.uploaded_at,
        })
      })

      const list: UserSertifikatItem[] = pengajuans.map((p: any) => {
        const sertifikatData = sertifikatMap.get(p.id)
        return {
          pengajuanId: p.id,
          publicId: p.public_id || String(p.id),
          topikMagang: p.topik_magang || 'Magang BRMP PH',
          bidangNama: p.bidangs?.nama || 'Bidang BRMP',
          asalInstansi: p.asal_instansi || '-',
          tanggalMulai: p.tanggal_mulai || '',
          tanggalSelesai: p.tanggal_selesai || '',
          status: p.status,
          hasSubmittedSKM: skmSet.has(p.id),
          hasSertifikat: Boolean(sertifikatData),
          sertifikatName: sertifikatData?.file_name,
          uploadedAt: sertifikatData?.uploaded_at,
        }
      })

      return { data: list, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan memuat data sertifikat.'
      return { data: [], error: msg }
    }
  },

  /**
   * Pengecekan dan pemicu notifikasi otomatis (Idempoten via klaim atomik)
   * Syarat: Status Selesai + Sertifikat sudah diunggah + SKM sudah diisi
   */
  async checkAndTriggerNotification(pengajuanId: number): Promise<{
    triggered: boolean
    error: string | null
  }> {
    try {
      const supabase = await createClient()

      // 1. Cek status pengajuan
      const { data: pengajuan, error: pErr } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          status,
          user_id,
          asal_instansi,
          tanggal_mulai,
          tanggal_selesai,
          bidangs (
            nama
          )
        `)
        .eq('id', pengajuanId)
        .single()

      if (pErr || !pengajuan || pengajuan.status !== 'Selesai') {
        return { triggered: false, error: 'Pengajuan belum berstatus Selesai.' }
      }

      // 2. Cek apakah SKM sudah diisi
      const { data: skmCheck, error: skmErr } = await supabase
        .from('skm_jawaban')
        .select('id')
        .eq('pengajuan_id', pengajuanId)
        .limit(1)

      if (skmErr || !skmCheck || skmCheck.length === 0) {
        return { triggered: false, error: 'SKM belum diisi oleh pemohon.' }
      }

      // 3. Cek apakah sertifikat sudah diunggah menggunakan maybeSingle()
      const { data: certCheck, error: certErr } = await supabase
        .from('sertifikats')
        .select('id, file_path, file_name, mime_type, notified_at')
        .eq('pengajuan_id', pengajuanId)
        .maybeSingle()

      if (certErr || !certCheck) {
        return { triggered: false, error: 'Berkas sertifikat belum diunggah admin.' }
      }

      if (certCheck.notified_at !== null) {
        // Sudah pernah dinotifikasi sebelumnya
        return { triggered: false, error: null }
      }

      // 4. Klaim atomik: UPDATE sertifikats SET notified_at = now() WHERE pengajuan_id = X AND notified_at IS NULL
      const nowIso = new Date().toISOString()
      const { data: claimed, error: claimErr } = await supabase
        .from('sertifikats')
        .update({ notified_at: nowIso, updated_at: nowIso })
        .eq('pengajuan_id', pengajuanId)
        .is('notified_at', null)
        .select('id')

      if (claimErr || !claimed || claimed.length === 0) {
        // Gagal mengklaim karena sudah diklaim proses lain bersamaan
        return { triggered: false, error: null }
      }

      // 5. Buat entri notifikasi in-app
      try {
        await supabase.from('notifikasi').insert([
          {
            user_id: pengajuan.user_id,
            judul: 'Sertifikat Magang Telah Siap',
            pesan: `Selamat! Sertifikat resmi kelulusan magang Anda (#${pengajuan.public_id || pengajuan.id}) telah diterbitkan. Silakan buka menu Sertifikat untuk melihat dan mengunduh berkas.`,
            is_read: false,
          },
        ])
      } catch (notifErr) {
        console.warn('[SertifikatService] Gagal membuat entri notifikasi in-app:', notifErr)
      }

      // 6. Ambil profil pemohon untuk kirim email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', pengajuan.user_id)
        .maybeSingle()

      if (!profile?.email) {
        return { triggered: true, error: null }
      }

      // 7. Unduh berkas sertifikat dari bucket privat via Admin Client (Service Role) untuk dijadikan lampiran
      const attachments: Array<{
        filename: string
        content: Buffer
        contentType: string
      }> = []

      const adminClient = createAdminClient()
      if (adminClient && certCheck.file_path) {
        try {
          const { data: blobData, error: dlErr } = await adminClient.storage
            .from('sertifikat')
            .download(certCheck.file_path)

          if (dlErr || !blobData) {
            console.warn(
              `[SertifikatService] Unduh storage gagal untuk file_path="${certCheck.file_path}", email tetap dikirim tanpa lampiran. Error:`,
              dlErr
            )
          } else {
            const arrayBuffer = await blobData.arrayBuffer()
            const fileBuffer = Buffer.from(arrayBuffer)

            // Ekstensi dan Content-Type dari mime_type tabel sertifikats
            const isJpeg = certCheck.mime_type === 'image/jpeg'
            const ext = isJpeg ? 'jpg' : 'pdf'
            const contentType = isJpeg ? 'image/jpeg' : 'application/pdf'

            // Sanitasi nama lampiran: "Sertifikat Magang - {nama pemohon}.{pdf|jpg}"
            const rawName = (profile.name || '').trim()
            // Hapus karakter non-alfanumerik berbahaya
            const sanitizedName = rawName.replace(/[^a-zA-Z0-9\s._-]/g, '').trim()
            const finalRecipientName = sanitizedName || 'Peserta'
            const attachmentFilename = `Sertifikat Magang - ${finalRecipientName}.${ext}`

            attachments.push({
              filename: attachmentFilename,
              content: fileBuffer,
              contentType,
            })
          }
        } catch (storageErr) {
          console.warn('[SertifikatService] Exception saat mengambil lampiran sertifikat:', storageErr)
        }
      } else {
        console.warn('[SertifikatService] Admin client tidak tersedia, email dikirim tanpa lampiran.')
      }

      // 8. Kirim Email Internal Langsung Menggunakan Nodemailer (Menghindari fetch HTTP luar)
      const gmailUser = process.env.GMAIL_USER?.trim()
      const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim()
      const fromAddress =
        process.env.EMAIL_FROM?.trim() ||
        (gmailUser ? `"SIMPUL BRMP-PH" <${gmailUser}>` : '"SIMPUL BRMP-PH" <no-reply@brmp.go.id>')

      if (
        !gmailUser ||
        !gmailAppPassword ||
        gmailAppPassword.includes('placeholder') ||
        gmailUser.includes('placeholder') ||
        gmailAppPassword.includes('your-google-app-password')
      ) {
        console.warn(
          '[SertifikatService] Kredensial Gmail SMTP belum disetel. Notifikasi email sertifikat dilewati.'
        )
        return { triggered: true, error: null }
      }

      const emailPayload: EmailNotificationPayload = {
        event: 'sertifikat_available',
        recipient: {
          email: profile.email,
          name: profile.name || 'Peserta Magang',
        },
        pengajuan: {
          id: pengajuan.id,
          publicId: pengajuan.public_id || String(pengajuan.id),
          bidangNama: (pengajuan.bidangs as any)?.nama,
          asalInstansi: pengajuan.asal_instansi,
          tanggalMulai: pengajuan.tanggal_mulai,
          tanggalSelesai: pengajuan.tanggal_selesai,
        },
      }

      const subject = getEmailSubject(emailPayload)
      const htmlContent = renderEmailHtml(emailPayload)
      const textContent = renderEmailPlainText(emailPayload)

      const cleanPassword = gmailAppPassword.replace(/\s+/g, '')
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: cleanPassword,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      })

      try {
        await transporter.sendMail({
          from: fromAddress,
          to: profile.email,
          subject,
          html: htmlContent,
          text: textContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        })
      } catch (sendErr: unknown) {
        const errorMsg = sendErr instanceof Error ? sendErr.message : 'Gagal mengirim email.'
        console.error('[SertifikatService] Pengiriman email gagal, rollback notified_at:', errorMsg)

        // Rollback notified_at ke NULL jika email gagal terkirim
        await supabase
          .from('sertifikats')
          .update({ notified_at: null })
          .eq('pengajuan_id', pengajuanId)

        return { triggered: false, error: errorMsg }
      }

      return { triggered: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan pemicu notifikasi.'
      console.error('[SertifikatService] checkAndTriggerNotification exception:', msg)
      return { triggered: false, error: msg }
    }
  },
}
