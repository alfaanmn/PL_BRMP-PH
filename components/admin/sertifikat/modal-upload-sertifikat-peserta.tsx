'use client'

import React, { useState, useRef } from 'react'
import type { AdminSertifikatListItem, PesertaSertifikatItem } from '@/types/sertifikat.types'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'

interface ModalUploadSertifikatPesertaProps {
  isOpen: boolean
  onClose: () => void
  item: AdminSertifikatListItem | null
  onSuccess: () => void
}

export function ModalUploadSertifikatPeserta({
  isOpen,
  onClose,
  item,
  onSuccess,
}: ModalUploadSertifikatPesertaProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File }>({})

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null)

  // Input file refs
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  if (!isOpen || !item) return null

  const handleTriggerFilePicker = (index: number) => {
    setErrorMsg(null)
    const inputEl = fileInputRefs.current[index]
    if (inputEl) {
      inputEl.value = '' // reset agar bisa memilih file yang sama jika diinginkan
      inputEl.click()
    }
  }

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    const file = e.target.files?.[0] || null
    if (!file) {
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'jpg' && ext !== 'jpeg') {
      setErrorMsg('Format file tidak didukung. Hanya PDF atau JPG/JPEG yang diperbolehkan.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal adalah 5 MB.')
      return
    }

    setSelectedFiles((prev) => ({ ...prev, [index]: file }))
  }

  const handleCancelSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    const inputEl = fileInputRefs.current[index]
    if (inputEl) {
      inputEl.value = ''
    }
  }

  const handleUploadSubmit = async (peserta: PesertaSertifikatItem, index: number) => {
    const file = selectedFiles[index]
    if (!file) {
      setErrorMsg(`Silakan pilih berkas sertifikat untuk ${peserta.nama} terlebih dahulu.`)
      return
    }

    try {
      setUploadingIndex(index)
      setErrorMsg(null)

      const formData = new FormData()
      formData.append('pengajuan_id', String(item.pengajuanId))
      formData.append('file', file)
      formData.append('peserta_nama', peserta.nama)
      formData.append('peserta_nim', peserta.nim_nis || '')
      formData.append('is_ketua', peserta.is_ketua ? 'true' : 'false')
      if (peserta.id) {
        formData.append('anggota_id', String(peserta.id))
      }

      const res = await fetch('/api/admin/sertifikat/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.success) {
        handleCancelSelectedFile(index)
        onSuccess()
      } else {
        setErrorMsg(json.error || `Gagal mengunggah sertifikat untuk ${peserta.nama}.`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan jaringan saat mengunggah.'
      setErrorMsg(msg)
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleDelete = async (sertifikatId: number, pesertaNama: string) => {
    if (!confirm(`Hapus berkas sertifikat untuk peserta "${pesertaNama}"?`)) {
      return
    }

    try {
      setDeletingId(sertifikatId)
      setErrorMsg(null)

      const res = await fetch('/api/admin/sertifikat/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sertifikat_id: sertifikatId }),
      })

      const json = await res.json()
      if (json.success) {
        onSuccess()
      } else {
        setErrorMsg(json.error || 'Gagal menghapus berkas sertifikat.')
      }
    } catch {
      setErrorMsg('Terjadi kesalahan sistem saat menghapus sertifikat.')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePreview = async (sertifikatId: number, pesertaNama: string) => {
    try {
      setPreviewLoadingId(sertifikatId)
      const res = await fetch(`/api/pengguna/sertifikat/download?sertifikat_id=${sertifikatId}`)
      const json = await res.json()
      if (json.success && json.data?.signedUrl) {
        setPreviewDoc({
          url: json.data.signedUrl,
          title: `Sertifikat Magang - ${pesertaNama} (#${item.publicId})`,
        })
      } else {
        alert(json.error || 'Gagal memuat pratinjau sertifikat.')
      }
    } catch {
      alert('Terjadi kesalahan saat memuat berkas.')
    } finally {
      setPreviewLoadingId(null)
    }
  }

  const uploadedCount = item.pesertas.filter((p) => Boolean(p.sertifikat)).length
  const totalCount = item.pesertas.length

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}>
          {/* Header Modal */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: '#f8fafc',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🎓</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Kelola Sertifikat Peserta Magang
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: uploadedCount === totalCount ? '#dcfce7' : '#fef3c7',
                  color: uploadedCount === totalCount ? '#166534' : '#92400e',
                  border: uploadedCount === totalCount ? '1px solid #86efac' : '1px solid #fde68a',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}>
                  {uploadedCount}/{totalCount} Berkas Terunggah
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Pengajuan #{item.publicId} &bull; {item.asalInstansi} &bull; {item.bidangNama}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
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

          {/* Body Daftar Peserta */}
          <div style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {errorMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.8125rem',
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{
              fontSize: '0.8125rem',
              color: '#475569',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              lineHeight: 1.5,
            }}>
              Setiap peserta magang (ketua maupun seluruh anggota kelompok) memiliki 1 berkas sertifikat resmi masing-masing. Klik tombol <strong>Pilih Berkas</strong> atau <strong>Ganti File</strong> untuk memilih sertifikat dari komputer Anda.
            </div>

            {item.pesertas.map((peserta, idx) => {
              const cert = peserta.sertifikat
              const isUploadingThis = uploadingIndex === idx
              const isDeletingThis = Boolean(cert && deletingId === cert.id)
              const isPreviewingThis = Boolean(cert && previewLoadingId === cert.id)
              const stagedFile = selectedFiles[idx]

              // Cek peringatan jika data nama/NIM di sertifikat berbeda dengan data peserta terbaru
              const isNameMismatch =
                cert &&
                cert.peserta_nama.trim().toLowerCase() !== peserta.nama.trim().toLowerCase()
              const isNimMismatch =
                cert &&
                Boolean(peserta.nim_nis) &&
                Boolean(cert.peserta_nim) &&
                cert.peserta_nim.trim() !== peserta.nim_nis.trim()

              return (
                <div
                  key={`${peserta.nama}_${idx}`}
                  style={{
                    backgroundColor: '#ffffff',
                    border: stagedFile ? '2px solid #86efac' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Hidden native file input */}
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[idx] = el
                    }}
                    accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                    onChange={(e) => handleFileChange(idx, e)}
                    style={{ display: 'none' }}
                  />

                  {/* Identitas Peserta */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: peserta.is_ketua ? '#eff6ff' : '#f1f5f9',
                        color: peserta.is_ketua ? '#1d4ed8' : '#475569',
                        border: peserta.is_ketua ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                      }}>
                        {peserta.is_ketua ? 'Ketua Kelompok / Pemohon' : `Anggota #${idx}`}
                      </span>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9375rem' }}>
                        {peserta.nama}
                      </span>
                      {peserta.nim_nis && (
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          (NIM: {peserta.nim_nis})
                        </span>
                      )}
                    </div>

                    {cert ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #86efac',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        ✓ Sertifikat Siap
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#fef2f2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        Belum Diunggah
                      </span>
                    )}
                  </div>

                  {/* Warning jika nama/NIM diedit setelah sertifikat diunggah */}
                  {(isNameMismatch || isNimMismatch) && (
                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem',
                      marginBottom: '0.75rem',
                      fontSize: '0.75rem',
                      color: '#92400e',
                      lineHeight: 1.4,
                    }}>
                      ⚠️ <strong>Peringatan Perubahan Data:</strong> Nama pada sertifikat terunggah (
                      <strong>{cert.peserta_nama}</strong>
                      {cert.peserta_nim ? ` / ${cert.peserta_nim}` : ''}) berbeda dengan data terbaru (
                      <strong>{peserta.nama}</strong>
                      {peserta.nim_nis ? ` / ${peserta.nim_nis}` : ''}). Disarankan untuk mengunggah ulang sertifikat yang sesuai.
                    </div>
                  )}

                  {/* Berkas Sertifikat Eksisting */}
                  {cert && !stagedFile && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>📄</span>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                            {cert.file_name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                            Ukuran: {(cert.file_size / 1024).toFixed(1)} KB &bull; Diunggah:{' '}
                            {new Date(cert.uploaded_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handlePreview(cert.id, peserta.nama)}
                          disabled={isPreviewingThis}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            color: '#1A6FC4',
                            border: '1px solid #bfdbfe',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: isPreviewingThis ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isPreviewingThis ? 'Memuat...' : '👁️ Pratinjau'}
                        </button>

                        {/* Tombol Ganti File yang LANGSUNG membuka file picker */}
                        <button
                          type="button"
                          onClick={() => handleTriggerFilePicker(idx)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🔄 Ganti File
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(cert.id, peserta.nama)}
                          disabled={isDeletingThis}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: isDeletingThis ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isDeletingThis ? '...' : '🗑️ Hapus'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State 1: File Baru Telah Dipilih (Siap Unggah) */}
                  {stagedFile ? (
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>📎</span>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#166534' }}>
                            Berkas Siap Diunggah: {stagedFile.name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#15803d' }}>
                            Ukuran: {(stagedFile.size / 1024).toFixed(1)} KB &bull; Format: {stagedFile.type || 'Dokumen'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleCancelSelectedFile(idx)}
                          disabled={isUploadingThis}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: isUploadingThis ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Batal
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUploadSubmit(peserta, idx)}
                          disabled={isUploadingThis}
                          style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '6px',
                            backgroundColor: '#15803d',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: isUploadingThis ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)',
                          }}
                        >
                          <span>{isUploadingThis ? '⏳ Mengunggah...' : '⬆️ Unggah Sekarang'}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* State 2: Belum ada sertifikat dan belum pilih file */}
                  {!cert && !stagedFile && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px dashed #cbd5e1',
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Belum ada berkas sertifikat untuk {peserta.nama} (Maks. 5 MB PDF/JPEG).
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTriggerFilePicker(idx)}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '6px',
                          backgroundColor: '#1A6FC4',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 1px 2px rgba(26, 111, 196, 0.2)',
                        }}
                      >
                        <span>📁</span>
                        <span>Pilih Berkas Sertifikat</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer Modal */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#f8fafc',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
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

      {/* Modal Pratinjau Dokumen */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </>
  )
}
