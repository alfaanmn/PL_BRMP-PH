import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bidangService } from '@/lib/services/bidang.service'
import { PenggunaHeaderNav } from '@/components/layout/pengguna-header-nav'

export const dynamic = 'force-dynamic'

export default async function PenggunaDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil profil pemohon dari public.profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Guard: Hanya role 'pengguna' yang boleh mengakses
  if (profile?.role !== 'pengguna') {
    redirect('/admin/dashboard')
  }

  // Cek apakah user memiliki pengajuan aktif di database
  const { data: pengajuans } = await supabase
    .from('pengajuans')
    .select('id, public_id, status, created_at, bidang_id, bidangs(nama)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Ambil daftar bidang magang real-time dari Supabase
  const bidangResult = await bidangService.getPublicBidangs()
  const bidangs = bidangResult.data || []
  const bidangError = bidangResult.error

  const latestPengajuan = pengajuans && pengajuans.length > 0 ? pengajuans[0] : null

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
      {/* Header / Navbar Pengguna */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.875rem 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Logo Brand */}
          <Link href="/pengguna/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.125rem'
            }}>
              SM
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', display: 'block' }}>
                SIM-MAGANG
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Portal Pemohon
              </span>
            </div>
          </Link>

          {/* Nav Links & Profile Action */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <a href="#alur" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Alur Magang
            </a>
            <a href="#bidang" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Daftar Bidang
            </a>

            <PenggunaHeaderNav userName={profile?.name || user.email?.split('@')[0] || ''} userEmail={user.email || ''} />
          </nav>
        </div>
      </header>

      {/* Hero Section Pengguna */}
      <section style={{
        padding: '3.5rem 2rem 3rem 2rem',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ maxWidth: '720px' }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                padding: '0.375rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Area Pemohon Magang
              </div>
              <h1 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                margin: '0 0 1rem 0'
              }}>
                Selamat Datang, {profile?.name || user.email?.split('@')[0]}!
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#475569',
                lineHeight: 1.6,
                margin: '0 0 2rem 0'
              }}>
                Ajukan permohonan magang baru, lengkapi berkas persyaratan, dan pantau status proses validasi dari instansi secara langsung.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  href="/pengguna/career/step1"
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>✨ Ajukan Magang Sekarang</span>
                </Link>
                <Link
                  href="/pengguna/riwayat"
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  📄 Lihat Riwayat Pengajuan
                </Link>
              </div>
            </div>

            {/* Status Summary Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              minWidth: '280px',
              flex: '1 1 300px',
              maxWidth: '380px'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>
                Ringkasan Status Anda
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Status Akun</span>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: profile?.is_active ? '#dcfce7' : '#fee2e2',
                    color: profile?.is_active ? '#15803d' : '#b91c1c',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 600
                  }}>
                    {profile?.is_active ? '● Akun Aktif' : '● Akun Dinonaktifkan'}
                  </span>
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Pengajuan Terakhir</span>
                  {latestPengajuan ? (
                    <div style={{ marginTop: '0.25rem' }}>
                      <strong style={{ fontSize: '0.9375rem', color: '#0f172a', display: 'block' }}>
                        {latestPengajuan.status}
                      </strong>
                      <Link
                        href={`/pengguna/pengajuan/${latestPengajuan.public_id}`}
                        style={{ fontSize: '0.8125rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}
                      >
                        Detail Pengajuan &rarr;
                      </Link>
                    </div>
                  ) : (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#94a3b8' }}>
                      Belum ada pengajuan aktif.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alur Pengajuan Section */}
      <section id="alur" style={{ padding: '4.5rem 2rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
              Tahapan Pengajuan Magang Anda
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
              Ikuti alur terstruktur untuk menyelesaikan proses pendaftaran magang
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.75rem'
          }}>
            {/* Step 1 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '2rem',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                Pilih Bidang Minat
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Pilih bidang magang yang sesuai dengan kompetensi dan jurusan studi Anda di bawah ini.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '2rem',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                Unggah Berkas Persyaratan
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Lengkapi tanggal pelaksanaan dan unggah dokumen proposal/surat pengantar resmi.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '2rem',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                Verifikasi & Pembimbing
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Tim Administrator memvalidasi berkas dan menetapkan pembimbing lapangan untuk Anda.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '2rem',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1rem'
              }}>
                4
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                Pelaksanaan & SKM
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Jalani masa magang, isi survei kepuasan (SKM), dan dapatkan penilaian akhir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Katalog Bidang Magang (Real-Time Database Supabase) */}
      <section id="bidang" style={{ padding: '4.5rem 2rem', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
              Pilihan Bidang Magang yang Tersedia
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
              Pilih bidang yang diminati dan klik tombol untuk langsung memulai form pengajuan
            </p>
          </div>

          {/* Error State */}
          {bidangError && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Gagal Mengambil Data Bidang</strong>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{bidangError}</p>
            </div>
          )}

          {/* Empty State */}
          {!bidangError && bidangs.length === 0 && (
            <div style={{
              padding: '2.5rem',
              backgroundColor: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              color: '#64748b',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <strong style={{ display: 'block', fontSize: '1rem', color: '#334155', marginBottom: '0.5rem' }}>
                Belum Ada Bidang yang Terdaftar
              </strong>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Saat ini belum ada data bidang magang yang aktif di dalam sistem.
              </p>
            </div>
          )}

          {/* Grid Bidang Real-Time dari Supabase */}
          {!bidangError && bidangs.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.75rem'
            }}>
              {bidangs.map((bidang) => (
                <div
                  key={bidang.id}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '2rem',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: '1rem'
                    }}>
                      Bidang #{bidang.id}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', lineHeight: 1.3 }}>
                      {bidang.nama}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                      {bidang.deskripsi || 'Fokus pada pengembangan kompetensi teknis, administratif, dan operasional sesuai bidang.'}
                    </p>
                  </div>

                  <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {bidang.kuota !== undefined && bidang.kuota !== null && (
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Kuota: <strong>{bidang.kuota} orang</strong>
                      </span>
                    )}
                    <Link
                      href={`/pengguna/career/step1?bidangId=${bidang.id}`}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        marginLeft: 'auto',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      Pilih & Ajukan &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#64748b',
        padding: '2.5rem 2rem',
        borderTop: '1px solid #1e293b',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.25rem' }}>
              SIM-MAGANG
            </span>
            <span style={{ fontSize: '0.8125rem' }}>
              Sistem Informasi Manajemen Magang & Praktik Kerja Lapangan
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
            <Link href="/pengguna/career/step1" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              Ajukan Magang
            </Link>
            <Link href="/pengguna/riwayat" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              Riwayat Pengajuan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
