'use client'

import React, { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import {
  adminPengajuanService,
  type AdminPengajuanDetailItem,
  type StatusLogItem,
  type PembimbingOption,
} from '@/lib/services/admin-pengajuan.service'
import { authService } from '@/lib/services/auth.service'
import { PengajuanTimelineLog } from '@/components/admin/pengajuan-timeline-log'
import { PengajuanVerifikasiModal } from '@/components/admin/pengajuan-verifikasi-modal'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'
import { EyeIcon, ExternalLinkIcon, DownloadIcon, FileTextIcon } from '@/components/ui/admin-icons'

interface PageProps {
  params: Promise<{
    publicId: string
  }>
}

export default function AdminPengajuanDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const publicId = resolvedParams.publicId

  const [detail, setDetail] = useState<AdminPengajuanDetailItem | null>(null)
  const [logs, setLogs] = useState<StatusLogItem[]>([])
  const [pembimbings, setPembimbings] = useState<PembimbingOption[]>([])
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modal State Verifikasi
  const [modalAction, setModalAction] = useState<'terima' | 'tolak' | 'selesai' | null>(null)
  const [loadingSubmit, setLoadingSubmit] = useState(false)

  // Modal State Preview Dokumen
  const [previewDoc, setPreviewDoc] = useState<{ url?: string | null; title: string } | null>(null)

  // Load detail data
  const loadDetail = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      // Ambil profile admin yang sedang login
      const adminProfile = await authService.getCurrentProfile()
      if (adminProfile) {
        setCurrentAdminId(adminProfile.id)
      }

      // Ambil detail pengajuan berdasarkan public_id
      const res = await adminPengajuanService.getAdminPengajuanDetail(publicId)

      if (res.error || !res.data) {
        setErrorMsg(res.error || 'Pengajuan tidak ditemukan.')
        return
      }

      const item = res.data
      setDetail(item)

      // Ambil logs & pembimbing terkait
      const [logsRes, pembimbingRes] = await Promise.all([
        adminPengajuanService.getPengajuanStatusLogs(item.id),
        adminPengajuanService.getBidangPembimbings(item.bidang_id),
      ])

      setLogs(logsRes.data)
      setPembimbings(pembimbingRes.data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat memuat data.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [publicId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  // Handle Verifikasi Submit
  const handleVerifikasiSubmit = async (payload: {
    status: 'Sedang Magang' | 'Ditolak' | 'Selesai'
    pembimbingId?: string | number | null
    alasanPenolakan?: string
    catatan?: string
  }) => {
    if (!detail) return
    try {
      setLoadingSubmit(true)
      setErrorMsg(null)

      const res = await adminPengajuanService.verifikasiPengajuan({
        pengajuanId: detail.id,
        userId: detail.user_id,
        status: payload.status,
        pembimbingId: payload.pembimbingId,
        alasanPenolakan: payload.alasanPenolakan,
        catatan: payload.catatan,
        adminId: currentAdminId,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memproses verifikasi.')
      } else {
        setSuccessMsg(`Status pengajuan berhasil diperbarui menjadi "${payload.status}".`)
        setModalAction(null)
        // Refresh data
        await loadDetail()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      setErrorMsg(msg)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Menunggu verifikasi' }
      case 'Sedang Magang':
      case 'Disetujui':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Sedang magang' }
      case 'Selesai':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Selesai' }
      case 'Ditolak':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: 'Ditolak' }
      case 'Dibatalkan':
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: 'Dibatalkan' }
      default:
        return { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0', label: status }
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
        Memuat detail pengajuan...
      </div>
    )
  }

  if (errorMsg && !detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
        <Link
          href="/admin/riwayat-pengajuan"
          style={{ fontSize: '12px', color: '#15803d', textDecoration: 'none', fontWeight: 600 }}
        >
          &larr; Kembali ke daftar pengajuan
        </Link>
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#991b1b',
            fontSize: '13px',
          }}
        >
          <strong>Peringatan:</strong> {errorMsg}
        </div>
      </div>
    )
  }

  if (!detail) return null

  const badge = getStatusBadge(detail.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px' }}>
      {/* 1. Header & Back Navigation */}
      <div>
        <Link
          href="/admin/riwayat-pengajuan"
          style={{
            fontSize: '12px',
            color: '#15803d',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginBottom: '0.5rem',
          }}
        >
          <span>&larr;</span>
          <span>Kembali ke daftar pengajuan</span>
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Sisi Kiri: Nama Pemohon, Email, & Topik Riset Italic */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                {detail.nama_lengkap}
              </h1>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {detail.profiles?.email || '-'}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#4b5563', marginTop: '3px' }}>
              Topik: "{detail.topik_magang || '-'}"
            </div>
          </div>

          {/* Sisi Kanan: Status Badge & Tombol Aksi Admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
              }}
            >
              {badge.label}
            </span>

            {detail.status === 'Menunggu Verifikasi' && (
              <>
                <button
                  type="button"
                  onClick={() => setModalAction('terima')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Terima Pengajuan
                </button>

                <button
                  type="button"
                  onClick={() => setModalAction('tolak')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Tolak
                </button>
              </>
            )}

            {detail.status === 'Sedang Magang' && (
              <button
                type="button"
                onClick={() => setModalAction('selesai')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tandai Selesai Magang
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            color: '#065f46',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✅ {successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#065f46',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#991b1b',
            fontSize: '12px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* 2. Grid Layout (Left: Unified Info Card & Documents, Right: Audit Trail) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Kolom Kiri: Card Identitas + Administrasi & Dokumen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          {/* Card Gabungan: Identitas + Administrasi (2 Kolom) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              padding: '1.25rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Field 1: Instansi */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4 8 4v14" />
                    <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11H9z" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Instansi</span>
                  <strong style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                    {detail.asal_instansi} &bull; {detail.jurusan}
                  </strong>
                </div>
              </div>

              {/* Field 2: Anggota Kelompok */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Anggota kelompok</span>
                  <strong style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                    {detail.jumlah_anggota > 1 && detail.anggota && detail.anggota.length > 0
                      ? `${detail.anggota.map((a) => a.nama).join(', ')} (${detail.jumlah_anggota} orang)`
                      : `Individu (1 orang)`}
                  </strong>
                </div>
              </div>

              {/* Field 3: Pembimbing */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <polyline points="17 11 19 13 23 9" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Pembimbing</span>
                  <strong style={{ fontSize: '13px', color: detail.pembimbings ? '#111827' : '#9ca3af', fontWeight: 600 }}>
                    {detail.pembimbings?.nama || 'Belum ditugaskan'}
                  </strong>
                </div>
              </div>

              {/* Field 4: Periode */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Periode</span>
                  <strong style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                    {formatDate(detail.tanggal_mulai)} - {formatDate(detail.tanggal_selesai)}
                  </strong>
                </div>
              </div>
            </div>

            {detail.status === 'Ditolak' && detail.alasan_penolakan && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '12px',
                }}
              >
                <strong>Alasan Penolakan:</strong> {detail.alasan_penolakan}
              </div>
            )}
          </div>

          {/* Dokumen Kelengkapan (List Baris) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              padding: '1.25rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 0.875rem 0', fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              Dokumen kelengkapan
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Surat Pengantar */}
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ color: '#15803d', display: 'flex' }}>
                    <FileTextIcon width={16} height={16} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>
                    Surat pengantar instansi
                  </span>
                </div>

                {detail.surat_pengantar_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: detail.surat_pengantar_url,
                          title: 'Surat Pengantar Instansi',
                        })
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #bbf7d0',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '30px',
                      }}
                    >
                      <EyeIcon width={13} height={13} />
                      <span>Lihat</span>
                    </button>
                    <a
                      href={detail.surat_pengantar_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        minHeight: '30px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <ExternalLinkIcon width={13} height={13} />
                      <span>Tab Baru</span>
                    </a>
                    <a
                      href={detail.surat_pengantar_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#15803d',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        minHeight: '30px',
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      <DownloadIcon width={13} height={13} />
                      <span>Unduh</span>
                    </a>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Tidak ada</span>
                )}
              </div>

              {/* Proposal Magang */}
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ color: '#15803d', display: 'flex' }}>
                    <FileTextIcon width={16} height={16} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>
                    Proposal magang
                  </span>
                </div>

                {detail.proposal_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: detail.proposal_url,
                          title: 'Proposal Kegiatan Magang',
                        })
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #bbf7d0',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '30px',
                      }}
                    >
                      <EyeIcon width={13} height={13} />
                      <span>Lihat</span>
                    </button>
                    <a
                      href={detail.proposal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        minHeight: '30px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <ExternalLinkIcon width={13} height={13} />
                      <span>Tab Baru</span>
                    </a>
                    <a
                      href={detail.proposal_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#15803d',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        minHeight: '30px',
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      <DownloadIcon width={13} height={13} />
                      <span>Unduh</span>
                    </a>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Tidak ada</span>
                )}
              </div>

              {/* Dokumen Tambahan */}
              {detail.dokumen_tambahan_url && (
                <div
                  style={{
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ color: '#15803d', display: 'flex' }}>
                      <FileTextIcon width={16} height={16} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>
                      Dokumen tambahan
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: detail.dokumen_tambahan_url,
                          title: 'Dokumen Tambahan',
                        })
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #bbf7d0',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '30px',
                      }}
                    >
                      <EyeIcon width={13} height={13} />
                      <span>Lihat</span>
                    </button>
                    <a
                      href={detail.dokumen_tambahan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        minHeight: '30px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <ExternalLinkIcon width={13} height={13} />
                      <span>Tab Baru</span>
                    </a>
                    <a
                      href={detail.dokumen_tambahan_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#15803d',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        minHeight: '30px',
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      <DownloadIcon width={13} height={13} />
                      <span>Unduh</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Timeline Audit Trail */}
        <div style={{ minWidth: 0 }}>
          <PengajuanTimelineLog logs={logs} loading={loading} />
        </div>
      </div>

      {/* 3. Modal Form Verifikasi */}
      <PengajuanVerifikasiModal
        isOpen={modalAction !== null}
        actionType={modalAction}
        pembimbingOptions={pembimbings}
        loadingSubmit={loadingSubmit}
        onClose={() => setModalAction(null)}
        onSubmit={handleVerifikasiSubmit}
      />

      {/* 4. Modal Pratinjau Dokumen */}
      <DocumentPreviewModal
        isOpen={previewDoc !== null}
        url={previewDoc?.url}
        title={previewDoc?.title || 'Pratinjau Dokumen'}
        subtitle={`Pengajuan: ${detail.nama_lengkap} (${detail.asal_instansi})`}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}

