'use client'

import React from 'react'
import type { Profile } from '@/types/auth.types'

interface AdminHeaderProps {
  profile: Profile | null
  onOpenMobileSidebar: () => void
}

export function AdminHeader({
  profile,
  onOpenMobileSidebar,
}: AdminHeaderProps) {
  const adminName = profile?.name || 'Administrator'

  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#02482e',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Left: Mobile Toggle Button & Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Mobile Toggle Button (< 1024px) */}
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Buka Menu"
          title="Buka Menu"
          style={{
            display: 'none',
            background: '#013723',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: '#ffffff',
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
                color: '#34d399',
                backgroundColor: '#013723',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399' }} />
              SIM BRMP PH
            </span>
            <span style={{ fontSize: '13px', color: '#d1fae5' }}>
              Selamat datang, <strong style={{ color: '#ffffff', fontWeight: 700 }}>{adminName}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '11px', color: '#a7f3d0', marginTop: '2px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{todayDate}</span>
          </div>
        </div>
      </div>

      {/* Right: Notification & Compact Account Widget */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Notification Bell Icon */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#013723',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            color: '#d1fae5',
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
              border: '2px solid #013723',
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
            backgroundColor: '#013723',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
            {adminName}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
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
      `}</style>
    </header>
  )
}
