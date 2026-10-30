import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { EmailNotificationPayload } from '@/types/email.types'
import {
  getEmailSubject,
  renderEmailHtml,
  renderEmailPlainText,
  escapeHtml,
} from '@/lib/templates/email-templates'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Wajib Node.js runtime untuk mendukung Nodemailer & modul jaringan SMTP
export const runtime = 'nodejs'

/**
 * Whitelist status database yang sah untuk tiap event pengajuan.
 * Disesuaikan secara presisi dengan status aktual hasil verifikasi:
 * - Persetujuan ('Disetujui', 'Sedang Magang', 'Terjadwal')
 * - Penolakan ('Ditolak')
 * - Selesai ('Selesai')
 * - Pembatalan ('Dibatalkan')
 * - Pengajuan Baru ('Menunggu Verifikasi')
 */
const STATUS_WHITELIST_PER_EVENT: Record<string, string[]> = {
  pengajuan_approved: ['Sedang Magang', 'Disetujui', 'Terjadwal'],
  pengajuan_rejected: ['Ditolak'],
  pengajuan_completed: ['Selesai'],
  pengajuan_cancelled: ['Dibatalkan'],
  pengajuan_submitted: ['Menunggu Verifikasi'],
  admin_pengajuan_new: ['Menunggu Verifikasi'],
  admin_skm_completed: ['Selesai'],
  sertifikat_available: ['Selesai'],
}

/**
 * Cache in-memory pelacak pengiriman email untuk mencegah replay attack / duplicate double-click.
 * Menyimpan key `${event}:${pengajuanId}` dengan masa berlaku (TTL) 60 detik.
 */
const recentEmailDispatches = new Map<string, number>()
const DISPATCH_CACHE_TTL_MS = 60 * 1000

function isRecentDuplicate(event: string, pengajuanId: number | string): boolean {
  const key = `${event}:${pengajuanId}`
  const now = Date.now()
  const lastTime = recentEmailDispatches.get(key)
  if (lastTime && now - lastTime < DISPATCH_CACHE_TTL_MS) {
    return true
  }
  recentEmailDispatches.set(key, now)
  return false
}

/**
 * Route Handler Aman untuk Pengiriman Email Transaksional
 * Dilengkapi proteksi autentikasi, otorisasi berbasis role, verifikasi status DB aktual,
 * pencegahan email ganda (idempotency guard), sanitasi/escape input, dan penegakan penerima dari database.
 */
