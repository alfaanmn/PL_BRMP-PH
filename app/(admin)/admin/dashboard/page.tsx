'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import type { Profile } from '@/types/auth.types'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const userProfile = await authService.getCurrentProfile()
        if (!userProfile) {
          router.push('/login')
          return
        }

        if (userProfile.role !== 'administrator') {
          router.push('/pengguna/dashboard')
          return
        }

        setProfile(userProfile)
      } catch (err) {
        console.error('Error fetching admin profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    setLoggingOut(true)
    await authService.logout()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#64748b'
      }}>
        Memuat Dashboard Administrator...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid #334155',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-block', backgroundColor: '#dc2626', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Administrator Area
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Dashboard Administrator
            </h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: loggingOut ? 'not-allowed' : 'pointer'
            }}
          >
            {loggingOut ? 'Keluar...' : 'Logout'}
          </button>
        </div>

        <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '1.5rem', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#94a3b8' }}>
            Informasi Akun
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Nama Lengkap</span>
              <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{profile?.name || '-'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Email</span>
              <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{profile?.email || '-'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Role</span>
              <strong style={{ fontSize: '1rem', color: '#f87171' }}>{profile?.role || '-'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Status Akun</span>
              <span style={{
                display: 'inline-block',
                marginTop: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: profile?.is_active ? '#065f46' : '#991b1b',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {profile?.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
          ✅ <strong>Role Protection Berfungsi:</strong> Halaman ini hanya dapat diakses oleh akun dengan role <code>administrator</code>.
        </p>
      </div>
    </div>
  )
}
