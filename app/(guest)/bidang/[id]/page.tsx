import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { bidangService } from '@/lib/services/bidang.service'
import { Navbar } from '@/components/layout/navbar'
import { AppLogo } from '@/components/shared/app-logo'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

interface BidangDetailPageProps {
  params: Promise<{ id: string }>
}

interface ActivityItem {
  iconType: 'palette' | 'server' | 'camera' | 'file' | 'database' | 'search' | 'scale' | 'handshake' | 'leaf'
  text: string
}

interface BidangMetaConfig {
  categoryIcon: 'broadcast' | 'building' | 'book' | 'handshake' | 'leaf'
  deskripsi: string
  activities: ActivityItem[]
  majors: string[]
  unitType: string
  unitName: string
  lokasi: string
}

function getBidangMeta(bidang: { id: string | number; nama: string; deskripsi?: string | null }): BidangMetaConfig {
  const idStr = String(bidang.id)
  const namaLower = (bidang.nama || '').toLowerCase()

  // 1. Administrasi Perkantoran & Kesekretariatan
  if (idStr === '2' || namaLower.includes('administrasi') || namaLower.includes('perkantoran') || namaLower.includes('sekretariat')) {
    return {
      categoryIcon: 'building',
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Tata kelola kearsipan digital, persuratan dinas, dan pelayanan administrasi perkantoran modern.',
      activities: [
        { iconType: 'file', text: 'Digitalisasi dan tata kelola persuratan dinas' },
        { iconType: 'database', text: 'Pengelolaan administrasi inventaris dan aset kantor' },
        { iconType: 'file', text: 'Penyusunan notulensi rapat dan agenda pimpinan' }
      ],
      majors: [
        'Administrasi perkantoran',
        'Manajemen perkantoran',
        'Kesekretariatan',
        'Manajemen informasi',
        'Kearsipan',
        'SMK administrasi'
      ],
      unitType: 'Unit kerja',
      unitName: 'Subbagian Tata Usaha & Kearsipan',
      lokasi: 'Ruang Tata Usaha & Sekretariat, Gedung Utama BRMP'
    }
  }

  // 2. Kehumasan, TIK & Komunikasi
  if (idStr === '1' || namaLower.includes('humas') || namaLower.includes('kehumasan') || namaLower.includes('tik') || namaLower.includes('komunikasi')) {
    return {
      categoryIcon: 'broadcast',
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Pengelolaan publikasi digital, diseminasi informasi standardisasi pertanian, dan pemeliharaan infrastruktur TIK BRMP.',
      activities: [
        { iconType: 'palette', text: 'Desain konten publikasi dan infografis media' },
        { iconType: 'server', text: 'Pengelolaan portal web dan jaringan kantor' },
        { iconType: 'camera', text: 'Liputan kegiatan dan dokumentasi acara resmi' }
      ],
      majors: [
        'Ilmu komunikasi',
        'Teknik informatika',
        'Sistem informasi',
        'Desain komunikasi visual',
        'Jurnalistik',
        'Hubungan masyarakat',
        'SMK multimedia / RPL'
      ],
      unitType: 'Unit kerja',
      unitName: 'Subbagian Hubungan Masyarakat & TIK',
      lokasi: 'Ruang TIK & Studio Multimedia, Gedung A BRMP'
    }
  }

  // 3. Perpustakaan & Dokumentasi
  if (idStr === '3' || namaLower.includes('perpustakaan') || namaLower.includes('pustaka') || namaLower.includes('dokumentasi')) {
    return {
      categoryIcon: 'book',
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Pengelolaan repositori ilmiah, katalogisasi literatur standardisasi pertanian, dan pelayanan referensi digital.',
      activities: [
        { iconType: 'search', text: 'Klasifikasi literatur dan jurnal standardisasi pertanian' },
        { iconType: 'database', text: 'Pengelolaan repositori digital dan arsip ilmiah' },
        { iconType: 'file', text: 'Pelayanan sirkulasi pustaka dan referensi data' }
      ],
      majors: [
        'Ilmu perpustakaan',
        'Sains informasi',
        'Manajemen informasi',
        'Kearsipan',
        'Ilmu komunikasi',
        'SMK perpustakaan'
      ],
      unitType: 'Fasilitas layanan',
      unitName: 'Perpustakaan & Repositori Ilmiah',
      lokasi: 'Gedung Perpustakaan & Dokumentasi BRMP'
    }
  }

  // 4. Kebijakan & Kerjasama
  if (idStr === '4' || namaLower.includes('kebijakan') || namaLower.includes('kerjasama') || namaLower.includes('standardisasi') || namaLower.includes('standar')) {
    return {
      categoryIcon: 'handshake',
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Analisis formulasi standar instrumen pertanian, fasilitasi kerjasama antarlembaga, dan harmonisasi regulasi.',
      activities: [
        { iconType: 'scale', text: 'Telaah dokumen standar instrumen pertanian nasional' },
        { iconType: 'handshake', text: 'Penyusunan draf kerjasama dan naskah kesepahaman' },
        { iconType: 'search', text: 'Monitoring evaluasi penerapan standar mutu komoditas' }
      ],
      majors: [
        'Agribisnis',
        'Hukum',
        'Manajemen kebijakan publik',
        'Hubungan internasional',
        'Ekonomi pertanian',
        'Vokasi agribisnis'
      ],
      unitType: 'Unit kerja',
      unitName: 'Subbagian Kerjasama & Program',
      lokasi: 'Ruang Komisi Standardisasi, Gedung B BRMP'
    }
  }

  // Fallback / Riset Pertanian
  return {
    categoryIcon: 'leaf',
    deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Pengujian instrumen budidaya presisi, standardisasi GAP, dan penyusunan pedoman mutu benih bersertifikat nasional.',
    activities: [
      { iconType: 'leaf', text: 'Validasi standar budidaya tanaman di kebun' },
      { iconType: 'search', text: 'Analisis agroklimat dan morfologi varietas tanaman' },
      { iconType: 'file', text: 'Kompilasi data dan penyusunan laporan teknis' }
    ],
    majors: [
      'Agronomi',
      'Agroteknologi',
      'Hortikultura',
      'Ilmu tanah',
      'Biologi pertanian',
      'SMK pertanian'
    ],
    unitType: 'Laboratorium lapangan',
    unitName: 'Kebun Riset & Agroklimat',
    lokasi: 'Gelanggang Riset, Kebun Percobaan IP2TP'
  }
}

