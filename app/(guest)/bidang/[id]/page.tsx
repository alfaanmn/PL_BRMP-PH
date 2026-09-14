import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bidangService } from '@/lib/services/bidang.service'
import { Navbar } from '@/components/layout/navbar'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

interface BidangDetailPageProps {
  params: Promise<{ id: string }>
}

interface BidangMetaConfig {
  deskripsi: string
  activities: string[]
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
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Tata kelola kearsipan digital, persuratan dinas kedinasan, dan pelayanan administrasi perkantoran modern.',
      activities: [
        'Registrasi, agenda, dan digitalisasi arsip persuratan dinas.',
        'Pengelolaan administrasi kepegawaian dan inventaris kantor.',
        'Notulensi rapat koordinasi dan penyusunan agenda pimpinan.'
      ],
      majors: [
        'Administrasi Perkantoran',
        'Manajemen Perkantoran',
        'Kesekretariatan',
        'Manajemen Informasi',
        'Kearsipan',
        'SMK Administrasi Perkantoran'
      ],
      unitType: 'Unit Kerja',
      unitName: 'Subbagian Tata Usaha & Kearsipan',
      lokasi: 'Ruang Tata Usaha & Sekretariat, Gedung Utama BRMP'
    }
  }

  // 2. Kehumasan, TIK & Komunikasi
  if (idStr === '1' || namaLower.includes('humas') || namaLower.includes('kehumasan') || namaLower.includes('tik') || namaLower.includes('komunikasi')) {
    return {
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Pengelolaan publikasi digital, diseminasi informasi standardisasi pertanian, dan pemeliharaan infrastruktur TIK BRMP.',
      activities: [
        'Desain konten publikasi dan infografis media sosial resmi.',
        'Pengelolaan portal web, sistem informasi, dan jaringan kantor.',
        'Liputan kegiatan, dokumentasi acara, dan siaran pers.'
      ],
      majors: [
        'Ilmu Komunikasi',
        'Teknik Informatika',
        'Sistem Informasi',
        'Desain Komunikasi Visual (DKV)',
        'Jurnalistik',
        'Hubungan Masyarakat (PR)',
        'SMK Multimedia / RPL'
      ],
      unitType: 'Unit Kerja',
      unitName: 'Subbagian Hubungan Masyarakat & TIK',
      lokasi: 'Ruang TIK & Studio Multimedia, Gedung A BRMP'
    }
  }

  // 3. Perpustakaan & Dokumentasi
  if (idStr === '3' || namaLower.includes('perpustakaan') || namaLower.includes('pustaka') || namaLower.includes('dokumentasi')) {
    return {
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Pengelolaan repositori ilmiah, katalogisasi literatur standardisasi pertanian, dan pelayanan referensi digital.',
      activities: [
        'Inventarisasi dan klasifikasi literatur serta jurnal standardisasi.',
        'Pengelolaan sistem temu kembali informasi dan repositori digital.',
        'Pelayanan sirkulasi pustaka dan penataan arsip ilmiah.'
      ],
      majors: [
        'Ilmu Perpustakaan',
        'Sains Informasi',
        'Manajemen Informasi',
        'Kearsipan',
        'Ilmu Komunikasi',
        'SMK Perpustakaan / Administrasi'
      ],
      unitType: 'Fasilitas Layanan',
      unitName: 'Perpustakaan & Repositori Ilmiah',
      lokasi: 'Gedung Perpustakaan & Dokumentasi BRMP'
    }
  }

  // 4. Kebijakan & Kerjasama
  if (idStr === '4' || namaLower.includes('kebijakan') || namaLower.includes('kerjasama') || namaLower.includes('standardisasi') || namaLower.includes('standar')) {
    return {
      deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Analisis formulasi standar instrumen pertanian, fasilitasi kerjasama antarlembaga, dan harmonisasi regulasi.',
      activities: [
        'Telaah dokumen naskah standar instrumen pertanian.',
        'Penyusunan draf nota kesepahaman (MoU) dan dokumen kerjasama.',
        'Monitoring dan evaluasi penerapan standar di lapangan.'
      ],
      majors: [
        'Agribisnis',
        'Hukum',
        'Manajemen Kebijakan Publik',
        'Hubungan Internasional',
        'Ekonomi Pertanian',
        'Vokasi Agribisnis / Administrasi'
      ],
      unitType: 'Unit Kerja',
      unitName: 'Subbagian Kerjasama & Program',
      lokasi: 'Ruang Komisi Standardisasi, Gedung B BRMP'
    }
  }

  // Fallback / Riset Pertanian
  return {
    deskripsi: bidang.deskripsi ? (bidang.deskripsi.split('.')[0] + '.') : 'Pengujian instrumen budidaya presisi, standardisasi GAP, dan penyusunan pedoman mutu benih bersertifikat nasional.',
    activities: [
      'Validasi SOP budidaya hortikultura di kebun percobaan.',
      'Analisis agroklimat dan morfologi varietas unggul baru.',
      'Kompilasi data dan penyusunan draft laporan teknis.'
    ],
    majors: [
      'Agronomi',
      'Agroteknologi',
      'Hortikultura',
      'Ilmu Tanah',
      'Biologi Pertanian',
      'SMK / Vokasi Pertanian'
    ],
    unitType: 'Laboratorium Lapangan',
    unitName: 'Kebun Riset & Agroklimat',
    lokasi: 'Gelanggang Riset, Kebun Percobaan IP2TP'
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
        backgroundColor: '#f8fafc',
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
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Bidang Magang Tidak Ditemukan
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
            ← Kembali ke Beranda
          </a>
        </div>
      </div>
    )
  }

  const userRole = (profileData?.role as AppRole) || null
  const backUrl = userRole === 'pengguna' ? '/pengguna/dashboard' : '/'
  const targetApplyUrl = user
    ? (userRole === 'administrator' ? '/admin/bidang' : `/pengguna/career/step1?bidangId=${bidang.id}`)
    : `/login?redirect=/pengguna/career/step1?bidangId=${bidang.id}`

  const totalKuota = bidang.kuota || 0
  const isKuotaOpened = totalKuota > 0
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
        {/* 2. Breadcrumbs */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
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
                Bidang Magang
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

        {/* 3. Banner Notifikasi Hijau: INFORMASI MAGANG TERSEDIA (Ringkas) */}
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#065f46',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'inline-block',
              marginRight: '0.5rem'
            }}>
              INFORMASI RESMI:
            </span>
            <span style={{
              fontSize: '0.8125rem',
              color: '#047857',
              lineHeight: 1.4
            }}>
              Detail spesifikasi posisi magang dan profil pembimbing BRMP Kementan RI.
            </span>
          </div>
        </div>

        {/* 4. Grid Utama 2 Kolom (Konten Kiri + Sidebar Kanan) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: '2rem'
          }}>
            {/* KOLOM KIRI */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Badge Kategori & ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Bidang Riset &amp; Terapan
                </span>
                <span style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}>
                  BIDANG #{bidang.id}
                </span>
              </div>

              {/* Judul Bidang */}
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.3,
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em'
              }}>
                {bidang.nama}
              </h1>

              {/* Subtitle Institusi */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                color: '#64748b',
                fontSize: '0.875rem',
                marginBottom: '1.75rem'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                  <path d="M10 6h4"/>
                  <path d="M10 10h4"/>
                  <path d="M10 14h4"/>
                  <path d="M10 18h4"/>
                </svg>
                <span>Balai Penerapan Standar Instrumen Pertanian (BPSIP) — Kementan RI</span>
              </div>

              {/* 3 Metric Cards (Kapasitas, Sisa Kuota, Durasi) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '2rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    Kapasitas Kuota
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isKuotaOpened ? '#0f172a' : '#64748b' }}>
                    {totalKuota} <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Mahasiswa</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Total Kuota Bidang</span>
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    Sisa Kuota Terbuka
                  </span>
                  {isKuotaOpened ? (
                    <>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                        {totalKuota} <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#15803d' }}>Mahasiswa</span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600 }}>● Sisa Kuota Aktif</span>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#64748b' }}>
                        Kuota belum dibuka
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600 }}>● Belum Dibuka</span>
                    </>
                  )}
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    Durasi Magang
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    1 - 3 <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Bulan / Periode</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Fleksibel / Sesuai Pengajuan</span>
                </div>
              </div>

              {/* Section: Deskripsi & Spesifikasi (1 Kalimat Ringkas) */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  <Image
                    src="/icon_deskripsi.png"
                    alt="Deskripsi"
                    width={22}
                    height={22}
                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                  />
                  <span>Deskripsi &amp; Spesifikasi Riset</span>
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#475569',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {meta.deskripsi}
                </p>
              </div>

              {/* Section: Cakupan Aktivitas Magang (1 Baris Per Poin) */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  margin: '0 0 0.75rem 0'
                }}>
                  <Image
                    src="/icon_cakupan.png"
                    alt="Cakupan"
                    width={22}
                    height={22}
                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                  />
                  <span>Cakupan Aktivitas Magang</span>
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
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#15803d',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#14532d', margin: 0 }}>
                        {act}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Latar Belakang Pendidikan (Langsung Tag Badges) */}
              <div style={{
                marginBottom: '2.25rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px'
              }}>
                <h2 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  margin: '0 0 0.75rem 0'
                }}>
                  <Image
                    src="/icon_rekomendasi.png"
                    alt="Pendidikan"
                    width={22}
                    height={22}
                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                  />
                  <span>Latar Belakang Pendidikan</span>
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {meta.majors.map((major, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {major}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section: Daftar Pembimbing Lapangan */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <h2 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    margin: 0
                  }}>
                    <Image
                      src="/icon_pembimbing.png"
                      alt="Pembimbing"
                      width={22}
                      height={22}
                      style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                    />
                    <span>Daftar Pembimbing Lapangan</span>
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                    {pembimbings.length} Pembimbing Terdaftar
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
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
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
                            NIP: {p.nip || '-'} | {p.jabatan || 'Pembimbing Teknis'}
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
                            Kuota: {p.kuota || 2} Mahasiswa
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
                    0 pembimbing terdaftar — ditetapkan setelah berkas disetujui.
                  </div>
                )}
              </div>

              {/* Disclaimer / Catatan Kuota */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.6875rem',
                color: '#dc2626'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Catatan Kuota: Kuota bersifat realtime dan dapat berubah sewaktu-waktu sesuai kuota pembimbing terdaftar.</span>
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
                  height: '140px',
                  background: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #22c55e 100%)',
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
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px',
                    fontSize: '0.6875rem',
                    fontWeight: 700
                  }}>
                    BRMP KEMENTAN RI
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {meta.unitType}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
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
                          Gelombang Aktif Tahun 2025/2026
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
                    <span>Daftar Magang Sekarang</span>
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
                    <span>← Kembali ke Katalog Bidang</span>
                  </Link>
                </div>
              </div>

              {/* Box Peringatan 1 Spesifikasi (Amber Scheme Konsisten & Ringkas) */}
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
                <span>Daftar hanya di 1 bidang per periode.</span>
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
                  <span>Kelengkapan Dokumen</span>
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
                    <span>Surat Pengantar Resmi Perguruan Tinggi / Sekolah</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Proposal Pengajuan Magang (PDF format)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Transkrip Nilai Akademik Terakhir (Min IPK 2.75)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Curriculum Vitae (CV) Terkini</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Sertifikat Prestasi / Portfolio Pendukung (Opsional)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Footer Resmi BRMP Kementan RI */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🌿</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                SIM-Magang BRMP
              </span>
            </div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
              Badan Riset dan Manajemen Pertanian
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#a7f3d0', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
              Badan kerja pemerintah yang bergerak di bidang riset dan standarisasi instrumen pertanian Republik Indonesia secara terpadu dan modern.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6ee7b7', lineHeight: 1.4, margin: 0 }}>
              🏢 Gedung E Lantai 2, Jl. Ragunan No. 29, Pasar Minggu, Jakarta Selatan 12540
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
                Katalog Bidang & Riset
              </Link>
              <Link href="/#alur" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Panduan & Alur Magang
              </Link>
              <Link href="/" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Beranda & Persyaratan
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
            © {new Date().getFullYear()} SIM-Magang BRMP. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span style={{ color: '#a7f3d0' }}>Syarat & Ketentuan</span>
            <span style={{ color: '#a7f3d0' }}>Kebijakan Privasi</span>
            <span style={{ color: '#a7f3d0' }}>Standar Pelayanan</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
