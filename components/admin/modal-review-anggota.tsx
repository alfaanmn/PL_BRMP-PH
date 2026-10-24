'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { PembimbingOption } from '@/lib/services/admin-pengajuan.service'

export interface ModalReviewAnggotaItem {
  id: number
  pengajuan_id?: number
  nama: string
  nim_nis: string
  no_hp?: string | null
  jurusan?: string | null
  is_ketua: boolean
  status?: 'menunggu' | 'diterima' | 'ditolak' | 'dibatalkan'
  alasan_penolakan?: string | null
  urutan_prioritas?: number
}

interface ModalReviewAnggotaProps {
  isOpen: boolean
  isFallbackData?: boolean
  pengajuan: {
    id: number
    public_id: string
    nama_lengkap: string
    asal_instansi: string
    bidang_nama?: string
    bidang_id?: number
    surat_balasan_url?: string | null
  }
  anggotas: ModalReviewAnggotaItem[]
  pembimbingOptions: PembimbingOption[]
  sisaKuotaBidang: number
  kuotaTotalBidang: number
  terisiBidang: number
  loadingSubmit: boolean
  onClose: () => void
  onSubmit: (data: {
    statusTarget: 'Sedang Magang' | 'Disetujui'
    pembimbingId?: number | null
    keputusanAnggota: Array<{
      id: number
      status: 'diterima' | 'ditolak'
      alasan?: string | null
    }>
    alasanPenolakanGlobal?: string | null
    suratBalasanUrl?: string | null
    catatan?: string
  }) => Promise<void>
}

const PRESET_ALASAN = [
  'Kuota bidang tidak mencukupi untuk seluruh anggota kelompok',
  'Persyaratan berkas administrasi tidak lengkap atau tidak sesuai',
  'Kualifikasi jurusan atau latar belakang pendidikan tidak relevan dengan bidang',
  'Lainnya (tulis alasan khusus)',
]