// Helper Render SVG Icon untuk Kategori Header (Tema Hijau BRMP)
function renderCategoryIcon(type: string) {
  const strokeColor = '#4ade80' // Mint / Emerald Green
  switch (type) {
    case 'broadcast':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
          <circle cx="12" cy="12" r="2"/>
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
          <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
        </svg>
      )
    case 'building':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
          <path d="M9 22v-4h6v4"/>
          <path d="M8 6h.01"/>
          <path d="M16 6h.01"/>
          <path d="M8 10h.01"/>
          <path d="M16 10h.01"/>
          <path d="M8 14h.01"/>
          <path d="M16 14h.01"/>
        </svg>
      )
    case 'book':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/>
          <path d="M6 10h10"/>
        </svg>
      )
    case 'handshake':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-3-3a1 1 0 0 0-1.4 0L13 11.6"/>
          <path d="m7 12.4 1.4-1.4a1 1 0 0 1 1.4 0l1.9 1.9"/>
          <path d="m18 13 3-3a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L14 8.6"/>
          <path d="m3 11 3-3a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L6.4 16"/>
        </svg>
      )
    default:
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      )
  }
}

// Helper Render SVG Icon untuk Cakupan Aktivitas (Tema Hijau BRMP)
function renderActivityIcon(type: string) {
  const strokeColor = '#22c55e' // Fresh Emerald Green
  switch (type) {
    case 'palette':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
        </svg>
      )
    case 'server':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
          <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
          <line x1="6" x2="6.01" y1="6" y2="6"/>
          <line x1="6" x2="6.01" y1="18" y2="18"/>
        </svg>
      )
    case 'camera':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
      )
    case 'file':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
          <path d="M10 13h4"/>
          <path d="M10 17h4"/>
        </svg>
      )
    case 'database':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
        </svg>
      )
    case 'search':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
      )
    case 'scale':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="M7 21h10"/>
          <path d="M12 3v18"/>
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
        </svg>
      )
    case 'handshake':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-3-3a1 1 0 0 0-1.4 0L13 11.6"/>
          <path d="m7 12.4 1.4-1.4a1 1 0 0 1 1.4 0l1.9 1.9"/>
          <path d="m18 13 3-3a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L14 8.6"/>
          <path d="m3 11 3-3a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L6.4 16"/>
        </svg>
      )
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      )
  }
}

