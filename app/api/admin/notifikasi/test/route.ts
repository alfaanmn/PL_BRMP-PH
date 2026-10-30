import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getMailerConfig,
  verifyMailerTransporter,
  sendServerMail,
  maskEmail,
} from '@/lib/services/server-mailer'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/notifikasi/test
 * Route Diagnosa Notifikasi & SMTP untuk Administrator.
 * Keamanan:
 * 1. Wajib autentikasi & role === 'administrator'.
 * 2. Di lingkungan produksi wajib menggunakan query string ?confirm=1.
 * 3. TIDAK PERNAH menampilkan nilai secret kredensial di response JSON.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verifikasi Autentikasi Pengguna
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi pengguna tidak ditemukan' },
        { status: 401 }
      )
    }

    // 2. Verifikasi Hak Akses Administrator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'administrator') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Endpoint ini khusus untuk administrator' },
        { status: 403 }
      )
    }

    // 3. Konfirmasi di Lingkungan Produksi
    const isProduction = process.env.NODE_ENV === 'production'
    const confirmParam = request.nextUrl.searchParams.get('confirm')

    if (isProduction && confirmParam !== '1') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Di lingkungan produksi, eksekusi tes email memerlukan konfirmasi eksplisit. Tambahkan parameter "?confirm=1" pada URL untuk melanjutkan.',
        },
        { status: 400 }
      )
    }

    // 4. Periksa Status Konfigurasi Environment (Tanpa Nilai Secret)
    const configStatus = getMailerConfig()

    // 5. Verifikasi Koneksi Transporter SMTP
    let smtpVerifyResult = { success: false, message: 'SMTP belum diverifikasi' }
    if (configStatus.isValid) {
      smtpVerifyResult = await verifyMailerTransporter()
    } else {
      smtpVerifyResult = {
        success: false,
        message: 'Verifikasi SMTP dilewati karena konfigurasi environment belum lengkap.',
      }
    }

    // 6. Uji Pengiriman Email Diagnostik ke Alamat Admin Pengelola
    let testEmailResult = { success: false, message: 'Pengiriman email uji dilewati' }

    if (smtpVerifyResult.success && configStatus.adminRecipientAddress) {
      const recipient = configStatus.adminRecipientAddress
      const nowStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

      const sendResult = await sendServerMail({
        to: recipient,
        subject: `[DIAGNOSTIK] Uji Coba Pengiriman Email SIMPUL BRMP-PH (${nowStr} WIB)`,
        html: `
          <div style="font-family:sans-serif;padding:20px;border:1px solid #10b981;border-radius:10px;">
            <h2 style="color:#065f46;margin-top:0;">Uji Coba Pengiriman Email Berhasil!</h2>
            <p>Halo Administrator,</p>
            <p>Email ini dikirimkan melalui fitur diagnostik resmi sistem <strong>SIMPUL BRMP-PH</strong> untuk memverifikasi bahwa konfigurasi SMTP Gmail berjalan dengan baik di hosting.</p>
            <ul>
              <li><strong>Waktu Tes:</strong> ${nowStr} WIB</li>
              <li><strong>URL Aplikasi Terdeteksi:</strong> ${configStatus.baseUrl || 'Default / Belum diatur'}</li>
              <li><strong>Akun Pengirim:</strong> ${maskEmail(configStatus.senderAddress || '')}</li>
              <li><strong>Target Admin Penerima:</strong> ${maskEmail(recipient)}</li>
            </ul>
            <p style="color:#6b7280;font-size:12px;">Pesan uji coba otomatis — tidak perlu dibalas.</p>
          </div>
        `,
        event: 'admin_diagnostic_test',
      })

      if (sendResult.success) {
        testEmailResult = {
          success: true,
          message: `Email uji berhasil terkirim ke ${maskEmail(recipient)} (Message ID: ${sendResult.messageId}).`,
        }
      } else {
        testEmailResult = {
          success: false,
          message: `Gagal mengirim email uji: ${sendResult.error}`,
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        detectedAppBaseUrl: configStatus.baseUrl,
        variablesCheck: {
          GMAIL_USER: {
            configured: configStatus.gmailUserConfigured,
            isValidFormat: configStatus.gmailUserValid,
          },
          GMAIL_APP_PASSWORD: {
            configured: configStatus.appPasswordConfigured,
            isValidLength: configStatus.appPasswordValidLength,
          },
          EMAIL_FROM: {
            configured: configStatus.emailFromConfigured,
          },
          ADMIN_EMAIL: {
            configured: configStatus.adminEmailConfigured,
          },
          NEXT_PUBLIC_SITE_URL: {
            configured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
            value: process.env.NEXT_PUBLIC_SITE_URL || null,
            isLocalhostInProd: Boolean(
              process.env.NODE_ENV === 'production' &&
                process.env.NEXT_PUBLIC_SITE_URL &&
                (process.env.NEXT_PUBLIC_SITE_URL.includes('localhost') ||
                  process.env.NEXT_PUBLIC_SITE_URL.includes('127.0.0.1'))
            ),
          },
          NEXT_PUBLIC_APP_URL: {
            configured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
          },
          VERCEL_PROJECT_PRODUCTION_URL: {
            configured: Boolean(process.env.VERCEL_PROJECT_PRODUCTION_URL),
          },
        },
        activeSender: maskEmail(configStatus.senderAddress || ''),
        activeAdminRecipient: maskEmail(configStatus.adminRecipientAddress || ''),
        configurationErrors: configStatus.errors,
      },
      smtpVerification: smtpVerifyResult,
      testEmailDelivery: testEmailResult,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[AdminTestMail API] Exception:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
