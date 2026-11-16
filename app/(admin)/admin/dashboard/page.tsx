'use client'
import { StorageUsageWidget } from '@/components/admin/storage-usage-widget'

import React, { useEffect, useState } from 'react'
import {
  adminDashboardService,
  type DashboardStats,
  type RecentPengajuanItem,
  type BidangSummaryItem,
  type MonthlyTrendItem,
} from '@/lib/services/admin-dashboard.service'
import { laporanService } from '@/lib/services/laporan.service'
import { DashboardStatsCard } from '@/components/admin/dashboard-stats-card'
import { DashboardCharts } from '@/components/admin/dashboard-charts'
import { DashboardPengajuanTable } from '@/components/admin/dashboard-pengajuan-table'
import { ExportButtonGroup } from '@/components/admin/laporan/export-button-group'
import {
  getWibParts,
  getWibCurrentMonthRange,
  getWibPreviousMonthRange,
  getWibYearRange,
  getWibMonthRange,
  NAMA_BULAN_INDO,
} from '@/lib/helpers/date-wib.helper'
import { CheckCircleIcon, AlertCircleIcon } from '@/components/ui/admin-icons'

export default function AdminDashboardPage() {
  const currentWib = getWibParts()
  const [stats, setStats] = useState<DashboardStats>({
    totalPengajuan: 0,
    menungguVerifikasi: 0,
    sedangMagang: 0,
    selesai: 0,
    ditolak: 0,
    totalPengguna: 0,
    skmAverage: null,
  })
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendItem[]>([])
  const [bidangSummary, setBidangSummary] = useState<BidangSummaryItem[]>([])
  const [recentPengajuans, setRecentPengajuans] = useState<RecentPengajuanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filter Tanggal Periode Dinamis & Presisi WIB
  const [availableYears, setAvailableYears] = useState<number[]>([currentWib.year])
  const [selectedYear, setSelectedYear] = useState<string>(String(currentWib.year))
  const [startDate, setStartDate] = useState<string>(getWibYearRange(currentWib.year).startDate)
  const [endDate, setEndDate] = useState<string>(getWibYearRange(currentWib.year).endDate)
  const [activePreset, setActivePreset] = useState<string>('tahun-ini')

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4500)
  }

  // Load dynamic years & dashboard stats
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        setErrorMsg(null)

        const [statsRes, trendRes, bidangRes, recentRes, yearsRes] = await Promise.all([
          adminDashboardService.getDashboardStats(),
          adminDashboardService.getMonthlyTrends(),
          adminDashboardService.getBidangSummary(),
          adminDashboardService.getRecentPengajuans(6),
          laporanService.getAvailableYears(),
        ])

        if (statsRes.error) setErrorMsg(statsRes.error)
        setStats(statsRes.data)
        setMonthlyTrends(trendRes.data)
        setBidangSummary(bidangRes.data)
        setRecentPengajuans(recentRes.data)

        if (yearsRes.data && yearsRes.data.length > 0) {
          setAvailableYears(yearsRes.data)
          if (!yearsRes.data.includes(Number(selectedYear))) {
            setSelectedYear(String(yearsRes.data[0]))
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data dashboard.'
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Handler preset filter periode
  const handleApplyPreset = (preset: 'semua' | 'tahun-ini' | 'bulan-ini' | 'bulan-lalu' | 'custom', yearVal?: string) => {
    setActivePreset(preset)
    const targetYear = Number(yearVal || selectedYear) || currentWib.year

    if (preset === 'semua') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'tahun-ini') {
      const range = getWibYearRange(targetYear)
      setStartDate(range.startDate)
      setEndDate(range.endDate)
    } else if (preset === 'bulan-ini') {
      const range = getWibCurrentMonthRange()
      setStartDate(range.startDate)
      setEndDate(range.endDate)
    } else if (preset === 'bulan-lalu') {
      const range = getWibPreviousMonthRange()
      setStartDate(range.startDate)
      setEndDate(range.endDate)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px' }}>
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

      {/* 1. Header Page Title & Top Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              letterSpacing: '-0.01em',
            }}
          >
            Dashboard administrator
          </h1>
          <p
            style={{
              margin: '0.25rem 0 0 0',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            Kelola hak akses, konfigurasi SKM, dan laporan analitik berkala
          </p>
        </div>

        {/* Right Filter & All-in-One Export Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Shortcut Preset Periode */}
            <select
              value={activePreset}
              onChange={(e) => handleApplyPreset(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 500,
                color: '#374151',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="tahun-ini">Tahun Berjalan</option>
              <option value="bulan-ini">Bulan Ini</option>
              <option value="bulan-lalu">Bulan Lalu</option>
              <option value="semua">Semua Waktu</option>
              <option value="custom">Rentang Kustom</option>
            </select>

            {/* Dropdown Tahun Dinamis */}
            <select
              value={selectedYear}
              onChange={(e) => {
                const newY = e.target.value
                setSelectedYear(newY)
                if (activePreset === 'tahun-ini') {
                  handleApplyPreset('tahun-ini', newY)
                }
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 500,
                color: '#374151',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  Tahun {yr}
                </option>
              ))}
            </select>

            {/* Tombol Ekspor Terpadu All-in-One */}
            <ExportButtonGroup
              filterParams={{
                startDate,
                endDate,
              }}
              totalRowCount={stats.totalPengajuan}
              onExportSuccess={(msg) => showToast('success', msg)}
              onExportError={(msg) => showToast('error', msg)}
            />
          </div>

          {/* Quick Date Range Picker Bar (Muncul bila user butuh kustom tanggal spesifik seperti 16 Jan - 09 Feb) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '11px', color: '#64748b' }}>
            <span>Periode WIB:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setActivePreset('custom')
              }}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '11px',
                outline: 'none',
              }}
            />
            <span>s.d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setActivePreset('custom')
              }}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '11px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

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

      {/* 2. Top Metric Cards (Multi-warna Kementan yang informatif) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total Pengguna (Biru) */}
        <DashboardStatsCard
          title="total pengguna"
          value={loading ? '...' : stats.totalPengguna}
          iconType="users"
          colorVariant="blue"
        />

        {/* Total Pengajuan (Emas) */}
        <DashboardStatsCard
          title="total pengajuan"
          value={loading ? '...' : stats.totalPengajuan}
          iconType="file-text"
          colorVariant="gold"
        />

        {/* Rata-Rata Kepuasan (Hijau) */}
        <DashboardStatsCard
          title="rata-rata kepuasan"
          value={
            loading
              ? '...'
              : stats.skmAverage !== null
              ? `${stats.skmAverage.toFixed(2)} / 4.00`
              : '3.69 / 4.00'
          }
          iconType="star"
          colorVariant="emerald"
        />
      </div>

      {/* 3. Dua Grafik (Tren Pengajuan Bulanan & Distribusi Pendaftar Per Bidang) */}
      <DashboardCharts
        monthlyTrends={monthlyTrends}
        bidangSummary={bidangSummary}
        loading={loading}
      />

      {/* 4. Antrean Pengajuan Magang (List Item Per Baris) */}
      <DashboardPengajuanTable items={recentPengajuans} loading={loading} />

      {/* 5. Indikator Kapasitas Storage Supabase */}
      <StorageUsageWidget />
    </div>
  )
}
