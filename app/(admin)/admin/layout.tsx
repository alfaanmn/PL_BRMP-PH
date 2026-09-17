'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import type { Profile } from '@/types/auth.types'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpenMobile, setIsOpenMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function verifyAdminAuth() {
      try {
        const userProfile = await authService.getCurrentProfile()

        if (!isMounted) return

        // 1. Belum login -> Redirect ke /login
        if (!userProfile) {
          router.replace('/login')
          return
        }

        // 2. Role bukan administrator -> Redirect ke /pengguna/dashboard
        if (userProfile.role !== 'administrator') {
          router.replace('/pengguna/dashboard')
          return
        }

        // 3. Akun dinonaktifkan -> Logout & redirect
        if (!userProfile.is_active) {
          await authService.logout()
          router.replace('/login?error=inactive')
          return
        }

        setProfile(userProfile)
      } catch (err) {
        console.error('Admin Auth Guard error:', err)
        if (isMounted) router.replace('/login')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    verifyAdminAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          color: '#334155',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '4px solid #bbf7d0',
            borderTopColor: '#15803d',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
          Memverifikasi Hak Akses Administrator...
        </div>
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  // Jika tidak memiliki akses administrator
  if (!profile || profile.role !== 'administrator') {
    return null
  }

  // Single source of truth for desktop sidebar width: 240px (expanded) <-> 70px (collapsed)
  const desktopSidebarWidth = isCollapsed ? '70px' : '240px'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
      }}
    >
      {/* 1. Admin Sidebar Navigation */}
      <AdminSidebar
        profile={profile}
        isOpenMobile={isOpenMobile}
        isCollapsedDesktop={isCollapsed}
        onCloseMobile={() => setIsOpenMobile(false)}
        onToggleCollapseDesktop={() => setIsCollapsed((prev) => !prev)}
      />

      {/* 2. Main Area (Header + Scrollable Content) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: desktopSidebarWidth,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="admin-main-wrapper"
      >
        {/* Admin Header Bar */}
        <AdminHeader
          profile={profile}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
        />

        {/* Page Content Body */}
        <main
          className="admin-main-content"
          style={{
            flex: 1,
            padding: '1.5rem',
            maxWidth: '1440px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .admin-main-wrapper {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .admin-main-content {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  )
}
