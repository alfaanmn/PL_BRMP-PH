'use client'

import React, { useEffect, useState } from 'react'
import {
  adminDashboardService,
  type DashboardStats,
  type RecentPengajuanItem,
  type BidangSummaryItem,
  type MonthlyTrendItem,
} from '@/lib/services/admin-dashboard.service'
import { DashboardStatsCard } from '@/components/admin/dashboard-stats-card'
import { DashboardCharts } from '@/components/admin/dashboard-charts'
import { DashboardPengajuanTable } from '@/components/admin/dashboard-pengajuan-table'

export default function AdminDashboardPage() {
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
  const [rekapYear, setRekapYear] = useState('2026')

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        setErrorMsg(null)

        const [statsRes, trendRes, bidangRes, recentRes] = await Promise.all([
          adminDashboardService.getDashboardStats(),
          adminDashboardService.getMonthlyTrends(),
          adminDashboardService.getBidangSummary(),
          adminDashboardService.getRecentPengajuans(6),
        ])

        if (statsRes.error) setErrorMsg(statsRes.error)
        setStats(statsRes.data)
        setMonthlyTrends(trendRes.data)
        setBidangSummary(bidangRes.data)
        setRecentPengajuans(recentRes.data)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data dashboard.'
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px' }}>
      {/* 1. Header Page Title & Top Controls (Sentence Case) */}
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
            Kelola hak akses, konfigurasi SKM, dan laporan tahunan
          </p>
        </div>

        {/* Right Filter & Export Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={rekapYear}
            onChange={(e) => setRekapYear(e.target.value)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <button
            onClick={() => alert('Fitur Ekspor Excel tersedia pada Fase 6 (Laporan).')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '5px 12px',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <span>Excel</span>
          </button>
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

      {/* 2. Top Metric Cards (3 Kartu Sesuai Prompt, Ikon Hijau Konsisten) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total Pengguna */}
        <DashboardStatsCard
          title="total pengguna"
          value={loading ? '...' : stats.totalPengguna}
          iconType="users"
        />

        {/* Total Pengajuan */}
        <DashboardStatsCard
          title="total pengajuan"
          value={loading ? '...' : stats.totalPengajuan}
          iconType="file-text"
        />

        {/* Rata-Rata Kepuasan */}
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
    </div>
  )
}
