import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { EmailNotificationPayload } from '@/types/email.types'
import {
  getEmailSubject,
  renderEmailHtml,
  renderEmailPlainText,
} from '@/lib/templates/email-templates'

// Wajib Node.js runtime untuk mendukung Nodemailer & modul jaringan SMTP
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload: EmailNotificationPayload = await request.json()

    const gmailUser = process.env.GMAIL_USER?.trim()
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim()
    const fromAddress =
      process.env.EMAIL_FROM?.trim() ||
      (gmailUser ? `"SIM-MAGANG BRMP PH" <${gmailUser}>` : '"SIM-MAGANG BRMP PH" <no-reply@brmp.go.id>')

    // 1. Validasi konfigurasi akun Gmail SMTP
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

    // 2. Validasi recipient email
    const toEmail = payload.recipient?.email?.trim()
    if (!toEmail || !toEmail.includes('@')) {
      console.warn(
        `[EmailAPI] Alamat email penerima tidak valid: "${toEmail}". Pengiriman dibatalkan.`
      )
      return NextResponse.json({
        success: false,
        error: 'INVALID_RECIPIENT_EMAIL',
      })
    }

    // 3. Susun Subject, HTML, dan Plain-text dari Template resmi BRMP PH
    const subject = getEmailSubject(payload)
    const htmlContent = renderEmailHtml(payload)
    const textContent = renderEmailPlainText(payload)

    // 4. Inisialisasi Transporter Gmail SMTP (Server-Side Only)
    const cleanPassword = gmailAppPassword.replace(/\s+/g, '')
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL port 465
      auth: {
        user: gmailUser,
        pass: cleanPassword,
      },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    })

    // 5. Kirim Email melalui Nodemailer
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
    console.error('[EmailAPI] Gagal mengirim email via Gmail SMTP:', msg)
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    )
  }
}
