if (typeof window !== 'undefined') {
  throw new Error('server-mailer hanya dapat dieksekusi di sisi server.')
}
import nodemailer from 'nodemailer'
import type { Transporter, SendMailOptions } from 'nodemailer'

/**
 * Interface opsi pengiriman email server-side
 */
export interface ServerMailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  event?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

/**
 * Interface hasil verifikasi konfigurasi email
 */
export interface MailerConfigStatus {
  isValid: boolean
  baseUrl: string | null
  gmailUserConfigured: boolean
  gmailUserValid: boolean
  appPasswordConfigured: boolean
  appPasswordValidLength: boolean
  emailFromConfigured: boolean
  adminEmailConfigured: boolean
  senderAddress: string | null
  adminRecipientAddress: string | null
  errors: string[]
}

/**
 * Sanitasi HTML untuk mencegah XSS injection pada template email
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  const stringVal = String(str)
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return stringVal.replace(/[&<>"']/g, (m) => map[m] || m)
}

/**
 * Masking alamat email untuk keamanan log (contoh: al***@gmail.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local.slice(0, 2)}***@${domain}`
}

/**
 * Validasi format email sederhana
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Mengambil dan memvalidasi konfigurasi Mailer & URL aplikasi
 */
export function getMailerConfig(): MailerConfigStatus {
  const errors: string[] = []

  // 1. Validasi URL Aplikasi
  let baseUrl: string | null = null
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, '')
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL.trim() !== '') {
    baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
  } else if (process.env.NODE_ENV === 'development') {
    baseUrl = 'http://localhost:3000'
  } else {
    errors.push('NEXT_PUBLIC_APP_URL atau VERCEL_PROJECT_PRODUCTION_URL tidak dikonfigurasi di lingkungan produksi.')
  }

  // 2. Validasi GMAIL_USER
  const rawUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : ''
  const gmailUserConfigured = Boolean(rawUser)
  const gmailUserValid = isValidEmail(rawUser)

  if (!gmailUserConfigured) {
    errors.push('Variabel GMAIL_USER belum diset di environment.')
  } else if (!gmailUserValid) {
    errors.push('Variabel GMAIL_USER tidak berformat email valid (harus mengandung @ dan domain).')
  }

  // 3. Validasi GMAIL_APP_PASSWORD (16 digit Google App Password tanpa spasi)
  const rawPass = process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') : ''
  const appPasswordConfigured = Boolean(rawPass)
  const appPasswordValidLength = rawPass.length === 16

  if (!appPasswordConfigured) {
    errors.push('Variabel GMAIL_APP_PASSWORD belum diset di environment.')
  } else if (!appPasswordValidLength) {
    errors.push(`Variabel GMAIL_APP_PASSWORD harus terdiri dari 16 karakter (terdeteksi ${rawPass.length} karakter).`)
  }

  // 4. Pengirim (EMAIL_FROM)
  const rawFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : ''
  const emailFromConfigured = Boolean(rawFrom)
  let senderAddress = rawUser

  if (rawFrom) {
    // Format yang diharapkan: "SIMPUL BRMP-PH <email@domain>" atau "email@domain"
    const match = rawFrom.match(/<([^>]+)>/)
    const emailInside = match ? match[1].trim() : rawFrom
    if (isValidEmail(emailInside)) {
      senderAddress = rawFrom
    } else {
      // Fallback aman ke GMAIL_USER jika sintaks tidak valid
      senderAddress = rawUser ? `SIMPUL BRMP-PH <${rawUser}>` : ''
    }
  } else if (rawUser) {
    senderAddress = `SIMPUL BRMP-PH <${rawUser}>`
  }

  // 5. Admin Penerima (ADMIN_EMAIL)
  const rawAdmin = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim() : ''
  const adminEmailConfigured = Boolean(rawAdmin)
  let adminRecipientAddress = rawUser // Fallback ke GMAIL_USER jika ADMIN_EMAIL kosong

  if (adminEmailConfigured && isValidEmail(rawAdmin)) {
    adminRecipientAddress = rawAdmin
  }

  const isValid = gmailUserValid && appPasswordValidLength && errors.length === 0

  return {
    isValid,
    baseUrl,
    gmailUserConfigured,
    gmailUserValid,
    appPasswordConfigured,
    appPasswordValidLength,
    emailFromConfigured,
    adminEmailConfigured,
    senderAddress: senderAddress || null,
    adminRecipientAddress: adminRecipientAddress || null,
    errors,
  }
}

