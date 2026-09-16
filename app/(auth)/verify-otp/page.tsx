'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
import { validateOtp } from '@/lib/validations/auth.validation'
import { AppLogo } from '@/components/shared/app-logo'

function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const emailParam = searchParams.get('email') || ''
  const [email, setEmail] = useState(emailParam)
  // 8 digit OTP slots
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(60)
  const [isSuccess, setIsSuccess] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [emailParam])

  // Focus kotak input pertama saat halaman dimuat
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Timer cooldown 60 detik untuk kirim ulang OTP
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleOtpChange = (index: number, value: string) => {
    // Hanya izinkan angka
    const cleanVal = value.replace(/\D/g, '')

    if (cleanVal.length > 1) {
      // Jika user paste beberapa angka langsung ke dalam input
      handlePasteValue(cleanVal)
      return
    }

    const newOtp = [...otp]
    newOtp[index] = cleanVal
    setOtp(newOtp)
    setErrorMessage(null)

    // Jika digit terisi, otomatis pindah ke input berikutnya
    if (cleanVal && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Jika kotak saat ini kosong dan user tekan Backspace, fokus ke kotak sebelumnya
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')
    handlePasteValue(pastedData)
  }

  const handlePasteValue = (value: string) => {
    if (!value) return
    const digits = value.slice(0, 8).split('')
    const newOtp = ['', '', '', '', '', '', '', '']
    digits.forEach((digit, i) => {
      newOtp[i] = digit
    })
    setOtp(newOtp)
    setErrorMessage(null)

    // Fokus ke kotak terakhir yang terisi atau kotak ke-8
    const nextIndex = Math.min(digits.length, 7)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const token = otp.join('').trim()
    const otpError = validateOtp(token)
    if (otpError) {
      setErrorMessage(otpError)
      return
    }

    if (!email || !email.trim()) {
      setErrorMessage('Alamat email tidak ditemukan. Silakan lakukan registrasi ulang.')
      return
    }

    setLoading(true)

    try {
      const response = await authService.verifyOtp({
        email: email.trim(),
        token: token,
        type: 'signup',
      })

      if (!response.success) {
        setErrorMessage(response.error?.message || 'Kode OTP tidak valid atau telah kedaluwarsa.')
        setLoading(false)
        return
      }

      setIsSuccess(true)
      setSuccessMessage('Verifikasi email berhasil! Mengarahkan ke Dashboard...')
      setLoading(false)

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

      setTimeout(() => {
        window.location.href = targetUrl
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memverifikasi OTP.'
      setErrorMessage(msg)
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email || !email.trim()) {
      setErrorMessage('Alamat email tidak ditemukan.')
      return
    }

    setResending(true)

    try {
      const response = await authService.resendOtp({
        email: email.trim(),
        type: 'signup',
      })

      if (!response.success) {
        setErrorMessage(response.error?.message || 'Gagal mengirim ulang kode OTP.')
        setResending(false)
        return
      }

      setSuccessMessage('Kode OTP baru telah berhasil dikirim ke email Anda.')
      setCooldown(60) // Reset countdown 60 detik
      setOtp(['', '', '', '', '', '', '', '']) // Bersihkan input
      inputRefs.current[0]?.focus()
      setResending(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengirim ulang OTP.'
      setErrorMessage(msg)
      setResending(false)
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
      {/* SISI KIRI: HERO BANNER INSTITUSI BRMP PENGELOLA HASIL */}
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
            <AppLogo size={42} priority />
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
            Langkah terakhir untuk mengaktifkan akun pendaftaran Anda. Masukkan kode OTP yang telah dikirimkan ke alamat email terdaftar.
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

      {/* SISI KANAN: FORM VERIFIKASI OTP */}
      <div style={{
        flex: '1 1 440px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 1.5rem',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Tombol Navigasi Kembali ke Register */}
          <Link
            href="/register"
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
            Ganti Email / Pendaftaran Ulang
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '1rem'
            }}>
              ✉️
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 0.375rem 0'
            }}>
              Verifikasi Email
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Masukkan kode OTP yang kami kirimkan ke email:
            </p>
            {email && (
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#15803d', margin: '0.25rem 0 0 0' }}>
                {email}
              </p>
            )}
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

          {/* Form Input OTP 8 Digit */}
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', textAlign: 'center' }}>
                KODE OTP VERIFIKASI
              </label>

              <div
                onPaste={handlePaste}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  width: '100%'
                }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading || isSuccess}
                    style={{
                      width: '42px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.375rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      borderRadius: '8px',
                      border: digit ? '2px solid #15803d' : '1px solid #cbd5e1',
                      backgroundColor: loading || isSuccess ? '#f8fafc' : '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: digit ? '0 0 0 3px rgba(21, 128, 61, 0.15)' : 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Tombol Submit Verifikasi */}
            <button
              type="submit"
              disabled={loading || otp.join('').trim().length < 6 || isSuccess}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: loading || otp.join('').trim().length < 6 || isSuccess ? 'not-allowed' : 'pointer',
                opacity: loading || otp.join('').trim().length < 6 || isSuccess ? 0.7 : 1,
                boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Memverifikasi...' : isSuccess ? 'Berhasil Diverifikasi ✓' : 'Verifikasi Akun'}
            </button>
          </form>

          {/* Area Kirim Ulang OTP & Cooldown */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: '#64748b'
          }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>Tidak menerima kode di email Anda?</p>
            {cooldown > 0 ? (
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                Kirim ulang kode dalam <strong style={{ color: '#15803d' }}>{cooldown} detik</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#15803d',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: resending || loading ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                  padding: '0.25rem 0.5rem'
                }}
              >
                {resending ? 'Mengirim Ulang...' : 'Kirim Ulang Kode OTP'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        color: '#64748b'
      }}>
        Memuat halaman verifikasi OTP...
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  )
}
