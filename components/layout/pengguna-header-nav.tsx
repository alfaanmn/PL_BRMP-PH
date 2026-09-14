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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
      {/* Profile Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.375rem 0.875rem 0.375rem 0.5rem',
        backgroundColor: '#ecfdf5',
        borderRadius: '9999px',
        border: '1px solid #a7f3d0'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#15803d',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.875rem',
          boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)'
        }}>
          {initial}
        </div>
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#065f46' }}>
            {userName || 'Pemohon'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
            Pemohon Magang
          </div>
        </div>
      </div>

      {/* Riwayat Pengajuan Nav */}
      <Link
        href="/pengguna/riwayat"
        style={{
          padding: '0.5rem 0.875rem',
          color: '#15803d',
          textDecoration: 'none',
          fontSize: '0.8125rem',
          fontWeight: 700,
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
          backgroundColor: '#ffffff',
          transition: 'all 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}
      >
        <span>📄</span>
        <span>Riwayat</span>
      </Link>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        style={{
          padding: '0.5rem 0.875rem',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          fontWeight: 700,
          cursor: loggingOut ? 'not-allowed' : 'pointer',
          opacity: loggingOut ? 0.7 : 1,
          transition: 'all 0.2s'
        }}
      >
        {loggingOut ? 'Keluar...' : 'Keluar'}
      </button>
    </div>
  )
}
