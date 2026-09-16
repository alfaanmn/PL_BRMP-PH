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

  // Desktop sidebar rail is 68px, main content margin stays static so page doesn't shift on hover
  const sidebarRailWidth = '68px'

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
      {/* 1. Admin Sidebar Navigation (Hover-Expand: 68px -> 250px) */}
      <AdminSidebar
        profile={profile}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* 2. Main Area (Header + Scrollable Content) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: sidebarRailWidth,
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
      `}</style>
    </div>
  )
}
