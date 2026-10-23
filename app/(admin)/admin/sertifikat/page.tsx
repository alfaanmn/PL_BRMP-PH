'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  sertifikatService,
} from '@/lib/services/sertifikat.service'
import type { AdminSertifikatListItem } from '@/types/sertifikat.types'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'

export default function AdminSertifikatPage() {
  const [list, setList] = useState<AdminSertifikatListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [skmFilter, setSkmFilter] = useState<'semua' | 'sudah' | 'belum'>('semua')
  const [certFilter, setCertFilter] = useState<'semua' | 'sudah' | 'belum'>('semua')
  const [notifFilter, setNotifFilter] = useState<'semua' | 'sudah' | 'belum'>('semua')

  // Upload modal state
  const [activeUploadItem, setActiveUploadItem] = useState<AdminSertifikatListItem | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null)

  // Delete state
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

  const handleOpenUpload = (item: AdminSertifikatListItem) => {
    setActiveUploadItem(item)
    setSelectedFile(null)
    setUploadError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setUploadError(null)
    if (!file) {
      setSelectedFile(null)
      return
    }

    // Client-side quick check
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'jpg' && ext !== 'jpeg') {
      setUploadError('Hanya berkas berformat PDF atau JPG/JPEG yang diperbolehkan.')
      setSelectedFile(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran berkas tidak boleh melebihi 5 MB.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUploadItem || !selectedFile) {
      setUploadError('Silakan pilih berkas sertifikat terlebih dahulu.')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append('pengajuan_id', String(activeUploadItem.pengajuanId))
      formData.append('file', selectedFile)

      const res = await fetch('/api/admin/sertifikat/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.success) {
        setActiveUploadItem(null)
        loadData()
      } else {
        setUploadError(json.error || 'Gagal mengunggah berkas sertifikat.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (item: AdminSertifikatListItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus berkas sertifikat untuk ${item.namaPemohon}?`)) {
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

  const handlePreview = async (item: AdminSertifikatListItem) => {
    try {
      setPreviewLoadingId(item.pengajuanId)
      const res = await fetch(`/api/pengguna/sertifikat/download?pengajuan_id=${item.pengajuanId}`)
      const json = await res.json()
      if (json.success && json.data?.signedUrl) {
        setPreviewDoc({
          url: json.data.signedUrl,
          title: `Sertifikat Magang - ${item.namaPemohon} (${item.publicId})`,
        })
      } else {
        alert(json.error || 'Gagal memuat pratinjau berkas sertifikat.')
      }
    } catch {
      alert('Terjadi kesalahan saat memuat berkas.')
    } finally {
      setPreviewLoadingId(null)
    }
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
            Kelola penerbitan dan pengunggahan berkas sertifikat kelulusan peserta magang berstatus Selesai.
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
                <th style={{ padding: '0.875rem 1rem' }}>Peserta &amp; ID</th>
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
                list.map((item) => (
                  <tr key={item.pengajuanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* Peserta */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.namaPemohon}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ID: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>#{item.publicId}</code> | NIM: {item.nimNis}
                      </div>
                    </td>

                    {/* Instansi */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ color: '#334155', fontWeight: 500 }}>{item.asalInstansi}</div>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>{item.bidangNama}</div>
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
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
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
                          color: '#b45309',
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
                      {item.sertifikat ? (
                        <div>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#ecfdf5',
                            color: '#166534',
                            border: '1px solid #86efac',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}>
                            ✓ Sudah Diunggah
                          </span>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '3px' }}>
                            {item.sertifikat.file_name}
                          </div>
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
                          Belum Diunggah
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
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
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
                        {/* Tombol Unggah / Ganti */}
                        <button
                          type="button"
                          onClick={() => handleOpenUpload(item)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            backgroundColor: item.sertifikat ? '#f8fafc' : '#15803d',
                            color: item.sertifikat ? '#0f172a' : '#ffffff',
                            border: item.sertifikat ? '1px solid #cbd5e1' : '1px solid #15803d',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {item.sertifikat ? 'Ganti File' : 'Unggah'}
                        </button>

                        {/* Tombol Lihat Pratinjau */}
                        {item.sertifikat && (
                          <button
                            type="button"
                            onClick={() => handlePreview(item)}
                            disabled={previewLoadingId === item.pengajuanId}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              backgroundColor: '#ecfdf5',
                              color: '#15803d',
                              border: '1px solid #a7f3d0',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: previewLoadingId === item.pengajuanId ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {previewLoadingId === item.pengajuanId ? '...' : 'Lihat'}
                          </button>
                        )}

                        {/* Tombol Hapus */}
                        {item.sertifikat && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.pengajuanId}
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: deletingId === item.pengajuanId ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {deletingId === item.pengajuanId ? '...' : 'Hapus'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Unggah / Ganti File */}
      {activeUploadItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              {activeUploadItem.sertifikat ? 'Ganti Berkas Sertifikat' : 'Unggah Sertifikat Magang'}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Peserta: <strong>{activeUploadItem.namaPemohon}</strong> (#{activeUploadItem.publicId})<br />
              Asal Instansi: {activeUploadItem.asalInstansi}
            </p>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
                  Pilih Berkas (PDF atau JPEG/JPG, maks. 5 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf, .jpg, .jpeg, image/jpeg, application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    boxSizing: 'border-box',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              {uploadError && (
                <div style={{
                  padding: '0.625rem 0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveUploadItem(null)}
                  disabled={uploading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer',
                    opacity: uploading || !selectedFile ? 0.6 : 1,
                  }}
                >
                  {uploading ? 'Mengunggah...' : 'Simpan Berkas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
