'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  adminPengajuanService,
  type AdminPengajuanListItem,
} from '@/lib/services/admin-pengajuan.service'
import { PengajuanFilterBar } from '@/components/admin/pengajuan-filter-bar'

export default function AdminRiwayatPengajuanPage() {
  const [pengajuans, setPengajuans] = useState<AdminPengajuanListItem[]>([])
  const [bidangs, setBidangs] = useState<Array<{ id: number | string; nama: string }>>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filter & Pagination state
  const [statusFilter, setStatusFilter] = useState('semua')
  const [bidangFilter, setBidangFilter] = useState('semua')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  // Load Bidang list for dropdown
  useEffect(() => {
    async function loadBidangs() {
      try {
        const res = await adminPengajuanService.getBidangList()
        if (res.data) {
          setBidangs(res.data)
        }
      } catch (err) {
        console.warn('Gagal memuat daftar bidang:', err)
      }
    }
    loadBidangs()
  }, [])

  // Load Pengajuans list
  const loadPengajuans = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      const res = await adminPengajuanService.getAdminPengajuans({
        status: statusFilter,
        bidangId: bidangFilter,
        search: searchKeyword,
        page: currentPage,
        limit,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setPengajuans(res.data)
        setTotalCount(res.totalCount)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat memuat pengajuan.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, bidangFilter, searchKeyword, currentPage])

  useEffect(() => {
    loadPengajuans()
  }, [loadPengajuans])

  const totalPages = Math.max(Math.ceil(totalCount / limit), 1)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return {
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          label: 'Menunggu verifikasi',
        }
      case 'Sedang Magang':
      case 'Disetujui':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          label: 'Sedang magang',
        }
      case 'Selesai':
        return {
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0',
          label: 'Selesai',
        }
      case 'Ditolak':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          label: 'Ditolak',
        }
      case 'Dibatalkan':
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          label: 'Dibatalkan',
        }
      default:
        return {
          bg: '#f1f5f9',
          color: '#334155',
          border: '#e2e8f0',
          label: status,
        }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px' }}>
      {/* 1. Page Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          Daftar pengajuan magang
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', color: '#6b7280' }}>
          Kelola, verifikasi, dan pantau status permohonan magang peserta di BRMP PH
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '12px',
          }}
        >
          <strong>Database Notice:</strong> {errorMsg}
        </div>
      )}

      {/* 2. Filter Bar */}
      <PengajuanFilterBar
        selectedStatus={statusFilter}
        selectedBidang={bidangFilter}
        searchKeyword={searchKeyword}
        bidangs={bidangs}
        onStatusChange={(st) => {
          setStatusFilter(st)
          setCurrentPage(1)
        }}
        onBidangChange={(bd) => {
          setBidangFilter(bd)
          setCurrentPage(1)
        }}
        onSearchChange={(kw) => {
          setSearchKeyword(kw)
          setCurrentPage(1)
        }}
      />

      {/* 3. List Pengajuan Container (Single Container with Row Items) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #f1f5f9',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            Memuat daftar pengajuan...
          </div>
        ) : pengajuans.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontWeight: 500, color: '#4b5563', fontSize: '13px' }}>
              Belum ada pengajuan yang sesuai filter.
            </div>
            <div style={{ fontSize: '11px', marginTop: '0.25rem' }}>
              Coba ganti filter status atau kata kunci pencarian Anda.
            </div>
          </div>
        ) : (
          <div>
            {pengajuans.map((item, idx) => {
              const badge = getStatusBadge(item.status)
              const isLast = idx === pengajuans.length - 1
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.875rem',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Sisi Kiri: Nama Pemohon (+Anggota) & Sub-info (Bidang, Pembimbing, Durasi) */}
                  <div style={{ minWidth: '220px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                      {item.nama_lengkap}
                      {item.jumlah_anggota > 1 && (
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, marginLeft: '6px' }}>
                          +{item.jumlah_anggota - 1} anggota
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                      {item.bidangs?.nama || 'Umum'} - Pembimbing: {item.pembimbings?.nama || 'belum ditugaskan'} - {item.durasi_bulan || 1} bulan
                    </div>
                  </div>

                  {/* Sisi Kanan: Badge Status & Tombol Periksa */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
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

                    <Link
                      href={`/admin/riwayat-pengajuan/${item.public_id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #15803d',
                        backgroundColor: '#ffffff',
                        color: '#15803d',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Periksa
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 4. Pagination Footer */}
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            backgroundColor: '#ffffff',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Menampilkan <strong>{pengajuans.length}</strong> dari <strong>{totalCount}</strong> pengajuan
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || loading}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: currentPage <= 1 ? '#9ca3af' : '#15803d',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Sebelumnya
            </button>

            <span style={{ fontSize: '12px', color: '#374151', padding: '0 4px' }}>
              Hal. <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || loading}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: currentPage >= totalPages ? '#9ca3af' : '#15803d',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
