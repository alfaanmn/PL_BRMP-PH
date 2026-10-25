'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { AdminSertifikatListItem } from '@/types/sertifikat.types'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'
import { ModalUploadSertifikatPeserta } from '@/components/admin/sertifikat/modal-upload-sertifikat-peserta'

export default function AdminSertifikatPage() {
  const [list, setList] = useState<AdminSertifikatListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [skmFilter, setSkmFilter] = useState<'semua' | 'sudah' | 'belum'>('semua')
  const [certFilter, setCertFilter] = useState<'semua' | 'sudah' | 'belum'>('semua')
  const [notifFilter, setNotifFilter] = useState<'semua' | 'sudah' | 'belum'>('semua')

  // Multi-participant modal state
  const [activeModalItem, setActiveModalItem] = useState<AdminSertifikatListItem | null>(null)

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null)

  // Modal pemilihan pratinjau sertifikat peserta (untuk pengajuan kelompok)
  const [previewPickerItem, setPreviewPickerItem] = useState<AdminSertifikatListItem | null>(null)

  // Delete all state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const res = await fetch('/api/admin/sertifikat/list?' + new URLSearchParams({
        search,
        skmStatus: skmFilter,
        sertifikatStatus: certFilter,
        notifikasiStatus: notifFilter,
      }))
      const json = await res.json()
      if (json.success) {
        setList(json.data)
        // Jika modal sedang terbuka, perbarui data item yang aktif
        setActiveModalItem((prev) => {
          if (!prev) return null
          return json.data.find((d: AdminSertifikatListItem) => d.pengajuanId === prev.pengajuanId) || null
        })
      } else {
        setErrorMsg(json.error || 'Gagal memuat data sertifikat.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan memuat data.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [search, skmFilter, certFilter, notifFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDeleteAll = async (item: AdminSertifikatListItem) => {
    if (!confirm(`Hapus SELURUH berkas sertifikat untuk pengajuan ${item.namaPemohon} (#${item.publicId})?`)) {
      return
    }

    try {
      setDeletingId(item.pengajuanId)
      const res = await fetch('/api/admin/sertifikat/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengajuan_id: item.pengajuanId }),
      })
      const json = await res.json()
      if (json.success) {
        loadData()
      } else {
        alert(json.error || 'Gagal menghapus sertifikat.')
      }
    } catch {
      alert('Terjadi kesalahan saat menghubungi server.')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePreviewSpecific = async (certId: number, pesertaNama: string, publicId: string) => {
    try {
      setPreviewLoadingId(certId)
      const res = await fetch(`/api/pengguna/sertifikat/download?sertifikat_id=${certId}`)
      const json = await res.json()
      if (json.success && json.data?.signedUrl) {
        setPreviewDoc({
          url: json.data.signedUrl,
          title: `Sertifikat Magang - ${pesertaNama} (#${publicId})`,
        })
      } else {
        alert(json.error || 'Gagal memuat pratinjau berkas sertifikat. Berkas mungkin belum diunggah atau tidak ditemukan.')
      }
    } catch {
      alert('Terjadi kesalahan saat memuat berkas sertifikat.')
    } finally {
      setPreviewLoadingId(null)
    }
  }

  const handlePreviewClick = (item: AdminSertifikatListItem) => {
    if (!item.sertifikats || item.sertifikats.length === 0) {
      alert('Belum ada berkas sertifikat yang diunggah untuk pengajuan ini.')
      return
    }

    // Jika hanya ada 1 sertifikat terunggah, langsung buka pratinjau
    if (item.sertifikats.length === 1) {
      const singleCert = item.sertifikats[0]
      handlePreviewSpecific(singleCert.id, singleCert.peserta_nama, item.publicId)
      return
    }

    // Jika ada lebih dari 1 sertifikat terunggah (kelompok), buka modal pemilih peserta
    setPreviewPickerItem(item)
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Halaman */}
      <div style={{
        marginBottom: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Manajemen Sertifikat Magang
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Kelola penerbitan sertifikat kelulusan peserta magang (1 sertifikat per peserta untuk kelompok &amp; individu).
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {/* Pencarian */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
              Cari Peserta / ID
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nama, ID, instansi..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filter Status SKM */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
              Status SKM
            </label>
            <select
              value={skmFilter}
              onChange={(e) => setSkmFilter(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value="semua">Semua Status SKM</option>
              <option value="sudah">Sudah Mengisi SKM</option>
              <option value="belum">Belum Mengisi SKM</option>
            </select>
          </div>

          {/* Filter Status Sertifikat */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
              Status Berkas Sertifikat
            </label>
            <select
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value="semua">Semua Berkas</option>
              <option value="sudah">Sudah Diunggah</option>
              <option value="belum">Belum Diunggah</option>
            </select>
          </div>

          {/* Filter Status Notifikasi */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
              Status Email / Notifikasi
            </label>
            <select
              value={notifFilter}
              onChange={(e) => setNotifFilter(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value="semua">Semua Status Notifikasi</option>
              <option value="sudah">Terkirim</option>
              <option value="belum">Belum Terkirim</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Data */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        {errorMsg && (
          <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '0.875rem', borderBottom: '1px solid #fecaca' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Peserta &amp; Tipe</th>
                <th style={{ padding: '0.875rem 1rem' }}>Instansi &amp; Bidang</th>
                <th style={{ padding: '0.875rem 1rem' }}>Periode</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status SKM</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status Berkas</th>
                <th style={{ padding: '0.875rem 1rem' }}>Notifikasi</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    Memuat data sertifikat...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    Tidak ada peserta berstatus Selesai yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                list.map((item) => {
                  const totalPeserta = item.pesertas?.length || 1
                  const uploadedCerts = item.sertifikats?.length || 0
                  const isFullyUploaded = uploadedCerts >= totalPeserta && totalPeserta > 0
                  const isPartiallyUploaded = uploadedCerts > 0 && uploadedCerts < totalPeserta

                  return (
                    <tr key={item.pengajuanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Peserta & Tipe */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.namaPemohon}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          ID: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>#{item.publicId}</code>
                          {item.nimNis && ` | NIM: ${item.nimNis}`}
                        </div>
                        {totalPeserta > 1 ? (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}>
                              👥 Kelompok ({totalPeserta} orang)
                            </span>
                          </div>
                        ) : (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              backgroundColor: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}>
                              👤 Individu
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Instansi */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ color: '#334155', fontWeight: 500 }}>{item.asalInstansi}</div>
                        <div style={{ fontSize: '0.75rem', color: '#1A6FC4', fontWeight: 600 }}>{item.bidangNama}</div>
                      </td>

                      {/* Periode */}
                      <td style={{ padding: '0.875rem 1rem', color: '#475569', fontSize: '0.8125rem' }}>
                        <div>{item.tanggalMulai} s/d</div>
                        <div>{item.tanggalSelesai} ({item.durasiBulan} bln)</div>
                      </td>

                      {/* Status SKM */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {item.hasSubmittedSKM ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#ecfdf5',
                            color: '#065F46',
                            border: '1px solid #a7f3d0',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}>
                            ✓ Sudah Diisi
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#fffbeb',
                            color: '#78350F',
                            border: '1px solid #fde68a',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}>
                            ⚠️ Belum Diisi
                          </span>
                        )}
                      </td>

                      {/* Status Berkas */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isFullyUploaded ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              backgroundColor: '#ecfdf5',
                              color: '#065F46',
                              border: '1px solid #a7f3d0',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}>
                              ✓ Lengkap ({uploadedCerts}/{totalPeserta})
                            </span>
                          </div>
                        ) : isPartiallyUploaded ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              backgroundColor: '#fffbeb',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}>
                              ⚠️ {uploadedCerts}/{totalPeserta} Diunggah
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            Belum Diunggah (0/{totalPeserta})
                          </span>
                        )}
                      </td>

                      {/* Notifikasi */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {item.notifiedAt ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#ecfdf5',
                            color: '#065F46',
                            border: '1px solid #a7f3d0',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}>
                            ✓ Terkirim
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#f8fafc',
                            color: '#94a3b8',
                            border: '1px solid #cbd5e1',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            Belum Terkirim
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                          {/* Tombol Kelola Berkas Multi-Peserta */}
                          <button
                            type="button"
                            onClick={() => setActiveModalItem(item)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              backgroundColor: isFullyUploaded ? '#f8fafc' : '#1A6FC4',
                              color: isFullyUploaded ? '#0f172a' : '#ffffff',
                              border: isFullyUploaded ? '1px solid #cbd5e1' : '1px solid #1A6FC4',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <span>📂</span>
                            <span>Kelola ({uploadedCerts}/{totalPeserta})</span>
                          </button>

                          {/* Tombol Pratinjau Cepat */}
                          {uploadedCerts > 0 && (
                            <button
                              type="button"
                              onClick={() => handlePreviewClick(item)}
                              disabled={previewLoadingId !== null}
                              style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                backgroundColor: '#eff6ff',
                                color: '#1A6FC4',
                                border: '1px solid #bfdbfe',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: previewLoadingId !== null ? 'not-allowed' : 'pointer',
                              }}
                              title={uploadedCerts > 1 ? 'Pilih Sertifikat untuk Dilihat' : 'Lihat Pratinjau Cepat'}
                            >
                              {previewLoadingId && item.sertifikats.some((c) => c.id === previewLoadingId) ? '...' : '👁️'}
                            </button>
                          )}

                          {/* Tombol Hapus Semua */}
                          {uploadedCerts > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAll(item)}
                              disabled={deletingId === item.pengajuanId}
                              style={{
                                padding: '0.4rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: deletingId === item.pengajuanId ? 'not-allowed' : 'pointer',
                              }}
                              title="Hapus Semua Berkas Sertifikat Pengajuan Ini"
                            >
                              {deletingId === item.pengajuanId ? '...' : '🗑️'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pemilihan Pratinjau Sertifikat Peserta (Khusus Kelompok > 1 Berkas) */}
      {previewPickerItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9990,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewPickerItem(null)
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                backgroundColor: '#f8fafc',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>👁️</span>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Pilih Sertifikat untuk Dilihat
                  </h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                  Pengajuan #{previewPickerItem.publicId} &bull; {previewPickerItem.asalInstansi} &bull; {previewPickerItem.sertifikats.length} Berkas Tersedia
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPickerItem(null)}
                aria-label="Tutup Modal"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* List Berkas Peserta (Ketua selalu di urutan paling atas) */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {[...previewPickerItem.sertifikats]
                .sort((a, b) => {
                  if (a.is_ketua && !b.is_ketua) return -1
                  if (!a.is_ketua && b.is_ketua) return 1
                  return a.id - b.id
                })
                .map((cert) => {
                  const isThisLoading = previewLoadingId === cert.id
                  return (
                    <div
                      key={cert.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ flex: '1 1 200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                            {cert.peserta_nama}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: cert.is_ketua ? '#eff6ff' : '#f1f5f9',
                              color: cert.is_ketua ? '#1e40af' : '#475569',
                              border: cert.is_ketua ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                            }}
                          >
                            {cert.is_ketua ? 'Ketua' : 'Anggota'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          NIM/NIS: {cert.peserta_nim || '-'} &bull; {cert.file_name} ({(cert.file_size / 1024).toFixed(1)} KB)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePreviewSpecific(cert.id, cert.peserta_nama, previewPickerItem.publicId)}
                        disabled={previewLoadingId !== null}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.45rem 0.875rem',
                          borderRadius: '8px',
                          backgroundColor: '#1A6FC4',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: previewLoadingId !== null ? 'not-allowed' : 'pointer',
                          opacity: isThisLoading ? 0.7 : 1,
                        }}
                      >
                        <span>👁️</span>
                        <span>{isThisLoading ? 'Memuat...' : 'Lihat Pratinjau'}</span>
                      </button>
                    </div>
                  )
                })}
            </div>

            {/* Footer Modal */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewPickerItem(null)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Terpadu Kelola Sertifikat Peserta (Ketua + Anggota) */}
      <ModalUploadSertifikatPeserta
        isOpen={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
        item={activeModalItem}
        onSuccess={() => {
          loadData()
        }}
      />

      {/* Modal Pratinjau Berkas Dokumen */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </div>
  )
}
