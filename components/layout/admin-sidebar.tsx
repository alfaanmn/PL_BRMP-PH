'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
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
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const isExpanded = isOpenMobile || isHovered

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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          ),
        },
        {
          label: 'Kelola Bidang',
          href: '/admin/bidang',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          ),
        },
        {
          label: 'Kelola Pembimbing',
          href: '/admin/pembimbing',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          ),
        },
        {
          label: 'Konfigurasi SKM',
          href: '/admin/skm-pertanyaan',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Main Sidebar Element (Hover Expand: 68px -> 250px on desktop) */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: isExpanded ? '250px' : '68px',
          backgroundColor: '#02482e',
          color: '#ffffff',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease, transform 0.2s ease',
          transform: isOpenMobile ? 'translateX(0)' : undefined,
          boxShadow: isExpanded ? '4px 0 20px rgba(0, 0, 0, 0.25)' : '2px 0 8px rgba(0, 0, 0, 0.12)',
          overflowX: 'hidden',
        }}
        className={`admin-sidebar ${isOpenMobile ? 'mobile-open' : 'mobile-closed'}`}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: isExpanded ? '1.25rem 1.25rem 1rem 1.25rem' : '1.25rem 0.875rem 1rem 0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            transition: 'padding 0.2s ease',
          }}
        >
          <Link
            href="/admin/dashboard"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#ffffff',
              minWidth: 0,
            }}
          >
            {/* Logo Emblem Gold */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                border: '2px solid #fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
              }}
            >
              🌾
            </div>

            {isExpanded && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 }}>
                  SIM BRMP PH
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Menu Navigation */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 0.625rem 1rem 0.625rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {section.sectionTitle && isExpanded && (
                <div
                  style={{
                    padding: '0 0.625rem 0.375rem 0.625rem',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#6ee7b7',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {section.sectionTitle}
                </div>
              )}

              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={!isExpanded ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isExpanded ? '0.625rem 0.75rem' : '0.625rem 0',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ffffff' : '#d1fae5',
                      backgroundColor: active ? '#16a34a' : 'transparent',
                      transition: 'background-color 0.15s ease, padding 0.2s ease',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ color: active ? '#ffffff' : '#a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0 }}>
                      {item.icon}
                    </span>

                    {isExpanded && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Logout */}
        <div
          style={{
            padding: '0.75rem 0.625rem 1.5rem 0.625rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={!isExpanded ? 'Keluar' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '0.5rem 0.75rem' : '0.5rem 0',
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {isExpanded && (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {loggingOut ? 'Keluar...' : 'Keluar'}
              </span>
            )}
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
        }
      `}</style>
    </>
  )
}

