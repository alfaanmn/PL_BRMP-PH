'use client'

import React, { useState } from 'react'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'
import { EyeIcon, ExternalLinkIcon, FileTextIcon, DownloadIcon } from '@/components/ui/admin-icons'

interface PengajuanDetailModalProps {
  isOpen: boolean
  onClose: () => void
  pengajuan: any | null
}

export function PengajuanDetailModal({
  isOpen,
  onClose,
  pengajuan,
}: PengajuanDetailModalProps) {
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)

  if (!isOpen || !pengajuan) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a',
          label: 'Menunggu Verifikasi',
        }
      case 'Disetujui':
      case 'Sedang Magang':
      case 'Selesai':
        return {
          bg: '#ecfdf5',
          color: '#16a34a',
          border: '#bbf7d0',
          label: status,
        }
      case 'Ditolak':
        return {
          bg: '#fef2f2',
          color: '#dc2626',
          border: '#fecaca',
          label: 'Ditolak',
        }
      case 'Dibatalkan':
        return {
          bg: '#f1f5f9',
          color: '#64748b',
          border: '#e2e8f0',
          label: 'Dibatalkan',
        }
      default:
        return {
          bg: '#ecfdf5',
          color: '#16a34a',
          border: '#bbf7d0',
          label: status || 'Tercatat',
        }
    }
  }

  const badge = getStatusBadge(pengajuan.status)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '0.75rem',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @media (max-width: 640px) {
          .pengajuan-detail-modal-box {
            max-height: 94vh !important;
            max-height: 94dvh !important;
            border-radius: 12px !important;
          }
          .pengajuan-detail-header {
            padding: 1rem !important;
          }
          .pengajuan-detail-body {
            padding: 1rem !important;
            gap: 1rem !important;
          }
        }
      `}</style>
      <div className="pengajuan-detail-modal-box" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div className="pengajuan-detail-header" style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 10,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
              Rincian Pengajuan #{pengajuan.id}
            </span>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>
              {pengajuan.bidangs?.nama || `Bidang ID #${pengajuan.bidang_id}`}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              {badge.label}
            </span>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="pengajuan-detail-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Topik & Rencana */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Topik / Rencana Riset Magang:
            </span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
              "{pengajuan.topik_magang || '-'}"
            </p>
          </div>

          {/* 2. Informasi Jadwal & Surat */}
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>
              Informasi Administrasi &amp; Waktu Pelaksanaan
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.625rem',
              fontSize: '0.8125rem'
            }}>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Nomor surat</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.nomor_surat || '-'}</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Tanggal surat</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.tanggal_surat || '-'}</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Periode magang</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.tanggal_mulai} s/d {pengajuan.tanggal_selesai}</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Estimasi durasi</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.durasi_bulan || 1} bulan</strong>
              </div>
            </div>
          </div>

          {/* 3. Identitas Pemohon */}
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>
              Identitas Pemohon Utama
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.625rem',
              fontSize: '0.8125rem'
            }}>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Nama pemohon</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.nama_lengkap || '-'}</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>NIM / NIS</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.nim_nis || '-'}</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Asal instansi</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.asal_instansi || '-'}</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Jurusan &amp; Jenjang</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.jurusan || '-'} ({pengajuan.jenjang || 'Mahasiswa'})</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>No WhatsApp</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.no_hp || '-'}</strong>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Jenis kelamin</span>
                <strong style={{ color: '#0f172a' }}>{pengajuan.jenis_kelamin || '-'}</strong>
              </div>
            </div>
          </div>

          {/* 4. Anggota Tim jika ada */}
          {pengajuan.jumlah_anggota > 1 && pengajuan.anggota && pengajuan.anggota.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>
                Anggota Tim ({pengajuan.jumlah_anggota} Orang)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pengajuan.anggota.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.625rem 0.75rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.nama}</span>
                      <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>NIM: {item.nim_nis}</span>
                    </div>
                    <span style={{ color: '#64748b' }}>{item.no_hp || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Dokumen Terlampir */}
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>
              Dokumen Persyaratan Terlampir
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Surat Pengantar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: '#15803d', display: 'flex' }}>
                    <FileTextIcon width={16} height={16} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Surat Pengantar Magang</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Wajib)</span>
                </div>
                {pengajuan.surat_pengantar_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: pengajuan.surat_pengantar_url,
                          title: 'Surat Pengantar Magang',
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
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '32px',
                      }}
                    >
                      <EyeIcon width={12} height={12} />
                      <span>Lihat</span>
                    </button>
                    <a
                      href={pengajuan.surat_pengantar_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#475569',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        minHeight: '32px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <ExternalLinkIcon width={12} height={12} />
                      <span>Tab Baru</span>
                    </a>
                    <a
                      href={pengajuan.surat_pengantar_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#ffffff',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#15803d',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        minHeight: '32px',
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      <DownloadIcon width={12} height={12} />
                      <span>Unduh</span>
                    </a>
                  </div>
                ) : (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>Tidak ada berkas</span>
                )}
              </div>

              {/* Proposal */}
              {pengajuan.proposal_url && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: '#15803d', display: 'flex' }}>
                      <FileTextIcon width={16} height={16} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Proposal Kegiatan Magang</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Opsional)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: pengajuan.proposal_url,
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
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '32px',
                      }}
                    >
                      <EyeIcon width={12} height={12} />
                      <span>Lihat</span>
                    </button>
                    <a
                      href={pengajuan.proposal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#475569',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        minHeight: '32px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <ExternalLinkIcon width={12} height={12} />
                      <span>Tab Baru</span>
                    </a>
                    <a
                      href={pengajuan.proposal_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#ffffff',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#15803d',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        minHeight: '32px',
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      <DownloadIcon width={12} height={12} />
                      <span>Unduh</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Dokumen Tambahan */}
              {pengajuan.dokumen_tambahan_url && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: '#15803d', display: 'flex' }}>
                      <FileTextIcon width={16} height={16} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Dokumen Tambahan</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Opsional)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: pengajuan.dokumen_tambahan_url,
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
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '32px',
                      }}
                    >
                      <EyeIcon width={12} height={12} />
                      <span>Lihat</span>
                    </button>
                    <a
                      href={pengajuan.dokumen_tambahan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#475569',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        minHeight: '32px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <ExternalLinkIcon width={12} height={12} />
                      <span>Tab Baru</span>
                    </a>
                    <a
                      href={pengajuan.dokumen_tambahan_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#ffffff',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#15803d',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        minHeight: '32px',
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      <DownloadIcon width={12} height={12} />
                      <span>Unduh</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Bagian Sertifikat Magang & SKM */}
          {pengajuan.status === 'Selesai' && (
            <div>
              {!pengajuan.hasSubmittedSKM ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>⚠️</span>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                      Survei Kepuasan Masyarakat (SKM) Wajib Diisi
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
                    Kegiatan magang Anda telah selesai. Mohon lengkapi kuesioner SKM terlebih dahulu agar sertifikat magang dapat diakses dan diunduh.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <a
                      href={`/pengguna/skm?pengajuan_id=${pengajuan.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: '0 1px 2px rgba(217, 119, 6, 0.2)'
                      }}
                    >
                      <span>⭐</span>
                      <span>Isi Kuesioner SKM Sekarang</span>
                    </a>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      <span>🔒</span>
                      <span>Sertifikat Terkunci</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem' }}>🎓</span>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                        Sertifikat Magang BRMP PH
                      </h4>
                    </div>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#15803d',
                      backgroundColor: '#dcfce7',
                      border: '1px solid #86efac',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      ✓ SKM Lengkap
                    </span>
                  </div>

                  {pengajuan.sertifikat_url ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ color: '#15803d', display: 'flex' }}>
                          <FileTextIcon width={16} height={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>Sertifikat Kelulusan Magang</div>
                          <div style={{ fontSize: '0.6875rem', color: '#15803d' }}>Dokumen resmi diterbitkan</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              url: pengajuan.sertifikat_url,
                              title: `Sertifikat Magang - ${pengajuan.bidangs?.nama || 'BRMP PH'}`,
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
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            minHeight: '32px',
                          }}
                        >
                          <EyeIcon width={12} height={12} />
                          <span>Lihat</span>
                        </button>
                        <a
                          href={pengajuan.sertifikat_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: '#475569',
                            fontWeight: 600,
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            backgroundColor: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            minHeight: '32px',
                            boxSizing: 'border-box',
                          }}
                        >
                          <ExternalLinkIcon width={12} height={12} />
                          <span>Tab Baru</span>
                        </a>
                        <a
                          href={pengajuan.sertifikat_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: '#ffffff',
                            fontWeight: 600,
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            backgroundColor: '#15803d',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            minHeight: '32px',
                            boxSizing: 'border-box',
                            boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                          }}
                        >
                          <DownloadIcon width={12} height={12} />
                          <span>Unduh</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.625rem 0.75rem',
                      backgroundColor: '#ffffff',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>⏳</span>
                      <span>Sertifikat sedang dalam proses penerbitan oleh administrator BRMP. Mohon periksa kembali secara berkala.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#f8fafc',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Pratinjau Dokumen Modal */}
      <DocumentPreviewModal
        isOpen={previewDoc !== null}
        url={previewDoc?.url}
        title={previewDoc?.title || 'Pratinjau Dokumen'}
        subtitle={`Pengajuan #${pengajuan.id} - ${pengajuan.nama_lengkap || 'Pemohon'}`}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}
