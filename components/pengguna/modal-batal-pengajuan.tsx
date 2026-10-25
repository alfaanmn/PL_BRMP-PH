'use client'

import React, { useState } from 'react'
import { pengajuanService } from '@/lib/services/pengajuan.service'
import { LoaderIcon, CloseIcon } from '@/components/ui/admin-icons'

interface ModalBatalPengajuanProps {
  isOpen: boolean
  onClose: () => void
  publicId: string
  bidangNama?: string
  onSuccess: () => void
}

export function ModalBatalPengajuan({
  isOpen,
  onClose,
  publicId,
  bidangNama,
  onSuccess,
}: ModalBatalPengajuanProps) {
  const [alasan, setAlasan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      setErrorMsg(null)

      const res = await pengajuanService.batalkanPengajuan(publicId, alasan)

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal membatalkan pengajuan.')
        return
      }

      // Berhasil
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat membatalkan pengajuan.'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
        boxSizing: 'border-box',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '460px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInModal 0.15s ease-out',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Batalkan Pengajuan
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmCancel} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
            Apakah Anda yakin ingin membatalkan pengajuan magang{' '}
            <strong style={{ color: '#0f172a' }}>{bidangNama ? `"${bidangNama}"` : `#${publicId}`}</strong>?
          </p>

          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              fontSize: '0.78125rem',
              color: '#92400e',
              lineHeight: 1.45,
            }}
          >
            Pengajuan yang telah dibatalkan tidak dapat diaktifkan kembali. Namun, Anda dapat mengajukan permohonan magang baru setelahnya.
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: '#dc2626',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="alasan-batal"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '0.375rem',
              }}
            >
              Alasan Pembatalan <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Opsional)</span>
            </label>
            <textarea
              id="alasan-batal"
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              disabled={isSubmitting}
              placeholder="Contoh: Terjadi kesalahan penulisan tanggal magang / perubahan rencana kelompok."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.625rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                color: '#0f172a',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.625rem',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#475569',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.55rem 1.25rem',
                backgroundColor: isSubmitting ? '#f87171' : '#dc2626',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)',
              }}
            >
              {isSubmitting ? (
                <>
                  <LoaderIcon width={14} height={14} /> Membatalkan...
                </>
              ) : (
                'Ya, Batalkan Pengajuan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