export async function POST(request: Request) {
  try {
    // 1. Verifikasi Autentikasi Sesi Pemanggil (Wajib Login)
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak valid atau belum login' },
        { status: 401 }
      )
    }

    // 2. Parse & Validasi Format JSON Payload
    let payload: EmailNotificationPayload
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Format JSON tidak valid' },
        { status: 400 }
      )
    }

    // 3. Whitelist Validasi Event
    const allowedEvents = Object.keys(STATUS_WHITELIST_PER_EVENT)
    if (!payload.event || !allowedEvents.includes(payload.event)) {
      return NextResponse.json(
        {
          success: false,
          error: `Bad Request: Event "${payload.event}" tidak diizinkan. Pilihan: ${allowedEvents.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 4. Inisialisasi Admin Client untuk Verifikasi Database
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error('[EmailAPI] Supabase Admin Client tidak tersedia (cek env service role).')
      return NextResponse.json(
        { success: false, error: 'Internal Server Error: Konfigurasi server tidak lengkap' },
        { status: 500 }
      )
    }

    // 5. Ambil Profil Pemanggil untuk Cek Role
    const { data: callerProfile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileErr || !callerProfile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Profil pemanggil tidak ditemukan' },
        { status: 401 }
      )
    }

    const isCallerAdmin = callerProfile.role === 'administrator'

    // 6. Evaluasi Otorisasi Role terhadap Event
    const isTargetAdmin =
      payload.recipientRole === 'admin' ||
      payload.event === 'admin_pengajuan_new' ||
      payload.event === 'admin_skm_completed'

    // Event ke admin HANYA boleh dipicu oleh administrator
    if (isTargetAdmin && !isCallerAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Hanya administrator yang berhak mengirim notifikasi admin' },
        { status: 403 }
      )
    }

    // Event verifikasi & administratif (approved, rejected, completed, sertifikat) HANYA boleh dipicu oleh administrator
    const isAdminOnlyEvent = [
      'pengajuan_approved',
      'pengajuan_rejected',
      'pengajuan_completed',
      'sertifikat_available',
    ].includes(payload.event)

    if (isAdminOnlyEvent && !isCallerAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Event "${payload.event}" hanya dapat dilakukan oleh administrator.`,
        },
        { status: 403 }
      )
    }

    // 7. Verifikasi Berkas Pengajuan di Database & Validasi Kepemilikan
    const publicId = payload.pengajuan?.publicId
    const pengajuanId = payload.pengajuan?.id

    if (!publicId && !pengajuanId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Pengajuan id atau publicId wajib disertakan' },
        { status: 400 }
      )
    }

    let pQuery = adminClient
      .from('pengajuans')
      .select(`
        id,
        public_id,
        user_id,
        status,
        nama_lengkap,
        asal_instansi,
        jurusan,
        jenjang,
        skm_reminder_sent_at,
        profiles:user_id (
          id,
          name,
          email,
          status_peserta
        ),
        bidangs (
          id,
          nama
        ),
        pembimbings (
          id,
          nama,
          nip,
          jabatan
        )
      `)

    if (publicId) {
      pQuery = pQuery.eq('public_id', String(publicId))
    } else {
      pQuery = pQuery.eq('id', Number(pengajuanId))
    }

    const { data: dbPengajuan, error: pErr } = await pQuery.maybeSingle()

    if (pErr || !dbPengajuan) {
      return NextResponse.json(
        { success: false, error: 'Not Found: Berkas pengajuan tidak ditemukan di database' },
        { status: 404 }
      )
    }

    // Otorisasi Kepemilikan: Pengguna biasa hanya boleh memicu untuk berkas miliknya sendiri
    if (!isCallerAdmin && dbPengajuan.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Anda tidak memiliki hak akses atas pengajuan ini' },
        { status: 403 }
      )
    }

    // 8. Verifikasi Status Aktual Pengajuan di Database (Strict State Whitelist)
    const allowedStatuses = STATUS_WHITELIST_PER_EVENT[payload.event] || []
    if (!allowedStatuses.includes(dbPengajuan.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Bad Request: Status pengajuan saat ini adalah "${dbPengajuan.status}", tidak memenuhi syarat untuk event "${payload.event}" (Status yang sah: ${allowedStatuses.join(', ')})`,
        },
        { status: 400 }
      )
    }

    // 9. Guard Pencegahan Pengiriman Ganda (Idempotency Guard)
    if (isRecentDuplicate(payload.event, dbPengajuan.id)) {
      return NextResponse.json({
        success: true,
        message: 'Email notifikasi sudah dikirim sebelumnya (idempotent duplicate prevention)',
        error: null,
      })
    }

    // 10. Kunci Alamat Penerima dari Database (Anti-Open Relay)
    let toEmail = ''
    let toName = ''

    if (isTargetAdmin) {
      const { getAdminEmailAddress } = await import('@/lib/services/server-mailer')
      toEmail = getAdminEmailAddress()
      toName = 'Admin SIMPUL'
    } else {
      const ownerProfile = (dbPengajuan as any).profiles
      toEmail = ownerProfile?.email?.trim() || ''
      toName = ownerProfile?.name || dbPengajuan.nama_lengkap || 'Peserta Magang'
    }

    if (!toEmail || !toEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Alamat email penerima pada database tidak valid' },
        { status: 400 }
      )
    }

    // Timpa recipient di payload dengan data definitif dari database
    payload.recipient = {
      email: toEmail,
      name: toName,
    }

    // 11. Sanitasi, Batasan Panjang (Maks 500 Char), dan Escape Input String
    if (payload.alasanPenolakan && typeof payload.alasanPenolakan === 'string') {
      const sanitized = escapeHtml(payload.alasanPenolakan.trim().slice(0, 500))
      payload.alasanPenolakan = sanitized
    }
    if (payload.catatan && typeof payload.catatan === 'string') {
      const sanitized = escapeHtml(payload.catatan.trim().slice(0, 500))
      payload.catatan = sanitized
    }

    // 12. Validasi Konfigurasi Gmail SMTP
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
        '[EmailAPI] Konfigurasi Gmail SMTP (GMAIL_USER / GMAIL_APP_PASSWORD) belum disetel di .env.local. Email dilewati secara aman.'
      )
      return NextResponse.json({
        success: false,
        error: 'GMAIL_CONFIG_NOT_CONFIGURED',
      })
    }

    // 13. Susun Subject, HTML, dan Plain-text dari Template Resmi (dengan data DB terlindungi)
    const subject = getEmailSubject(payload)
    const htmlContent = renderEmailHtml(payload)
    const textContent = renderEmailPlainText(payload)

    // 14. Inisialisasi Transporter Gmail SMTP (Server-Side Only)
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

    // 15. Kirim Email melalui Nodemailer
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      error: null,
    })
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim email via Gmail SMTP'
    console.error('[EmailAPI] Exception saat mengirim email:', msg)
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    )
  }
}
