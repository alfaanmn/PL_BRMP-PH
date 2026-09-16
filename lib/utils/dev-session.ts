/**
 * Utility untuk mengelola Development Server Boot Identifier.
 * Memastikan sesi Supabase di-reset saat server dev di-restart (Ctrl+C -> npm run dev),
 * namun tetap persisten saat refresh (F5) atau navigasi selama server masih hidup.
 *
 * Logika ini hanya aktif jika process.env.NODE_ENV === 'development'.
 */

// Boot ID unik yang di-generate satu kali per siklus hidup proses server Node.js
export const DEV_SERVER_BOOT_ID =
  process.env.NODE_ENV === 'development'
    ? `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    : ''

export const DEV_BOOT_COOKIE_NAME = 'sim_dev_boot_id'
