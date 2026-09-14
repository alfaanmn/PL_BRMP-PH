import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

export default async function KontakPage() {
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

  const berandaUrl = profileData?.role === 'pengguna' ? '/pengguna/dashboard' : '/'

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
      {/* 1. Header / Navbar Resmi BRMP Kementan */}
      <Navbar user={user} profile={profileData} activeKey="kontak" />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem 1.5rem',
        boxSizing: 'border-box'
      }}>
        {/* Top Header & Status Layanan Meja Bantuan */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              marginBottom: '0.625rem'
            }}>
              <span>🏢</span>
              <span>Layanan Bantuan Terpadu Pelamar Magang</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.025em'
            }}>
              Kontak & Layanan Informasi SIM-Magang
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#64748b',
              margin: 0,
              maxWidth: '680px',
              lineHeight: 1.5
            }}>
              Pusat bantuan resmi dan sekretariat administrasi magang Balai Penerapan Standar Instrumen Pertanian (BRMP) Kementerian Pertanian Republik Indonesia.
            </p>
          </div>

          {/* Status Meja Bantuan Pill */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.875rem 1.25rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              STATUS LAYANAN MEJA BANTUAN
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#15803d' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                display: 'inline-block'
              }}/>
              <span>Aktif • Jam Kerja Resmi 08.00 - 16.00 WIB</span>
            </div>
          </div>
        </div>

        {/* 3 Cards Top Grid (Sekretariat, Saluran Daring, Waktu Konsultasi) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Card 1: Sekretariat BRMP */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}>
            <div>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                marginBottom: '1rem'
              }}>
                🏛️
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                SEKRETARIAT BRMP
              </span>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Kantor Pusat BRMP Kementan RI
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                Jl. Ragunan No. 29, Pasar Minggu, Jakarta Selatan, DKI Jakarta 12540
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.375rem 0.625rem',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                color: '#475569',
                fontWeight: 600
              }}>
                <span>🏢</span>
                <span>Gedung Pelayanan Publik & Lab Pengujian</span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <a
                href="https://maps.google.com/?q=-6.2942,106.8228"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#15803d',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>Petunjuk Arah Rute</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Card 2: Saluran Daring */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}>
            <div>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                marginBottom: '1rem'
              }}>
                🎧
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                SALURAN DARING
              </span>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
                Elektronik & Helpdesk
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>✉️</span>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>Email Resmi Administrasi:</span>
                    <strong style={{ color: '#0f172a' }}>magang.brmp@pertanian.go.id</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>📞</span>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>Telepon / Faksimili:</span>
                    <strong style={{ color: '#0f172a' }}>(021) 7804168</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a' }}>💬</span>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>WhatsApp Konsultasi Cepat:</span>
                    <strong style={{ color: '#15803d' }}>+62 811-9284-550</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>⏱</span>
              <span>Respon dalam kurun 1x24 jam kerja</span>
            </div>
          </div>

          {/* Card 3: Waktu Konsultasi */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}>
            <div>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                marginBottom: '1rem'
              }}>
                🕒
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                WAKTU KONSULTASI
              </span>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
                Jam Operasional Kantor
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#166534' }}>
                    <span>Senin – Kamis</span>
                    <span>08.00 – 16.00 WIB</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#15803d' }}>Istirahat: 12.00 – 13.00 WIB</span>
                </div>

                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#166534' }}>
                    <span>Jumat</span>
                    <span>08.00 – 16.30 WIB</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#15803d' }}>Istirahat: 11.30 – 13.00 WIB</span>
                </div>

                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <span>🚫</span>
                  <span>Sabtu, Minggu & Libur Nasional: Tutup</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>📅</span>
              <span>Mengikuti kalender resmi SKB 3 Menteri</span>
            </div>
          </div>
        </div>

        {/* 2 Kolom: Peta Lokasi (Kiri) + Form Pertanyaan & Masukan (Kanan) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
          marginBottom: '2.5rem'
        }}>
          {/* KOLOM KIRI: Peta Lokasi Kantor BRMP */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                  LOKASI FISIK BALAI
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0' }}>
                  Peta Lokasi Kantor BRMP
                </h2>
              </div>
              <a
                href="https://maps.google.com/?q=Badan+Riset+dan+Manajemen+Pertanian+Kementan"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>Buka di Google Maps</span>
                <span>↗</span>
              </a>
            </div>

            {/* Google Maps Container */}
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              position: 'relative',
              marginBottom: '1rem',
              height: '280px',
              backgroundColor: '#e2e8f0'
            }}>
              <iframe
                title="Peta Lokasi Kantor BRMP Kementan"
                src="https://maps.google.com/maps?q=-6.2942,106.8228&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Overlay Badge Pin */}
              <div style={{
                position: 'absolute',
                bottom: '0.75rem',
                left: '0.75rem',
                right: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(4px)',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.625rem 0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.875rem'
                }}>
                  📍
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ fontSize: '0.75rem', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                    Sekretariat Pengelola Magang
                  </strong>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', lineHeight: 1.2 }}>
                    Kompleks Badan Penelitian Pertanian, Jl. Ragunan 29
                  </span>
                  <span style={{ fontSize: '0.625rem', color: '#15803d', fontWeight: 600 }}>
                    Titik Koordinat Resmi: -6.2942, 106.8228
                  </span>
                </div>
              </div>
            </div>

            {/* Transit Points Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '0.625rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#166534',
                fontWeight: 600
              }}>
                <span>🚌</span>
                <span>Halte TransJakarta Ragunan / Pertanian (500m)</span>
              </div>
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '0.625rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#166534',
                fontWeight: 600
              }}>
                <span>🚆</span>
                <span>Stasiun KRL Pasar Minggu (± 2.5 km)</span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Form Pertanyaan & Masukan */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FORM PERTANYAAN & MASUKAN
              </span>
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 700
              }}>
                Responsif
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Ajukan Pertanyaan
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
              Gunakan formulir ini untuk perihal kelayakan berkas, kesesuaian unit kerja, atau konsultasi penerimaan.
            </p>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} action="#">
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                  Nama Lengkap <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Sesuai KTP / KTM Mahasiswa"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                    Alamat Email <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="nama@kampus.ac.id"
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                    Universitas / Sekolah <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Asal Instansi Akademik"
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                  Perihal Pertanyaan <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    outline: 'none'
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Pilih Kategori Kendala / Topik...</option>
                  <option value="berkas">Kelayakan & Verifikasi Berkas</option>
                  <option value="bidang">Kesesuaian Bidang & Pembimbing</option>
                  <option value="jadwal">Jadwal & Periode Pelaksanaan Magang</option>
                  <option value="teknis">Kendala Teknis Aplikasi / Akun</option>
                  <option value="lainnya">Lainnya / Konsultasi Umum</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                  Rincian Pesan / Pertanyaan <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Uraikan kendala atau informasi yang Anda butuhkan secara jelas..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '0.8125rem 1.25rem',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.3)',
                  marginTop: '0.25rem'
                }}
              >
                <span>✉️</span>
                <span>Kirim Pesan Bantuan</span>
              </button>
            </form>

            <div style={{
              marginTop: '1rem',
              paddingTop: '0.875rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem'
            }}>
              <span style={{ color: '#64748b' }}>Butuh respon segera via chat?</span>
              <a
                href="https://wa.me/628119284550?text=Halo%20Admin%20SIM-Magang%20BRMP%20Kementan,%20saya%20ingin%20bertanya%20seputar%20magang."
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#15803d', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>WhatsApp Helpdesk</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Saluran Informasi Publik & Media Sosial Resmi (4 Cards) */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                TAUTAN LEMBAGA TERKAIT
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0' }}>
                Saluran Informasi Publik & Media Sosial Resmi
              </h2>
            </div>
            <a
              href="https://www.pertanian.go.id"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span>Portal Pertanian.go.id</span>
              <span>↗</span>
            </a>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            {/* 1. Portal Kementan */}
            <a
              href="https://www.pertanian.go.id"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  🌐
                </div>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>Portal Kementan RI</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>pertanian.go.id</span>
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>↗</span>
            </a>

            {/* 2. Instagram */}
            <a
              href="https://www.instagram.com/kementerianpertanian/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#fdf2f8',
                  color: '#db2777',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  📷
                </div>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>Instagram Resmi</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>@kementerianpertanian</span>
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>↗</span>
            </a>

            {/* 3. YouTube BRMP */}
            <a
              href="https://www.youtube.com/@brmppengelolahasil"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  ▶️
                </div>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>YouTube BRMP</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Kanal Standardisasi Pertanian</span>
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>↗</span>
            </a>

            {/* 4. Layanan PPID */}
            <a
              href="https://ppid.pertanian.go.id"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  🏛️
                </div>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>Layanan PPID</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Keterbukaan Informasi Publik</span>
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>↗</span>
            </a>
          </div>
        </div>

        {/* Banner Komitmen Bebas Gratifikasi & Pungutan Liar (WBS) */}
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', maxWidth: '800px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#15803d',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '1.125rem'
            }}>
              🛡️
            </div>
            <div>
              <strong style={{ fontSize: '0.9375rem', color: '#065f46', display: 'block', marginBottom: '0.25rem' }}>
                Komitmen Bebas Gratifikasi & Pungutan Liar
              </strong>
              <p style={{ fontSize: '0.8125rem', color: '#047857', margin: 0, lineHeight: 1.45 }}>
                Seluruh proses registrasi, seleksi, pembimbingan teknis, dan sertifikasi magang di lingkungan Kementerian Pertanian RI <strong>TIDAK DIPUNGUT BIAYA (100% GRATIS)</strong>. Laporkan indikasi pelanggaran melalui Whistleblowing System (WBS) Pertanian.
              </p>
            </div>
          </div>

          <a
            href="https://wbs.pertanian.go.id"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #86efac',
              color: '#15803d',
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <span>Pengaduan WBS</span>
            <span>🛡️</span>
          </a>
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
              Portal resmi penerimaan dan pengelolaan magang/riset instrumen pertanian Republik Indonesia. Mengembangkan kapabilitas agrikultur nasional yang berstandar internasional dan berintegritas tinggi.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6ee7b7', lineHeight: 1.4, margin: 0 }}>
              🏢 Gedung E, Lantai 4 Kantor Pusat Kementerian Pertanian<br/>
              Jl. Harsono RM No. 3, Ragunan, Pasar Minggu, Jakarta Selatan 12550
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
              <Link href={berandaUrl} style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Beranda Utama
              </Link>
              <Link href="/#bidang" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Katalog Unit & Bidang
              </Link>
              <Link href="/#alur" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Pedoman & Alur Seleksi
              </Link>
              <Link href="/kontak" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                Bantuan & Pengaduan
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
                <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.75rem' }}>Surat Elektronik:</strong>
                <span>brmp@pertanian.go.id</span>
              </div>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.75rem' }}>Call Center:</strong>
                <span>(021) 7806202 / 7804344</span>
              </div>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.75rem' }}>Jam Layanan:</strong>
                <span>Senin - Jumat: 08.00 - 16.00 WIB</span>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <span style={{ color: '#6ee7b7', fontSize: '0.75rem' }}>🛡️ Sistem Informasi Resmi Kementan RI</span>
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
            © {new Date().getFullYear()} Kementerian Pertanian Republik Indonesia. Hak Cipta Dilindungi.
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
