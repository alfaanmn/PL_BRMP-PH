'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { pengajuanService } from '@/lib/services/pengajuan.service'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'
import { ModalBatalPengajuan } from '@/components/pengguna/modal-batal-pengajuan'
import {
  FileTextIcon,
  EyeIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LoaderIcon,
} from '@/components/ui/admin-icons'

export interface PengajuanStatusLog {
  id: number | string
  pengajuan_id: number | string
  status: string
  catatan?: string | null
  created_at: string
}

interface UserPengajuanDetailViewProps {
  pengajuan: any
  logs?: PengajuanStatusLog[]
  hasSubmittedSKM?: boolean
}

export function UserPengajuanDetailView({
  pengajuan,
  logs = [],
  hasSubmittedSKM = false,
}: UserPengajuanDetailViewProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<string>(pengajuan.status)
  const [currentLogs, setCurrentLogs] = useState<PengajuanStatusLog[]>(logs)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)
  const [openingDocKey, setOpeningDocKey] = useState<string | null>(null)

  // Multi-sertifikat state
  const [sertifikatList, setSertifikatList] = useState<any[]>([])
  const [loadingCerts, setLoadingCerts] = useState(false)
  const [downloadingSeq, setDownloadingSeq] = useState(false)

  // Fetch daftar seluruh sertifikat pengajuan jika status 'Selesai'
  useEffect(() => {
    if (pengajuan.status === 'Selesai') {
      setLoadingCerts(true)
      fetch(`/api/pengguna/sertifikat/download?pengajuan_id=${pengajuan.id}&list=true`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setSertifikatList(json.data)
          }
        })
        .catch((err) => console.warn('Gagal memuat daftar sertifikat:', err))
        .finally(() => setLoadingCerts(false))
    }
  }, [pengajuan.id, pengajuan.status])

  const handleOpenDoc = async (
    rawPath: string | null | undefined,
    title: string,
    mode: 'preview' | 'tab' | 'download' = 'preview',
    actionKey?: string
  ) => {
    if (!rawPath) return
    if (mode === 'preview') {
      setPreviewDoc({ url: rawPath, title })
      return
    }

    if (actionKey) setOpeningDocKey(actionKey)
    try {
      if (mode === 'download') {
        const res = await pengajuanService.getSignedDocumentUrl(rawPath, 3600, { download: true })
        if (res.url) {
          const response = await fetch(res.url)
          if (response.ok) {
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
          } else {
            window.open(res.url, '_blank')
          }
        } else {
          alert(res.error || 'Gagal memuat berkas dokumen.')
        }
      } else {
        const res = await pengajuanService.getSignedDocumentUrl(rawPath, 3600)
        if (res.url) {
          window.open(res.url, '_blank')
        } else {
          alert(res.error || 'Gagal memuat berkas dokumen.')
        }
      }
    } catch {
      alert('Terjadi kesalahan saat memproses berkas dokumen.')
    } finally {
      if (actionKey) setOpeningDocKey(null)
    }
  }

  const handlePreviewSertifikatById = async (sertifikatId: number, title: string) => {
    try {
      const res = await fetch(`/api/pengguna/sertifikat/download?sertifikat_id=${sertifikatId}`)
      const json = await res.json()
      if (json.success && json.data?.signedUrl) {
        setPreviewDoc({ url: json.data.signedUrl, title })
      } else {
        alert(json.error || 'Gagal memuat pratinjau sertifikat.')
      }
    } catch {
      alert('Terjadi kesalahan saat memuat berkas sertifikat.')
    }
  }

  // Tahap 1: Unduh Berurutan untuk semua sertifikat
  const handleDownloadAllSequential = async () => {
    if (sertifikatList.length === 0) return
    try {
      setDownloadingSeq(true)
      for (let i = 0; i < sertifikatList.length; i++) {
        const cert = sertifikatList[i]
        const downloadUrl = `/api/pengguna/sertifikat/download?sertifikat_id=${cert.id}&download=true&redirect=1`
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = downloadUrl
        document.body.appendChild(iframe)

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 10000)

        if (i < sertifikatList.length - 1) {
          await new Promise((r) => setTimeout(r, 700))
        }
      }
    } catch {
      alert('Gagal mengunduh berkas secara berurutan.')
    } finally {
      setTimeout(() => setDownloadingSeq(false), 1000)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return {
          bg: '#FEF3C7',
          color: '#78350F',
          border: '#FDE68A',
          label: 'Menunggu Verifikasi',
          desc: 'Permohonan Anda sedang dalam antrean verifikasi administrasi oleh tim BRMP.',
        }
      case 'Disetujui':
      case 'Sedang Magang':
        return {
          bg: '#EFF6FF',
          color: '#1D4ED8',
          border: '#BFDBFE',
          label: status,
          desc: 'Permohonan magang telah disetujui. Silakan ikuti instruksi pembimbing Anda.',
        }
      case 'Selesai':
        return {
          bg: '#ECFDF5',
          color: '#065F46',
          border: '#A7F3D0',
          label: 'Selesai',
          desc: 'Kegiatan magang telah selesai dan tervalidasi.',
        }
      case 'Ditolak':
        return {
          bg: '#FEF2F2',
          color: '#991B1B',
          border: '#FECACA',
          label: 'Ditolak',
          desc: 'Permohonan Anda belum dapat diterima pada periode ini.',
        }
      case 'Dibatalkan':
        return {
          bg: '#F1F5F9',
          color: '#475569',
          border: '#CBD5E1',
          label: 'Dibatalkan',
          desc: 'Pengajuan ini telah dibatalkan.',
        }
      default:
        return {
          bg: '#F1F5F9',
          color: '#475569',
          border: '#CBD5E1',
          label: status || 'Tercatat',
          desc: 'Status permohonan magang Anda di sistem.',
        }
    }
  }

  const badge = getStatusBadge(currentStatus)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Navigation & Breadcrumbs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <Link
            href="/pengguna/dashboard"
            style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}
          >
            ← Kembali ke Dashboard
          </Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <Link
            href="/pengguna/riwayat"
            style={{ color: '#64748b', textDecoration: 'none' }}
          >
            Riwayat
          </Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>
            {pengajuan.public_id || `#${pengajuan.id}`}
          </span>
        </div>

        <Link
          href="/pengguna/riwayat"
          style={{
            fontSize: '0.75rem',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          Semua Pengajuan
        </Link>
      </div>

      {/* Main Header Card with Status Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#16a34a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                ID Pengajuan: {pengajuan.public_id || pengajuan.id}
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Diajukan pada {pengajuan.created_at ? new Date(pengajuan.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) : '-'}
              </span>
            </div>
            <h1 style={{
              fontSize: '1.375rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {pengajuan.bidangs?.nama || `Bidang ID #${pengajuan.bidang_id}`}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: badge.color,
                display: 'inline-block',
              }} />
              {badge.label}
            </div>

            {currentStatus === 'Menunggu Verifikasi' && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ✕ Batalkan Pengajuan
              </button>
            )}
          </div>
        </div>

        {/* Status notice alert */}
        <div style={{
          backgroundColor: badge.bg,
          border: `1px solid ${badge.border}`,
          borderRadius: '8px',
          padding: '0.875rem 1rem',
          color: badge.color,
          fontSize: '0.8125rem',
          lineHeight: 1.5,
        }}>
          <strong>Status Terkini:</strong> {badge.desc}
          {currentStatus === 'Ditolak' && pengajuan.alasan_penolakan && (
            <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
              Alasan: {pengajuan.alasan_penolakan}
            </div>
          )}
        </div>
      </div>

      {/* Grid: 2 Kolom di Desktop, 1 Kolom di Mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Card 1: Informasi Magang & Pelaksanaan */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>📅</span> Waktu &amp; Topik Kegiatan
          </h2>

          <div style={{
            padding: '0.875rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Rencana / Topik Magang:
            </span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
              "{pengajuan.topik_magang || '-'}"
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.625rem',
            fontSize: '0.8125rem',
          }}>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Tanggal Mulai</span>
              <strong style={{ color: '#0f172a' }}>{pengajuan.tanggal_mulai || '-'}</strong>
            </div>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Tanggal Selesai</span>
              <strong style={{ color: '#0f172a' }}>{pengajuan.tanggal_selesai || '-'}</strong>
            </div>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Estimasi Durasi</span>
              <strong style={{ color: '#0f172a' }}>{pengajuan.durasi_bulan || 1} Bulan</strong>
            </div>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Jumlah Peserta</span>
              <strong style={{ color: '#0f172a' }}>{pengajuan.jumlah_anggota || 1} Orang</strong>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Surat Pengantar Instansi:
            </span>
            <div style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
              Nomor: <strong>{pengajuan.nomor_surat || '-'}</strong> (Tgl: {pengajuan.tanggal_surat || '-'})
            </div>
          </div>
        </div>

        {/* Card 2: Pembimbing Magang jika ada */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>👨‍🏫</span> Pembimbing Magang
          </h2>

          {pengajuan.pembimbings ? (
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>
                  Pembimbing Resmi
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#14532d', margin: '2px 0 0 0' }}>
                  {pengajuan.pembimbings.nama}
                </h3>
              </div>
              {pengajuan.pembimbings.nip && (
                <div style={{ fontSize: '0.8125rem', color: '#166534' }}>
                  NIP: <strong>{pengajuan.pembimbings.nip}</strong>
                </div>
              )}
              {pengajuan.pembimbings.jabatan && (
                <div style={{ fontSize: '0.8125rem', color: '#166534' }}>
                  Jabatan: {pengajuan.pembimbings.jabatan}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
            }}>
              {pengajuan.status === 'Menunggu Verifikasi'
                ? 'Pembimbing lapangan akan ditetapkan setelah berkas permohonan Anda diverifikasi dan disetujui oleh tim BRMP.'
                : 'Belum ada pembimbing yang terdata untuk permohonan ini.'}
            </div>
          )}

          {/* Akses Sertifikat jika Selesai */}
          {pengajuan.status === 'Selesai' && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#065f46', display: 'block' }}>
                    🎓 Sertifikat Resmi Kelulusan Magang
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                    {loadingCerts
                      ? 'Memuat data sertifikat peserta...'
                      : sertifikatList.length > 0
                      ? `${sertifikatList.length} sertifikat resmi telah diterbitkan untuk kegiatan magang ini.`
                      : 'Sertifikat sedang dalam proses penerbitan oleh administrator.'}
                  </span>
                </div>

                {sertifikatList.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDownloadAllSequential}
                    disabled={downloadingSeq}
                    style={{
                      padding: '0.4rem 0.85rem',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: downloadingSeq ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)',
                    }}
                  >
                    <span>📥</span>
                    <span>{downloadingSeq ? 'Mengunduh Semua...' : `Unduh Semua (${sertifikatList.length} Berkas)`}</span>
                  </button>
                )}
              </div>

              {/* Daftar Berkas Masing-masing Peserta */}
              {sertifikatList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {sertifikatList.map((c, idx) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.625rem 0.875rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: c.is_ketua ? '#eff6ff' : '#f1f5f9',
                          color: c.is_ketua ? '#1d4ed8' : '#475569',
                          border: c.is_ketua ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                        }}>
                          {c.is_ketua ? 'Ketua' : `Anggota #${idx}`}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
                            {c.peserta_nama}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                            {c.file_name} &bull; {(c.file_size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <button
                          type="button"
                          onClick={() => handlePreviewSertifikatById(c.id, `Sertifikat Magang - ${c.peserta_nama}`)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span>👁️</span> Pratinjau
                        </button>
                        <a
                          href={`/api/pengguna/sertifikat/download?sertifikat_id=${c.id}&download=true&redirect=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span>📥</span> Unduh
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Identitas Pemohon & Anggota Kelompok */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 1rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>👤</span> Data Pemohon &amp; Peserta
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.8125rem',
          marginBottom: '1rem',
        }}>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Nama Lengkap (Ketua)</span>
            <strong style={{ color: '#0f172a' }}>{pengajuan.nama_lengkap || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>NIM / NIS</span>
            <strong style={{ color: '#0f172a' }}>{pengajuan.nim_nis || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Asal Instansi</span>
            <strong style={{ color: '#0f172a' }}>{pengajuan.asal_instansi || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Jurusan &amp; Jenjang</span>
            <strong style={{ color: '#0f172a' }}>{pengajuan.jurusan || '-'} ({pengajuan.jenjang || 'Mahasiswa'})</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>No. WhatsApp</span>
            <strong style={{ color: '#0f172a' }}>{pengajuan.no_hp || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Jenis Kelamin</span>
            <strong style={{ color: '#0f172a' }}>{pengajuan.jenis_kelamin || '-'}</strong>
          </div>
        </div>

        {/* Anggota Kelompok Tambahan */}
        {pengajuan.jumlah_anggota > 1 && pengajuan.anggota && pengajuan.anggota.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', margin: '0 0 0.625rem 0' }}>
              Anggota Tim Tambahan ({pengajuan.anggota.length} orang)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pengajuan.anggota.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.625rem 0.85rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.nama}</span>
                    <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>NIM/NIS: {item.nim_nis}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {item.jurusan ? `${item.jurusan} • ` : ''}{item.no_hp || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card 4: Dokumen Berkas Persyaratan */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 1rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>📂</span> Berkas Dokumen Persyaratan
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {/* Surat Pengantar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 0.85rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ color: '#16a34a', display: 'flex' }}>
                <FileTextIcon width={18} height={18} />
              </div>
              <div>
                <strong style={{ color: '#0f172a', display: 'block' }}>Surat Pengantar Magang</strong>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Dokumen wajib dari instansi/kampus/sekolah</span>
              </div>
            </div>

            {pengajuan.surat_pengantar_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleOpenDoc(pengajuan.surat_pengantar_url, 'Surat Pengantar Magang', 'preview')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <EyeIcon width={14} height={14} /> Pratinjau
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDoc(pengajuan.surat_pengantar_url, 'Surat Pengantar Magang', 'tab', 'sp_tab')}
                  disabled={openingDocKey === 'sp_tab'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {openingDocKey === 'sp_tab' ? <LoaderIcon width={14} height={14} /> : <ExternalLinkIcon width={14} height={14} />} Tab Baru
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDoc(pengajuan.surat_pengantar_url, 'Surat Pengantar Magang', 'download', 'sp_dl')}
                  disabled={openingDocKey === 'sp_dl'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {openingDocKey === 'sp_dl' ? <LoaderIcon width={14} height={14} /> : <DownloadIcon width={14} height={14} />} Unduh
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Belum diunggah</span>
            )}
          </div>

          {/* Proposal Magang jika ada */}
          {pengajuan.proposal_url && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.85rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ color: '#2563eb', display: 'flex' }}>
                  <FileTextIcon width={18} height={18} />
                </div>
                <div>
                  <strong style={{ color: '#0f172a', display: 'block' }}>Proposal Magang / Riset</strong>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Rencana kegiatan dan kurikulum usulan</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleOpenDoc(pengajuan.proposal_url, 'Proposal Magang', 'preview')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <EyeIcon width={14} height={14} /> Pratinjau
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDoc(pengajuan.proposal_url, 'Proposal Magang', 'download', 'prop_dl')}
                  disabled={openingDocKey === 'prop_dl'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {openingDocKey === 'prop_dl' ? <LoaderIcon width={14} height={14} /> : <DownloadIcon width={14} height={14} />} Unduh
                </button>
              </div>
            </div>
          )}

          {/* Surat Balasan Resmi jika ada */}
          {pengajuan.surat_balasan_url && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.85rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ color: '#16a34a', display: 'flex' }}>
                  <FileTextIcon width={18} height={18} />
                </div>
                <div>
                  <strong style={{ color: '#14532d', display: 'block' }}>Surat Balasan / Jawaban BRMP</strong>
                  <span style={{ color: '#15803d', fontSize: '0.75rem' }}>Surat resmi keputusan penerimaan dari pimpinan balai</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleOpenDoc(pengajuan.surat_balasan_url, 'Surat Balasan BRMP', 'preview')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #86efac',
                    color: '#14532d',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <EyeIcon width={14} height={14} /> Pratinjau
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDoc(pengajuan.surat_balasan_url, 'Surat Balasan BRMP', 'download', 'sb_dl')}
                  disabled={openingDocKey === 'sb_dl'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {openingDocKey === 'sb_dl' ? <LoaderIcon width={14} height={14} /> : <DownloadIcon width={14} height={14} />} Unduh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 5: Riwayat Perjalanan Status (Audit Trail Timeline) */}
      {currentLogs && currentLogs.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>⏱️</span> Riwayat Perkembangan Status
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentLogs.map((log, index) => (
              <div
                key={log.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: log.status === 'Dibatalkan' ? '#94a3b8' : '#16a34a',
                  marginTop: '5px',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#0f172a' }}>{log.status}</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </span>
                  </div>
                  {log.catatan && (
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                      {log.catatan}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          url={previewDoc.url}
          title={previewDoc.title}
        />
      )}

      {/* Modal Dialog Konfirmasi Pembatalan Pengajuan */}
      <ModalBatalPengajuan
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        publicId={pengajuan.public_id}
        bidangNama={pengajuan.bidangs?.nama}
        onSuccess={() => {
          setCurrentStatus('Dibatalkan')
          setCurrentLogs((prev) => [
            ...prev,
            {
              id: Date.now(),
              pengajuan_id: pengajuan.id,
              status: 'Dibatalkan',
              catatan: 'Dibatalkan oleh pemohon magang.',
              created_at: new Date().toISOString(),
            },
          ])
          router.refresh()
        }}
      />
    </div>
  )
}

