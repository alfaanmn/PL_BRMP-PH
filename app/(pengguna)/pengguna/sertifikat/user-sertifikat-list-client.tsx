'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { UserSertifikatItem, SertifikatRecord } from '@/types/sertifikat.types'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'

interface UserSertifikatListClientProps {
  initialItems: UserSertifikatItem[]
  errorMsg?: string | null
}

export function UserSertifikatListClient({ initialItems, errorMsg }: UserSertifikatListClientProps) {
  const [items] = useState<UserSertifikatItem[]>(initialItems)
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)
  const [loadingPreviewId, setLoadingPreviewId] = useState<number | null>(null)
  const [downloadingSequentialId, setDownloadingSequentialId] = useState<number | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null)
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null)

  const handlePreviewCert = async (sertifikatId: number, title: string) => {
    try {
      setLoadingPreviewId(sertifikatId)
      const res = await fetch(`/api/pengguna/sertifikat/download?sertifikat_id=${sertifikatId}`)
      const json = await res.json()
      if (json.success && json.data?.signedUrl) {
        setPreviewDoc({
          url: json.data.signedUrl,
          title,
        })
      } else {
        alert(json.error || 'Gagal memuat pratinjau sertifikat.')
      }
    } catch {
      alert('Terjadi kesalahan saat memuat berkas sertifikat.')
    } finally {
      setLoadingPreviewId(null)
    }
  }

  // Unduh Semua (ZIP Server-Side)
  const handleDownloadZip = async (publicId: string) => {
    try {
      setDownloadingZipId(publicId)
      const res = await fetch(`/api/pengguna/sertifikat/download-zip?public_id=${publicId}`)
      if (!res.ok) {
        let errorMsg = 'Gagal membuat arsip ZIP sertifikat.'
        try {
          const json = await res.json()
          if (json.error) errorMsg = json.error
        } catch {}
        alert(errorMsg)
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `Sertifikat_Kelompok_${publicId}.zip`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        if (document.body.contains(a)) document.body.removeChild(a)
      }, 1000)
    } catch {
      alert('Terjadi kesalahan koneksi saat mengunduh arsip ZIP.')
    } finally {
      setDownloadingZipId(null)
    }
  }

  // Tahap 1: Unduh Berurutan (Sequential Download) untuk kelompok
  const handleDownloadAllSequential = async (pengajuanId: number, certs: SertifikatRecord[]) => {
    if (!certs || certs.length === 0) return
    try {
      setDownloadingSequentialId(pengajuanId)
      setDownloadProgress({ current: 0, total: certs.length })

      for (let i = 0; i < certs.length; i++) {
        const cert = certs[i]
        setDownloadProgress({ current: i + 1, total: certs.length })

        // Buka unduhan via invisible link
        const downloadUrl = `/api/pengguna/sertifikat/download?sertifikat_id=${cert.id}&download=true&redirect=1`
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = downloadUrl
        document.body.appendChild(iframe)

        // Hapus iframe setelah unduhan terpicu
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 10000)

        // Delay 700ms antar berkas agar browser tidak memblokir multi-download
        if (i < certs.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 700))
        }
      }
    } catch (err) {
      console.error('Gagal mengunduh berkas secara berurutan:', err)
      alert('Terjadi kesalahan saat memproses unduh berurutan.')
    } finally {
      setTimeout(() => {
        setDownloadingSequentialId(null)
        setDownloadProgress(null)
      }, 1000)
    }
  }

  if (errorMsg) {
    return (
      <div style={{
        padding: '1.25rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        color: '#b91c1c',
        fontSize: '0.875rem',
      }}>
        {errorMsg}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
          Belum Ada Kegiatan Magang
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
          Anda belum memiliki riwayat pengajuan magang di BRMP PH. Sertifikat akan terbit setelah Anda menyelesaikan rangkaian program magang.
        </p>
        <Link
          href="/pengguna/career/step1"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            backgroundColor: '#15803d',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)',
          }}
        >
          <span>Daftar Magang Sekarang</span>
          <span>→</span>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {items.map((item) => {
          const isSelesai = item.status === 'Selesai'
          const certs = item.sertifikats || []
          const hasCerts = certs.length > 0
          const isDownloadingThis = downloadingSequentialId === item.pengajuanId

          return (
            <div
              key={item.pengajuanId}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {/* Header Pengajuan */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '1rem',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}>
                      #{item.publicId}
                    </span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {item.topikMagang}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Bidang: <strong>{item.bidangNama}</strong> &bull; Instansi: <strong>{item.asalInstansi}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: isSelesai ? '#ecfdf5' : '#eff6ff',
                    color: isSelesai ? '#166534' : '#1d4ed8',
                    border: isSelesai ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                  }}>
                    {isSelesai ? 'Kegiatan Selesai' : item.status}
                  </span>
                </div>
              </div>

              {/* Status Section */}
              {!isSelesai ? (
                // Kasus 1: Belum berstatus Selesai
                <div style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.875rem' }}>
                      Program Magang Sedang Berjalan
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px' }}>
                      Sertifikat kelulusan resmi akan dapat diakses setelah seluruh rangkaian magang Anda dinyatakan &quot;Selesai&quot; dan mengisi kuesioner SKM.
                    </div>
                  </div>
                </div>
              ) : !item.hasSubmittedSKM ? (
                // Kasus 2: Selesai tapi belum isi SKM
                <div style={{
                  padding: '1.125rem 1.25rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⭐</span>
                    <div>
                      <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        Survei Kepuasan Masyarakat (SKM) Wajib Diisi
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#b45309', lineHeight: 1.4, maxWidth: '580px' }}>
                        Kegiatan magang Anda telah selesai. Mohon luangkan waktu untuk melengkapi kuesioner SKM terlebih dahulu agar akses pratinjau dan pengunduhan sertifikat terbuka.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Link
                      href={`/pengguna/skm?pengajuan_id=${item.pengajuanId}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 1px 2px rgba(217, 119, 6, 0.2)',
                      }}
                    >
                      <span>⭐</span>
                      <span>Isi SKM Sekarang</span>
                    </Link>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}>
                      <span>🔒</span>
                      <span>Sertifikat Terkunci</span>
                    </span>
                  </div>
                </div>
              ) : !hasCerts ? (
                // Kasus 3: SKM terisi tapi sertifikat belum diunggah admin
                <div style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                    <div>
                      <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.875rem' }}>
                        Kuesioner SKM Telah Lengkap
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#15803d', marginTop: '2px' }}>
                        Sertifikat kelulusan Anda sedang disiapkan dan akan segera diterbitkan oleh administrator. Notifikasi email akan dikirimkan begitu berkas siap.
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#64748b',
                    backgroundColor: '#ffffff',
                    border: '1px dashed #cbd5e1',
                    padding: '0.45rem 0.875rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}>
                    <span>⏳</span>
                    <span>Sedang Diterbitkan Admin</span>
                  </span>
                </div>
              ) : (
                // Kasus 4: Sertifikat Tersedia (Multi-Peserta)
                <div>
                  {/* Banner & Tombol Unduh Semua */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.9375rem' }}>
                        🎓 Sertifikat Resmi Kelulusan Telah Diterbitkan ({certs.length} Berkas)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '2px' }}>
                        Silakan lihat pratinjau atau unduh sertifikat untuk masing-masing peserta magang di bawah ini.
                      </div>
                    </div>

                    {/* Tombol Unduh Semua (ZIP & Sequential Fallback) */}
                    {certs.length > 1 && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Tombol Unduh Semua (ZIP Server-Side) */}
                        <button
                          type="button"
                          onClick={() => handleDownloadZip(item.publicId)}
                          disabled={downloadingZipId === item.publicId || isDownloadingThis}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            cursor: (downloadingZipId === item.publicId || isDownloadingThis) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                          }}
                        >
                          <span>📦</span>
                          <span>
                            {downloadingZipId === item.publicId ? 'Menyiapkan ZIP...' : `Unduh Semua (ZIP)`}
                          </span>
                        </button>

                        {/* Tombol Unduh Berurutan (Fallback) */}
                        <button
                          type="button"
                          onClick={() => handleDownloadAllSequential(item.pengajuanId, certs)}
                          disabled={isDownloadingThis || downloadingZipId === item.publicId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 0.875rem',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            cursor: (isDownloadingThis || downloadingZipId === item.publicId) ? 'not-allowed' : 'pointer',
                          }}
                          title="Unduh file satu per satu secara berurutan"
                        >
                          <span>📥</span>
                          <span>
                            {isDownloadingThis && downloadProgress
                              ? `Mengunduh (${downloadProgress.current}/${downloadProgress.total})...`
                              : `Unduh Berurutan`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Daftar Berkas Masing-masing Peserta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {certs.map((c, cIdx) => {
                      const isPreviewingThis = loadingPreviewId === c.id

                      return (
                        <div
                          key={c.id}
                          style={{
                            padding: '0.875rem 1.25rem',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem',
                              flexShrink: 0,
                            }}>
                              📜
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: c.is_ketua ? '#eff6ff' : '#f1f5f9',
                                  color: c.is_ketua ? '#1d4ed8' : '#475569',
                                  border: c.is_ketua ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                                }}>
                                  {c.is_ketua ? 'Ketua' : `Anggota #${cIdx}`}
                                </span>
                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                                  {c.peserta_nama}
                                </span>
                                {c.peserta_nim && (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    (NIM: {c.peserta_nim})
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                Berkas: <strong>{c.file_name}</strong> &bull; Ukuran: {(c.file_size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() =>
                                handlePreviewCert(c.id, `Sertifikat Magang - ${c.peserta_nama} (#${item.publicId})`)
                              }
                              disabled={isPreviewingThis}
                              style={{
                                padding: '0.45rem 0.875rem',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: isPreviewingThis ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <span>👁️</span>
                              <span>{isPreviewingThis ? 'Memuat...' : 'Pratinjau'}</span>
                            </button>

                            <a
                              href={`/api/pengguna/sertifikat/download?sertifikat_id=${c.id}&download=true&redirect=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '0.45rem 0.875rem',
                                borderRadius: '6px',
                                backgroundColor: '#15803d',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                              }}
                            >
                              <span>📥</span>
                              <span>Unduh</span>
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Pratinjau Terpadu */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </>
  )
}
