'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import { AppLogo } from '@/components/shared/app-logo'
import type { Profile } from '@/types/auth.types'

interface AdminSidebarProps {
  profile?: Profile | null
  isOpenMobile?: boolean
  isCollapsedDesktop?: boolean
  onCloseMobile?: () => void
  onToggleCollapseDesktop?: () => void
}

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface MenuSection {
  sectionTitle?: string
  items: MenuItem[]
}

export function AdminSidebar({
  profile,
  isOpenMobile = false,
  isCollapsedDesktop = false,
  onCloseMobile,
  onToggleCollapseDesktop,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Akun Administrator?')) {
      setLoggingOut(true)
      await authService.logout()
      window.location.href = '/login'
    }
  }

  // Menu dikelompokkan sesuai gaya resmi Kementan / SIM BRMP PH pada referensi
  const menuSections: MenuSection[] = [
    {
      items: [
        {
          label: 'Dashboard',
          href: '/admin/dashboard',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
      ],
    },
    {
      sectionTitle: 'LAYANAN & PKL',
      items: [
        {
          label: 'Pengajuan & Verifikasi',
          href: '/admin/riwayat-pengajuan',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          ),
        },
        {
          label: 'Kelola Bidang',
          href: '/admin/bidang',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          ),
        },
        {
          label: 'Kelola Pembimbing',
          href: '/admin/pembimbing',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
      ],
    },
    {
      sectionTitle: 'SISTEM & LAPORAN',
      items: [
        {
          label: 'Kelola Pengguna',
          href: '/admin/user',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          ),
        },
        {
          label: 'Konfigurasi SKM',
          href: '/admin/skm-pertanyaan',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        },
        {
          label: 'Rekap SKM',
          href: '/admin/rekap-skm',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
        },
        {
          label: 'Laporan',
          href: '/admin/laporan',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
      ],
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const isCollapsed = isCollapsedDesktop

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Main Sidebar Element (Desktop: 240px <-> 70px) */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: isCollapsed ? '70px' : '240px',
          backgroundColor: '#02482e',
          color: '#ffffff',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.15)',
          overflow: 'visible',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`admin-sidebar ${isOpenMobile ? 'mobile-open' : 'mobile-closed'} ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}
      >
        {/* Floating Circular Toggle Button on the Right Edge (Centered Vertically) */}
        {onToggleCollapseDesktop && (
          <button
            type="button"
            onClick={onToggleCollapseDesktop}
            aria-label={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
            title={isCollapsed ? 'Buka Sidebar (Expand)' : 'Tutup Sidebar (Collapse)'}
            style={{
              position: 'absolute',
              top: '50%',
              right: '-13px',
              transform: 'translateY(-50%)',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              color: '#02482e',
              border: '1px solid #cbd5e1',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 60,
              transition: 'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
            }}
            className="sidebar-floating-toggle-btn"
          >
            {isCollapsed ? (
              /* Chevron Right (Buka / Expand) */
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02482e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              /* Chevron Left (Tutup / Collapse) */
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02482e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        )}

        {/* Brand Header */}
        <div
          style={{
            padding: isCollapsed ? '1rem 0.5rem 0.875rem 0.5rem' : '1.125rem 1.25rem 1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'padding 0.25s ease',
            minHeight: '64px',
            boxSizing: 'border-box',
          }}
        >
          {/* Logo Emblem & Brand Text */}
          <Link
            href="/admin/dashboard"
            title="SIM BRMP PH Admin Portal"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              color: '#ffffff',
              minWidth: 0,
            }}
          >
            {/* Logo Emblem SIM-Magang (smile.png) */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <AppLogo size={32} alt="Logo Admin SIM-Magang" />
            </div>

            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : 'auto',
                transition: 'opacity 0.2s ease, width 0.25s ease',
              }}
              className="admin-brand-text"
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 }}>
                SIM BRMP PH
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#6ee7b7', fontWeight: 500, letterSpacing: '0.02em', marginTop: '2px' }}>
                Admin Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Menu Navigation */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isCollapsed ? '1rem 0.4rem' : '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: isCollapsed ? '0.75rem' : '1.25rem',
            transition: 'padding 0.25s ease',
          }}
        >
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {section.sectionTitle && (
                <div
                  style={{
                    padding: isCollapsed ? '0.25rem 0' : '0 0.625rem 0.375rem 0.625rem',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#6ee7b7',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    opacity: isCollapsed ? 0 : 1,
                    height: isCollapsed ? '0px' : 'auto',
                    borderTop: isCollapsed ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                    transition: 'opacity 0.2s ease, height 0.25s ease',
                  }}
                  className="admin-section-title"
                >
                  {!isCollapsed && section.sectionTitle}
                </div>
              )}

              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.75rem',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ffffff' : '#d1fae5',
                      backgroundColor: active ? '#16a34a' : 'transparent',
                      transition: 'background-color 0.15s ease, padding 0.25s ease',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ color: active ? '#ffffff' : '#a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', flexShrink: 0 }}>
                      {item.icon}
                    </span>

                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : 'auto',
                        transition: 'opacity 0.2s ease, width 0.25s ease',
                      }}
                      className="admin-nav-label"
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Logout */}
        <div
          style={{
            padding: isCollapsed ? '0.75rem 0.4rem 1.5rem 0.4rem' : '0.75rem 0.75rem 1.5rem 0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'padding 0.25s ease',
          }}
        >
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={isCollapsed ? 'Keluar' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '0.55rem 0' : '0.55rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              minWidth: 0,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : 'auto',
                transition: 'opacity 0.2s ease, width 0.25s ease',
              }}
              className="admin-logout-label"
            >
              {loggingOut ? 'Keluar...' : 'Keluar'}
            </span>
          </button>
        </div>
      </aside>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .admin-sidebar {
            width: 260px !important;
          }
          .admin-sidebar.mobile-closed {
            transform: translateX(-100%) !important;
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .sidebar-floating-toggle-btn {
            display: none !important;
          }
          .admin-brand-text,
          .admin-section-title,
          .admin-nav-label,
          .admin-logout-label {
            opacity: 1 !important;
            width: auto !important;
            height: auto !important;
          }
        }
      `}</style>
    </>
  )
}

