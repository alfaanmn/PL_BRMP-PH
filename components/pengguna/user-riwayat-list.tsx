'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { PengajuanDetailModal } from './pengajuan-detail-modal'
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal'
import { FileTextIcon } from '@/components/ui/admin-icons'

interface UserRiwayatListProps {
  initialPengajuans: any[]
}

export function UserRiwayatList({ initialPengajuans }: UserRiwayatListProps) {
  const [pengajuans, setPengajuans] = useState<any[]>(initialPengajuans || [])
  const [selectedPengajuan, setSelectedPengajuan] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<string>('semua')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [previewDoc, setPreviewDoc] = useState<{ url: string | null; title: string } | null>(null)

  useEffect(() => {
    setPengajuans(initialPengajuans || [])
  }, [initialPengajuans])

  // Helper status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a',
          label: 'Menunggu verifikasi',
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

  // Counters
  const countTotal = pengajuans.length
  const countMenunggu = pengajuans.filter((p) => p.status === 'Menunggu Verifikasi').length
  const countDisetujui = pengajuans.filter(
    (p) => p.status === 'Disetujui' || p.status === 'Sedang Magang' || p.status === 'Selesai'
  ).length
  const countDitolak = pengajuans.filter((p) => p.status === 'Ditolak').length

  // Filtered List
  const filteredList = useMemo(() => {
    return pengajuans.filter((p) => {
      // Tab filter
      if (activeTab === 'menunggu' && p.status !== 'Menunggu Verifikasi') return false
      if (
        activeTab === 'disetujui' &&
        p.status !== 'Disetujui' &&
        p.status !== 'Sedang Magang' &&
        p.status !== 'Selesai'
      )
        return false
      if (activeTab === 'ditolak' && p.status !== 'Ditolak') return false

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const bidangName = (p.bidangs?.nama || '').toLowerCase()
        const nomorSurat = (p.nomor_surat || '').toLowerCase()
        const publicId = (p.public_id || '').toLowerCase()
        const instansi = (p.asal_instansi || '').toLowerCase()

        if (
          !bidangName.includes(query) &&
          !nomorSurat.includes(query) &&
          !publicId.includes(query) &&
          !instansi.includes(query)
        ) {
          return false
        }
      }

      return true
    })
  }, [pengajuans, activeTab, searchQuery])

  const formatDate = (dateStr?: string | null) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <style>{`
        .stat-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease;
          cursor: pointer;
          user-select: none;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px -3px rgba(0, 0, 0, 0.06);
        }
        .stat-card.total:hover {
          border-color: #cbd5e1;
        }
        .stat-card.menunggu:hover {
          border-color: #fde68a;
          background-color: #fffdf5;
        }
        .stat-card.disetujui:hover {
          border-color: #bbf7d0;
          background-color: #f6fef9;
        }
        .stat-card.ditolak:hover {
          border-color: #fecaca;
          background-color: #fef8f8;
        }

        .pengajuan-card {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .pengajuan-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.04) !important;
        }

        .btn-rincian {
          transition: all 0.15s ease;
        }
        .btn-rincian:hover {
          background-color: #ecfdf5 !important;
          border-color: #86efac !important;
          color: #15803d !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* 1. Ringkasan Statistik (4 Kartu dengan Hover Animasi) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.75rem'
      }}>
        {/* Total */}
        <div
          onClick={() => setActiveTab('semua')}
          className="stat-card total"
          style={{
            borderColor: activeTab === 'semua' ? '#94a3b8' : '#e2e8f0',
            backgroundColor: activeTab === 'semua' ? '#f8fafc' : '#ffffff'
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Total</span>
          <span style={{ fontSize: '19px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
            {countTotal}
          </span>
        </div>

        {/* Menunggu */}
        <div
          onClick={() => setActiveTab('menunggu')}
          className="stat-card menunggu"
          style={{
            borderColor: activeTab === 'menunggu' ? '#fde68a' : '#e2e8f0',
            backgroundColor: activeTab === 'menunggu' ? '#fffdf5' : '#ffffff'
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Menunggu</span>
          <span style={{ fontSize: '19px', fontWeight: 600, color: '#d97706', lineHeight: 1.2 }}>
            {countMenunggu}
          </span>
        </div>

        {/* Disetujui */}
        <div
          onClick={() => setActiveTab('disetujui')}
          className="stat-card disetujui"
          style={{
            borderColor: activeTab === 'disetujui' ? '#bbf7d0' : '#e2e8f0',
            backgroundColor: activeTab === 'disetujui' ? '#f6fef9' : '#ffffff'
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Disetujui</span>
          <span style={{ fontSize: '19px', fontWeight: 600, color: '#16a34a', lineHeight: 1.2 }}>
            {countDisetujui}
          </span>
        </div>

        {/* Ditolak */}
        <div
          onClick={() => setActiveTab('ditolak')}
          className="stat-card ditolak"
          style={{
            borderColor: activeTab === 'ditolak' ? '#fecaca' : '#e2e8f0',
            backgroundColor: activeTab === 'ditolak' ? '#fef8f8' : '#ffffff'
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Ditolak</span>
          <span style={{ fontSize: '19px', fontWeight: 600, color: '#dc2626', lineHeight: 1.2 }}>
            {countDitolak}
          </span>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar (Compact Height) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.625rem'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {[
            { key: 'semua', label: 'Semua', count: countTotal },
            { key: 'menunggu', label: 'Menunggu', count: countMenunggu },
            { key: 'disetujui', label: 'Disetujui', count: countDisetujui },
            { key: 'ditolak', label: 'Ditolak', count: countDitolak },
          ].map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.3rem 0.625rem',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                  color: isActive ? '#16a34a' : '#64748b',
                  border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '0 4px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? '#16a34a' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: 600
                }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Box Compact */}
        <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '320px', minWidth: '160px' }}>
          <input
            type="text"
            placeholder="Cari bidang / no surat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.4rem 0.625rem 0.4rem 1.85rem',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            🔍
          </span>
        </div>
      </div>

      {/* 3. Cards Riwayat Pengajuan */}
      {filteredList.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          padding: '3rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#ecfdf5',
            color: '#16a34a',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto'
          }}>
            📄
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            {countTotal === 0 ? 'Belum ada riwayat pengajuan magang' : 'Tidak ada pengajuan sesuai filter'}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '380px', margin: '0 auto 1.25rem auto', lineHeight: 1.5 }}>
            {countTotal === 0
              ? 'Anda belum pernah mengirimkan permohonan magang di BRMP. Silakan ajukan pendaftaran magang melalui formulir resmi.'
              : 'Coba ubah kata kunci pencarian atau ganti filter status untuk melihat pengajuan lainnya.'}
          </p>
          {countTotal === 0 ? (
            <Link
              href="/pengguna/career/step1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)'
              }}
            >
              <span>Ajukan magang sekarang</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveTab('semua')
                setSearchQuery('')
              }}
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredList.map((item) => {
            const badge = getStatusBadge(item.status)
            const durasiStr = `${item.durasi_bulan || 1} bulan`
            const pemohonStr = item.nama_lengkap || 'Pemohon'
            const anggotaStr = `${item.jumlah_anggota || 1} orang`
            const isSelesai = item.status === 'Selesai'
            const hasSubmittedSKM = Boolean(item.hasSubmittedSKM)
            const hasSertifikat = Boolean(item.sertifikat_url)

            return (
              <div
                key={item.id}
                className="pengajuan-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: isSelesai && !hasSubmittedSKM ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                  boxShadow: isSelesai && !hasSubmittedSKM ? '0 2px 8px -2px rgba(217, 119, 6, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Baris Atas: ID & Tanggal di kiri, Status & SKM Badge di kanan */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    ID #{item.id} • Diajukan {formatDate(item.created_at)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {isSelesai && !hasSubmittedSKM && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⚠️</span>
                        <span>Wajib Isi SKM</span>
                      </span>
                    )}

                    {isSelesai && hasSubmittedSKM && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#ecfdf5',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>✓</span>
                        <span>SKM Lengkap</span>
                      </span>
                    )}

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Judul Bidang */}
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {item.bidangs?.nama || `Bidang magang #${item.bidang_id}`}
                </h3>

                {/* Satu Baris Info Ringkas */}
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {durasiStr} - {pemohonStr} ({anggotaStr})
                </div>

                {/* Baris Bawah: Berkas Tag di kiri, Tombol Aksi di kanan */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  paddingTop: '0.25rem'
                }}>
                  {/* Berkas Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {item.surat_pengantar_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            url: item.surat_pengantar_url,
                            title: 'Surat Pengantar Magang',
                          })
                        }
                        style={{
                          fontSize: '11px',
                          color: '#15803d',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #bbf7d0',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          minHeight: '28px',
                        }}
                        title="Klik untuk melihat Surat Pengantar"
                      >
                        <FileTextIcon width={13} height={13} />
                        <span>Surat pengantar</span>
                      </button>
                    )}

                    {item.proposal_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            url: item.proposal_url,
                            title: 'Proposal Kegiatan Magang',
                          })
                        }
                        style={{
                          fontSize: '11px',
                          color: '#15803d',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #bbf7d0',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          minHeight: '28px',
                        }}
                        title="Klik untuk melihat Proposal Magang"
                      >
                        <FileTextIcon width={13} height={13} />
                        <span>Proposal</span>
                      </button>
                    )}

                    {item.dokumen_tambahan_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            url: item.dokumen_tambahan_url,
                            title: 'Dokumen Tambahan',
                          })
                        }
                        style={{
                          fontSize: '11px',
                          color: '#15803d',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #bbf7d0',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          minHeight: '28px',
                        }}
                        title="Klik untuk melihat Dokumen Tambahan"
                      >
                        <FileTextIcon width={13} height={13} />
                        <span>Dokumen tambahan</span>
                      </button>
                    )}
                  </div>

                  {/* Tombol Aksi: SKM, Sertifikat, & Lihat Rincian */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {/* Alur SKM & Sertifikat untuk status Selesai */}
                    {isSelesai && (
                      <>
                        {!hasSubmittedSKM ? (
                          <>
                            <Link
                              href={`/pengguna/skm?pengajuan_id=${item.id}`}
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#ffffff',
                                backgroundColor: '#d97706',
                                border: '1px solid #b45309',
                                borderRadius: '6px',
                                padding: '0.3rem 0.65rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 1px 2px rgba(217, 119, 6, 0.2)'
                              }}
                              title="Wajib mengisi SKM untuk membuka akses sertifikat magang"
                            >
                              <span>⭐</span>
                              <span>Isi SKM</span>
                            </Link>

                            <span
                              style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                backgroundColor: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '6px',
                                padding: '0.3rem 0.5rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'not-allowed'
                              }}
                              title="Sertifikat terkunci sampai kuesioner SKM selesai diisi"
                            >
                              <span>🔒</span>
                              <span>Sertifikat Terkunci</span>
                            </span>
                          </>
                        ) : hasSertifikat ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                url: item.sertifikat_url,
                                title: `Sertifikat Magang - ${item.bidangs?.nama || 'BRMP PH'}`,
                              })
                            }
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#ffffff',
                              backgroundColor: '#16a34a',
                              border: '1px solid #15803d',
                              borderRadius: '6px',
                              padding: '0.3rem 0.65rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
                              transition: 'all 0.15s ease'
                            }}
                            title="Klik untuk melihat dan mengunduh sertifikat magang Anda"
                          >
                            <span>🎓</span>
                            <span>Lihat Sertifikat</span>
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '0.3rem 0.5rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Sertifikat sedang dalam proses penerbitan oleh administrator BRMP"
                          >
                            <span>⏳</span>
                            <span>Sertifikat Proses Terbit</span>
                          </span>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedPengajuan(item)}
                      className="btn-rincian"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#16a34a',
                        backgroundColor: '#ffffff',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        padding: '0.3rem 0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>Lihat rincian</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Detail */}
      {selectedPengajuan && (
        <PengajuanDetailModal
          isOpen={!!selectedPengajuan}
          onClose={() => setSelectedPengajuan(null)}
          pengajuan={selectedPengajuan}
        />
      )}

      {/* Modal Pratinjau Dokumen */}
      <DocumentPreviewModal
        isOpen={previewDoc !== null}
        url={previewDoc?.url}
        title={previewDoc?.title || 'Pratinjau Dokumen'}
        subtitle="Dokumen Riwayat Pengajuan"
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}
