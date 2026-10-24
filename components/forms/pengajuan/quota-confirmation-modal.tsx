'use client'

import React from 'react'

interface QuotaConfirmationModalProps {
  isOpen: boolean
  sisaKuota: number
  jumlahDiajukan: number
  loading: boolean
  onConfirmPartial: () => void
  onReduceMembers: () => void
  onChangeField: () => void
  onClose: () => void
}

export function QuotaConfirmationModal({
  isOpen,
  sisaKuota,
  jumlahDiajukan,
  loading,
  onConfirmPartial,
  onReduceMembers,
  onChangeField,
  onClose,
}: QuotaConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInModal 0.2s ease-out',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#fffbeb',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            !
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#92400e' }}>
              Konfirmasi Keterbatasan Kuota Bidang
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#b45309' }}>
              Jumlah anggota melebihi sisa kapasitas yang tersedia
            </p>
          </div>
        </div>

        {/* Isi Modal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: '0 0 0.5rem' }}>
              Sisa kuota untuk bidang yang Anda pilih saat ini hanya tersisa{' '}
              <strong style={{ color: '#0f172a' }}>{sisaKuota} slot</strong>, sedangkan permohonan
              kelompok Anda mengajukan <strong style={{ color: '#0f172a' }}>{jumlahDiajukan} orang</strong>.
            </p>
            <p style={{ margin: 0, color: '#64748b' }}>
              Jika Anda memilih <em>Tetap Ajukan</em>, administrator berhak untuk <strong>menyetujui sebagian anggota</strong> saja sesuai kapasitas kuota yang tersedia.
            </p>
          </div>

          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            Silakan pilih tindakan yang Anda kehendaki:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {/* Opsi 1: Tetap Ajukan */}
            <button
              type="button"
              onClick={onConfirmPartial}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Tetap Ajukan (Terima Sebagian)</div>
                <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
                  Lanjutkan proses pengajuan dengan persetujuan parsial
                </div>
              </div>
              <span style={{ fontSize: '16px' }}>&rarr;</span>
            </button>

            {/* Opsi 2: Kurangi Jumlah Anggota */}
            <button
              type="button"
              onClick={onReduceMembers}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Kurangi Jumlah Anggota</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Kembali ke formulir langkah 1 untuk menyesuaikan tim
                </div>
              </div>
              <span style={{ fontSize: '16px' }}>&larr;</span>
            </button>

            {/* Opsi 3: Ganti Bidang Lain */}
            <button
              type="button"
              onClick={onChangeField}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Pilih Bidang Magang Lain</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Kembali untuk memilih bidang dengan kuota yang mencukupi
                </div>
              </div>
              <span style={{ fontSize: '16px' }}>&larr;</span>
            </button>
          </div>
        </div>

        {/* Footer Modal */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}
