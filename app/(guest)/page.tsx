import Link from 'next/link'
import Image from 'next/image'
import { bidangService } from '@/lib/services/bidang.service'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { AppLogo } from '@/components/shared/app-logo'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

function getBidangIcon(nama: string = ''): string {
  const lower = (nama || '').toLowerCase()
  if (lower.includes('huma') || lower.includes('tik') || lower.includes('informasi') || lower.includes('komunikasi')) {
    return '💻'
  }
  if (lower.includes('admin') || lower.includes('tata') || lower.includes('kantor') || lower.includes('keuangan')) {
    return '🏢'
  }
  if (lower.includes('pustaka') || lower.includes('dokumen') || lower.includes('literasi') || lower.includes('arsip')) {
    return '📚'
  }
  if (lower.includes('kebijakan') || lower.includes('kerja') || lower.includes('program') || lower.includes('evaluasi') || lower.includes('kerjasama')) {
    return '🤝'
  }
  return '🌱'
}

function getBidangImage(nama: string = '', id: number | string = ''): string {
  const lower = (nama || '').toLowerCase()
  if (lower.includes('huma') || lower.includes('tik') || lower.includes('informasi') || lower.includes('komunikasi')) {
    return '/card_kehumasan_tik.png'
  }
  if (lower.includes('kebijakan') || lower.includes('kerja') || lower.includes('program') || lower.includes('evaluasi')) {
    return '/card_kebijakan_kerjasama.png'
  }
  if (lower.includes('pustaka') || lower.includes('dokumen') || lower.includes('literasi') || lower.includes('arsip')) {
    return '/card_perpustakaan.png'
  }
  if (lower.includes('admin') || lower.includes('tata') || lower.includes('kantor') || lower.includes('keuangan')) {
    return '/card_administrasi.png'
  }

  const list = ['/card_kehumasan_tik.png', '/card_kebijakan_kerjasama.png', '/card_administrasi.png', '/card_perpustakaan.png']
  const idNum = typeof id === 'number' ? id : parseInt(String(id), 10) || 1
  return list[(idNum - 1) % list.length]
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
  if (lower.includes('kebijakan') || lower.includes('kerja') || lower.includes('program') || lower.includes('evaluasi')) {
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

export default async function HomePage() {
  const supabase = await createClient()
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

  const userRole = profileData?.role || null

  // Ambil data bidang dari database Supabase sebagai Single Source of Truth
  const bidangResult = await bidangService.getPublicBidangs()
  const bidangs = bidangResult.data || []
  const bidangError = bidangResult.error

  const b0 = bidangs[0] || { id: 1, nama: 'Kehumasan, TIK & Komunikasi', kuota: 0 }
  const b1 = bidangs[1] || { id: 2, nama: 'Administrasi Perkantoran', kuota: 0 }
  const b2 = bidangs[2] || { id: 3, nama: 'Perpustakaan & Dokumentasi', kuota: 0 }
  const b3 = bidangs[3] || { id: 4, nama: 'Kebijakan & Kerjasama', kuota: 0 }

  const dashboardUrl = profileData?.role === 'administrator' ? '/admin/dashboard' : '/pengguna/dashboard'

  // Alur 5 Tahapan Magang Terstruktur
  const timelineSteps = [
    {
      num: '01',
      icon: '/step1_topik_pembimbing.png',
      title: 'Topik & Pembimbing',
      desc: 'Tentukan bidang fokus riset & kuota pembimbing.'
    },
    {
      num: '02',
      icon: '/step2_surat_pengantar.png',
      title: 'Surat Pengantar',
      desc: 'Siapkan surat pengantar resmi dari kampus / sekolah.'
    },
    {
      num: '03',
      icon: '/step3_daftar_sip.png',
      title: 'Daftar di SIM',
      desc: 'Isi formulir pengajuan online & upload berkas syarat.'
    },
    {
      num: '04',
      icon: '/step4_verifikasi_admin.png',
      title: 'Verifikasi Admin',
      desc: 'Pemeriksaan berkas & validasi oleh sekretariat.'
    },
    {
      num: '05',
      icon: '/step5_surat_balasan.png',
      title: 'Surat Balasan',
      desc: 'Terima surat balasan resmi & mulai magang.'
    }
  ]

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
        .bidang-card {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
          will-change: transform, box-shadow;
        }
        @media (hover: hover) and (pointer: fine) {
          .bidang-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 30px -6px rgba(0, 0, 0, 0.09), 0 6px 12px -2px rgba(0, 0, 0, 0.04) !important;
            border-color: #86efac !important;
          }
          .bidang-card:hover .bidang-img {
            transform: scale(1.06);
          }
          .bidang-card:hover .bidang-overlay {
            opacity: 0.15;
          }
        }
        .bidang-img {
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .bidang-overlay {
          transition: opacity 0.28s ease;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes subtle-float-left {
          0%, 100% { transform: translateX(-32px) translateY(0px); }
          50% { transform: translateX(-32px) translateY(-5px); }
        }
        @keyframes subtle-float-right {
          0%, 100% { transform: translateX(32px) translateY(0px); }
          50% { transform: translateX(32px) translateY(-5px); }
        }

        .floating-bidang-card {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
          will-change: transform, box-shadow;
        }
        .floating-bidang-card.left {
          animation: subtle-float-left 4.5s ease-in-out infinite;
        }
        .floating-bidang-card.right {
          animation: subtle-float-right 4.5s ease-in-out infinite 1.2s;
        }

        .floating-icon-box {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease;
          will-change: transform;
        }

        @media (hover: hover) and (pointer: fine) {
          .floating-bidang-card:hover {
            animation-play-state: paused;
            box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.35) !important;
            border-color: #22c55e !important;
          }
          .floating-bidang-card.left:hover {
            transform: translateX(-36px) translateY(-3px) scale(1.04) !important;
          }
          .floating-bidang-card.right:hover {
            transform: translateX(36px) translateY(-3px) scale(1.04) !important;
          }
          .floating-bidang-card:hover .floating-icon-box {
            transform: scale(1.2) rotate(8deg);
          }
        }

        .step-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          will-change: transform, box-shadow;
        }
        .step-icon-box {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease;
          will-change: transform;
        }
        @media (hover: hover) and (pointer: fine) {
          .step-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 22px -4px rgba(21, 128, 61, 0.12) !important;
            border-color: #86efac !important;
          }
          .step-card:hover .step-icon-box {
            transform: scale(1.15) translateY(-2px);
          }
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 2.25rem 1rem 2.75rem 1rem !important;
          }
          .floating-bidang-card {
            animation: none !important;
            max-width: 135px !important;
            padding: 0.4rem 0.5rem !important;
            border-radius: 10px !important;
          }
          .floating-bidang-card.left {
            transform: none !important;
          }
          .floating-bidang-card.right {
            transform: none !important;
          }
          .floating-icon-box {
            width: 26px !important;
            height: 26px !important;
            font-size: 0.85rem !important;
            border-radius: 6px !important;
          }
        }
      `}</style>
      {/* Header / Navbar Resmi BRMP Kementan */}
      <Navbar user={user} profile={profileData} activeKey="beranda" />

      {/* 1. HERO SECTION FULL-BLEED (Model SIP Biogen Kementan) */}
      <section className="hero-section" style={{
        backgroundColor: '#064e3b',
        backgroundImage: 'radial-gradient(circle at 75% 40%, #065f46 0%, #064e3b 85%)',
        color: '#ffffff',
        padding: '3.5rem 1.5rem 4rem 1.5rem',
        borderBottom: '1px solid #047857',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          {/* Kolom Kiri: Headline & CTA */}
          <div style={{ maxWidth: '540px' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h1 style={{
                color: '#ffffff',
                fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: 0
              }}>
                Sistem Informasi Magang
              </h1>
              <div style={{
                fontSize: 'clamp(2rem, 4vw, 2.85rem)',
                fontWeight: 900,
                fontStyle: 'italic',
                color: '#86efac',
                marginTop: '0.25rem',
                letterSpacing: '-0.03em',
                lineHeight: 1.15
              }}>
                BRMP Pengelola Hasil
              </div>
            </div>

            <p style={{
              fontSize: '0.9375rem',
              color: '#d1fae5',
              lineHeight: 1.6,
              margin: '0 0 2rem 0'
            }}>
              SIM (Sistem Informasi Magang) merupakan platform resmi untuk memfasilitasi mahasiswa dan siswa dalam melaksanakan kegiatan magang akademik, riset vokasi, dan pengujian mutu instrumen di lingkungan Balai Penerapan Standar Instrumen Pertanian (BRMP) Pengelola Hasil Kementerian Pertanian.
            </p>

            {/* CTA Button Hijau Cerah */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="#bidang"
                style={{
                  padding: '0.875rem 2rem',
                  backgroundColor: '#22c55e',
                  color: '#064e3b',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 900,
                  fontSize: '0.9375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                  transition: 'all 0.2s'
                }}
              >
                BIDANG MAGANG
              </a>

              <Link
                href={user ? dashboardUrl : '/register'}
                style={{
                  padding: '0.875rem 1.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                Mulai Pendaftaran →
              </Link>
            </div>
          </div>

          {/* Kolom Kanan: Karakter Utama Halus di Tengah & 4 Floating Cards di Sisi Luar */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '520px',
            width: '100%',
            maxWidth: '640px',
            margin: '0 auto'
          }}>
            {/* Backdrop Persegi Melengkung Halus (Ala SIP Biogen) */}
            <div style={{
              position: 'absolute',
              width: '320px',
              height: '430px',
              backgroundColor: '#043c2b',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
              zIndex: 0
            }} />

            {/* Gambar Karakter Anti-Aliased Halus di Tengah */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              zIndex: 1
            }}>
              <Image
                src="/g1_smooth.png"
                alt="Peserta Magang BRMP Kementan"
                width={684}
                height={684}
                priority
                style={{
                  width: '100%',
                  maxWidth: '350px',
                  height: 'auto',
                  maxHeight: '460px',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.35))'
                }}
              />
            </div>

            {/* 4 Floating Bidang Cards (Melayang di Sisi Luar, Bebas dari Wajah & Badan) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              pointerEvents: 'none',
              zIndex: 2
            }}>
              {/* Baris Atas: Bidang 1 (Kiri Luar) & Bidang 3 (Kanan Luar) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link
                  href={`/bidang/${b0.id}`}
                  className="floating-bidang-card left"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '14px',
                    boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    pointerEvents: 'auto',
                    textDecoration: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    transform: 'translateX(-32px)',
                    maxWidth: '210px'
                  }}
                >
                  <div className="floating-icon-box" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    {getBidangIcon(b0.nama)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {b0.nama}
                    </div>
                    <div style={{
                      fontSize: '0.625rem',
                      color: (b0.kuota || 0) > 0 ? '#15803d' : '#dc2626',
                      fontWeight: 700,
                      marginTop: '0.125rem'
                    }}>
                      ● {(b0.kuota || 0) > 0 ? `${b0.kuota} Slot Tersedia` : 'Kuota Penuh'}
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/bidang/${b2.id}`}
                  className="floating-bidang-card right"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '14px',
                    boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    pointerEvents: 'auto',
                    textDecoration: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    transform: 'translateX(32px)',
                    maxWidth: '210px'
                  }}
                >
                  <div className="floating-icon-box" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    {getBidangIcon(b2.nama)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {b2.nama}
                    </div>
                    <div style={{
                      fontSize: '0.625rem',
                      color: (b2.kuota || 0) > 0 ? '#15803d' : '#dc2626',
                      fontWeight: 700,
                      marginTop: '0.125rem'
                    }}>
                      ● {(b2.kuota || 0) > 0 ? `${b2.kuota} Slot Tersedia` : 'Kuota Penuh'}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Baris Bawah: Bidang 2 (Kiri Luar) & Bidang 4 (Kanan Luar) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link
                  href={`/bidang/${b1.id}`}
                  className="floating-bidang-card left"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '14px',
                    boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    pointerEvents: 'auto',
                    textDecoration: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    transform: 'translateX(-32px)',
                    maxWidth: '210px'
                  }}
                >
                  <div className="floating-icon-box" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: '#fffbeb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    {getBidangIcon(b1.nama)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {b1.nama}
                    </div>
                    <div style={{
                      fontSize: '0.625rem',
                      color: (b1.kuota || 0) > 0 ? '#15803d' : '#dc2626',
                      fontWeight: 700,
                      marginTop: '0.125rem'
                    }}>
                      ● {(b1.kuota || 0) > 0 ? `${b1.kuota} Slot Tersedia` : 'Kuota Penuh'}
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/bidang/${b3.id}`}
                  className="floating-bidang-card right"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '14px',
                    boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    pointerEvents: 'auto',
                    textDecoration: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    transform: 'translateX(32px)',
                    maxWidth: '210px'
                  }}
                >
                  <div className="floating-icon-box" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: '#f5f3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    {getBidangIcon(b3.nama)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {b3.nama}
                    </div>
                    <div style={{
                      fontSize: '0.625rem',
                      color: (b3.kuota || 0) > 0 ? '#15803d' : '#dc2626',
                      fontWeight: 700,
                      marginTop: '0.125rem'
                    }}>
                      ● {(b3.kuota || 0) > 0 ? `${b3.kuota} Slot Tersedia` : 'Kuota Penuh'}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '3rem 1.5rem 4rem 1.5rem',
        boxSizing: 'border-box'
      }}>
        {/* 2. Section Bidang Magang & Riset */}
        <section style={{ marginBottom: '4rem' }} id="bidang">
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Bidang Magang &amp; Riset
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Pilih bidang yang sesuai dengan minat dan kompetensi kamu.
            </p>
          </div>

          {/* Error State */}
          {bidangError && (
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              Gagal memuat katalog bidang: {bidangError}
            </div>
          )}

          {/* Empty State */}
          {!bidangError && bidangs.length === 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🌱</span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                Belum Ada Bidang Magang yang Dipublikasikan
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Silakan periksa kembali nanti atau hubungi sekretariat BRMP untuk informasi berikutnya.
              </p>
            </div>
          )}

          {/* Grid Kartu Bidang Visual */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {bidangs.map((b) => {
              const applyUrl = user
                ? (userRole === 'administrator' ? '/admin/bidang' : `/pengguna/career/step1?bidangId=${b.id}`)
                : `/login?redirect=/pengguna/career/step1?bidangId=${b.id}`

              const coverImage = getBidangImage(b.nama, b.id)
              const shortDesc = getBidangShortDesc(b.nama, b.deskripsi)
              const isAvailable = (b.kuota || 0) > 0

              return (
                <div
                  key={b.id}
                  className="bidang-card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div>
                    {/* Gambar Banner Visual (45-55% tinggi atas card) */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '180px',
                      backgroundColor: '#f1f5f9',
                      overflow: 'hidden'
                    }}>
                      <Image
                        src={coverImage}
                        alt={b.nama}
                        width={400}
                        height={220}
                        className="bidang-img"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      {/* Darkening Overlay saat Hover */}
                      <div
                        className="bidang-overlay"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: '#000000'
                        }}
                      />
                      {/* Badge Mahasiswa & SMK */}
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: '#ffffff',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 600
                      }}>
                        Mahasiswa &amp; SMK
                      </div>

                      {/* Status Kuota: Tersedia / Penuh */}
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2',
                        color: isAvailable ? '#15803d' : '#dc2626',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 700
                      }}>
                        {isAvailable ? '● Tersedia' : '● Penuh'}
                      </div>
                    </div>

                    {/* Card Content: Judul & 1 Kalimat Deskripsi */}
                    <div style={{ padding: '1rem 1.25rem 0.75rem 1.25rem' }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 0.35rem 0',
                        lineHeight: 1.3
                      }}>
                        {b.nama}
                      </h3>

                      <p style={{
                        fontSize: '0.8125rem',
                        color: '#64748b',
                        lineHeight: 1.45,
                        margin: '0 0 0.75rem 0'
                      }}>
                        {shortDesc}
                      </p>

                      <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>
                        {b.kuota || 0} Slot tersedia
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Action Buttons */}
                  <div style={{
                    padding: '0.75rem 1.25rem 1.25rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Link
                      href={`/bidang/${b.id}`}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#475569',
                        textDecoration: 'none',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s'
                      }}
                    >
                      Detail
                    </Link>

                    <Link
                      href={applyUrl}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: isAvailable ? '#15803d' : '#94a3b8',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        pointerEvents: isAvailable ? 'auto' : 'none',
                        boxShadow: isAvailable ? '0 2px 6px rgba(21, 128, 61, 0.2)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Daftar
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 3. Section Alur Magang (Connected Timeline) */}
        <section style={{ marginBottom: '4rem' }} id="alur">
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Alur Magang
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Tahapan resmi penerimaan hingga penyelesaian magang di BRMP Kementan.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            position: 'relative'
          }}>
            {timelineSteps.map((step) => (
              <div
                key={step.num}
                className="step-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                    <span style={{
                      fontSize: '1.125rem',
                      fontWeight: 900,
                      color: '#15803d',
                      letterSpacing: '-0.02em'
                    }}>
                      {step.num}
                    </span>
                    <div className="step-icon-box" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #bbf7d0'
                    }}>
                      <Image
                        src={step.icon}
                        alt={step.title}
                        width={28}
                        height={28}
                        style={{
                          width: '28px',
                          height: '28px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

          {/* Footer Resmi BRMP Kementan */}
          <footer style={{
            backgroundColor: '#064e3b',
            color: '#ecfdf5',
            borderTop: '1px solid #047857',
            padding: '3rem 1.5rem 2rem 1.5rem',
            marginTop: 'auto'
          }}>
            <div style={{
              maxWidth: '1240px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '2.5rem',
              marginBottom: '2.5rem'
            }}>
              {/* Info Institusi */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AppLogo size={36} />
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
                    SIM-Magang BRMP
                  </span>
                </div>
              </div>

              {/* Navigasi Cepat */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>
                  NAVIGASI CEPAT
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
                  <Link href={dashboardUrl} style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                    Beranda Utama
                  </Link>
                  <a href="#bidang" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                    Katalog Bidang &amp; Riset
                  </a>
                  <a href="#alur" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                    Alur Magang
                  </a>
                  <Link href="/kontak" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                    Bantuan &amp; Helpdesk
                  </Link>
                </div>
              </div>

              {/* Kontak & Lokasi */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>
                  SEKRETARIAT BRMP
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: '#a7f3d0', lineHeight: 1.5 }}>
                  <div>
                    <a
                      href="https://www.google.com/maps/place/Balai+Pengelola+Hasil+Perakitan+dan+Modernisasi+Pertanian/@-6.5893588,106.7998551,17z/data=!3m1!4b1!4m6!3m5!1s0x2e69c5ccf0c9dc05:0xd84bcc2b4c0158c9!8m2!3d-6.5893641!4d106.80243!16s%2Fg%2F1tcwc2r_?entry=ttu"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#a7f3d0', textDecoration: 'none' }}
                    >
                      Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian ↗
                    </a>
                  </div>
                  <div>Email: magang.brmp@pertanian.go.id</div>
                  <div>WhatsApp: +62 811-9284-550</div>
                </div>
              </div>
            </div>

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
              color: '#86efac'
            }}>
              <div>© {new Date().getFullYear()} Kementerian Pertanian Republik Indonesia (SIM-Magang BRMP). Hak Cipta Dilindungi.</div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <Link href="/kontak" style={{ color: '#86efac', textDecoration: 'none' }}>Syarat &amp; Ketentuan</Link>
                <Link href="/kontak" style={{ color: '#86efac', textDecoration: 'none' }}>Kebijakan Privasi</Link>
              </div>
            </div>
          </footer>
        </div>
        )
}
