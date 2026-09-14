'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
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
      }

      if (redirectParam && redirectParam.startsWith('/')) {
        if (role === 'administrator' && !redirectParam.startsWith('/pengguna')) {
          targetUrl = redirectParam
        } else if (role === 'pengguna' && !redirectParam.startsWith('/admin')) {
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

  const handleGoogleLogin = async () => {
    setErrorMessage(null)
    setLoading(true)
    try {
      const response = await authService.loginWithGoogle()
      if (!response.success) {
        setErrorMessage(response.error?.message || 'Gagal memulai login dengan Google.')
        setLoading(false)
      }
    } catch {
      setErrorMessage('Gagal menghubungi layanan Google.')
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
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              🌿
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

      {/* SISI KANAN: FORM LOGIN INTERAKTIF */}
      <div style={{
        flex: '1 1 440px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2rem',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
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
              marginBottom: '2rem',
              transition: 'color 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali ke Beranda
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 0.375rem 0'
            }}>
              Masuk ke Portal
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Selamat datang kembali! Masukkan akun Anda.
            </p>
          </div>

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

          {/* Alert Success */}
          {successMessage && (
            <div style={{
              padding: '0.875rem 1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              color: '#166534',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.4
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  padding: '0.75rem 1rem',
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
                    padding: '0.75rem 2.75rem 0.75rem 1rem',
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
                marginTop: '0.25rem'
              }}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Divider ATAU */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: '#94a3b8',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ padding: '0 0.75rem' }}>ATAU</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              transition: 'background-color 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          {/* Footer Register Link */}
          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8125rem', color: '#64748b' }}>
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
