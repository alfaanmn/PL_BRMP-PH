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
   * Mengirim notifikasi in-app kepada seluruh administrator aktif.
   * Di server: langsung memproses via admin client Supabase (tanpa loopback fetch & bebas 401).
   * Di browser: memanggil route /api/notifications/notify-admin.
   */
  async notifyAdmins(payload: NotifyAdminPayload): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      if (typeof window === 'undefined') {
        const { notifyAllAdminsServer } = await import('@/lib/services/server-notifikasi')
        const result = await notifyAllAdminsServer({
          judul: payload.judul,
          pesan: payload.pesan,
          link: payload.link,
        })
        return {
          success: result.success,
          count: result.notifiedCount,
          error: result.error,
        }
      }

      const response = await fetch('/api/notifications/notify-admin', {
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
   * Menandai notifikasi administrator telah dibaca
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

  /**
   * Mengambil daftar notifikasi milik pengguna biasa (user) yang sedang login
   */
  async getUserNotifications(): Promise<{
    success: boolean
    notifications: NotifikasiRecord[]
    unreadCount: number
    error?: string
  }> {
    try {
      const response = await fetch('/api/pengguna/notifikasi', {
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
        error: result.error || 'Gagal memuat notifikasi pengguna',
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat notifikasi'
      return { success: false, notifications: [], unreadCount: 0, error: msg }
    }
  },

  /**
   * Menandai notifikasi milik pengguna biasa (user) telah dibaca
   */
  async markUserAsRead(id?: number, markAll?: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/pengguna/notifikasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, markAll }),
      })
      const result = await response.json()
      return { success: result.success ?? false, error: result.error }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui notifikasi pengguna'
      return { success: false, error: msg }
    }
  },
}
