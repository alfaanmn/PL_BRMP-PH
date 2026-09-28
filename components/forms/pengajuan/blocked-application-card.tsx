'use client'

import React from 'react'
import Link from 'next/link'

interface BlockedApplicationCardProps {
  status: string
  bidangNama?: string
  publicId?: string
  id?: number | string
  createdDate?: string
  reason?: string
}

export function BlockedApplicationCard({
  status,
  bidangNama,
  publicId,
  id,
  createdDate,
  reason,
}: BlockedApplicationCardProps) {
  const isMenunggu = status === 'Menunggu Verifikasi'

  const theme = isMenunggu
    ? {
        border: '#fde68a',
        bg: '#fffdf5',
        badgeBg: '#fef3c7',
        badgeColor: '#92400e',
        badgeBorder: '#fde68a',
        icon: '⏳',
        title: 'Pengajuan Magang Sedang Diproses',
        desc:
          reason ||
          'Anda memiliki permohonan magang yang saat ini sedang dalam proses verifikasi oleh sekretariat BRMP. Sesuai ketentuan, Anda baru dapat mengajukan kembali apabila permohonan ini ditolak atau dibatalkan.',
      }
    : {
        border: '#bbf7d0',
        bg: '#f6fef9',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        badgeBorder: '#86efac',
        icon: '👨‍💼',
        title: 'Anda Sedang Menjalani Periode Magang',
        desc:
          reason ||
          'Anda tercatat aktif sedang melaksanakan program magang/PKL di BRMP. Satu peserta hanya diperbolehkan mengikuti satu kegiatan magang pada satu waktu.',
      }

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '2.5rem 1.75rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: theme.badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          border: `2px solid ${theme.badgeBorder}`,
        }}
      >
        {theme.icon}
      </div>

      <div style={{ maxWidth: '520px' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
              backgroundColor: theme.badgeBg,
              color: theme.badgeColor,
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: `1px solid ${theme.badgeBorder}`,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            ● Status: {status}
          </span>
        </div>

        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 0.5rem 0',
          }}
        >
          {theme.title}
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: '#475569',
            lineHeight: 1.6,
            margin: '0 auto 1.25rem auto',
          }}
        >
          {theme.desc}
        </p>

        {/* Info Box */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            textAlign: 'left',
            fontSize: '0.8125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span>Bidang Terpilih:</span>
            <strong style={{ color: '#0f172a' }}>{bidangNama || '-'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span>Nomor / ID Pengajuan:</span>
            <strong style={{ color: '#0f172a' }}>{publicId || `#${id || '-'}`}</strong>
          </div>
          {createdDate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Waktu Pengajuan:</span>
              <strong style={{ color: '#0f172a' }}>{createdDate}</strong>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/pengguna/riwayat"
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: '#15803d',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)',
            }}
          >
            <span>📋</span>
            <span>Lihat Riwayat &amp; Status</span>
          </Link>

          <Link
            href="/pengguna/dashboard"
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              border: '1px solid #cbd5e1',
            }}
          >
            🏠 Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
