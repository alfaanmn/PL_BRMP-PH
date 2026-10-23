'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { UserSertifikatItem } from '@/types/sertifikat.types'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'

interface UserSertifikatListClientProps {
  initialItems: UserSertifikatItem[]
  errorMsg?: string | null
}

export function UserSertifikatListClient({ initialItems, errorMsg }: UserSertifikatListClientProps) {
  const [items] = useState<UserSertifikatItem[]>(initialItems)
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)
  const [loadingPreviewId, setLoadingPreviewId] = useState<number | null>(null)

  const handlePreview = async (item: UserSertifikatItem) => {
    try {
      setLoadingPreviewId(item.pengajuanId)
      const res = await fetch(`/api/pengguna/sertifikat/download?pengajuan_id=${item.pengajuanId}`)
      const json = await res.json()
      if (json.success && json.data?.signedUrl) {
        setPreviewDoc({
          url: json.data.signedUrl,
          title: `Sertifikat Magang - ${item.bidangNama} (#${item.publicId})`,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {items.map((item) => {
          const isSelesai = item.status === 'Selesai'

          return (
            <div
              key={item.pengajuanId}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: isSelesai && item.hasSubmittedSKM && item.hasSertifikat
                  ? '1px solid #86efac'
                  : isSelesai && !item.hasSubmittedSKM
                  ? '1px solid #fde68a'
                  : '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: isSelesai && item.hasSubmittedSKM && item.hasSertifikat
                  ? '0 4px 12px -2px rgba(21, 128, 61, 0.08)'
                  : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Baris Atas: Informasi Program & Status Pengajuan */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem',
                paddingBottom: '0.875rem',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#15803d',
                      backgroundColor: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #bbf7d0',
                    }}>
                      #{item.publicId}
                    </span>
                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {item.topikMagang}
                    </h2>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Bidang: <strong style={{ color: '#334155' }}>{item.bidangNama}</strong> • Instansi: {item.asalInstansi}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Periode: {item.tanggalMulai} s/d {item.tanggalSelesai}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: isSelesai ? '#ecfdf5' : '#f8fafc',
                    color: isSelesai ? '#15803d' : '#64748b',
                    border: isSelesai ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  }}>
                    Status Magang: {item.status}
                  </span>
                </div>
              </div>

              {/* Status Kondisional Sertifikat */}
              {!isSelesai ? (
                // Kasus 1: Magang belum selesai
                <div style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>⏳</span>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.4 }}>
                    Kegiatan magang Anda masih berstatus <strong>{item.status}</strong>. Penerbitan sertifikat kelulusan akan tersedia setelah kegiatan magang Anda resmi diselesaikan oleh administrator.
                  </div>
                </div>
              ) : !item.hasSubmittedSKM ? (
                // Kasus 2: Magang Selesai tapi SKM belum diisi (Terkunci)
                <div style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>⚠️</span>
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
              ) : !item.hasSertifikat ? (
                // Kasus 3: SKM sudah terisi tapi sertifikat belum diunggah admin
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
                        Sertifikat kelulusan Anda sedang disiapkan dan akan segera diunggah oleh administrator BRMP. Notifikasi akan dikirimkan begitu berkas siap.
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
                    <span>Sedang Disiapkan Admin</span>
                  </span>
                </div>
              ) : (
                // Kasus 4: Lengkap! SKM terisi & Sertifikat sudah diunggah
                <div style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
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
                      <div style={{ fontWeight: 800, color: '#14532d', fontSize: '0.9375rem' }}>
                        Sertifikat Kelulusan Magang Resmi
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '2px' }}>
                        Berkas: <strong>{item.sertifikatName || 'Sertifikat-Magang.pdf'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                    {/* Tombol Pratinjau */}
                    <button
                      type="button"
                      onClick={() => handlePreview(item)}
                      disabled={loadingPreviewId === item.pengajuanId}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #86efac',
                        color: '#15803d',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: loadingPreviewId === item.pengajuanId ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      }}
                    >
                      <span>👁️</span>
                      <span>{loadingPreviewId === item.pengajuanId ? 'Memuat...' : 'Lihat Pratinjau'}</span>
                    </button>

                    {/* Tombol Unduh Berkas Langsung via Secure Route */}
                    <a
                      href={`/api/pengguna/sertifikat/download?pengajuan_id=${item.pengajuanId}&download=true&redirect=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem 1.125rem',
                        borderRadius: '8px',
                        backgroundColor: '#15803d',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      <span>📥</span>
                      <span>Unduh Sertifikat</span>
                    </a>
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
