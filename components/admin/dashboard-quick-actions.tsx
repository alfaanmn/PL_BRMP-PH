import React from 'react'
import Link from 'next/link'

interface QuickActionsProps {
  pendingCount?: number
}

export function DashboardQuickActions({ pendingCount = 0 }: QuickActionsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
      }}
    >
      {/* 1. Verifikasi Berkas Pengajuan */}
      <Link
        href="/admin/riwayat-pengajuan"
        style={{
          textDecoration: 'none',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #fde68a',
          padding: '1.125rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              Verifikasi Berkas Masuk
            </span>
            {pendingCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                }}
              >
                {pendingCount}
              </span>
            )}
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '11px', color: '#6b7280' }}>
            Periksa berkas pemohon & plotting pembimbing
          </p>
        </div>
        <div style={{ color: '#9ca3af' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>

      {/* 2. Kelola Bidang & Kuota */}
      <Link
        href="/admin/bidang"
        style={{
          textDecoration: 'none',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.125rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
            Kelola Bidang & Kuota
          </span>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '11px', color: '#6b7280' }}>
            Atur daya tampung & ketersediaan kuota magang
          </p>
        </div>
        <div style={{ color: '#9ca3af' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>

      {/* 3. Layanan & Rekap SKM */}
      <Link
        href="/admin/rekap-skm"
        style={{
          textDecoration: 'none',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.125rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
            Layanan & Rekap SKM
          </span>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '11px', color: '#6b7280' }}>
            Lihat rekapitulasi penilaian survei kepuasan & cetak laporan
          </p>
        </div>
        <div style={{ color: '#9ca3af' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>
    </div>
  )
}
