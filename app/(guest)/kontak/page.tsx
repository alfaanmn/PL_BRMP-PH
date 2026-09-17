import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { AppLogo } from '@/components/shared/app-logo'
import type { AppRole } from '@/types/auth.types'
import {
  InstagramIcon,
  FacebookIcon,
  XIcon,
  TikTokIcon,
  YouTubeIcon,
  MapPinIcon,
  MailIcon,
  WhatsAppIcon,
  ExternalLinkIcon,
} from '@/components/ui/admin-icons'

export const dynamic = 'force-dynamic'

interface SocialPillItem {
  name: string
  url: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}

export default async function KontakPage() {
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

  // 5 Media Sosial Resmi BRMP
  const socialPills: SocialPillItem[] = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/brmp.pengelola.hasil/',
      icon: <InstagramIcon width={14} height={14} />,
      iconBg: '#e1306c',
      iconColor: '#ffffff',
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com/@brmppengelolahasil?si=skP8GGfRCHD5bIda',
      icon: <YouTubeIcon width={14} height={14} />,
      iconBg: '#ff0000',
      iconColor: '#ffffff',
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@brmp.pengelola.hasil',
      icon: <TikTokIcon width={14} height={14} />,
      iconBg: '#000000',
      iconColor: '#ffffff',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/profile.php?id=100092450928563',
      icon: <FacebookIcon width={14} height={14} />,
      iconBg: '#1877f2',
      iconColor: '#ffffff',
    },
    {
      name: 'X (Twitter)',
      url: 'https://x.com/brmpkelolahasil',
      icon: <XIcon width={13} height={13} />,
      iconBg: '#0f172a',
      iconColor: '#ffffff',
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
        .contact-row-item {
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .contact-row-item:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
        }
        .social-pill {
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .social-pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border-color: #94a3b8 !important;
        }
        @media (max-width: 860px) {
          .kontak-split-layout {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .kontak-main-container {
            padding: 2rem 1rem 4rem 1rem !important;
          }
        }
      `}</style>

      {/* 1. Header / Navbar Resmi */}
      <Navbar user={user} profile={profileData} activeKey="kontak" />

      {/* 2. Main Content (Clean 2-Column Layout) */}
      <main
        className="kontak-main-container"
        style={{
          maxWidth: '1140px',
          width: '100%',
          margin: '0 auto',
          padding: '3rem 1.5rem 5rem 1.5rem',
          boxSizing: 'border-box',
          flex: 1,
        }}
      >
        <div
          className="kontak-split-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '3.5rem',
            alignItems: 'start',
          }}
        >
          {/* KOLOM KIRI: Informasi & Kontak Langsung */}
          <div>
            {/* Header Text */}
            <div style={{ marginBottom: '2rem' }}>
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
                Kontak
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
                Hubungi Kami
              </h1>

              <p
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0,
                  lineHeight: 1.55,
                  maxWidth: '520px',
                }}
              >
                Silakan hubungi kami untuk informasi lebih lanjut mengenai program magang di BRMP
                Pengelola Hasil.
              </p>
            </div>

            {/* Section: LOKASI KANTOR */}
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
                  marginBottom: '0.5rem',
                }}
              >
                <MapPinIcon width={14} height={14} />
                <span>LOKASI KANTOR</span>
              </div>

              <strong
                style={{
                  fontSize: '15px',
                  color: '#0f172a',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                BRMP Pengelola Hasil
              </strong>

              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Kompleks Balai Standardisasi Instrumen Pascapanen Pertanian, Kementerian Pertanian RI
              </p>
            </div>

            {/* Section: KONTAK LANGSUNG */}
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
                  marginBottom: '0.75rem',
                }}
              >
                <span>💬</span>
                <span>KONTAK LANGSUNG</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Baris WhatsApp */}
                <a
                  href="https://wa.me/6281805503899"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-row-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <WhatsAppIcon width={20} height={20} />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          display: 'block',
                          lineHeight: 1.2,
                        }}
                      >
                        WhatsApp Resmi
                      </span>
                      <strong
                        style={{
                          fontSize: '14px',
                          color: '#0f172a',
                          fontWeight: 700,
                          display: 'block',
                        }}
                      >
                        0818 0550 3899
                      </strong>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>Chat</span>
                    <span>→</span>
                  </span>
                </a>

                {/* Baris Email */}
                <a
                  href="mailto:brmp.pengelolahasil@pertanian.go.id"
                  className="contact-row-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <MailIcon width={18} height={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          display: 'block',
                          lineHeight: 1.2,
                        }}
                      >
                        Surat Elektronik
                      </span>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: '#0f172a',
                          fontWeight: 700,
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        brmp.pengelolahasil@pertanian.go.id
                      </strong>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      flexShrink: 0,
                    }}
                  >
                    <span>Kirim</span>
                    <span>→</span>
                  </span>
                </a>
              </div>
            </div>

            {/* Section: MEDIA SOSIAL (Pills) */}
            <div>
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
                  marginBottom: '0.75rem',
                }}
              >
                <span>🌐</span>
                <span>MEDIA SOSIAL</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                {socialPills.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-pill"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.875rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '9999px',
                      textDecoration: 'none',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: item.iconBg,
                        color: item.iconColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Card Peta Lokasi */}
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
              {/* Embed Google Maps */}
              <div style={{ width: '100%', height: '280px', backgroundColor: '#e2e8f0' }}>
                <iframe
                  title="Peta Lokasi BRMP Pengelola Hasil"
                  src="https://maps.google.com/maps?q=BRMP+Pengelola+Hasil&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Bottom Info inside Card */}
              <div style={{ padding: '1.5rem' }}>
                <span
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#15803d',
                    border: '1px solid #a7f3d0',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '0.625rem',
                  }}
                >
                  Peta Lokasi
                </span>

                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 0.375rem 0',
                  }}
                >
                  BRMP Pengelola Hasil
                </h3>

                <p
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    lineHeight: 1.5,
                    margin: '0 0 1.25rem 0',
                  }}
                >
                  Kompleks Balai Standardisasi Instrumen Pascapanen Pertanian, Kementerian Pertanian RI.
                </p>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=BRMP+Pengelola+Hasil"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1.25rem',
                    backgroundColor: '#155c3a',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(21, 92, 58, 0.2)',
                  }}
                >
                  <span>Buka di Google Maps</span>
                  <ExternalLinkIcon width={13} height={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer Resmi */}
      <footer
        style={{
          backgroundColor: '#064e3b',
          color: '#d1fae5',
          padding: '2.5rem 1.5rem 2rem 1.5rem',
          marginTop: 'auto',
          borderTop: '1px solid #047857',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
              <Link href="/kontak" style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}>
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
