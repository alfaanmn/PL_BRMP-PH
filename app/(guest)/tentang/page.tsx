import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { AppLogo } from '@/components/shared/app-logo'
import type { AppRole } from '@/types/auth.types'
import {
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LayersIcon,
} from '@/components/ui/admin-icons'

export const dynamic = 'force-dynamic'

export default async function TentangPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
        name: profile.name || null,
      }
    }
  }

  const berandaUrl = profileData?.role === 'pengguna' ? '/pengguna/dashboard' : '/'
  const bidangUrl = profileData?.role === 'pengguna' ? '/pengguna/dashboard#bidang' : '/#bidang'
  const daftarUrl = user ? (profileData?.role === 'administrator' ? '/admin/dashboard' : '/pengguna/dashboard') : '/register'

  // 4 Lingkup Bidang Magang Resmi
  const bidangList = [
    {
      title: 'Kehumasan, TIK & Komunikasi',
      desc: 'Pengelolaan teknologi informasi, publikasi ilmiah, multimedia, dan komunikasi publik institusi.',
      icon: '💻',
    },
    {
      title: 'Administrasi Perkantoran',
      desc: 'Tata kelola persuratan, kearsipan, administrasi umum, dan pelayanan ketatausahaan balai.',
      icon: '🏢',
    },
    {
      title: 'Perpustakaan & Dokumentasi',
      desc: 'Pengelolaan koleksi literatur pertanian, repositori dokumen teknis, dan layanan informasi riset.',
      icon: '📚',
    },
    {
      title: 'Kebijakan & Kerjasama',
      desc: 'Dukungan koordinasi kemitraan, telaah program kerja, serta evaluasi kerjasama instansi.',
      icon: '🤝',
    },
  ]

  // 3 Prinsip Layanan SIM-Magang
  const prinsipLayanan = [
    {
      title: 'Transparan & Terpantau',
      desc: 'Pemohon dapat memantau setiap tahapan verifikasi dan status pengajuan secara real-time.',
    },
    {
      title: 'Bimbingan Terarah',
      desc: 'Penempatan bidang disesuaikan dengan fokus keilmuan dan ketersediaan pembimbing.',
    },
    {
      title: 'Administrasi Terpadu',
      desc: 'Pengelolaan berkas satu pintu mulai dari pendaftaran online hingga penerbitan surat balasan resmi.',
    },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
      }}
    >
      <style>{`
        .tentang-card-hover {
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .tentang-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          border-color: #cbd5e1 !important;
        }
        .cta-btn-primary {
          transition: background-color 0.15s ease, transform 0.15s ease;
        }
        .cta-btn-primary:hover {
          background-color: #16a34a !important;
          transform: translateY(-1px);
        }
        .cta-btn-secondary {
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .cta-btn-secondary:hover {
          background-color: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        @media (max-width: 860px) {
          .tentang-split-layout {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .tentang-bidang-grid {
            grid-template-columns: 1fr !important;
          }
          .tentang-main-container {
            padding: 2rem 1rem 4rem 1rem !important;
          }
        }
      `}</style>

      {/* 1. Header / Navbar Resmi */}
      <Navbar user={user} profile={profileData} />

      {/* 2. Main Content (Clean Layout selaras /kontak) */}
      <main
        className="tentang-main-container"
        style={{
          maxWidth: '1140px',
          width: '100%',
          margin: '0 auto',
          padding: '3rem 1.5rem 5rem 1.5rem',
          boxSizing: 'border-box',
          flex: 1,
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#15803d',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.375rem',
            }}
          >
            Tentang Kami
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.875rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            Sistem Informasi Manajemen Magang
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.6,
              maxWidth: '680px',
            }}
          >
            Platform resmi pelayanan penerimaan magang, penelitian, dan praktik kerja lapangan bagi
            mahasiswa serta siswa vokasi di lingkungan BRMP Pengelola Hasil.
          </p>
        </div>

        {/* Split Grid: Kiri Profil & Nilai, Kanan Foto Kantor & Action */}
        <div
          className="tentang-split-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '3.5rem',
            alignItems: 'start',
            marginBottom: '4rem',
          }}
        >
          {/* KOLOM KIRI: Profil & Misi Layanan */}
          <div>
            {/* Section: Profil Institusi */}
            <div style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#15803d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.625rem',
                }}
              >
                <LayersIcon width={14} height={14} />
                <span>PROFIL LAYANAN</span>
              </div>

              <strong
                style={{
                  fontSize: '17px',
                  color: '#0f172a',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                BRMP Pengelola Hasil
              </strong>

              <p
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: 1.65,
                  margin: '0 0 1rem 0',
                }}
              >
                SIM-Magang dikembangkan untuk memberikan kemudahan akses, transparansi proses
                seleksi, dan tertib administrasi dalam penyelenggaraan program magang akademik
                maupun praktik kerja lapangan (PKL).
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.875rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              >
                <MapPinIcon width={16} height={16} className="text-emerald-700 mt-0.5 shrink-0" />
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                    Kementerian Pertanian Republik Indonesia
                  </strong>
                  Kompleks Balai Standardisasi Instrumen Pascapanen Pertanian
                </div>
              </div>
            </div>

            {/* Section: Prinsip Layanan */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#15803d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}
              >
                PRINSIP LAYANAN
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {prinsipLayanan.map((item, idx) => (
                  <div
                    key={idx}
                    className="tentang-card-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }}>
                      <CheckCircleIcon width={16} height={16} />
                    </div>
                    <div>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: '#0f172a',
                          fontWeight: 700,
                          display: 'block',
                          marginBottom: '2px',
                        }}
                      >
                        {item.title}
                      </strong>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Visual Foto Kantor & Card Quick Action */}
          <div>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
              }}
            >
              {/* Foto Kantor Resmi BRMP_PH */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  backgroundColor: '#f1f5f9',
                }}
              >
                <Image
                  src="/BRMP_PH.png"
                  alt="Gedung Kantor BRMP Pengelola Hasil"
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>

              {/* Box Konten Bawah Foto */}
              <div style={{ padding: '1.5rem' }}>
                <span
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#15803d',
                    border: '1px solid #a7f3d0',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    display: 'inline-block',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Pusat Layanan Magang
                </span>

                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 0.5rem 0',
                    lineHeight: 1.3,
                  }}
                >
                  Mulai Pengajuan Magang Anda
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    margin: '0 0 1.25rem 0',
                    lineHeight: 1.5,
                  }}
                >
                  Pelajari bidang yang tersedia dan siapkan dokumen persyaratan resmi dari institusi
                  pendidikan Anda.
                </p>

                {/* Tombol CTA Quick Route */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <Link
                    href={bidangUrl}
                    className="cta-btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1rem',
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <span>Lihat Bidang Magang</span>
                    <ArrowRightIcon width={14} height={14} />
                  </Link>

                  <Link
                    href={daftarUrl}
                    className="cta-btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1rem',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <span>{user ? 'Buka Dashboard' : 'Daftar Akun Baru'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION BAWAH: 4 Fokus Bidang Magang */}
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#15803d',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
              }}
            >
              FOKUS KEGIATAN
            </div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              4 Bidang Penempatan Magang
            </h2>
          </div>

          <div
            className="tentang-bidang-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
            }}
          >
            {bidangList.map((bidang, idx) => (
              <div
                key={idx}
                className="tentang-card-hover"
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  {bidang.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    {bidang.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: '#64748b',
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {bidang.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 3. Footer Resmi BRMP Kementan */}
      <footer
        style={{
          backgroundColor: '#064e3b',
          color: '#ecfdf5',
          borderTop: '1px solid #047857',
          padding: '2.5rem 1.5rem 1.5rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {/* Info Balai */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '0.75rem',
              }}
            >
              <AppLogo size={32} />
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                SIM-Magang BRMP
              </span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: '#a7f3d0',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Portal Sistem Informasi Manajemen Magang Badan Riset dan Manajemen Pertanian
              Pengelola Hasil Kementerian Pertanian Republik Indonesia.
            </p>
          </div>

          {/* Navigasi Cepat */}
          <div>
            <h4
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 0.875rem 0',
              }}
            >
              Navigasi
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '13px',
              }}
            >
              <Link href={berandaUrl} style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Beranda Utama
              </Link>
              <Link href="/#bidang" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Bidang Magang
              </Link>
              <Link href="/kontak" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Kontak &amp; Informasi
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            paddingTop: '1.25rem',
            borderTop: '1px solid #047857',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '12px',
            color: '#6ee7b7',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} BRMP Pengelola Hasil Kementerian Pertanian RI. Hak
            Cipta Dilindungi.
          </div>
        </div>
      </footer>
    </div>
  )
}
