'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  adminPengajuanService,
  type AdminPengajuanListItem,
} from '@/lib/services/admin-pengajuan.service'
import { PengajuanFilterBar } from '@/components/admin/pengajuan-filter-bar'

function RiwayatPengajuanContent() {
  const searchParams = useSearchParams()
  const [pengajuans, setPengajuans] = useState<AdminPengajuanListItem[]>([])
  const [bidangs, setBidangs] = useState<Array<{ id: number | string; nama: string }>>([])
  const [pembimbings, setPembimbings] = useState<Array<{ id: number | string; nama: string }>>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filter & Pagination state
  const [statusFilter, setStatusFilter] = useState('semua')
  const [bidangFilter, setBidangFilter] = useState('semua')
  const [pembimbingFilter, setPembimbingFilter] = useState('semua')
  const [jenjangFilter, setJenjangFilter] = useState('semua')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  // Sinkronkan kata kunci saat parameter URL berubah dari Navbar Search
  useEffect(() => {
    const urlQuery = searchParams.get('search')
    if (urlQuery !== null && urlQuery !== undefined) {
      setSearchKeyword(urlQuery)
      setCurrentPage(1)
    }
  }, [searchParams])

  // Load Bidang & Pembimbing list for dropdowns
  useEffect(() => {
    async function loadMasterOptions() {
      try {
        const [bidangRes, pembimbingRes] = await Promise.all([
          adminPengajuanService.getBidangList(),
          adminPengajuanService.getPembimbingList(),
        ])
        if (bidangRes.data) setBidangs(bidangRes.data)
        if (pembimbingRes.data) setPembimbings(pembimbingRes.data)
      } catch (err) {
        console.warn('Gagal memuat opsi master filter:', err)
      }
    }
    loadMasterOptions()
  }, [])

  // Load Pengajuans list (Server-Side Filter)
  const loadPengajuans = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      const res = await adminPengajuanService.getAdminPengajuans({
        status: statusFilter,
        bidangId: bidangFilter,
        pembimbingId: pembimbingFilter,
        jenjang: jenjangFilter,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
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
  }, [
    statusFilter,
    bidangFilter,
    pembimbingFilter,
    jenjangFilter,
    startDateFilter,
    endDateFilter,
    searchKeyword,
    currentPage,
  ])

  useEffect(() => {
    loadPengajuans()
  }, [loadPengajuans])

  const handleResetFilters = () => {
    setStatusFilter('semua')
    setBidangFilter('semua')
    setPembimbingFilter('semua')
    setJenjangFilter('semua')
    setStartDateFilter('')
    setEndDateFilter('')
    setSearchKeyword('')
    setCurrentPage(1)
  }

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

  const hasActiveFilter =
    statusFilter !== 'semua' ||
    bidangFilter !== 'semua' ||
    pembimbingFilter !== 'semua' ||
    jenjangFilter !== 'semua' ||
    startDateFilter !== '' ||
    endDateFilter !== '' ||
    searchKeyword.trim() !== ''

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
        selectedPembimbing={pembimbingFilter}
        selectedJenjang={jenjangFilter}
        startDate={startDateFilter}
        endDate={endDateFilter}
        searchKeyword={searchKeyword}
        bidangs={bidangs}
        pembimbings={pembimbings}
        onStatusChange={(st) => {
          setStatusFilter(st)
          setCurrentPage(1)
        }}
        onBidangChange={(bd) => {
          setBidangFilter(bd)
          setCurrentPage(1)
        }}
        onPembimbingChange={(pb) => {
          setPembimbingFilter(pb)
          setCurrentPage(1)
        }}
        onJenjangChange={(jj) => {
          setJenjangFilter(jj)
          setCurrentPage(1)
        }}
        onStartDateChange={(sd) => {
          setStartDateFilter(sd)
          setCurrentPage(1)
        }}
        onEndDateChange={(ed) => {
          setEndDateFilter(ed)
          setCurrentPage(1)
        }}
        onSearchChange={(kw) => {
          setSearchKeyword(kw)
          setCurrentPage(1)
        }}
        onResetFilters={handleResetFilters}
      />

      {/* 3. List Pengajuan Container */}
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
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px', marginBottom: '0.25rem' }}>
              Tidak ada data yang sesuai dengan filter.
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
              Coba sesuaikan kata kunci pencarian, rentang tanggal, atau ganti parameter filter bidang dan status Anda.
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16a34a',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Kembalikan semua filter
              </button>
            )}
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

export default function AdminRiwayatPengajuanPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat riwayat pengajuan...</div>}>
      <RiwayatPengajuanContent />
    </Suspense>
  )
}
