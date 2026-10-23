import {
  EmailNotificationPayload,
  EmailSendResult,
} from '@/types/email.types'

export const emailService = {
  /**
   * Mengirim notifikasi email transaksional melalui Server Route Handler (/api/notifications/email).
   * Bersih dari import Nodemailer/Node.js internals sehingga aman di-import oleh Client Component.
   */
  async sendNotification(payload: EmailNotificationPayload): Promise<EmailSendResult> {
    try {
      // Tentukan base URL sesuai context (Browser vs Server-Side execution)
      let baseUrl = ''
      if (typeof window === 'undefined') {
        const rawUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : process.env.NODE_ENV === 'production'
                ? 'https://simpul-brmpph.id'
                : 'http://localhost:3000')

        baseUrl = rawUrl.replace(/\/+$/, '')
      }

      const endpoint = `${baseUrl}/api/notifications/email`

      const response = await fetch(endpoint, {
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
        err instanceof Error ? err.message : 'Terjadi kegagalan saat menghubungi endpoint notifikasi email'
      console.warn('[EmailService] Gagal memicu notifikasi email:', msg)
      return {
        success: false,
        error: msg,
      }
    }
  },
}
