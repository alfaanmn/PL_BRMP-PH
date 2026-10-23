import React from 'react'
import Link from 'next/link'
import { AppLogo } from '@/components/shared/app-logo'

interface FooterProps {
  berandaUrl?: string
  dashboardUrl?: string
}

/**
 * Komponen Reusable Footer Global SIMPUL BRMP-PH
 * Digunakan serentak di semua halaman publik (Home, Tentang, Kontak, Bidang Detail)
 */
export function Footer({
  berandaUrl = '/',
  dashboardUrl,
}: FooterProps) {
  const currentYear = new Date().getFullYear()
  const homeLink = dashboardUrl || berandaUrl

  return (
    <footer
      style={{
        backgroundColor: '#064e3b',
        color: '#ecfdf5',
        borderTop: '1px solid #047857',
        padding: '3rem 1.5rem 2rem 1.5rem',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Kolom 1: Logo & Nama Lengkap Lembaga */}
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.875rem',
              marginBottom: '0.875rem',
            }}
          >
            {/* Ukuran logo dapat disesuaikan pada properti size={...} */}
            <AppLogo size={56} variant="simpul" alt="Logo SIMPUL BRMP-PH" />
            <div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  marginBottom: '0.25rem',
                }}
              >
                SIMPUL
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#d1fae5',
                  lineHeight: 1.45,
                }}
              >
                Sistem Informasi Magang dan
                <br />
                Pelatihan Unggulan Lanjutan
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Navigasi Cepat */}
        <div>
          <h4
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 1rem 0',
            }}
          >
            NAVIGASI CEPAT
          </h4>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
              fontSize: '0.8125rem',
            }}
          >
            <Link href={homeLink} style={{ color: '#a7f3d0', textDecoration: 'none' }}>
              Beranda Utama
            </Link>
            <Link href="/#bidang" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
              Katalog Bidang &amp; Riset
            </Link>
            <Link href="/#alur" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
              Alur Magang
            </Link>
            <Link href="/kontak" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
              Bantuan &amp; Helpdesk
            </Link>
          </div>
        </div>

        {/* Kolom 3: Alamat Kantor & Kontak */}
        <div>
          <h4
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 1rem 0',
            }}
          >
            ALAMAT KANTOR
          </h4>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: '#a7f3d0',
              lineHeight: 1.5,
            }}
          >
            <div>
              Jl. Salak Kel No.22, RT.03/RW.04, Babakan, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16128
            </div>
            <div>
              Email:{' '}
              <a
                href="mailto:brmp.pengelolahasil@pertanian.go.id"
                style={{ color: '#a7f3d0', textDecoration: 'none' }}
              >
                brmp.pengelolahasil@pertanian.go.id
              </a>
            </div>
            <div>
              WhatsApp:{' '}
              <a
                href="https://wa.me/6281805503899"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#a7f3d0', textDecoration: 'none' }}
              >
                +62 818-0550-3899
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Baris Bawah: Copyright Resmi Sesuai Standar Kementan */}
      <div
        style={{
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
          color: '#86efac',
        }}
      >
        <div>
          © {currentYear} BRMP Pengelola Hasil — Kementerian Pertanian RI.
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/kontak" style={{ color: '#86efac', textDecoration: 'none' }}>
            Syarat &amp; Ketentuan
          </Link>
          <Link href="/kontak" style={{ color: '#86efac', textDecoration: 'none' }}>
            Kebijakan Privasi
          </Link>
        </div>
      </div>
    </footer>
  )
}
