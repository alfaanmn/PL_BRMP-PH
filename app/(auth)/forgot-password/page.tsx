'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
import { validateEmail } from '@/lib/validations/auth.validation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const emailErr = validateEmail(email)
    if (emailErr) {
      setErrorMessage(emailErr)
      return
    }

    setLoading(true)

    try {
      const response = await authService.forgotPassword(email)

      if (!response.success) {
        setErrorMessage(response.error?.message || 'Gagal mengirim email reset password.')
        setLoading(false)
        return
      }

      setIsSent(true)
      setLoading(false)
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
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid #e2e8f0',
        boxSizing: 'border-box'
      }}>
        {/* Tombol Kembali ke Beranda */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8125rem',
            color: '#64748b',
            textDecoration: 'none',
            fontWeight: 500,
            marginBottom: '1.25rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Kembali ke Beranda
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            fontWeight: 700,
            fontSize: '1.25rem',
            marginBottom: '0.75rem'
          }}>
            SM
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Lupa Password
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Masukkan email Anda untuk menerima tautan pemulihan kata sandi
          </p>
        </div>

        {isSent ? (
          <div style={{
            padding: '1.25rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '1rem', fontWeight: 600 }}>
              Email Pemulihan Dikirim
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: '#15803d', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Kami telah mengirimkan instruksi reset password ke <strong>{email}</strong>. Silakan periksa kotak masuk atau spam email Anda.
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <>
            {/* Alert Error */}
            {errorMessage && (
              <div style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Email Terdaftar
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: loading ? '#f1f5f9' : '#ffffff'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                  marginTop: '0.5rem'
                }}
              >
                {loading ? 'Mengirim Email...' : 'Kirim Link Reset'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#64748b' }}>
              Ingat password Anda?{' '}
              <Link href="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                Kembali ke Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
