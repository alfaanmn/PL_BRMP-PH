'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
import type { AppRole } from '@/types/auth.types'

interface GuestAuthNavProps {
  isLoggedIn: boolean
  role: AppRole | null
}

export function GuestAuthNav({ isLoggedIn, role }: GuestAuthNavProps) {
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const response = await authService.logout()
      if (response.success) {
        window.location.href = '/'
      } else {
        console.error('Logout failed:', response.error)
        setLoggingOut(false)
      }
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  if (isLoggedIn) {
    const dashboardUrl = role === 'administrator' ? '/admin/dashboard' : '/pengguna/dashboard'

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          href={dashboardUrl}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
            display: 'inline-block'
          }}
        >
          Buka Dashboard
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            padding: '0.625rem 1.125rem',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            opacity: loggingOut ? 0.7 : 1,
            transition: 'background-color 0.2s'
          }}
        >
          {loggingOut ? 'Keluar...' : 'Logout'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <Link
        href="/login"
        style={{
          padding: '0.625rem 1.125rem',
          color: '#334155',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          backgroundColor: '#ffffff'
        }}
      >
        Masuk
      </Link>
      <Link
        href="/register"
        style={{
          padding: '0.625rem 1.25rem',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
        }}
      >
        Daftar
      </Link>
    </div>
  )
}
