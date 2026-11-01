'use client'

import React, { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TAB_STORAGE_KEY = 'simpul_tab_active'
const BRIDGE_COOKIE_NAME = 'simpul_tab_bridge'
const BROADCAST_CHANNEL_NAME = 'simpul_tab_auth_channel'
const BROADCAST_TIMEOUT_MS = 600 // Jendela tunggu balasan peer tab (500-1000 ms)
const SIGNOUT_TIMEOUT_MS = 2000 // Batas waktu request ke server signout agar tidak menggantung

/**
 * Daftar rute publik yang TIDAK boleh memicu signOut tab
 */
const PUBLIC_AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/auth/callback',
  '/callback',
]

function isPublicPath(pathname: string): boolean {
  if (!pathname || pathname === '/') return true
  return PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : null
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

/**
 * Sapu bersih cookie auth di sisi browser secara sinkron
 */
function purgeClientAuthCookies() {
  if (typeof document === 'undefined') return
  document.cookie.split(';').forEach((c) => {
    const cookieName = c.split('=')[0].trim()
    if (
      cookieName.startsWith('sb-') ||
      cookieName.includes('auth-token') ||
      cookieName === BRIDGE_COOKIE_NAME
    ) {
      document.cookie = `${cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      if (typeof window !== 'undefined' && window.location.hostname) {
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      }
    }
  })
}

export function TabSessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isVerified, setIsVerified] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const isEvaluatingRef = useRef(false)

  useEffect(() => {
    // 1. Jika di halaman publik/auth, guard tidak memblokir atau melakukan signOut
    if (isPublicPath(pathname)) {
      setIsVerified(true)
      return
    }

    const supabase = createClient()

    // 2. Siapkan BroadcastChannel untuk sinkronisasi antar-tab aktif
    let channel: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
        channelRef.current = channel

        // Listener PING: HANYA dibalas tab yang punya flag simpul_tab_active,
        // sedang berada di halaman terproteksi (!isPublicPath), dan memiliki sesi auth valid
        channel.onmessage = async (event) => {
          if (event.data?.type === 'PING') {
            const hasActiveFlag = sessionStorage.getItem(TAB_STORAGE_KEY) === '1'
            if (hasActiveFlag && !isPublicPath(window.location.pathname)) {
              // Validasi sesi auth aktual sebelum membalas PONG
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                channel?.postMessage({ type: 'PONG', sourcePath: window.location.pathname })
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[TabSessionGuard] BroadcastChannel tidak tersedia:', e)
    }

    // 3. Evaluasi status tab saat ini
    const evaluateTabState = async () => {
      if (isEvaluatingRef.current) return
      isEvaluatingRef.current = true

      // 3A. Kasus: Tab ini sudah aktif secara sah (dari refresh halaman atau navigasi internal)
      if (sessionStorage.getItem(TAB_STORAGE_KEY) === '1') {
        setIsVerified(true)
        isEvaluatingRef.current = false
        return
      }

      // 3B. Kasus: Ada cookie jembatan auth singkat (khusus OAuth/Magic Link server callback)
      const hasBridgeCookie = getCookie(BRIDGE_COOKIE_NAME)
      if (hasBridgeCookie) {
        sessionStorage.setItem(TAB_STORAGE_KEY, '1')
        // Hapus SEKALI BACA secara instan agar tidak dapat dibaca tab lain
        clearCookie(BRIDGE_COOKIE_NAME)
        channel?.postMessage({ type: 'PONG', sourcePath: window.location.pathname })
        setIsVerified(true)
        isEvaluatingRef.current = false
        return
      }

      // 3C. Kasus: Tab baru dibuka manual. Cek apakah ada tab terproteksi lain yang masih hidup
      if (channel) {
        let isConfirmedByPeer = false

        const peerListener = (event: MessageEvent) => {
          if (event.data?.type === 'PONG') {
            isConfirmedByPeer = true
          }
        }

        channel.addEventListener('message', peerListener)
        channel.postMessage({ type: 'PING' })

        // Tunggu balasan peer selama BROADCAST_TIMEOUT_MS (600ms)
        await new Promise((resolve) => setTimeout(resolve, BROADCAST_TIMEOUT_MS))
        channel.removeEventListener('message', peerListener)

        if (isConfirmedByPeer) {
          // Tab lain yang sedang aktif dan terautentikasi mengonfirmasi sesi!
          sessionStorage.setItem(TAB_STORAGE_KEY, '1')
          setIsVerified(true)
          isEvaluatingRef.current = false
          return
        }
      }

      // 3D. Tidak ada tab aktif lain yang merespons (seluruh tab lama telah ditutup!)
      // Sesi tab mati: eksekusi logout server-side definitif dan bersihkan cookie
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), SIGNOUT_TIMEOUT_MS)

        // Panggil route handler server-side untuk menghapus cookie auth dari response HTTP header
        await fetch('/api/auth/signout', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.warn('[TabSessionGuard] Fetch signout server timeout/gagal:', err)
        })

        clearTimeout(timeoutId)

        // Juga panggil client signOut sebagai fallback
        await supabase.auth.signOut().catch(() => {})
      } catch (err) {
        console.warn('[TabSessionGuard] Error saat proses sign out tab mati:', err)
      } finally {
        // Bersihkan storage dan cookie di browser
        try {
          sessionStorage.clear()
        } catch {}
        purgeClientAuthCookies()

        // Ambil path internal untuk redirect kembali setelah login
        const rawPath = window.location.pathname + window.location.search
        const safeNext =
          rawPath.startsWith('/') && !rawPath.startsWith('//') && !rawPath.includes('javascript:')
            ? rawPath
            : '/pengguna/dashboard'

        // Gunakan window.location.replace agar browser melakukan Full Page Reload tanpa cookie auth
        window.location.replace(`/login?next=${encodeURIComponent(safeNext)}`)
      }
    }

    evaluateTabState()

    return () => {
      if (channel) {
        channel.close()
      }
    }
  }, [pathname])

  // Cegah flash dashboard/konten terproteksi sebelum verifikasi tab tuntas
  if (!isVerified && !isPublicPath(pathname)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#64748b',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid #cbd5e1',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Memverifikasi sesi aman...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return <>{children}</>
}