export default async function BidangDetailPage({ params }: BidangDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Ambil data user & role untuk header nav
  const { data: { user } } = await supabase.auth.getUser()
  let profileData: { role: AppRole | null; name: string | null } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single()
    if (profile) {
      profileData = {
        role: (profile.role as AppRole) || null,
        name: profile.name || null
      }
    }
  }

  // Ambil detail bidang dari database Supabase
  const result = await bidangService.getBidangById(id)
  const bidang = result.data

  if (!bidang) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#064e3b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          maxWidth: '420px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Bidang magang tidak ditemukan
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Bidang yang Anda tuju belum terdaftar atau telah dinonaktifkan dari sistem BRMP.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.625rem 1.25rem',
              backgroundColor: '#15803d',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            ← Kembali ke beranda
          </a>
        </div>
      </div>
    )
  }

  const userRole = (profileData?.role as AppRole) || null
  const targetApplyUrl = user
    ? (userRole === 'administrator' ? '/admin/bidang' : `/pengguna/career/step1?bidangId=${bidang.id}`)
    : `/login?redirect=/pengguna/career/step1?bidangId=${bidang.id}`

  const totalKuota = bidang.kuota || 0
  const isKuotaOpened = (bidang.is_active !== false) && totalKuota > 0
  const pembimbings = bidang.pembimbings || []
  const meta = getBidangMeta(bidang)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0
    }}>
      <style>{`
        .bidang-detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 2rem;
          align-items: start;
        }
        .bidang-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.875rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .bidang-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 540px) {
          .bidang-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.625rem !important;
          }
          .bidang-detail-main-card {
            padding: 1.25rem 1rem !important;
          }
        }
      `}</style>

      {/* Header / Navbar Resmi BRMP Kementan */}
      <Navbar user={user} profile={profileData} activeKey="bidang" />

      {/* Main Container */}
      <main style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem 1.5rem 4rem 1.5rem',
        boxSizing: 'border-box'
      }}>
        {/* Breadcrumb Navigasi */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '1.25rem' }}>
          <ol style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '0.8125rem',
            color: '#64748b'
          }}>
            <li>
              <Link href="/" style={{ color: '#15803d', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Beranda</span>
              </Link>
            </li>
            <li>
              <span style={{ color: '#cbd5e1' }}>/</span>
            </li>
            <li>
              <Link href="/#bidang" style={{ color: '#64748b', textDecoration: 'none' }}>
                Bidang magang
              </Link>
            </li>
            <li>
              <span style={{ color: '#cbd5e1' }}>/</span>
            </li>
            <li style={{ color: '#0f172a', fontWeight: 600, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bidang.nama}
            </li>
          </ol>
        </nav>

        {/* Grid Utama 2 Kolom (Konten Kiri + Sidebar Kanan) */}
        <div className="bidang-detail-grid">
          {/* KOLOM KIRI (KONTEN UTAMA) */}
          <div className="bidang-detail-main-card" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            {/* 1. HEADER SECTION (Ikon Bulat 48x48px Hijau BRMP + Judul + Unit Kerja) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#064e3b',
                border: '1px solid #047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(6, 78, 59, 0.2)'
              }}>
                {renderCategoryIcon(meta.categoryIcon)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.3,
                  margin: '0 0 0.25rem 0',
                  letterSpacing: '-0.02em'
                }}>
                  {bidang.nama}
                </h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  Balai Penerapan Standar Instrumen Pertanian - Kementan RI
                </p>
              </div>
            </div>

            {/* 2. STATUS KUOTA (SATU BADGE TUNGGAL DI BAWAH HEADER) */}
            <div style={{ marginBottom: '1.75rem' }}>
              {isKuotaOpened ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  padding: '0.4rem 0.875rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 600
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <span>Pendaftaran dibuka — sisa kuota aktif {totalKuota} mahasiswa</span>
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '0.4rem 0.875rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 600
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Pendaftaran belum dibuka — gelombang 2025/2026</span>
                </div>
              )}
            </div>

            {/* 3. KARTU STATISTIK (GRID 3 KOLOM DENGAN IKON HIJAU DI ATAS ANGKA) */}
            <div className="bidang-stats-grid">
              {/* Card 1: Kapasitas kuota */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.125rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
              }}>
                <div style={{ color: '#15803d', marginBottom: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '0.25rem' }}>
                  {totalKuota}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  Kapasitas kuota
                </span>
              </div>

              {/* Card 2: Sisa kuota */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.125rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
              }}>
                <div style={{ color: '#15803d', marginBottom: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                    <path d="M13 5v2"/>
                    <path d="M13 17v2"/>
                    <path d="M13 11v2"/>
                  </svg>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: isKuotaOpened ? '#15803d' : '#0f172a',
                  lineHeight: 1.1,
                  marginBottom: '0.25rem'
                }}>
                  {isKuotaOpened ? totalKuota : '-'}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  Sisa kuota
                </span>
              </div>

              {/* Card 3: Bulan magang */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.125rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
              }}>
                <div style={{ color: '#15803d', marginBottom: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" x2="16" y1="2" y2="6"/>
                    <line x1="8" x2="8" y1="2" y2="6"/>
                    <line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '0.25rem' }}>
                  1-3
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  Bulan magang
                </span>
              </div>
            </div>

            {/* 4. CAKUPAN AKTIVITAS MAGANG (DENGAN IKON HIJAU BRMP & MAKSIMAL 8 KATA) */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#475569',
                margin: '0 0 0.875rem 0'
              }}>
                Cakupan aktivitas
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {meta.activities.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#064e3b',
                      border: '1px solid #047857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {renderActivityIcon(act.iconType)}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {act.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. LATAR BELAKANG PENDIDIKAN (PILL SOLID WARNA HIJAU BRMP) */}
            <div style={{ marginBottom: '2.25rem' }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#475569',
                margin: '0 0 0.75rem 0'
              }}>
                Latar belakang pendidikan
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {meta.majors.map((major, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#064e3b',
                      color: '#86efac',
                      border: '1px solid #047857',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em'
                    }}
                  >
                    {major}
                  </span>
                ))}
              </div>
            </div>

            {/* 6. DAFTAR PEMBIMBING LAPANGAN */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <h2 style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#475569',
                  margin: 0
                }}>
                  Daftar pembimbing lapangan
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                  {pembimbings.length} pembimbing terdaftar
                </span>
              </div>

              {pembimbings.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem'
                }}>
                  {pembimbings.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Image
                          src="/icon_pembimbing.png"
                          alt={p.nama}
                          width={24}
                          height={24}
                          style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          margin: '0 0 0.125rem 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {p.nama}
                        </h3>
                        <span style={{
                          fontSize: '0.6875rem',
                          color: '#64748b',
                          display: 'block',
                          marginBottom: '0.375rem'
                        }}>
                          NIP: {p.nip || '-'} | {p.jabatan || 'Pembimbing teknis'}
                        </span>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: '#ffffff',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 700
                        }}>
                          Kuota: {p.kuota_default ?? p.kuota ?? 2} mahasiswa
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontSize: '0.8125rem',
                  color: '#64748b'
                }}>
                  Belum ada pembimbing khusus — ditetapkan saat berkas diverifikasi.
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN (SIDEBAR ACTION CARD) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'sticky',
            top: '5rem'
          }}>
            {/* Card Pendaftaran & Info Lokasi */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Visual Banner Unit / Laboratorium */}
              <div style={{
                height: '130px',
                background: 'linear-gradient(135deg, #064e3b 0%, #15803d 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '1rem',
                color: '#ffffff'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}>
                  BRMP KEMENTAN RI
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {meta.unitType}
                  </span>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                    {meta.unitName}
                  </h3>
                </div>
              </div>

              {/* Metadata Lokasi & Penerimaan */}
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <Image
                      src="/icon_lokasi.png"
                      alt="Lokasi"
                      width={20}
                      height={20}
                      style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0, marginTop: '0.125rem' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', fontWeight: 600 }}>LOKASI PELAKSANAAN</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                        {meta.lokasi}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <Image
                      src="/icon_jadwal.png"
                      alt="Jadwal"
                      width={20}
                      height={20}
                      style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0, marginTop: '0.125rem' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', fontWeight: 600 }}>MASA PENERIMAAN</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                        Gelombang aktif tahun 2025/2026
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <Link
                  href={targetApplyUrl}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                    marginBottom: '0.75rem'
                  }}
                >
                  <span>Daftar magang sekarang</span>
                  <span>→</span>
                </Link>

                {/* Secondary Back Button */}
                <Link
                  href="/#bidang"
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    border: '1px solid #e2e8f0',
                    boxSizing: 'border-box'
                  }}
                >
                  <span>← Kembali ke katalog bidang</span>
                </Link>
              </div>
            </div>

            {/* Box Peringatan 1 Spesifikasi */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: '#92400e',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              fontWeight: 600
            }}>
              <Image
                src="/icon_tip.png"
                alt="Tips"
                width={18}
                height={18}
                style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }}
              />
              <span>Daftar hanya di 1 bidang per periode pengajuan.</span>
            </div>

            {/* Box Checklist Kelengkapan Dokumen */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}>
              <h3 style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 0.875rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Image
                  src="/icon_dokumen.png"
                  alt="Dokumen"
                  width={20}
                  height={20}
                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                />
                <span>Kelengkapan dokumen</span>
              </h3>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
                fontSize: '0.75rem',
                color: '#475569'
              }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>Surat pengantar resmi perguruan tinggi / sekolah</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>Proposal pengajuan magang (format PDF)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>Transkrip nilai akademik terakhir</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>Curriculum vitae (CV) terkini</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>Sertifikat prestasi / portofolio (opsional)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Resmi BRMP Kementan RI */}
      <footer style={{
        backgroundColor: '#064e3b',
        color: '#d1fae5',
        padding: '3rem 1.5rem 2rem 1.5rem',
        marginTop: 'auto',
        borderTop: '1px solid #047857'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2rem'
        }}>
          {/* Kolom 1: Profil Lembaga */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <AppLogo size={32} />
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                SIM-Magang BRMP
              </span>
            </div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
              Badan Riset dan Manajemen Pertanian
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#a7f3d0', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
              Badan kerja pemerintah yang bergerak di bidang riset dan standardisasi instrumen pertanian Republik Indonesia secara terpadu dan modern.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6ee7b7', lineHeight: 1.4, margin: 0 }}>
              <a
                href="https://www.google.com/maps/place/Balai+Pengelola+Hasil+Perakitan+dan+Modernisasi+Pertanian/@-6.5893588,106.7998551,17z/data=!3m1!4b1!4m6!3m5!1s0x2e69c5ccf0c9dc05:0xd84bcc2b4c0158c9!8m2!3d-6.5893641!4d106.80243!16s%2Fg%2F1tcwc2r_?entry=ttu"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6ee7b7', textDecoration: 'none' }}
              >
                📍 Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian ↗
              </a>
            </p>
          </div>

          {/* Kolom 2: Navigasi Cepat */}
          <div>
            <h4 style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 1rem 0'
            }}>
              NAVIGASI CEPAT
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
              <Link href="/#bidang" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Katalog bidang & riset
              </Link>
              <Link href="/#alur" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Panduan & alur magang
              </Link>
              <Link href="/" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Beranda & persyaratan
              </Link>
              <Link href="/kontak" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Kontak BRMP
              </Link>
            </div>
          </div>

          {/* Kolom 3: Layanan Informasi Publik */}
          <div>
            <h4 style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 1rem 0'
            }}>
              LAYANAN INFORMASI PUBLIK
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: '#a7f3d0' }}>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.75rem' }}>Hubungi Layanan:</strong>
                <span>(021) 7806205 / 7806544</span>
              </div>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.75rem' }}>Jam Operasional:</strong>
                <span>Senin - Jumat, 08.00 - 16.00 WIB</span>
              </div>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.75rem' }}>Kementerian:</strong>
                <span>Kementerian Pertanian Republik Indonesia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          paddingTop: '1.5rem',
          borderTop: '1px solid #047857',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          color: '#6ee7b7'
        }}>
          <div>
            © {new Date().getFullYear()} SIM-Magang BRMP. Hak cipta dilindungi undang-undang.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span style={{ color: '#a7f3d0' }}>Syarat & ketentuan</span>
            <span style={{ color: '#a7f3d0' }}>Kebijakan privasi</span>
            <span style={{ color: '#a7f3d0' }}>Standar pelayanan</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
