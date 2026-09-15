'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import type { AppRole } from '@/types/auth.types'

export interface NavbarProps {
  user?: {
    id?: string
    email?: string | null
  } | null
  profile?: {
    name?: string | null
    role?: AppRole | string | null
  } | null
  activeKey?: 'beranda' | 'alur' | 'bidang' | 'kontak'
}

export function Navbar({ user, profile, activeKey }: NavbarProps) {
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  const role = (profile?.role as AppRole) || null
  const isLoggedIn = !!user || !!profile
  const userName = profile?.name || user?.email?.split('@')[0] || ''
  const userInitial = (userName || user?.email || 'U').charAt(0).toUpperCase()

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

  // URL routes based on role
  const isPengguna = role === 'pengguna' || (isLoggedIn && role !== 'administrator')
  const berandaUrl = isPengguna ? '/pengguna/dashboard' : role === 'administrator' ? '/admin/dashboard' : '/'
  const alurUrl = isPengguna ? '/pengguna/dashboard#alur' : '/#alur'
  const bidangUrl = isPengguna ? '/pengguna/dashboard#bidang' : role === 'administrator' ? '/admin/bidang' : '/#bidang'
  const kontakUrl = '/kontak'

  // Determine active item
  const isBerandaActive = activeKey === 'beranda' || (
    !activeKey && (pathname === '/' || pathname === '/pengguna/dashboard' || pathname === '/admin/dashboard')
  )
  const isAlurActive = activeKey === 'alur'
  const isBidangActive = activeKey === 'bidang' || (!activeKey && pathname?.startsWith('/bidang'))
  const isKontakActive = activeKey === 'kontak' || (!activeKey && pathname === '/kontak')

  const linkActiveStyle = {
    color: '#15803d',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 700 as const,
    borderBottom: '2px solid #15803d',
    paddingBottom: '0.25rem'
  }

  const linkInactiveStyle = {
    color: '#475569',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500 as const,
    transition: 'color 0.2s',
    paddingBottom: '0.25rem'
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, target: 'beranda' | 'alur' | 'bidang') => {
    const isTargetOnCurrentPage =
      (pathname === '/' || pathname === '/pengguna/dashboard')

    if (isTargetOnCurrentPage) {
      if (target === 'beranda') {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        window.history.pushState(null, '', berandaUrl)
      } else {
        const el = document.getElementById(target)
        if (el) {
          e.preventDefault()
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.history.pushState(null, '', `#${target}`)
        }
      }
    }
  }

  return (
    <>
      {/* 1. Bar Pengumuman Resmi Kementan */}
      <div style={{
        backgroundColor: '#064e3b',
        color: '#ecfdf5',
        fontSize: '0.8125rem',
        padding: '0.5rem 1rem',
        borderBottom: '1px solid #047857'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              backgroundColor: '#15803d',
              color: '#ffffff',
              padding: '0.125rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Pemberitahuan
            </span>
            <span>Penerimaan periode magang aktif untuk <strong>Mahasiswa D3/S1</strong> dan <strong>Siswa SMK Vokasi Pertanian</strong>.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#86efac', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            <span>Portal Pemohon Aktif (Tahun 2025/2026)</span>
          </div>
        </div>
      </div>

      {/* 2. Header / Navbar Resmi BRMP Kementan */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Logo & Institusi */}
          <Link
            href={berandaUrl}
            onClick={(e) => handleNavClick(e, 'beranda')}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#15803d',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.125rem',
              boxShadow: '0 2px 6px rgba(21, 128, 61, 0.3)'
            }}>
              🌿
            </div>
            <div>
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                lineHeight: 1.2
              }}>
                KEMENTERIAN PERTANIAN REPUBLIK INDONESIA
              </span>
              <span style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: '#15803d',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                SIM-Magang BRMP
              </span>
            </div>
          </Link>

          {/* Nav Links & Actions */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link
              href={berandaUrl}
              onClick={(e) => handleNavClick(e, 'beranda')}
              style={isBerandaActive ? linkActiveStyle : linkInactiveStyle}
            >
              Beranda
            </Link>
            <a
              href={alurUrl}
              onClick={(e) => handleNavClick(e, 'alur')}
              style={isAlurActive ? linkActiveStyle : linkInactiveStyle}
            >
              Alur Magang
            </a>
            <a
              href={bidangUrl}
              onClick={(e) => handleNavClick(e, 'bidang')}
              style={isBidangActive ? linkActiveStyle : linkInactiveStyle}
            >
              Bidang Magang
            </a>
            <Link
              href={kontakUrl}
              style={isKontakActive ? linkActiveStyle : linkInactiveStyle}
            >
              Kontak
            </Link>

            {/* User Auth / Action Section */}
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                {/* Tombol Khusus Role */}
                {role === 'administrator' ? (
                  <Link
                    href="/admin/dashboard"
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
                    <span>📊</span>
                    <span>Admin</span>
                  </Link>
                ) : (
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
                )}

                {/* Profile Pill (Interactive User Badge) */}
                <Link
                  href={isPengguna ? '/pengguna/profil' : berandaUrl}
                  title="Buka Profil & Pengaturan Akun"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.375rem 0.875rem 0.375rem 0.5rem',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '9999px',
                    border: '1px solid #a7f3d0',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
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
                    {userInitial}
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#065f46' }}>
                      {userName || 'Pemohon'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
                      {role === 'administrator' ? 'Administrator' : 'Pemohon Magang'}
                    </div>
                  </div>
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
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Link
                  href="/login"
                  style={{
                    padding: '0.5rem 1rem',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}
