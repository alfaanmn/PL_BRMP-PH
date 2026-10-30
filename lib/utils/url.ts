/**
 * Single Source of Truth untuk Base URL Aplikasi SIMPUL.
 *
 * Digunakan untuk:
 * - Redirect URL pada Supabase Auth (signUp, resend, resetPasswordForEmail)
 * - Callback redirect URL pada Route Handler (/auth/callback)
 * - Tautan / Link / Gambar pada Template Email Notifikasi
 *
 * Prioritas Resolusi:
 * 1. process.env.NEXT_PUBLIC_SITE_URL (Rekomendasi Utama)
 * 2. process.env.NEXT_PUBLIC_APP_URL (Fallback backward compatibility)
 * 3. process.env.VERCEL_PROJECT_PRODUCTION_URL / process.env.VERCEL_URL (Hosting Vercel)
 * 4. Fallback development: http://localhost:3000 (HANYA jika process.env.NODE_ENV === 'development')
 *
 * Di production, jika env tidak di-set sama sekali:
 * sistem fallback darurat ke https://simpul-brmpph.id dan mencatat warning jelas di server.
 */
export function getSiteUrl(path: string = ''): string {
  let siteUrl = ''

  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== '') {
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL.trim()
  } else if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    siteUrl = process.env.NEXT_PUBLIC_APP_URL.trim()
  } else if (
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL.trim() !== ''
  ) {
    siteUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
  } else if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== '') {
    siteUrl = `https://${process.env.VERCEL_URL.trim()}`
  } else if (process.env.NODE_ENV === 'development') {
    siteUrl = 'http://localhost:3000'
  } else {
    // Lingkungan production tanpa env terdefinisi
    console.warn(
      '[getSiteUrl] WARNING: NEXT_PUBLIC_SITE_URL tidak dikonfigurasi di lingkungan produksi! ' +
        'Menggunakan fallback resmi: https://simpul-brmpph.id. ' +
        'Harap atur NEXT_PUBLIC_SITE_URL=https://simpul-brmpph.id pada dashboard hosting Anda.'
    )
    siteUrl = 'https://simpul-brmpph.id'
  }

  // Pastikan protokol https:// atau http:// tersedia
  if (!/^https?:\/\//i.test(siteUrl)) {
    siteUrl = `https://${siteUrl}`
  }

  // Bersihkan trailing slash
  siteUrl = siteUrl.replace(/\/+$/, '')

  // Jika tidak ada path tambahan, kembalikan base URL
  if (!path || path.trim() === '') {
    return siteUrl
  }

  const cleanPath = path.trim().startsWith('/') ? path.trim() : `/${path.trim()}`
  return `${siteUrl}${cleanPath}`
}