export function ModalReviewAnggota({
  isOpen,
  isFallbackData = false,
  pengajuan,
  anggotas,
  pembimbingOptions,
  sisaKuotaBidang,
  kuotaTotalBidang,
  terisiBidang,
  loadingSubmit,
  onClose,
  onSubmit,
}: ModalReviewAnggotaProps) {
  // State penerimaan per ID anggota: map { [anggotaId]: true (diterima) | false (ditolak) }
  const [keputusanMap, setKeputusanMap] = useState<Record<number, boolean>>({})
  // State alasan penolakan per anggota: map { [anggotaId]: string }
  const [alasanMap, setAlasanMap] = useState<Record<number, string>>({})
  // State dropdown preset per anggota
  const [presetMap, setPresetMap] = useState<Record<number, string>>({})
  // State pembimbing
  const [selectedPembimbing, setSelectedPembimbing] = useState<string>('')
  // State surat balasan url
  const [suratBalasanUrl, setSuratBalasanUrl] = useState<string>('')
  // State catatan global
  const [catatanGlobal, setCatatanGlobal] = useState<string>('')
  // Step konfirmasi dua langkah: 'review' | 'confirm'
  const [confirmStep, setConfirmStep] = useState<'review' | 'confirm'>('review')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Ref untuk melacak status isOpen sebelumnya agar useEffect TIDAK mereset pilihan admin saat re-render
  const prevIsOpenRef = React.useRef(false)

  // Inisialisasi default: HANYA dieksekusi saat modal BARU DIBUKA (isOpen transisi dari false ke true)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && anggotas.length > 0) {
      const initialKeputusan: Record<number, boolean> = {}
      const initialAlasan: Record<number, string> = {}
      const initialPreset: Record<number, string> = {}

      anggotas.forEach((a) => {
        initialKeputusan[a.id] = true
        initialAlasan[a.id] = ''
        initialPreset[a.id] = PRESET_ALASAN[0]
      })

      setKeputusanMap(initialKeputusan)
      setAlasanMap(initialAlasan)
      setPresetMap(initialPreset)
      setSelectedPembimbing('')
      setCatatanGlobal('')
      setConfirmStep('review')
      setValidationError(null)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, anggotas])

  // Hitung jumlah diterima dan ditolak
  // Hitung jumlah diterima dan ditolak
  const anggotaDiterimaIds = useMemo(() => {
    return Object.entries(keputusanMap)
      .filter(([_, diterima]) => diterima === true)
      .map(([id]) => Number(id))
  }, [keputusanMap])

  const anggotaDitolakIds = useMemo(() => {
    return Object.entries(keputusanMap)
      .filter(([_, diterima]) => diterima === false)
      .map(([id]) => Number(id))
  }, [keputusanMap])

  // Helper untuk mengekstrak alasan penolakan anggota secara ketat (tidak ada fallback teks otomatis)
  const getAlasanAnggota = (id: number): string => {
    const preset = presetMap[id] || PRESET_ALASAN[0]
    if (preset === 'Lainnya (tulis alasan khusus)') {
      return (alasanMap[id] || '').trim()
    }
    return preset.trim()
  }

  // Pengecekan apakah ada anggota yang ditolak tapi alasannya kosong (WAJIB terisi)
  const hasMissingRejectReason = useMemo(() => {
    return anggotaDitolakIds.some((id) => {
      const alasan = getAlasanAnggota(id)
      return alasan === ''
    })
  }, [anggotaDitolakIds, presetMap, alasanMap])

  const jumlahDiterima = anggotaDiterimaIds.length
  const jumlahDitolak = anggotaDitolakIds.length
  const totalAnggota = anggotas.length

  // Validasi kuota berlebih
  const isOverQuota = jumlahDiterima > sisaKuotaBidang

  if (!isOpen) return null

  const handleToggle = (id: number, diterima: boolean) => {
    setKeputusanMap((prev) => ({ ...prev, [id]: diterima }))
    setValidationError(null)
  }

  const handlePresetChange = (id: number, val: string) => {
    setPresetMap((prev) => ({ ...prev, [id]: val }))
    if (val !== 'Lainnya (tulis alasan khusus)') {
      setAlasanMap((prev) => ({ ...prev, [id]: val }))
    } else {
      setAlasanMap((prev) => ({ ...prev, [id]: '' }))
    }
  }

  const handleCustomReasonChange = (id: number, val: string) => {
    setAlasanMap((prev) => ({ ...prev, [id]: val }))
  }

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (isFallbackData) {
      setValidationError('Data anggota belum tersinkron, hubungi developer.')
      return
    }

    if (isOverQuota) {
      setValidationError(
        `Jumlah anggota yang diterima (${jumlahDiterima} orang) melebihi sisa kuota bidang (${sisaKuotaBidang} slot). Kurangi anggota yang diterima atau tolak sebagian.`
      )
      return
    }

    // Validasi alasan untuk setiap anggota yang ditolak
    for (const ditolakId of anggotaDitolakIds) {
      const alasan = getAlasanAnggota(ditolakId)
      if (!alasan) {
        const item = anggotas.find((a) => a.id === ditolakId)
        setValidationError(
          `Alasan penolakan untuk "${item?.nama || 'anggota'}" wajib diisi (preset atau teks khusus tidak boleh kosong).`
        )
        return
      }
    }

    setConfirmStep('confirm')
  }

  const handleFinalSubmit = async () => {
    setValidationError(null)

    if (isFallbackData) {
      setValidationError('Data anggota belum tersinkron, hubungi developer.')
      return
    }

    // Validasi ulang: pastikan SEMUA anggota yang ditolak memiliki alasan yang tidak kosong
    for (const item of anggotas) {
      const isAccepted = keputusanMap[item.id] !== false
      if (!isAccepted) {
        const rawReason = getAlasanAnggota(item.id)
        if (!rawReason) {
          setValidationError(`Alasan penolakan untuk "${item.nama}" wajib diisi.`)
          setConfirmStep('review')
          return
        }
      }
    }

    // Susun array keputusan_anggota yang WAJIB mencakup SEMUA anggota
    const keputusanAnggota = anggotas.map((item) => {
      const isAccepted = keputusanMap[item.id] !== false
      const alasan = isAccepted ? null : getAlasanAnggota(item.id)

      return {
        id: Number(item.id),
        status: isAccepted ? ('diterima' as const) : ('ditolak' as const),
        alasan: alasan || null,
      }
    })

    const isAllRejected = jumlahDiterima === 0

    // Alasan penolakan global jika semua ditolak
    let alasanGlobal: string | null = null
    if (isAllRejected) {
      const reasons = keputusanAnggota.filter((k) => k.alasan).map((k) => k.alasan as string)
      alasanGlobal = reasons[0] || 'Seluruh anggota kelompok belum memenuhi kriteria penerimaan.'
    }

    let catatan = catatanGlobal.trim()
    if (!catatan) {
      if (isAllRejected) {
        catatan = 'Seluruh anggota kelompok ditolak'
      } else if (jumlahDitolak > 0) {
        catatan = `Disetujui sebagian (${jumlahDiterima} diterima, ${jumlahDitolak} ditolak)`
      } else {
        catatan = `Seluruh anggota (${jumlahDiterima} orang) disetujui`
      }
    }

    // statusTarget selalu 'Sedang Magang', RPC akan otomatis menentukan Ditolak jika semua anggota ditolak
    await onSubmit({
      statusTarget: 'Sedang Magang',
      pembimbingId: selectedPembimbing ? Number(selectedPembimbing) : null,
      keputusanAnggota,
      alasanPenolakanGlobal: alasanGlobal,
      suratBalasanUrl: suratBalasanUrl.trim() || pengajuan.surat_balasan_url || null,
      catatan,
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
          maxWidth: '820px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Verifikasi Anggota & Kuota Pengajuan Magang
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
              {pengajuan.nama_lengkap} &bull; {pengajuan.asal_instansi} &bull; Bidang: {pengajuan.bidang_nama || '-'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loadingSubmit}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#94a3b8',
              cursor: loadingSubmit ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Banner Kapasitas & Live Counter */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f1f5f9',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>STATUS KUOTA BIDANG</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                Terisi {terisiBidang} / {kuotaTotalBidang} (Sisa: {sisaKuotaBidang})
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: isOverQuota ? '#fef2f2' : '#f0fdf4',
                borderRadius: '10px',
                border: `1px solid ${isOverQuota ? '#fecaca' : '#bbf7d0'}`,
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: isOverQuota ? '#b91c1c' : '#15803d',
                  fontWeight: 600,
                }}
              >
                PILIHAN DITERIMA
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: isOverQuota ? '#b91c1c' : '#15803d',
                  marginTop: '2px',
                }}
              >
                {jumlahDiterima} dari {totalAnggota} anggota {isOverQuota && `(Lebih ${jumlahDiterima - sisaKuotaBidang} slot!)`}
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: jumlahDitolak > 0 ? '#fff7ed' : '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 600 }}>DITOLAK</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#9a3412', marginTop: '2px' }}>
                {jumlahDitolak} anggota
              </div>
            </div>
          </div>

          {/* Banner Peringatan Keras Jika Data Anggota Masih Fallback */}
          {isFallbackData && (
            <div
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>⚠️</span>
              <span>Data anggota belum tersinkron, hubungi developer.</span>
            </div>
          )}

          {/* Alert Error Validasi */}
          {validationError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '12px',
                marginBottom: '1rem',
                fontWeight: 500,
              }}
            >
              {validationError}
            </div>
          )}

          {confirmStep === 'review' ? (
            <form onSubmit={handleProceedToConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Tabel / Daftar Anggota */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Daftar Anggota Kelompok
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {anggotas.map((item, idx) => {
                    const isAccepted = keputusanMap[item.id] !== false
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          border: `1px solid ${isAccepted ? '#bbf7d0' : '#fecaca'}`,
                          backgroundColor: isAccepted ? '#fcfdfd' : '#fff5f5',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.625rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                {idx + 1}. {item.nama}
                              </span>
                              {item.is_ketua && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#e0e7ff',
                                    color: '#4338ca',
                                  }}
                                >
                                  Ketua Kelompok
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              NIM: {item.nim_nis} &bull; Jurusan: {item.jurusan || '-'} &bull; HP: {item.no_hp || '-'}
                            </div>
                          </div>

                          {/* Tombol Toggle Terima / Tolak */}
                          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                            <button
                              type="button"
                              onClick={() => handleToggle(item.id, true)}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: isAccepted ? '#15803d' : '#f8fafc',
                                color: isAccepted ? '#ffffff' : '#64748b',
                              }}
                            >
                              Terima
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(item.id, false)}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: !isAccepted ? '#dc2626' : '#f8fafc',
                                color: !isAccepted ? '#ffffff' : '#64748b',
                              }}
                            >
                              Tolak
                            </button>
                          </div>
                        </div>

                        {/* Input Alasan jika Ditolak */}
                        {!isAccepted && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.75rem',
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #fca5a5',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                            }}
                          >
                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#991b1b' }}>
                              Alasan Penolakan untuk {item.nama}: <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                              value={presetMap[item.id] || PRESET_ALASAN[0]}
                              onChange={(e) => handlePresetChange(item.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                color: '#1e293b',
                              }}
                            >
                              {PRESET_ALASAN.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            {presetMap[item.id] === 'Lainnya (tulis alasan khusus)' && (
                              <input
                                type="text"
                                placeholder="Tulis alasan spesifik penolakan..."
                                value={alasanMap[item.id] || ''}
                                onChange={(e) => handleCustomReasonChange(item.id, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  color: '#1e293b',
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pemilihan Pembimbing (Hanya jika ada anggota yang diterima) */}
              {jumlahDiterima > 0 && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Penugasan Pembimbing Lapangan
                  </label>
                  <select
                    value={selectedPembimbing}
                    onChange={(e) => setSelectedPembimbing(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                    }}
                  >
                    <option value="">-- Tetapkan Pembimbing (Opsional / Dapat Diatur Nanti) --</option>
                    {pembimbingOptions.map((p) => {
                      const sisa = p.slot_tersedia ?? Math.max(0, (p.kuota_default || 0) - (p.terisi || 0))
                      return (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={p.is_active === false}
                        >
                          {p.nama} {p.nip ? `(NIP: ${p.nip})` : ''} - Sisa Kuota Bimbingan: {sisa} slot {p.is_active === false ? '(Nonaktif)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Catatan Tambahan */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Catatan Verifikasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={catatanGlobal}
                  onChange={(e) => setCatatanGlobal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                  }}
                />
              </div>

              {/* Peringatan Alasan Kosong atau Kuota Lebih */}
              {hasMissingRejectReason && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    color: '#e11d48',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Perhatian: Terdapat anggota yang ditolak dengan alasan penolakan masih kosong. Mohon pilih preset atau tulis alasan sebelum melanjutkan.
                </div>
              )}

              {/* Tombol Lanjut ke Konfirmasi */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isOverQuota || hasMissingRejectReason || isFallbackData}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: isOverQuota || hasMissingRejectReason || isFallbackData ? '#94a3b8' : '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: isOverQuota || hasMissingRejectReason || isFallbackData ? 'not-allowed' : 'pointer',
                  }}
                >
                  Review Ringkasan & Konfirmasi &rarr;
                </button>
              </div>
            </form>
          ) : (
            /* Langkah Konfirmasi Akhir (Two-Step Confirmation) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: jumlahDiterima === 0 ? '#fff1f2' : '#f0fdf4',
                  borderRadius: '12px',
                  border: `1px solid ${jumlahDiterima === 0 ? '#fecdd3' : '#bbf7d0'}`,
                }}
              >
                <h4
                  style={{
                    margin: '0 0 0.5rem',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: jumlahDiterima === 0 ? '#9f1239' : '#166534',
                  }}
                >
                  {jumlahDiterima === 0
                    ? 'Konfirmasi Penolakan Seluruh Pengajuan'
                    : jumlahDitolak > 0
                    ? 'Konfirmasi Penerimaan Sebagian Anggota (Partial Approval)'
                    : 'Konfirmasi Penerimaan Seluruh Anggota'}
                </h4>
                <p style={{ margin: '0 0 0.75rem', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                  Anda akan menetapkan status verifikasi pengajuan ini:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                  <li>
                    Status Akhir: <strong>{jumlahDiterima > 0 ? 'Sedang Magang' : 'Ditolak'}</strong>
                  </li>
                  <li>
                    Anggota Diterima: <strong>{jumlahDiterima} orang</strong> (Slot bidang akan dialokasikan)
                  </li>
                  <li>
                    Anggota Ditolak: <strong>{jumlahDitolak} orang</strong>
                  </li>
                  {selectedPembimbing && (
                    <li>
                      Pembimbing: <strong>{pembimbingOptions.find((p) => String(p.id) === String(selectedPembimbing))?.nama || '-'}</strong>
                    </li>
                  )}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setConfirmStep('review')}
                  disabled={loadingSubmit}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: loadingSubmit ? 'not-allowed' : 'pointer',
                  }}
                >
                  &larr; Ubah Pilihan
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loadingSubmit || isFallbackData}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    backgroundColor: isFallbackData ? '#94a3b8' : jumlahDiterima > 0 ? '#15803d' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: loadingSubmit || isFallbackData ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {loadingSubmit ? 'Memproses...' : 'Ya, Eksekusi Verifikasi Sekarang'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
