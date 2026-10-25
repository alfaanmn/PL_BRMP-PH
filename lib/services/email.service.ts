import {
  EmailNotificationPayload,
  EmailSendResult,
} from '@/types/email.types'
import {
  getEmailSubject,
  renderEmailHtml,
  renderEmailPlainText,
} from '@/lib/templates/email-templates'

export const emailService = {
  /**
   * Mengirim notifikasi email transaksional.
   * Di sisi server: langsung memproses via server-mailer (tanpa HTTP loopback fetch ke diri sendiri).
   * Di sisi browser (jika ada): memanggil route handler /api/notifications/email.
   */
  async sendNotification(payload: EmailNotificationPayload): Promise<EmailSendResult> {
    try {
      // 1. Jika dieksekusi di Server-side (Node.js runtime / Server Action / Route Handler)
      if (typeof window === 'undefined') {
        const { sendServerMail } = await import('@/lib/services/server-mailer')

        const toEmail = payload.recipient?.email?.trim()
        if (!toEmail || !toEmail.includes('@')) {
          console.warn(`[EmailService] Email penerima tidak valid: "${toEmail}". Pengiriman dibatalkan.`)
          return {
            success: false,
            error: 'Alamat email penerima tidak valid.',
          }
        }

        const subject = getEmailSubject(payload)
        const html = renderEmailHtml(payload)
        const text = renderEmailPlainText(payload)

        const result = await sendServerMail({
          to: toEmail,
          subject,
          html,
          text,
          event: payload.event,
        })

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error || null,
        }
      }

      // 2. Jika dipanggil dari Client-side Browser
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      return {
        success: data.success ?? false,
        messageId: data.messageId,
        error: data.error ?? null,
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Terjadi kegagalan saat memproses pengiriman email.'
      console.warn('[EmailService] Gagal memicu notifikasi email:', msg)
      return {
        success: false,
        error: msg,
      }
    }
  },
}