/**
 * Mengambil Base URL aplikasi saat ini
 */
export function getAppBaseUrl(): string {
  const config = getMailerConfig()
  if (config.baseUrl) return config.baseUrl

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  console.error('[Mailer] URL aplikasi belum dikonfigurasi di environment produksi (NEXT_PUBLIC_APP_URL kosong).')
  return ''
}

/**
 * Mengambil alamat email admin pengelola (ADMIN_EMAIL dengan fallback ke GMAIL_USER)
 */
export function getAdminEmailAddress(): string {
  const config = getMailerConfig()
  return config.adminRecipientAddress || 'simpulbrmpph@gmail.com'
}

/**
 * Singleton / Cached Nodemailer Transporter
 */
let transporterInstance: Transporter | null = null

export function getSharedTransporter(): Transporter | null {
  const config = getMailerConfig()
  if (!config.gmailUserValid || !config.appPasswordValidLength) {
    return null
  }

  if (!transporterInstance) {
    const rawPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
    const user = (process.env.GMAIL_USER || '').trim()

    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: rawPass,
      },
    })
  }

  return transporterInstance
}

/**
 * Verifikasi koneksi transporter SMTP Gmail
 */
export async function verifyMailerTransporter(): Promise<{ success: boolean; message: string }> {
  try {
    const config = getMailerConfig()
    if (!config.isValid) {
      return {
        success: false,
        message: `Konfigurasi email tidak valid: ${config.errors.join('; ')}`,
      }
    }

    const transporter = getSharedTransporter()
    if (!transporter) {
      return {
        success: false,
        message: 'Gagal menginisialisasi transporter SMTP.',
      }
    }

    await transporter.verify()
    return {
      success: true,
      message: 'Koneksi SMTP Gmail berhasil diverifikasi.',
    }
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string }
    const code = errorObj?.code || 'UNKNOWN_ERROR'
    const msg = errorObj?.message || 'Error verifikasi SMTP tidak dikenal.'
    console.error(`[Mailer Verify] Gagal verifikasi SMTP. Kode: ${code}. Pesan: ${msg}`)
    return {
      success: false,
      message: `Gagal verifikasi SMTP (Kode: ${code}): ${msg}`,
    }
  }
}

/**
 * Fungsi Server-side untuk mengirim email
 * Tidak memutus proses utama jika gagal, namun mencatat log terstruktur tanpa membocorkan secret.
 */
export async function sendServerMail(options: ServerMailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const eventName = options.event || 'general_notification'
  const recipients = Array.isArray(options.to) ? options.to : [options.to]
  const maskedRecipients = recipients.map(maskEmail).join(', ')

  try {
    const config = getMailerConfig()
    if (!config.isValid || !config.senderAddress) {
      const errReason = config.errors.join(' | ') || 'Konfigurasi email tidak valid.'
      console.warn(`[Mailer ${eventName}] Pengiriman dibatalkan ke [${maskedRecipients}]. Alasan: ${errReason}`)
      return { success: false, error: errReason }
    }

    const transporter = getSharedTransporter()
    if (!transporter) {
      console.warn(`[Mailer ${eventName}] Transporter tidak tersedia. Email ke [${maskedRecipients}] dilewati.`)
      return { success: false, error: 'Transporter SMTP tidak tersedia.' }
    }

    const mailOptions: SendMailOptions = {
      from: config.senderAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      attachments: options.attachments,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`[Mailer ${eventName}] Email berhasil dikirim ke [${maskedRecipients}]. ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string }
    const errorCode = errorObj?.code || 'UNKNOWN'
    const errorMessage = errorObj?.message || 'Unknown error'

    console.error(
      `[Mailer ERROR] Event: ${eventName} | Penerima: [${maskedRecipients}] | Kode: ${errorCode} | Pesan: ${errorMessage}`
    )
    return { success: false, error: `[${errorCode}] ${errorMessage}` }
  }
}
