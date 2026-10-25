export interface NotifikasiRecord {
  id: number
  user_id: string
  judul: string
  pesan: string
  link?: string | null
  is_read: boolean
  created_at: string
}

export interface NotifyAdminPayload {
  judul: string
  pesan: string
  link?: string
}

export const notifikasiService = {
  /**
   * Mengirim notifikasi in-app kepada seluruh administrator aktif
   * Mendukung eksekusi di Client Component maupun Server-Side (Route Handler)
   */
  async notifyAdmins(payload: NotifyAdminPayload): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
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

      const response = await fetch(`${baseUrl}/api/notifications/notify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      return {
        success: data.success ?? false,
        count: data.count,
        error: data.error ?? undefined,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim notifikasi admin'
      console.warn('[NotifikasiService] notifyAdmins error:', msg)
      return { success: false, error: msg }
    }
  },

  /**
   * Mengambil daftar notifikasi milik administrator yang sedang login
   */
  async getAdminNotifications(): Promise<{
    success: boolean
    notifications: NotifikasiRecord[]
    unreadCount: number
    error?: string
  }> {
    try {
      const response = await fetch('/api/admin/notifikasi', {
        method: 'GET',
        cache: 'no-store',
      })
      const result = await response.json()

      if (result.success && result.data) {
        return {
          success: true,
          notifications: result.data.notifications || [],
          unreadCount: result.data.unreadCount || 0,
        }
      }

      return {
        success: false,
        notifications: [],
        unreadCount: 0,
        error: result.error || 'Gagal memuat notifikasi',
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat notifikasi'
      return { success: false, notifications: [], unreadCount: 0, error: msg }
    }
  },

  /**
   * Menandai 1 notifikasi tertentu telah dibaca
   */
  async markAsRead(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/admin/notifikasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = await response.json()
      return { success: result.success ?? false, error: result.error }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui notifikasi'
      return { success: false, error: msg }
    }
  },

  /**
   * Menandai seluruh notifikasi administrator sebagai telah dibaca
   */
  async markAllAsRead(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/admin/notifikasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      const result = await response.json()
      return { success: result.success ?? false, error: result.error }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui seluruh notifikasi'
      return { success: false, error: msg }
    }
  },
}
