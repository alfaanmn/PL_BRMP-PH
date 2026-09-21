import React from 'react'
import Link from 'next/link'
import type { AppRole } from '@/types/auth.types'

export interface BidangCardItem {
  id: number | string
  nama: string
  deskripsi?: string | null
  kuota?: number | null
  is_active?: boolean | null
}

interface BidangCardProps {
  bidang: BidangCardItem
  user: any | null
  userRole: AppRole | null
}

function getBidangOutlineIcon(nama: string = '') {
  const lower = (nama || '').toLowerCase()

  // 1. TIK / Kehumasan / Komunikasi / Multimedia -> Monitor & Devices Outline
  if (lower.includes('huma') || lower.includes('tik') || lower.includes('informasi') || lower.includes('komunikasi') || lower.includes('media')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    )
  }

  // 2. Administrasi / Tata Usaha / Keuangan / Sekretariat -> Folder / Briefcase Outline
  if (lower.includes('admin') || lower.includes('tata') || lower.includes('kantor') || lower.includes('keuangan') || lower.includes('sekretariat')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      </svg>
    )
  }

  // 3. Perpustakaan / Dokumentasi / Kearsipan -> Book Outline
  if (lower.includes('pustaka') || lower.includes('dokumen') || lower.includes('literasi') || lower.includes('arsip')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
        <path d="M6 6h10"/>
        <path d="M6 10h10"/>
      </svg>
    )
  }

  // 4. Kebijakan / Kerjasama / Program -> Scale / Timbangan Outline
  if (lower.includes('kebijakan') || lower.includes('kerja') || lower.includes('program') || lower.includes('evaluasi') || lower.includes('kerjasama')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="M7 21h10"/>
        <path d="M12 3v18"/>
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
      </svg>
    )
  }

  // Default: Riset & Standar Pertanian -> Sprout / Leaf Outline
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  )
}

function getBidangShortDesc(nama: string = '', deskripsi: string | null = ''): string {
  const lower = (nama || '').toLowerCase()
  if (lower.includes('huma') || lower.includes('tik') || lower.includes('informasi') || lower.includes('komunikasi')) {
    return 'Teknologi informasi, komunikasi, dan pengelolaan informasi BRMP.'
  }
  if (lower.includes('admin') || lower.includes('tata') || lower.includes('kantor') || lower.includes('keuangan')) {
    return 'Administrasi dan pengelolaan layanan perkantoran BRMP.'
  }
  if (lower.includes('pustaka') || lower.includes('dokumen') || lower.includes('literasi') || lower.includes('arsip')) {
    return 'Pengelolaan koleksi, dokumentasi, dan layanan informasi.'
  }
  if (lower.includes('kebijakan') || lower.includes('kerja') || lower.includes('program') || lower.includes('evaluasi') || lower.includes('kerjasama')) {
    return 'Dukungan kebijakan, koordinasi, dan administrasi kerjasama.'
  }
  if (deskripsi) {
    const firstSentence = deskripsi.split('.')[0]
    if (firstSentence && firstSentence.trim().length > 10) {
      return firstSentence.trim() + '.'
    }
  }
  return 'Penerapan standar instrumen pertanian dan riset operasional BRMP.'
}

export function BidangCard({ bidang, user, userRole }: BidangCardProps) {
  const isAvailable = (bidang.kuota || 0) > 0
  const shortDesc = getBidangShortDesc(bidang.nama, bidang.deskripsi)

  const applyUrl = user
    ? (userRole === 'administrator' ? '/admin/bidang' : `/pengguna/career/step1?bidangId=${bidang.id}`)
    : `/login?redirect=/pengguna/career/step1?bidangId=${bidang.id}`

  // Warna brand hijau solid atau abu-abu netral (#5F5E5A) saat penuh
  const cardBgColor = isAvailable ? '#0F6E56' : '#5F5E5A'

  return (
    <div
      className="bidang-card-solid"
      style={{
        backgroundColor: cardBgColor,
        borderRadius: '14px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
        opacity: isAvailable ? 1 : 0.92,
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease'
      }}
    >
      {/* Elemen Dekoratif Lingkaran Samar di Pojok Kanan Atas */}
      <div
        style={{
          position: 'absolute',
          top: '-45px',
          right: '-45px',
          width: '145px',
          height: '145px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          width: '85px',
          height: '85px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header: Icon Outline Putih (Pojok Kiri) & Badge Pill (Pojok Kanan) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}
        >
          {/* Icon Outline Sederhana Putih (Tanpa kotak putih, 24px) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              opacity: isAvailable ? 1 : 0.85
            }}
          >
            {getBidangOutlineIcon(bidang.nama)}
          </div>

          {/* Badge Pill Status / Kuota di Pojok Kanan Atas */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              color: '#ffffff',
              padding: '0.22rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.01em',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {isAvailable ? (
              <>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#86efac', display: 'inline-block' }} />
                {`${bidang.kuota || 0} slot tersedia`}
              </>
            ) : (
              <>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'inline-block' }} />
                Penuh
              </>
            )}
          </div>
        </div>

        {/* Judul Bidang */}
        <h3
          style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 0.35rem 0',
            lineHeight: 1.35,
            opacity: isAvailable ? 1 : 0.9
          }}
        >
          {bidang.nama}
        </h3>

        {/* Deskripsi Singkat */}
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'rgba(255, 255, 255, 0.82)',
            lineHeight: 1.45,
            margin: '0 0 1rem 0',
            opacity: isAvailable ? 1 : 0.8
          }}
        >
          {shortDesc}
        </p>
      </div>

      {/* Action Buttons (Dual Action) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 1,
          marginTop: '0.5rem',
          paddingTop: '0.875rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Tombol Detail (Outline Putih Transparan) */}
        <Link
          href={`/bidang/${bidang.id}`}
          className="bidang-solid-btn-detail"
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#ffffff',
            textDecoration: 'none',
            padding: '0.45rem 0.625rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            transition: 'background-color 0.15s ease, border-color 0.15s ease'
          }}
        >
          Detail
        </Link>

        {/* Tombol Daftar (Putih Solid dengan Teks Hijau Brand) atau Penuh (Disabled) */}
        {isAvailable ? (
          <Link
            href={applyUrl}
            className="bidang-solid-btn-apply"
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#0F6E56',
              textDecoration: 'none',
              padding: '0.45rem 0.625rem',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #ffffff',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.15s ease'
            }}
          >
            Daftar
          </Link>
        ) : (
          <span
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.65)',
              padding: '0.45rem 0.625rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
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
}
