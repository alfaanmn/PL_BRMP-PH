import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '')
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  )

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        return document.cookie
          .split(';')
          .map((c) => c.trim())
          .filter(Boolean)
          .map((c) => {
            const eqIndex = c.indexOf('=')
            if (eqIndex === -1) return { name: c, value: '' }
            const rawVal = c.slice(eqIndex + 1)
            let val = rawVal
            try {
              val = decodeURIComponent(rawVal)
            } catch {
              val = rawVal
            }
            return {
              name: c.slice(0, eqIndex),
              value: val,
            }
          })
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookiePath = options?.path || '/'
          if (!value || options?.maxAge === 0) {
            // Penghapusan cookie (misal signOut) - pertahankan path dan domain asli
            let deleteStr = `${name}=; path=${cookiePath}; max-age=0`
            if (options?.domain) {
              deleteStr += `; Domain=${options.domain}`
            }
            document.cookie = deleteStr
          } else {
            // Session cookie murni: TANPA maxAge dan TANPA expires
            let cookieStr = `${name}=${encodeURIComponent(value)}; path=${cookiePath}`
            if (options?.domain) {
              cookieStr += `; Domain=${options.domain}`
            }
            if (options?.sameSite) {
              cookieStr += `; SameSite=${options.sameSite}`
            }
            if (options?.secure) {
              cookieStr += '; Secure'
            }
            document.cookie = cookieStr
          }
        })
      },
    },
  })
}