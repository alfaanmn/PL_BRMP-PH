if (typeof window !== 'undefined') {
  throw new Error('server-notifikasi hanya dapat dieksekusi di sisi server.')
}
import { createAdminClient } from '@/lib/supabase/admin'

export interface CreateNotificationParams {
  userId: string
  judul: string
  pesan: string
  link?: string | null
}

export interface NotifyAdminsParams {
  judul: string
  pesan: string
  link?: string | null
}

/**
 * Menyimpan notifikasi web ke database untuk user tertentu menggunakan admin client
 */
export async function createNotificationServer(params: CreateNotificationParams): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.warn('[NotificationServer] Supabase Admin Client tidak tersedia (Service Role Key belum diset).')
      return { success: false, error: 'Admin client tidak tersedia.' }
    }

    const { error } = await adminClient.from('notifikasi').insert({
      user_id: params.userId,
      judul: params.judul,
      pesan: params.pesan,
      link: params.link || null,
      is_read: false,
    })

    if (error) {
      console.error('[NotificationServer] Gagal insert notifikasi:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[NotificationServer] Exception saat insert notifikasi:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Mengirimkan notifikasi web ke SELURUH user dengan role = 'administrator'
 */
export async function notifyAllAdminsServer(params: NotifyAdminsParams): Promise<{
  success: boolean
  notifiedCount?: number
  error?: string
}> {
  try {
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.warn('[NotificationServer notifyAdmins] Admin Client tidak tersedia.')
      return { success: false, error: 'Admin client tidak tersedia.' }
    }

    // Ambil semua admin aktif
    const { data: admins, error: fetchErr } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'administrator')
      .eq('is_active', true)

    if (fetchErr) {
      console.error('[NotificationServer notifyAdmins] Gagal mengambil profil admin:', fetchErr.message)
      return { success: false, error: fetchErr.message }
    }

    if (!admins || admins.length === 0) {
      console.warn('[NotificationServer notifyAdmins] Tidak ada user administrator aktif.')
      return { success: true, notifiedCount: 0 }
    }

    const inserts = admins.map((admin) => ({
      user_id: admin.id,
      judul: params.judul,
      pesan: params.pesan,
      link: params.link || null,
      is_read: false,
    }))

    const { error: insertErr } = await adminClient.from('notifikasi').insert(inserts)

    if (insertErr) {
      console.error('[NotificationServer notifyAdmins] Gagal insert notifikasi admin:', insertErr.message)
      return { success: false, error: insertErr.message }
    }

    return { success: true, notifiedCount: inserts.length }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[NotificationServer notifyAdmins] Exception:', msg)
    return { success: false, error: msg }
  }
}
