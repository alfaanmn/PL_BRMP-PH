'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AppRole } from '@/types/auth.types'
import { BidangItem } from '@/lib/services/bidang.service'

interface BidangListSectionProps {
  bidangs: BidangItem[]
  user: any | null
  userRole: AppRole | null
}

type FilterType = 'all' | 'tersedia' | 'penuh'

interface CategoryTheme {
  bg: string
  border: string
  iconColor: string
  icon: React.ReactNode
}

function getCategoryTheme(nama: string = '', isAvailable: boolean): CategoryTheme {
  const lower = (nama || '').toLowerCase()

  // 1. Kehumasan & TIK / Komunikasi / Multimedia
  if (lower.includes('huma') || lower.includes('tik') || lower.includes('informasi') || lower.includes('komunikasi') || lower.includes('media')) {
    return {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      iconColor: isAvailable ? '#059669' : '#64748b',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )
    }
  }

  // 2. Administrasi / Tata Usaha / Keuangan / Sekretariat
  if (lower.includes('admin') || lower.includes('tata') || lower.includes('kantor') || lower.includes('keuangan') || lower.includes('sekretariat')) {
    return {
      bg: '#fffbeb',
      border: '#fde68a',
      iconColor: isAvailable ? '#d97706' : '#64748b',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
        </svg>
      )
    }
  }

  // 3. Perpustakaan / Dokumentasi / Kearsipan
  if (lower.includes('pustaka') || lower.includes('dokumen') || lower.includes('literasi') || lower.includes('arsip')) {
    return {
      bg: '#eff6ff',
      border: '#bfdbfe',
      iconColor: isAvailable ? '#2563eb' : '#64748b',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/>
          <path d="M6 10h10"/>
        </svg>
      )
    }
  }

  // 4. Kebijakan & Kerjasama
  if (lower.includes('kebijakan') || lower.includes('kerja') || lower.includes('program') || lower.includes('evaluasi') || lower.includes('kerjasama')) {
    return {
      bg: '#f1f5f9',
      border: '#e2e8f0',
      iconColor: '#64748b',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="M7 21h10"/>
          <path d="M12 3v18"/>
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
        </svg>
      )
    }
  }

  // Default: Pertanian & Standar Riset
  return {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    iconColor: isAvailable ? '#16a34a' : '#64748b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
      </svg>
    )
  }
}

