'use client'

import React, { useState } from 'react'
import type { PembimbingOption } from '@/lib/services/admin-pengajuan.service'

interface PengajuanVerifikasiModalProps {
  isOpen: boolean
  actionType: 'terima' | 'tolak' | 'selesai' | null
  pembimbingOptions: PembimbingOption[]
  jumlahAnggota?: number
  loadingSubmit: boolean
  onClose: () => void
  onSubmit: (payload: {
    status: 'Sedang Magang' | 'Ditolak' | 'Selesai'
    pembimbingId?: string | number | null
    alasanPenolakan?: string
    catatan?: string
  }) => void
}

export function PengajuanVerifikasiModal({
  isOpen,
  actionType,
  pembimbingOptions,
  jumlahAnggota = 1,
  loadingSubmit,
  onClose,
  onSubmit,
}: PengajuanVerifikasiModalProps) {
  const [selectedPembimbing, setSelectedPembimbing] = useState<string>('')
  const [alasanPenolakan, setAlasanPenolakan] = useState<string>('')
  const [catatan, setCatatan] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen || !actionType) return null

  const requiredSlots = Math.max(1, jumlahAnggota || 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (actionType === 'tolak') {
      if (!alasanPenolakan.trim()) {
        setValidationError('Alasan penolakan wajib diisi untuk menginformasikan kepada pemohon.')
        return
      }
      onSubmit({
        status: 'Ditolak',
        alasanPenolakan: alasanPenolakan.trim(),
        catatan: alasanPenolakan.trim(),
      })
    } else if (actionType === 'terima') {
      if (selectedPembimbing) {
        const chosen = pembimbingOptions.find((p) => String(p.id) === String(selectedPembimbing))
        if (chosen) {
          if (chosen.is_active === false) {
            setValidationError(`Pembimbing ${chosen.nama} berstatus nonaktif dan tidak dapat ditugaskan.`)
            return
          }
          if (chosen.slot_tersedia < requiredSlots) {
            setValidationError(
              `Kapasitas pembimbing ${chosen.nama} tidak mencukupi (sisa ${chosen.slot_tersedia} slot, pengajuan ini memerlukan ${requiredSlots} slot).`
            )
            return
          }
        }
      }

      onSubmit({
        status: 'Sedang Magang',
        pembimbingId: selectedPembimbing ? Number(selectedPembimbing) : null,
        catatan: catatan.trim() || 'Pengajuan disetujui, peserta sedang magang',
      })
    } else if (actionType === 'selesai') {
      onSubmit({
        status: 'Selesai',
        catatan: catatan.trim() || 'Peserta telah menyelesaikan masa magang',
      })
    }
  }

  const getTitle = () => {
    switch (actionType) {
      case 'terima':
        return 'Terima Pengajuan Magang'
      case 'tolak':
        return 'Tolak Pengajuan Magang'
      case 'selesai':
        return 'Selesaikan Periode Magang'
    }
  }

  const selectedPembimbingData = selectedPembimbing
    ? pembimbingOptions.find((p) => String(p.id) === String(selectedPembimbing))
    : null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90dvh',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#ffffff',
            zIndex: 5,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            {getTitle()}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loadingSubmit}
            aria-label="Tutup Dialog"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '16px',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {validationError && (
            <div
              style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              {validationError}
            </div>
          )}

          {/* Form Action: TERIMA */}
          {actionType === 'terima' && (
            <>
              <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
                Status pengajuan akan diubah menjadi <strong style={{ color: '#15803d' }}>Sedang Magang</strong>. Silakan pilih Pembimbing Lapangan yang memiliki kapasitas tersedia untuk penugasan peserta ({requiredSlots} orang):
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Tugaskan Pembimbing Lapangan (Opsional)
                </label>
                <select
                  value={selectedPembimbing}
                  onChange={(e) => {
                    setSelectedPembimbing(e.target.value)
                    setValidationError(null)
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Pilih Pembimbing Lapangan --</option>
                  {pembimbingOptions.map((p) => {
                    const isInactive = p.is_active === false
                    const isFull = p.is_full || p.slot_tersedia <= 0
                    const isInsufficient = p.slot_tersedia < requiredSlots
                    const isDisabled = isInactive || isFull || isInsufficient

                    const nipPart = p.nip ? ` (NIP: ${p.nip})` : ''
                    let label = `${p.nama}${nipPart}`

                    if (isInactive) {
                      label += ' — [Nonaktif]'
                    } else if (isFull) {
                      label += ` — Penuh (Terisi ${p.terisi}/${p.kuota_default})`
                    } else if (isInsufficient) {
                      label += ` — ${p.slot_tersedia} slot (Terisi ${p.terisi}/${p.kuota_default}) [Slot tidak cukup untuk ${requiredSlots} peserta]`
                    } else {
                      label += ` — ${p.slot_tersedia} slot tersedia (Terisi ${p.terisi}/${p.kuota_default})`
                    }

                    return (
                      <option
                        key={p.id}
                        value={String(p.id)}
                        disabled={isDisabled}
                        style={{
                          color: isDisabled ? '#94a3b8' : '#0f172a',
                          backgroundColor: isDisabled ? '#f8fafc' : '#ffffff',
                          fontWeight: isDisabled ? 400 : 500,
                        }}
                      >
                        {label}
                      </option>
                    )
                  })}
                </select>

                {/* Ringkasan Kapasitas Pembimbing Terpilih */}
                {selectedPembimbingData && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#166534',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#064e3b' }}>
                      {selectedPembimbingData.nama} {selectedPembimbingData.nip ? `(NIP: ${selectedPembimbingData.nip})` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '11.5px', color: '#15803d' }}>
                      <span>Kuota Maks: <strong>{selectedPembimbingData.kuota_default} peserta</strong></span>
                      <span>Terisi: <strong>{selectedPembimbingData.terisi} peserta</strong></span>
                      <span>Sisa Slot: <strong>{selectedPembimbingData.slot_tersedia} peserta</strong></span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Catatan Verifikasi (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan atau instruksi awal..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </>
          )}

          {/* Form Action: TOLAK */}
          {actionType === 'tolak' && (
            <>
              <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.4 }}>
                Status pengajuan akan diubah menjadi <strong style={{ color: '#dc2626' }}>Ditolak</strong>. Masukkan alasan penolakan agar pemohon dapat mengetahuinya:
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Alasan Penolakan <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={alasanPenolakan}
                  onChange={(e) => setAlasanPenolakan(e.target.value)}
                  placeholder="Contoh: Kuota pada bidang ini telah penuh, berkas surat pengantar tidak terbaca, dll..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>
            </>
          )}

          {/* Form Action: SELESAI */}
          {actionType === 'selesai' && (
            <>
              <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.4 }}>
                Konfirmasi bahwa peserta ini telah menyelesaikan seluruh masa magangnya di BRMP PH. Status akan diubah menjadi <strong style={{ color: '#047857' }}>Selesai</strong>.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Catatan Penuntasan / Kelulusan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan evaluasi peserta..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </>
          )}

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loadingSubmit}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: '#4b5563',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loadingSubmit}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor:
                  actionType === 'tolak'
                    ? '#dc2626'
                    : actionType === 'selesai'
                    ? '#047857'
                    : '#15803d',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: loadingSubmit ? 'not-allowed' : 'pointer',
                opacity: loadingSubmit ? 0.7 : 1,
              }}
            >
              {loadingSubmit ? 'Menyimpan...' : actionType === 'tolak' ? 'Tolak Pengajuan' : actionType === 'selesai' ? 'Tandai Selesai' : 'Terima Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
