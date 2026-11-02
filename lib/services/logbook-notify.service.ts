import { createAdminClient } from '@/lib/supabase/admin'
import { sendServerMail } from '@/lib/services/server-mailer'
import { getSiteUrl } from '@/lib/utils'

export interface LogbookUploadAdminNotificationPayload {
  namaPemohon: string
  bidangNama: string
  mingguKe: number
  periodeMulai: string
  periodeSelesai: string
  fileName: string
  pengajuanId: number | string
  publicId?: string
  isReplace: boolean
}

export interface LogbookReminderPayload {
  toEmail: string
  namaPemohon: string
  mingguKe: number
  periodeMulai: string
  periodeSelesai: string
  jenis: 'kamis' | 'jumat'
  publicId?: string
}

/**
 * Mengambil daftar alamat email penerima administrator
 */
export async function getAdminNotificationEmails(): Promise<string[]> {
  const envEmails = process.env.ADMIN_NOTIFY_EMAILS
  if (envEmails && envEmails.trim()) {
    return envEmails
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.includes('@'))
  }

  const adminClient = createAdminClient()
  if (!adminClient) return []

  const { data: admins } = await adminClient
    .from('profiles')
    .select('email')
    .eq('role', 'administrator')
    .eq('is_active', true)
    .not('email', 'is', null)

  return (admins || [])
    .map((a) => (a.email || '').trim())
    .filter((e) => e.includes('@'))
}

/**
 * Mengirim email notifikasi ke administrator saat pemohon mengunggah/mengganti logbook
 */
export async function sendLogbookUploadedAdminNotification(
  payload: LogbookUploadAdminNotificationPayload
): Promise<void> {
  const adminEmails = await getAdminNotificationEmails()
  if (adminEmails.length === 0) {
    console.warn('[LogbookNotify] Tidak ada email administrator yang ditemukan.')
    return
  }

  const siteUrl = getSiteUrl()
  const detailUrl = payload.publicId
    ? `${siteUrl}/admin/riwayat-pengajuan/${payload.publicId}`
    : `${siteUrl}/admin/riwayat-pengajuan`

  const uploadTimeWib = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date())

  const actionText = payload.isReplace ? 'memperbarui berkas' : 'mengunggah berkas baru'
  const subject = `[SIMPUL] Logbook ${payload.isReplace ? 'Diperbarui' : 'Baru'} - ${payload.namaPemohon} (Minggu ke-${payload.mingguKe})`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background-color: #16a34a; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: -0.01em;">Pemberitahuan Logbook Magang</h2>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-top: 0;">
          Halo Administrator SIMPUL,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Peserta magang berikut telah <strong>${actionText}</strong> logbook kegiatan mingguan:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; width: 140px;">Nama Peserta</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${payload.namaPemohon}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Bidang</td>
            <td style="padding: 8px 0; color: #0f172a;">${payload.bidangNama}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Minggu ke</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">Minggu ke-${payload.mingguKe}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Periode Kegiatan</td>
            <td style="padding: 8px 0; color: #0f172a;">${payload.periodeMulai} s/d ${payload.periodeSelesai}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Nama Berkas</td>
            <td style="padding: 8px 0; color: #0f172a;">${payload.fileName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Waktu Unggah</td>
            <td style="padding: 8px 0; color: #0f172a;">${uploadTimeWib} WIB</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 24px 0 16px 0;">
          <a href="${detailUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 13px;">
            Lihat Rincian Pengajuan di Panel Admin
          </a>
        </div>

        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
          Email ini dikirim secara otomatis oleh Sistem Informasi Magang dan Pelatihan Unggulan Lanjutan (SIMPUL).
        </p>
      </div>
    </div>
  `

  const text = `
Pemberitahuan Logbook Magang - SIMPUL

Peserta ${payload.namaPemohon} (${payload.bidangNama}) telah ${actionText} logbook kegiatan Minggu ke-${payload.mingguKe} (${payload.periodeMulai} s/d ${payload.periodeSelesai}).
Nama berkas: ${payload.fileName}
Waktu unggah: ${uploadTimeWib} WIB

Buka panel admin untuk melihat detail: ${detailUrl}
  `.trim()

  for (const adminEmail of adminEmails) {
    try {
      await sendServerMail({
        to: adminEmail,
        subject,
        html,
        text,
        event: 'logbook_uploaded',
      })
    } catch (sendErr) {
      console.warn(`[LogbookNotify] Gagal mengirim email ke admin ${adminEmail}:`, sendErr)
    }
  }
}

/**
 * Mengirim email pengingat logbook mingguan ke pemohon (Kamis & Jumat)
 */
export async function sendLogbookReminderNotification(payload: LogbookReminderPayload): Promise<boolean> {
  const siteUrl = getSiteUrl()
  const logbookUrl = `${siteUrl}/pengguna/riwayat`

  const isJumat = payload.jenis === 'jumat'
  const subject = isJumat
    ? `[PENTING] Batas Waktu Pengisian Logbook Magang Minggu ke-${payload.mingguKe} - SIMPUL`
    : `[Pengingat] Pengisian Logbook Magang Minggu ke-${payload.mingguKe} - SIMPUL`

  const titleHeader = isJumat
    ? `Pengingat Terakhir Pengisian Logbook (Hari Jumat)`
    : `Pengingat Rutin Pengisian Logbook Mingguan`

  const descText = isJumat
    ? `Hari ini adalah hari <strong>Jumat</strong>, batas waktu pengisian laporan kegiatan magang mingguan untuk <strong>Minggu ke-${payload.mingguKe}</strong> (${payload.periodeMulai} s/d ${payload.periodeSelesai}). Catatan: Anda tetap dapat mengunggah berkas setelah hari ini apabila mengalami kendala.`
    : `Mengingatkan Anda untuk segera mengisi dan mengunggah logbook kegiatan magang untuk <strong>Minggu ke-${payload.mingguKe}</strong> (${payload.periodeMulai} s/d ${payload.periodeSelesai}) sebelum akhir pekan ini.`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background-color: ${isJumat ? '#b91c1c' : '#2563eb'}; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: -0.01em;">${titleHeader}</h2>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-top: 0;">
          Halo <strong>${payload.namaPemohon}</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          ${descText}
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <div style="font-size: 13px; color: #475569;">
            <strong>Minggu ke:</strong> ${payload.mingguKe}<br />
            <strong>Periode:</strong> ${payload.periodeMulai} s/d ${payload.periodeSelesai}<br />
            <strong>Format berkas:</strong> PDF, JPG, JPEG, PNG (Maks 2 MB)
          </div>
        </div>

        <div style="text-align: center; margin: 24px 0 16px 0;">
          <a href="${logbookUrl}" style="display: inline-block; background-color: ${isJumat ? '#b91c1c' : '#2563eb'}; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 13px;">
            Unggah Logbook Sekarang →
          </a>
        </div>

        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
          Email ini dikirim secara otomatis oleh Sistem Informasi Magang dan Pelatihan Unggulan Lanjutan (SIMPUL).
        </p>
      </div>
    </div>
  `

  const text = `
${titleHeader} - SIMPUL

Halo ${payload.namaPemohon},
${descText.replace(/<[^>]+>/g, '')}

Periode: ${payload.periodeMulai} s/d ${payload.periodeSelesai}
Tautan pengunggahan: ${logbookUrl}
  `.trim()

  const result = await sendServerMail({
    to: payload.toEmail,
    subject,
    html,
    text,
    event: 'logbook_reminder',
  })

  return result.success
}
