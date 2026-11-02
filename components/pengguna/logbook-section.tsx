'use client'

import React, { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { FileTextIcon, LoaderIcon, EyeIcon } from '@/components/ui/admin-icons'

interface LogbookItem {
  id: string
  minggu_ke: number
  periode_mulai: string
  periode_selesai: string
  file_name: string
  file_size: number
  mime_type: string
  catatan?: string | null
  created_at: string
  updated_at: string
}

interface WeekData {
  minggu_ke: number
  periode_mulai: string
  periode_selesai: string
  is_current: boolean
  is_future: boolean
  is_past: boolean
  logbook: LogbookItem | null
}

interface LogbookSectionProps {
  pengajuanId: number | string
  pengajuanStatus: string
}

export function LogbookSection({ pengajuanId, pengajuanStatus }: LogbookSectionProps) {
  const [weeks, setWeeks] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeUploadWeek, setActiveUploadWeek] = useState<WeekData | null>(null)

  // Upload modal states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [catatan, setCatatan] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Pratinjau signed url
  const [openingDocId, setOpeningDocId] = useState<string | null>(null)

  // Tampilkan kartu informatif jika status belum 'Sedang Magang' agar pemohon mengetahui lokasi modul logbook
  if (pengajuanStatus !== 'Sedang Magang') {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            📖
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Logbook Kegiatan Magang Mingguan
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Pencatatan dan unggah laporan kegiatan mingguan peserta magang
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
          fontSize: '0.8125rem',
          color: '#475569',
          lineHeight: 1.6,
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>ℹ️</span>
          <div>
            <strong style={{ color: '#0f172a' }}>Kapan modul ini aktif?</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>
              Modul pengunggahan berkas dan catatan mingguan akan otomatis aktif di halaman ini setelah permohonan magang Anda disetujui oleh tim admin dan telah memasuki periode aktif magang (status: <strong style={{ color: '#16a34a' }}>Sedang Magang</strong>).
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fetchLogbooks = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const res = await fetch(`/api/pengguna/logbook?pengajuan_id=${pengajuanId}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat jadwal logbook.')
      }
      setWeeks(data.weeks || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data logbook.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogbooks()
  }, [pengajuanId])

  const handleOpenUpload = (week: WeekData) => {
    setActiveUploadWeek(week)
    setSelectedFile(null)
    setCatatan(week.logbook?.catatan || '')
    setUploadError(null)
    setUploadProgressText('')
  }

  const handleCloseUpload = () => {
    if (uploading) return
    setActiveUploadWeek(null)
    setSelectedFile(null)
    setCatatan('')
    setUploadError(null)
    setUploadProgressText('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    setUploadError(null)
    const lowerName = file.name.toLowerCase()
    const validExts = ['.pdf', '.jpg', '.jpeg', '.png']
    const hasValidExt = validExts.some((ext) => lowerName.endsWith(ext))

    if (!hasValidExt) {
      setUploadError('Format berkas tidak didukung. Harap pilih berkas PDF, JPG, JPEG, atau PNG.')
      setSelectedFile(null)
      return
    }

    if (file.type === 'application/pdf' && file.size > 2 * 1024 * 1024) {
      setUploadError(
        `Berkas PDF terlalu besar (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maksimal 2 MB. Silakan kompresi berkas PDF Anda terlebih dahulu.`
      )
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUploadWeek) return

    if (!selectedFile && !activeUploadWeek.logbook) {
      setUploadError('Silakan pilih berkas logbook terlebih dahulu.')
      return
    }

    if (!selectedFile) {
      setUploadError('Harap pilih berkas baru jika ingin mengganti logbook.')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)

      let fileToUpload: File = selectedFile

      // Kompresi jika tipe gambar
      if (selectedFile.type.startsWith('image/')) {
        setUploadProgressText('Mengompresi gambar...')
        try {
          const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          }
          fileToUpload = await imageCompression(selectedFile, options)
        } catch (compErr) {
          console.warn('[Logbook] Kompresi gambar gagal, menggunakan berkas asli:', compErr)
          fileToUpload = selectedFile
        }
      }

      setUploadProgressText('Mengunggah berkas logbook...')
      const fd = new FormData()
      fd.append('file', fileToUpload)
      fd.append('pengajuan_id', String(pengajuanId))
      fd.append('minggu_ke', String(activeUploadWeek.minggu_ke))
      if (catatan.trim()) {
        fd.append('catatan', catatan.trim())
      }

      const res = await fetch('/api/pengguna/logbook/upload', {
        method: 'POST',
        body: fd,
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengunggah berkas logbook.')
      }

      // Berhasil
      handleCloseUpload()
      await fetchLogbooks()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengunggah logbook.'
      setUploadError(msg)
    } finally {
      setUploading(false)
      setUploadProgressText('')
    }
  }

  const handleViewLogbook = async (logbookId: string) => {
    try {
      setOpeningDocId(logbookId)
      const res = await fetch(`/api/logbook/signed-url?id=${logbookId}`)
      const data = await res.json()
      if (!res.ok || !data.success || !data.signedUrl) {
        throw new Error(data.error || 'Gagal memuat berkas.')
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuka berkas logbook.'
      alert(msg)
    } finally {
      setOpeningDocId(null)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '1.25rem',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8',
            }}
          >
            <FileTextIcon width={18} height={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Logbook Kegiatan Magang Mingguan
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Unggah 1 berkas laporan/dokumentasi kegiatan setiap minggunya (PDF/JPG/PNG maks 2 MB).
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
          }}
        >
          Masa Magang Aktif
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.5rem', color: '#64748b' }}>
          <LoaderIcon width={18} height={18} />
          <span style={{ fontSize: '0.875rem' }}>Memuat jadwal logbook...</span>
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.8125rem' }}>
          {errorMsg}
        </div>
      ) : weeks.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
          Belum ada jadwal minggu yang terhitung untuk periode magang Anda.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {weeks.map((week) => {
            const hasUploaded = Boolean(week.logbook)
            return (
              <div
                key={week.minggu_ke}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: week.is_current ? '#f0fdf4' : '#f8fafc',
                  border: week.is_current ? '1px solid #86efac' : '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                      Minggu ke-{week.minggu_ke}
                    </span>
                    {week.is_current && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        Minggu Ini
                      </span>
                    )}
                    {week.is_future && (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        Mendatang
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Periode: {week.periode_mulai} s/d {week.periode_selesai}
                  </div>
                  {hasUploaded && week.logbook && (
                    <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.2rem' }}>
                      ✓ {week.logbook.file_name} ({(week.logbook.file_size / 1024).toFixed(0)} KB) — Diunggah {new Date(week.logbook.updated_at).toLocaleDateString('id-ID')}
                      {week.logbook.catatan && (
                        <div style={{ fontStyle: 'italic', color: '#475569', marginTop: '2px' }}>
                          "{week.logbook.catatan}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {hasUploaded && week.logbook && (
                    <button
                      type="button"
                      onClick={() => handleViewLogbook(week.logbook!.id)}
                      disabled={openingDocId === week.logbook.id}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#2563eb',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      {openingDocId === week.logbook.id ? <LoaderIcon width={12} height={12} /> : <EyeIcon width={12} height={12} />}
                      Lihat
                    </button>
                  )}

                  {!week.is_future ? (
                    <button
                      type="button"
                      onClick={() => handleOpenUpload(week)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: hasUploaded ? '#475569' : '#ffffff',
                        backgroundColor: hasUploaded ? '#ffffff' : '#16a34a',
                        border: hasUploaded ? '1px solid #cbd5e1' : '1px solid #16a34a',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {hasUploaded ? 'Ganti Berkas' : 'Unggah Logbook'}
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Belum dimulai
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL UPLOAD / GANTI LOGBOOK */}
      {activeUploadWeek && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              {activeUploadWeek.logbook ? 'Ganti Berkas Logbook' : 'Unggah Logbook Kegiatan'}
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Minggu ke-{activeUploadWeek.minggu_ke} ({activeUploadWeek.periode_mulai} s/d {activeUploadWeek.periode_selesai})
            </p>

            <form onSubmit={handleSubmitUpload}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Pilih Berkas (PDF, JPG, JPEG, PNG maks 2 MB) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  disabled={uploading}
                  style={{
                    display: 'block',
                    width: '100%',
                    fontSize: '0.8125rem',
                    color: '#475569',
                  }}
                />
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Gambar akan dikompresi otomatis di peramban sebelum dikirim.
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Catatan Ringkas Kegiatan (Opsional, maks 500 karakter)
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  maxLength={500}
                  placeholder="Contoh: Menyusun dokumentasi API dan pengujian modul otentikasi..."
                  disabled={uploading}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    padding: '0.5rem',
                    fontSize: '0.8125rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
                  {catatan.length}/500 karakter
                </div>
              </div>

              {uploadError && (
                <div style={{ marginBottom: '1rem', padding: '0.625rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.75rem' }}>
                  {uploadError}
                </div>
              )}

              {uploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.8125rem' }}>
                  <LoaderIcon width={14} height={14} />
                  <span>{uploadProgressText || 'Memproses pengunggahan...'}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseUpload}
                  disabled={uploading}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!selectedFile && !activeUploadWeek.logbook)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: uploading ? '#94a3b8' : '#16a34a',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {uploading && <LoaderIcon width={14} height={14} />}
                  Simpan Logbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

