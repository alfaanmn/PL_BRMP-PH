'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SKMReminderModalProps {
  pengajuan: {
    id: number
    public_id?: string | null
    bidang_nama?: string | null
  }
}

export function SKMReminderModal({ pengajuan }: SKMReminderModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!pengajuan?.id) return

    // Cek apakah pengguna sudah menunda pengingat untuk sesi browser ini
    const dismissedKey = `skm_reminder_dismissed_${pengajuan.id}`
    const isDismissed = sessionStorage.getItem(dismissedKey)

    if (!isDismissed) {
      setIsOpen(true)
    }
  }, [pengajuan?.id])

  if (!isOpen) return null

  const handleDismiss = () => {
    if (pengajuan?.id) {
      sessionStorage.setItem(`skm_reminder_dismissed_${pengajuan.id}`, 'true')
    }
    setIsOpen(false)
  }

  const handleFillNow = () => {
    setIsOpen(false)
    router.push(`/pengguna/skm?pengajuan_id=${pengajuan.id}`)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skm-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'skmFadeIn 0.2s ease-out forwards',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #d1fae5',
          overflow: 'hidden',
          animation: 'skmZoomIn 0.2s ease-out forwards',
        }}
      >
        {/* Header Visual Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            padding: '1.25rem 1.5rem',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <button
            onClick={handleDismiss}
            type="button"
            aria-label="Tutup modal"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.375rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                flexShrink: 0,
              }}
            >
              <svg style={{ width: '24px', height: '24px', color: '#ffffff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.125rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <svg style={{ width: '12px', height: '12px', color: '#a7f3d0' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Periode Magang Selesai
              </span>
              <h2 id="skm-modal-title" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }}>
                Survei Kepuasan Masyarakat (SKM)
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Selamat! Masa magang Anda pada bidang{' '}
            <strong style={{ color: '#0f172a', fontWeight: 600 }}>
              {pengajuan.bidang_nama || 'Bidang Magang BRMP'}
            </strong>{' '}
            telah selesai.
          </p>

          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              fontSize: '0.8125rem',
              color: '#065f46',
              lineHeight: 1.55,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <svg
              style={{ width: '20px', height: '20px', color: '#059669', flexShrink: 0, marginTop: '2px' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span style={{ fontWeight: 700, display: 'block', marginBottom: '3px', color: '#047857' }}>
                Tahap Akhir Magang & Penerbitan Sertifikat
              </span>
              Mohon luangkan waktu 3–5 menit untuk mengisi 17 butir instrumen evaluasi kepuasan layanan magang. Jawaban Anda sangat berharga bagi peningkatan mutu layanan kami.
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                padding: '0.625rem 1.125rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleFillNow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#047857'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#059669'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Isi SKM Sekarang
              <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes skmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes skmZoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