export function BidangListSection({ bidangs, user, userRole }: BidangListSectionProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')

  // Hitung statistik
  const totalCount = bidangs.length
  const openCount = useMemo(() => {
    return bidangs.filter((b) => (b.kuota || 0) > 0).length
  }, [bidangs])

  // Filter data client-side
  const filteredBidangs = useMemo(() => {
    if (filter === 'tersedia') {
      return bidangs.filter((b) => (b.kuota || 0) > 0)
    }
    if (filter === 'penuh') {
      return bidangs.filter((b) => (b.kuota || 0) <= 0)
    }
    return bidangs
  }, [bidangs, filter])

  return (
    <section style={{ marginBottom: '4rem' }} id="bidang">
      <style>{`
        .bidang-list-row {
          transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }
        .bidang-list-row:hover {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04) !important;
          transform: translateY(-1px);
        }
        .bidang-row-apply-btn {
          transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .bidang-row-apply-btn:hover {
          background-color: #0d5d49 !important;
          box-shadow: 0 3px 8px rgba(15, 110, 86, 0.3) !important;
          transform: translateY(-1px);
        }
        @media (max-width: 640px) {
          .bidang-list-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .bidang-filter-group {
            width: 100% !important;
            justify-content: flex-start !important;
          }
          .bidang-list-row {
            flex-wrap: wrap !important;
            gap: 0.75rem 1rem !important;
            padding: 12px 14px !important;
          }
          .bidang-slot-indicator {
            width: 100% !important;
            order: 3 !important;
            padding-top: 0.25rem !important;
          }
          .bidang-target-label {
            display: none !important;
          }
          .bidang-title-col {
            min-width: 140px !important;
          }
        }
      `}</style>

      {/* Header Section */}
      <div
        className="bidang-list-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Bidang Magang &amp; Riset
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            {totalCount} bidang · {openCount} masih buka pendaftaran
          </p>
        </div>

        {/* 3 Tombol Filter di Kanan */}
        <div
          className="bidang-filter-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            backgroundColor: '#f1f5f9',
            padding: '0.25rem',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0'
          }}
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '0.35rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filter === 'all' ? '#0F6E56' : 'transparent',
              color: filter === 'all' ? '#ffffff' : '#64748b',
              boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilter('tersedia')}
            style={{
              padding: '0.35rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filter === 'tersedia' ? '#0F6E56' : 'transparent',
              color: filter === 'tersedia' ? '#ffffff' : '#64748b',
              boxShadow: filter === 'tersedia' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Tersedia ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('penuh')}
            style={{
              padding: '0.35rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filter === 'penuh' ? '#0F6E56' : 'transparent',
              color: filter === 'penuh' ? '#ffffff' : '#64748b',
              boxShadow: filter === 'penuh' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Penuh ({totalCount - openCount})
          </button>
        </div>
      </div>

      {/* Empty State jika filter tidak menemukan hasil */}
      {filteredBidangs.length === 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            color: '#64748b'
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            Tidak ada bidang dengan status &quot;{filter === 'tersedia' ? 'Tersedia' : 'Penuh'}&quot;.
          </p>
        </div>
      )}

      {/* List Vertikal 1 Kolom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredBidangs.map((b) => {
          const isAvailable = (b.kuota || 0) > 0
          const kuotaNum = b.kuota || 0
          const totalRefCapacity = 10
          // Progress bar percentage (misal proporsi keterisian slot)
          const filledPercentage = isAvailable
            ? Math.min(100, Math.max(15, Math.round(((totalRefCapacity - kuotaNum) / totalRefCapacity) * 100)))
            : 100

          const theme = getCategoryTheme(b.nama, isAvailable)

          const applyUrl = user
            ? (userRole === 'administrator' ? '/admin/bidang' : `/pengguna/career/step1?bidangId=${b.id}`)
            : `/login?redirect=/pengguna/career/step1?bidangId=${b.id}`

          return (
            <div
              key={b.id}
              className="bidang-list-row"
              onClick={() => router.push(`/bidang/${b.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                opacity: isAvailable ? 1 : 0.72,
                boxSizing: 'border-box'
              }}
            >
              {/* a. Icon Container (40x40px, rounded-10px) */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.border}`,
                  color: theme.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {theme.icon}
              </div>

              {/* b. Kolom Judul & Sub-label (flex: 1) */}
              <div className="bidang-title-col" style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1.35,
                    marginBottom: '0.15rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {b.nama}
                </div>
                <div
                  className="bidang-target-label"
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}
                >
                  Mahasiswa &amp; SMK
                </div>
              </div>

              {/* c. Indikator Slot / Progress Bar (~90-110px) */}
              <div
                className="bidang-slot-indicator"
                style={{
                  width: '105px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                {/* Progress Bar Tipis */}
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '9999px',
                    backgroundColor: '#e2e8f0',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${filledPercentage}%`,
                      borderRadius: '9999px',
                      backgroundColor: isAvailable ? '#16a34a' : '#94a3b8',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                {/* Teks Slot */}
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: isAvailable ? '#15803d' : '#64748b',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isAvailable ? `${kuotaNum} dari ${totalRefCapacity} slot` : 'Penuh'}
                </div>
              </div>

              {/* d. Tombol Aksi "Daftar" / "Penuh" */}
              <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {isAvailable ? (
                  <Link
                    href={applyUrl}
                    className="bidang-row-apply-btn"
                    style={{
                      display: 'inline-block',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px',
                      backgroundColor: '#0F6E56',
                      color: '#ffffff',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      boxShadow: '0 1px 2px rgba(15, 110, 86, 0.2)'
                    }}
                  >
                    Daftar
                  </Link>
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      color: '#94a3b8',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'not-allowed',
                      userSelect: 'none'
                    }}
                  >
                    Penuh
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
