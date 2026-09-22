'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import { AppLogo } from '@/components/shared/app-logo'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const role = (profile?.role as AppRole) || null
  const isLoggedIn = !!user || !!profile
  const userName = profile?.name || user?.email?.split('@')[0] || ''
  const userInitial = (userName || user?.email || 'U').charAt(0).toUpperCase()

  // Lock body scroll when mobile drawer is open, restore on close or unmount
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [mobileMenuOpen])

  // Close drawer on pathname change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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
    setMobileMenuOpen(false)
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
      <style>{`
        .desktop-nav-menu {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .mobile-header-right {
          display: none;
        }
        .announcement-text-mobile {
          display: inline;
        }

        @media (max-width: 1023px) {
          .desktop-nav-menu {
            display: none !important;
          }
          .mobile-header-right {
            display: flex !important;
            align-items: center;
            gap: 0.375rem;
          }
          .announcement-text-mobile {
            font-size: 0.75rem !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>

      {/* 1. Bar Pengumuman Resmi Kementan */}
      <div style={{
        backgroundColor: '#064e3b',
        color: '#ecfdf5',
        fontSize: '0.8125rem',
        padding: '0.45rem 1rem',
        borderBottom: '1px solid #047857'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto' }}>
            <span style={{
              backgroundColor: '#15803d',
              color: '#ffffff',
              padding: '0.125rem 0.375rem',
              borderRadius: '4px',
              fontSize: '0.625rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flexShrink: 0
            }}>
              Pemberitahuan
            </span>
            <span className="announcement-text-mobile">
              Penerimaan periode magang aktif: <strong>Mahasiswa &amp; Siswa SMK</strong>.
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: '#86efac',
            fontWeight: 600,
            fontSize: '0.75rem',
            flexShrink: 0
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            <span>Portal Aktif 2025/2026</span>
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
          padding: '0.625rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* Logo & Institusi */}
          <Link
            href={berandaUrl}
            onClick={(e) => handleNavClick(e, 'beranda')}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              boxShadow: '0 2px 4px rgba(21, 128, 61, 0.12)',
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              <AppLogo size={34} alt="Logo SIM-Magang" priority />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <span style={{
                fontSize: '0.5625rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                KEMENTERIAN PERTANIAN RI
              </span>
              <span style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#15803d',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                SIM-Magang BRMP
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links & Actions (Hidden on Mobile) */}
          <nav className="desktop-nav-menu">
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

            {/* Desktop User Auth / Action Section */}
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {role === 'administrator' ? (
                  <Link
                    href="/admin/dashboard"
                    style={{
                      padding: '0.45rem 0.75rem',
                      color: '#15803d',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      backgroundColor: '#ffffff',
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
                      padding: '0.45rem 0.75rem',
                      color: '#15803d',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      backgroundColor: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}
                  >
                    <span>📄</span>
                    <span>Riwayat</span>
                  </Link>
                )}

                <Link
                  href={isPengguna ? '/pengguna/profil' : berandaUrl}
                  title="Buka Profil & Pengaturan Akun"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.3rem 0.75rem 0.3rem 0.4rem',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '9999px',
                    border: '1px solid #a7f3d0',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}>
                    {userInitial}
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46' }}>
                      {userName || 'Pemohon'}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#059669', fontWeight: 600 }}>
                      {role === 'administrator' ? 'Administrator' : 'Pemohon'}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    padding: '0.45rem 0.75rem',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: loggingOut ? 'not-allowed' : 'pointer',
                    opacity: loggingOut ? 0.7 : 1
                  }}
                >
                  {loggingOut ? '...' : 'Keluar'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link
                  href="/login"
                  style={{
                    padding: '0.45rem 0.875rem',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff'
                  }}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  style={{
                    padding: '0.45rem 0.875rem',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 700
                  }}
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Right Section (Visible on Mobile <1024px: Auth buttons + Hamburger) */}
          <div className="mobile-header-right">
            {isLoggedIn ? (
              <Link
                href={isPengguna ? '/pengguna/profil' : '/admin/dashboard'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#15803d'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.6875rem'
                }}>
                  {userInitial}
                </div>
                <span style={{ maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName || 'User'}
                </span>
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Link
                  href="/login"
                  style={{
                    padding: '0.35rem 0.625rem',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  style={{
                    padding: '0.35rem 0.625rem',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '7px',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 3px rgba(21, 128, 61, 0.2)'
                  }}
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Hamburger Button for Mobile Drawer */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka Menu Navigasi"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Mobile Navigation Drawer (Modal / Overlay) */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          />

          {/* Drawer Panel */}
          <div style={{
            position: 'relative',
            width: '85%',
            maxWidth: '320px',
            height: '100dvh',
            backgroundColor: '#ffffff',
            boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 10,
            overflowY: 'auto',
            boxSizing: 'border-box',
            padding: '1.25rem 1rem'
          }}>
            {/* Top: Logo & Close Button */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <AppLogo size={32} alt="Logo BRMP" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#15803d', lineHeight: 1.2 }}>
                      SIM-Magang
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 600 }}>
                      BRMP Kementan RI
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup Menu"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* User Profile Card if logged in */}
              {isLoggedIn && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    flexShrink: 0
                  }}>
                    {userInitial}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#14532d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userName || 'Pemohon'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#15803d', fontWeight: 600 }}>
                      {role === 'administrator' ? 'Administrator' : 'Pemohon Magang'}
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  href={berandaUrl}
                  onClick={(e) => handleNavClick(e, 'beranda')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minHeight: '44px',
                    padding: '0 0.875rem',
                    borderRadius: '8px',
                    backgroundColor: isBerandaActive ? '#f0fdf4' : 'transparent',
                    color: isBerandaActive ? '#15803d' : '#334155',
                    fontWeight: isBerandaActive ? 700 : 500,
                    textDecoration: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>🏠</span>
                  <span>Beranda</span>
                </Link>

                <a
                  href={alurUrl}
                  onClick={(e) => handleNavClick(e, 'alur')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minHeight: '44px',
                    padding: '0 0.875rem',
                    borderRadius: '8px',
                    backgroundColor: isAlurActive ? '#f0fdf4' : 'transparent',
                    color: isAlurActive ? '#15803d' : '#334155',
                    fontWeight: isAlurActive ? 700 : 500,
                    textDecoration: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>📌</span>
                  <span>Alur Magang</span>
                </a>

                <a
                  href={bidangUrl}
                  onClick={(e) => handleNavClick(e, 'bidang')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minHeight: '44px',
                    padding: '0 0.875rem',
                    borderRadius: '8px',
                    backgroundColor: isBidangActive ? '#f0fdf4' : 'transparent',
                    color: isBidangActive ? '#15803d' : '#334155',
                    fontWeight: isBidangActive ? 700 : 500,
                    textDecoration: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>🌱</span>
                  <span>Bidang Magang</span>
                </a>

                <Link
                  href={kontakUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minHeight: '44px',
                    padding: '0 0.875rem',
                    borderRadius: '8px',
                    backgroundColor: isKontakActive ? '#f0fdf4' : 'transparent',
                    color: isKontakActive ? '#15803d' : '#334155',
                    fontWeight: isKontakActive ? 700 : 500,
                    textDecoration: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>📞</span>
                  <span>Kontak</span>
                </Link>

                {isLoggedIn && !isPengguna && role === 'administrator' && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      minHeight: '44px',
                      padding: '0 0.875rem',
                      borderRadius: '8px',
                      backgroundColor: pathname?.startsWith('/admin') ? '#f0fdf4' : 'transparent',
                      color: pathname?.startsWith('/admin') ? '#15803d' : '#334155',
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span>📊</span>
                    <span>Panel Administrator</span>
                  </Link>
                )}

                {isLoggedIn && isPengguna && (
                  <>
                    <Link
                      href="/pengguna/riwayat"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minHeight: '44px',
                        padding: '0 0.875rem',
                        borderRadius: '8px',
                        backgroundColor: pathname === '/pengguna/riwayat' ? '#f0fdf4' : 'transparent',
                        color: pathname === '/pengguna/riwayat' ? '#15803d' : '#334155',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>📄</span>
                      <span>Riwayat Pengajuan</span>
                    </Link>

                    <Link
                      href="/pengguna/profil"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minHeight: '44px',
                        padding: '0 0.875rem',
                        borderRadius: '8px',
                        backgroundColor: pathname === '/pengguna/profil' ? '#f0fdf4' : 'transparent',
                        color: pathname === '/pengguna/profil' ? '#15803d' : '#334155',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>👤</span>
                      <span>Profil Saya</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions: Login / Register OR Logout */}
            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.625rem',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: loggingOut ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{loggingOut ? 'Memproses Keluar...' : 'Keluar dari Akun'}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '44px',
                      padding: '0.625rem',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    Masuk ke Akun
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '44px',
                      padding: '0.625rem',
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    Daftar Akun Baru
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
