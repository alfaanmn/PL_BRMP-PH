'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { laporanService } from '@/lib/services/laporan.service'
import { LaporanFilterBar } from '@/components/admin/laporan/laporan-filter-bar'
import type {
  LaporanSummaryStats,
  LaporanPengajuanRow,
  LaporanFilterParams,
} from '@/types/laporan.types'
import {
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChartBarIcon,
} from '@/components/ui/admin-icons'

export default function AdminLaporanPage() {
  // 1. Filter states
  const [statusFilter, setStatusFilter] = useState('semua')
  const [bidangFilter, setBidangFilter] = useState('semua')
  const [pembimbingFilter, setPembimbingFilter] = useState('semua')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // 2. Dropdown options
  const [bidangList, setBidangList] = useState<Array<{ id: number | string; nama: string }>>([])
  const [pembimbingList, setPembimbingList] = useState<Array<{ id: number | string; nama: string }>>([])

  // 3. Data states
  const [summary, setSummary] = useState<LaporanSummaryStats>({
    totalPengajuan: 0,
    totalPeserta: 0,
    totalBidang: 0,
    totalPembimbing: 0,
    rataRataSKM: null,
    statusCounts: {
      menungguVerifikasi: 0,
      sedangMagang: 0,
      selesai: 0,
      ditolak: 0,
      dibatalkan: 0,
    },
  })
  const [tableRows, setTableRows] = useState<LaporanPengajuanRow[]>([])
  const [totalRowCount, setTotalRowCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 4. Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4500)
  }

  // Load Filter Dropdown Options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [bRes, pRes] = await Promise.all([
          laporanService.getBidangList(),
          laporanService.getPembimbingList(),
        ])
        if (bRes.data) setBidangList(bRes.data)
        if (pRes.data) setPembimbingList(pRes.data)
      } catch (err) {
        console.warn('Gagal memuat opsi filter:', err)
      }
    }
    loadOptions()
  }, [])

  // Load Data Preview & Summary
  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const filterParams: LaporanFilterParams = {
        status: statusFilter,
        bidangId: bidangFilter,
        pembimbingId: pembimbingFilter,
        startDate: startDateFilter,
        endDate: endDateFilter,
        search: searchKeyword,
        page: currentPage,
        limit: pageSize,
      }

      const [sumRes, rowsRes] = await Promise.all([
        laporanService.getLaporanSummary(filterParams),
        laporanService.getLaporanPengajuans(filterParams),
      ])

      if (sumRes.error) setErrorMsg(sumRes.error)
      if (rowsRes.error) setErrorMsg(rowsRes.error)

      setSummary(sumRes.data)
      setTableRows(rowsRes.data)
      setTotalRowCount(rowsRes.totalCount)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data laporan.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [
    statusFilter,
    bidangFilter,
    pembimbingFilter,
    startDateFilter,
    endDateFilter,
    searchKeyword,
    currentPage,
  ])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleResetFilters = () => {
    setStatusFilter('semua')
    setBidangFilter('semua')
    setPembimbingFilter('semua')
    setStartDateFilter('')
    setEndDateFilter('')
    setSearchKeyword('')
    setCurrentPage(1)
  }

  const activeFilterParams: LaporanFilterParams = {
    status: statusFilter,
    bidangId: bidangFilter,
    pembimbingId: pembimbingFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
    search: searchKeyword,
  }

  const totalPages = Math.max(Math.ceil(totalRowCount / pageSize), 1)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' }
      case 'Sedang Magang':
      case 'Disetujui':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
      case 'Selesai':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
      case 'Ditolak':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' }
      case 'Dibatalkan':
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
      default:
        return { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        .laporan-stat-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
      `}</style>

      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: toast.type === 'success' ? '#02482e' : '#991b1b',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircleIcon width={20} height={20} className="text-emerald-300" />
          ) : (
            <AlertCircleIcon width={20} height={20} className="text-red-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Page Header with Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.375rem 0', letterSpacing: '-0.02em' }}>
            Pusat laporan & ringkasan analitik
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Ringkasan data pengajuan, peserta magang, bidang, pembimbing, status, dan survei kepuasan masyarakat
          </p>
        </div>
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
            fontSize: '0.8125rem',
          }}
        >
          <strong>Database Notice:</strong> {errorMsg}
        </div>
      )}

      {/* 2. Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* Total Pengajuan */}
        <div className="laporan-stat-card">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Total pengajuan
          </span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: '1.2' }}>
            {summary.totalPengajuan}
          </span>
        </div>

        {/* Total Peserta / Orang */}
        <div className="laporan-stat-card">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Total peserta (orang)
          </span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: '1.2' }}>
            {summary.totalPeserta}
          </span>
        </div>

        {/* Sedang Magang */}
        <div className="laporan-stat-card">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#16a34a' }}>
            Sedang magang aktif
          </span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a', lineHeight: '1.2' }}>
            {summary.statusCounts.sedangMagang}
          </span>
        </div>

        {/* Selesai Magang */}
        <div className="laporan-stat-card">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#047857' }}>
            Selesai magang
          </span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#047857', lineHeight: '1.2' }}>
            {summary.statusCounts.selesai}
          </span>
        </div>

        {/* Nilai Rata-rata SKM */}
        <div className="laporan-stat-card">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Rata-rata kepuasan SKM
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#02482e', lineHeight: '1.2' }}>
              {summary.rataRataSKM !== null ? summary.rataRataSKM.toFixed(2) : '-'}
            </span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              / 4.00
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <LaporanFilterBar
        status={statusFilter}
        bidangId={bidangFilter}
        pembimbingId={pembimbingFilter}
        startDate={startDateFilter}
        endDate={endDateFilter}
        searchKeyword={searchKeyword}
        bidangList={bidangList}
        pembimbingList={pembimbingList}
        onStatusChange={(val) => {
          setStatusFilter(val)
          setCurrentPage(1)
        }}
        onBidangChange={(val) => {
          setBidangFilter(val)
          setCurrentPage(1)
        }}
        onPembimbingChange={(val) => {
          setPembimbingFilter(val)
          setCurrentPage(1)
        }}
        onStartDateChange={(val) => {
          setStartDateFilter(val)
          setCurrentPage(1)
        }}
        onEndDateChange={(val) => {
          setEndDateFilter(val)
          setCurrentPage(1)
        }}
        onSearchChange={(val) => {
          setSearchKeyword(val)
          setCurrentPage(1)
        }}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Table Preview Data Pengajuan */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Pratinjau Data Pengajuan Terfilter
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              Menampilkan {tableRows.length} dari total {totalRowCount} rekaman yang memenuhi parameter filter saat ini
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <LoaderIcon width={24} height={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Memproses data laporan...</p>
          </div>
        ) : tableRows.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <ChartBarIcon width={28} height={28} className="text-slate-400 mx-auto mb-2" />
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Tidak ada data pengajuan yang sesuai filter
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              Silakan sesuaikan kembali kriteria filter tanggal, status, atau bidang magang.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '50px', textAlign: 'center' }}>No</th>
                  <th style={{ padding: '0.75rem 1rem', width: '130px' }}>ID / Public ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Pemohon / Instansi</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bidang & Pembimbing</th>
                  <th style={{ padding: '0.75rem 1rem', width: '150px' }}>Periode Magang</th>
                  <th style={{ padding: '0.75rem 1rem', width: '120px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', width: '110px', textAlign: 'center' }}>Pengajuan</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => {
                  const badge = getStatusBadge(row.status)
                  return (
                    <tr key={row.publicId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {row.no}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8125rem' }}>
                          {row.publicId}
                        </span>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                          Surat: {row.nomorSurat}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.namaPemohon}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {row.asalInstansi} &bull; {row.jurusan}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 500, marginTop: '2px' }}>
                          {row.jumlahAnggota} peserta ({row.jenjang})
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{row.bidangNama}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Pembimbing: {row.pembimbingNama !== '-' ? row.pembimbingNama : '(Belum ditentukan)'}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#475569' }}>
                        <div>{row.tanggalMulai} s.d</div>
                        <div>{row.tanggalSelesai}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>({row.durasiBulan} bulan)</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: badge.color,
                            backgroundColor: badge.bg,
                            border: `1px solid ${badge.border}`,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.8125rem', color: '#64748b' }}>
                        {row.tanggalPengajuan}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Sebelumnya
            </button>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
