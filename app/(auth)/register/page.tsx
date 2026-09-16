'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
import { AppLogo } from '@/components/shared/app-logo'
import { validateRegister } from '@/lib/validations/auth.validation'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [noHp, setNoHp] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki')
  const [asalInstansi, setAsalInstansi] = useState('')
  const [jurusan, setJurusan] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false)
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validasi input form
    const validation = validateRegister({
      name,
      email,
      password,
      confirmPassword,
      no_hp: noHp,
      asal_instansi: asalInstansi,
      jurusan,
      jenis_kelamin: jenisKelamin,
    })

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      setErrorMessage(firstError)
      return
    }

    setLoading(true)

    try {
      const response = await authService.register({
        name,
        email,
        password,
        no_hp: noHp || undefined,
        asal_instansi: asalInstansi || undefined,
        jurusan: jurusan || undefined,
        jenis_kelamin: jenisKelamin || undefined,
      })

      if (!response.success) {
        setErrorMessage(response.error?.message || 'Registrasi gagal.')
        setLoading(false)
        return
      }

      if (response.data?.requiresEmailConfirmation) {
        setIsRegisteredSuccess(true)
        setRequiresEmailConfirmation(true)
        setLoading(false)
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`)
        }, 1200)
      } else {
        setIsRegisteredSuccess(true)
        setRequiresEmailConfirmation(false)
        setLoading(false)
        setTimeout(() => {
          router.push('/pengguna/dashboard')
          router.refresh()
        }, 1500)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      setErrorMessage(msg)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexWrap: 'wrap',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0
    }}>
      {/* SISI KIRI: HERO BANNER INSTITUSI BRMP PENGELOLA HASIL DENGAN FOTO BACKGROUND BRMP_PH.png */}
      <div style={{
        flex: '1 1 500px',
        minHeight: '100vh',
        backgroundImage: "linear-gradient(135deg, rgba(6, 78, 59, 0.65) 0%, rgba(21, 128, 61, 0.55) 50%, rgba(6, 95, 70, 0.70) 100%), url('/BRMP_PH.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#ffffff',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem 3.5rem',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* Top Header Institusi */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden'
            }}>
              <AppLogo size={40} alt="Logo BRMP" priority />
            </div>
            <div>
              <span style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                display: 'block',
                lineHeight: 1.2,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                BRMP Pengelola Hasil
              </span>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#d1fae5',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.2
              }}>
                Kementerian Pertanian RI
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Content: Headline & Desc */}
        <div style={{ position: 'relative', zIndex: 2, margin: '3rem 0' }}>
          {/* Badge Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            padding: '0.3125rem 0.875rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#ecfdf5',
            marginBottom: '1.5rem',
            letterSpacing: '0.03em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
            <span>SIM-MAGANG &amp; PKL</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.875rem, 3.2vw, 2.75rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            margin: '0 0 1.25rem 0',
            color: '#ffffff',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
          }}>
            Badan Perakitan dan Modernisasi Pertanian Pengelola Hasil
          </h1>

          <p style={{
            fontSize: '1rem',
            lineHeight: 1.65,
            color: '#f0fdf4',
            maxWidth: '520px',
            margin: 0,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Bergabunglah bersama peneliti &amp; praktisi ahli di Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian. Akses portal pendaftaran dan kelola berkas Anda secara terintegrasi.
          </p>

          <div style={{
            marginTop: '2rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#ecfdf5',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            padding: '0.375rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span>🏢</span>
            <span>Jl. Salak 22 Bogor 16128</span>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.75rem', color: '#d1fae5', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>
          &copy; {new Date().getFullYear()} BRMP Pengelola Hasil — Kementerian Pertanian RI
        </div>
      </div>

      {/* SISI KANAN: FORM REGISTER INTERAKTIF */}
      <div style={{
        flex: '1 1 480px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2rem',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Tombol Navigasi Kembali ke Beranda */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: 600,
              marginBottom: '1.5rem',
              transition: 'color 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali ke Beranda
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 0.375rem 0'
            }}>
              Daftar Akun Baru
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Lengkapi data diri Anda untuk memulai pendaftaran magang.
            </p>
          </div>

          {/* Sukses Registrasi Screen */}
          {isRegisteredSuccess ? (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 1rem auto'
              }}>
                ✓
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '1.125rem', fontWeight: 700 }}>
                Pendaftaran Berhasil!
              </h3>
              <p style={{ margin: '0 0 1.25rem 0', color: '#15803d', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {requiresEmailConfirmation
                  ? `Kami telah mengirimkan 6 digit kode OTP ke ${email}. Mengarahkan ke halaman verifikasi...`
                  : 'Akun Anda berhasil dibuat. Anda akan segera diarahkan ke Dashboard...'}
              </p>
              {requiresEmailConfirmation ? (
                <Link
                  href={`/verify-otp?email=${encodeURIComponent(email.trim())}`}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
                  }}
                >
                  Masukkan Kode OTP Sekarang →
                </Link>
              ) : (
                <Link
                  href="/pengguna/dashboard"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
                  }}
                >
                  Menuju Dashboard
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Alert Error */}
              {errorMessage && (
                <div style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  lineHeight: 1.4
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Registrasi */}
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Nama Lengkap */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                    Nama Lengkap <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.6875rem 0.875rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: loading ? '#f8fafc' : '#ffffff',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                    Email Aktif <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.6875rem 0.875rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: loading ? '#f8fafc' : '#ffffff',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                  />
                </div>

                {/* 2 Kolom: Nomor HP/WA & Jenis Kelamin */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '0.6875rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: loading ? '#f8fafc' : '#ffffff',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                      Jenis Kelamin
                    </label>
                    <select
                      value={jenisKelamin}
                      onChange={(e) => setJenisKelamin(e.target.value)}
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '0.6875rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: loading ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* 2 Kolom: Asal Instansi & Program Studi */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                      Asal Instansi
                    </label>
                    <input
                      type="text"
                      value={asalInstansi}
                      onChange={(e) => setAsalInstansi(e.target.value)}
                      placeholder="Universitas / SMK / Sekolah"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '0.6875rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: loading ? '#f8fafc' : '#ffffff',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                      Program Studi / Jurusan
                    </label>
                    <input
                      type="text"
                      value={jurusan}
                      onChange={(e) => setJurusan(e.target.value)}
                      placeholder="Contoh: Agroteknologi"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '0.6875rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: loading ? '#f8fafc' : '#ffffff',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span> (Min. 6 karakter)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '0.6875rem 2.75rem 0.6875rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: loading ? '#f8fafc' : '#ffffff',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                    Konfirmasi Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password di atas"
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '0.6875rem 2.75rem 0.6875rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: loading ? '#f8fafc' : '#ffffff',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Tombol Submit Daftar */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.8125rem',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)',
                    transition: 'all 0.2s',
                    marginTop: '0.5rem'
                  }}
                >
                  {loading ? 'Memproses Pendaftaran...' : 'Daftar Akun'}
                </button>
              </form>

              {/* Footer Login Link */}
              <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.8125rem', color: '#64748b' }}>
                Sudah punya akun?{' '}
                <Link href="/login" style={{ color: '#15803d', fontWeight: 700, textDecoration: 'none' }}>
                  Masuk sekarang
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

