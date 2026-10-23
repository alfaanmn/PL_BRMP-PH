'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/auth.types'

interface AdminHeaderProps {
  profile: Profile | null
  onOpenMobileSidebar: () => void
}

export function AdminHeader({
  profile,
  onOpenMobileSidebar,
}: AdminHeaderProps) {
  const router = useRouter()
  const [navSearchKeyword, setNavSearchKeyword] = useState('')

  const adminName = profile?.name || 'Administrator'

  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = navSearchKeyword.trim()
    if (trimmed) {
      router.push(`/admin/riwayat-pengajuan?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/admin/riwayat-pengajuan')
    }
  }

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #F5C400',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        gap: '1rem',
      }}
    >
      {/* Left: Mobile Toggle Button & Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
        {/* Mobile Toggle Button (< 1024px) */}
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Buka Menu"
          title="Buka Menu"
          style={{
            display: 'none',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: '#0f172a',
          }}
          className="admin-mobile-menu-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#1A6FC4',
                backgroundColor: '#eff6ff',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #bfdbfe',
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1A6FC4' }} />
              SIM BRMP PH
            </span>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              Selamat datang, <strong style={{ color: '#0f172a', fontWeight: 700 }}>{adminName}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{todayDate}</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <form
        onSubmit={handleNavSearch}
        style={{
          flex: '1 1 200px',
          maxWidth: '380px',
          position: 'relative',
        }}
        className="admin-header-search"
      >
        <div
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={navSearchKeyword}
          onChange={(e) => setNavSearchKeyword(e.target.value)}
          placeholder="Cari pengajuan, nama, instansi..."
          style={{
            width: '100%',
            padding: '6px 12px 6px 30px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#1A6FC4'
            e.currentTarget.style.backgroundColor = '#ffffff'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1'
            e.currentTarget.style.backgroundColor = '#f8fafc'
          }}
        />
      </form>

      {/* Right: Notification & Compact Account Widget */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Notification Bell Icon */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            color: '#475569',
            transition: 'all 0.15s ease',
          }}
          title="Notifikasi Sistem"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Red Indicator Dot */}
          <span
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              border: '2px solid #ffffff',
            }}
          />
        </div>

        {/* Compact Account Widget (Tanpa duplikasi avatar besar) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '5px 12px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
            {adminName}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#78350F',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '1px 6px',
              borderRadius: '4px',
              letterSpacing: '0.03em',
            }}
          >
            Admin
          </span>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .admin-mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .admin-header-search {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
