'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
import { AppLogo } from '@/components/shared/app-logo'
import { validateEmail, validatePassword } from '@/lib/validations/auth.validation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'inactive') {
      setErrorMessage('Akun Anda telah dinonaktifkan. Silakan hubungi administrator.')
    } else if (errorParam === 'auth_callback_failed') {
      setErrorMessage('Autentikasi gagal atau tautan verifikasi telah kedaluwarsa.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validasi input
    const emailErr = validateEmail(email)
    if (emailErr) {
      setErrorMessage(emailErr)
      return
    }

    const passErr = validatePassword(password)
    if (passErr) {
      setErrorMessage(passErr)
      return
    }

    setLoading(true)

    try {
      const response = await authService.login({ email, password })

      if (!response.success) {
        setErrorMessage(response.error?.message || 'Login gagal.')
        setLoading(false)
        return
      }

      const role = response.data?.role
      const redirectParam = searchParams.get('redirect')

      let targetUrl = '/pengguna/dashboard'
      if (role === 'administrator') {
        targetUrl = '/admin/dashboard'
        if (redirectParam && redirectParam.startsWith('/admin')) {
          targetUrl = redirectParam
        }
      } else {
        if (redirectParam && redirectParam.startsWith('/') && redirectParam !== '/' && !redirectParam.startsWith('/admin')) {
          targetUrl = redirectParam
        }
      }

      window.location.href = targetUrl
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      setErrorMessage(msg)
      setLoading(false)
    }
  }

  return (
    <div className="auth-main-container">
      <style>{`
        .auth-main-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          background-color: #ffffff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 0;
        }
        .auth-hero-banner {
          display: flex;
          flex: 1 1 500px;
          min-height: 100vh;
          background-image: linear-gradient(135deg, rgba(6, 78, 59, 0.65) 0%, rgba(21, 128, 61, 0.55) 50%, rgba(6, 95, 70, 0.70) 100%), url('/BRMP_PH.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          color: #ffffff;
          position: relative;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
          box-sizing: border-box;
          overflow: hidden;
        }
        .auth-form-container {
          flex: 1 1 440px;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 2rem;
          box-sizing: border-box;
          background-color: #ffffff;
        }
        .auth-form-card {
          width: 100%;
          max-width: 400px;
          box-sizing: border-box;
        }
        .auth-mobile-header {
          display: none;
        }
        .auth-back-link-desktop {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .auth-heading-wrapper {
          margin-bottom: 2rem;
        }
        .auth-footer-link {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.8125rem;
          color: #64748b;
        }

        @media (max-width: 1023px) {
          .auth-hero-banner {
            display: none !important;
          }
          .auth-main-container {
            background-color: #f8fafc;
            flex-direction: column;
          }
          .auth-form-container {
            min-height: 100vh;
            min-height: 100dvh;
            padding: 1.25rem 1rem !important;
            justify-content: center !important;
          }
          .auth-form-card {
            background-color: #ffffff;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
            padding: 1.5rem 1.25rem !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
            max-width: 390px;
          }
          .auth-mobile-header {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #f1f5f9;
          }
          .auth-back-link-desktop {
            display: none !important;
          }
          .auth-heading-wrapper {
            margin-bottom: 1.125rem !important;
          }
          .auth-footer-link {
            margin-top: 1.25rem !important;
          }
        }
      `}</style>

      {/* SISI KIRI: HERO BANNER INSTITUSI BRMP PENGELOLA HASIL (Hanya Desktop >=1024px) */}
      <div className="auth-hero-banner">
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
        <div style={{ position: 'relative', zIndex: 2, margin: '4rem 0' }}>
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

      {/* SISI KANAN: FORM LOGIN INTERAKTIF */}
      <div className="auth-form-container">
        <div className="auth-form-card">
          {/* Mobile Header Branding (Tampil di Mobile) */}
          <div className="auth-mobile-header">
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                boxShadow: '0 2px 4px rgba(21, 128, 61, 0.12)',
                flexShrink: 0
              }}>
                <AppLogo size={30} alt="Logo BRMP" priority />
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#15803d', display: 'block', lineHeight: 1.2 }}>
                  SIM-Magang
                </span>
                <span style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 600, display: 'block', lineHeight: 1.1 }}>
                  BRMP Kementan RI
                </span>
              </div>
            </Link>

            <Link
              href="/"
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9'
              }}
            >
              <span>Beranda</span>
              <span>→</span>
            </Link>
          </div>

          {/* Tombol Navigasi Kembali ke Beranda (Desktop only) */}
          <Link
            href="/"
            className="auth-back-link-desktop"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali ke Beranda
          </Link>

          {/* Heading */}
          <div className="auth-heading-wrapper">
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 0.25rem 0'
            }}>
              Masuk ke Portal
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              Selamat datang! Masukkan email &amp; password akun Anda.
            </p>
          </div>

          {/* Alert Error */}
          {errorMessage && (
            <div style={{
              padding: '0.625rem 0.875rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.4
            }}>
              <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Alert Success */}
          {successMessage && (
            <div style={{
              padding: '0.625rem 0.875rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.4
            }}>
              <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Input Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                Email
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
                  minHeight: '44px',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: loading ? '#f8fafc' : '#ffffff',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
            </div>

            {/* Input Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '0.75rem', color: '#15803d', textDecoration: 'none', fontWeight: 700 }}
                >
                  Lupa password?
                </Link>
              </div>

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
                    minHeight: '44px',
                    padding: '0.625rem 2.75rem 0.625rem 0.875rem',
                    borderRadius: '8px',
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
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: '0.375rem',
                    minWidth: '36px',
                    minHeight: '36px',
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

            {/* Checkbox Ingat Saya */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#15803d',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.8125rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                Ingat saya
              </label>
            </div>

            {/* Tombol Submit Masuk */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0.625rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)',
                transition: 'all 0.2s',
                marginTop: '0.25rem'
              }}
            >
              {loading ? 'Memproses...' : 'Masuk ke Akun'}
            </button>
          </form>

          {/* Footer Register Link */}
          <div className="auth-footer-link">
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: '#15803d', fontWeight: 700, textDecoration: 'none' }}>
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
        color: '#64748b'
      }}>
        Memuat halaman login...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
