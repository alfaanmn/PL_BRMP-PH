'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'

interface PenggunaHeaderNavProps {
  userName: string
  userEmail: string
}

export function PenggunaHeaderNav({ userName, userEmail }: PenggunaHeaderNavProps) {
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const response = await authService.logout()
      if (response.success) {
        window.location.href = '/'
      } else {
        console.error('Logout error:', response.error)
        setLoggingOut(false)
      }
    } catch (err) {
      console.error('Logout error:', err)
      setLoggingOut(false)
    }
  }

  const initial = (userName || userEmail || 'U').charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      {/* Profile Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.375rem 0.875rem 0.375rem 0.5rem',
        backgroundColor: '#f1f5f9',
        borderRadius: '9999px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.875rem'
        }}>
          {initial}
        </div>
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
            {userName || 'Pemohon'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Pemohon Magang
          </div>
        </div>
      </div>

      {/* Riwayat Pengajuan Nav */}
      <Link
        href="/pengguna/riwayat"
        style={{
          padding: '0.5rem 0.875rem',
          color: '#334155',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff'
        }}
      >
        Riwayat Pengajuan
      </Link>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        style={{
          padding: '0.5rem 1rem',
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
