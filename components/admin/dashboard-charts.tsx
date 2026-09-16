import React from 'react'
import type { MonthlyTrendItem, BidangSummaryItem } from '@/lib/services/admin-dashboard.service'

interface DashboardChartsProps {
  monthlyTrends: MonthlyTrendItem[]
  bidangSummary: BidangSummaryItem[]
  loading?: boolean
}

export function DashboardCharts({ monthlyTrends, bidangSummary, loading }: DashboardChartsProps) {
  // Cek apakah data tren memiliki minimal 3 titik data
  const validTrendPoints = monthlyTrends.filter((t) => t.count > 0 || monthlyTrends.length >= 3)
  const hasEnoughTrendData = validTrendPoints.length >= 3

  // Nilai maksimum untuk skala
  const maxTrend = Math.max(...monthlyTrends.map((t) => t.count), 1)
  const maxBidang = Math.max(...bidangSummary.map((b) => b.total_pendaftar), 1)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {/* 1. Kiri: Tren pengajuan bulanan */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #f1f5f9',
          padding: '1.25rem',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '220px',
        }}
      >
        <h3
          style={{
            margin: '0 0 1rem 0',
            fontSize: '13px',
            fontWeight: 500,
            color: '#111827',
          }}
        >
          Tren pengajuan bulanan
        </h3>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>
            Memuat grafik tren...
          </div>
        ) : !hasEnoughTrendData ? (
          /* Empty state jika data kurang dari 3 titik data */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '2rem 1rem',
              textAlign: 'center',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              Data akan tampil setelah ada lebih banyak pengajuan
            </span>
          </div>
        ) : (
          /* Line chart hijau normal jika >= 3 titik data */
          <div style={{ position: 'relative', width: '100%', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', height: '140px', width: '100%' }}>
              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                <polyline
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2"
                  points={monthlyTrends
                    .map((t, idx) => {
                      const x = (idx / Math.max(monthlyTrends.length - 1, 1)) * 90 + 5
                      const y = 100 - (t.count / maxTrend) * 80
                      return `${x}%,${y}%`
                    })
                    .join(' ')}
                />
                {monthlyTrends.map((t, idx) => {
                  const x = (idx / Math.max(monthlyTrends.length - 1, 1)) * 90 + 5
                  const y = 100 - (t.count / maxTrend) * 80
                  return <circle key={idx} cx={`${x}%`} cy={`${y}%`} r="4" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af' }}>
              {monthlyTrends.map((t, idx) => (
                <span key={idx}>{t.periode}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Kanan: Distribusi pendaftar per bidang */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #f1f5f9',
          padding: '1.25rem',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '220px',
        }}
      >
        <h3
          style={{
            margin: '0 0 1rem 0',
            fontSize: '13px',
            fontWeight: 500,
            color: '#111827',
          }}
        >
          Distribusi pendaftar per bidang
        </h3>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>
            Memuat data bidang...
          </div>
        ) : bidangSummary.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>
            Belum ada bidang magang terdaftar.
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Bar Chart Container */}
            <div
              style={{
                height: '140px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                paddingBottom: '6px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              {bidangSummary.map((b) => {
                const count = b.total_pendaftar || 0
                const heightPercent = maxBidang > 0 ? (count / maxBidang) * 90 : 0
                const isTop = count > 0 && count === maxBidang

                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      width: `${100 / Math.max(bidangSummary.length, 1)}%`,
                      maxWidth: '54px',
                    }}
                  >
                    <div
                      title={`${b.nama}: ${count} pendaftar`}
                      style={{
                        width: '80%',
                        maxWidth: '44px',
                        height: count === 0 ? '4px' : `${Math.max(heightPercent, 16)}%`,
                        backgroundColor: isTop ? '#15803d' : count > 0 ? '#4ade80' : '#e5e7eb',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.2s ease',
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Labels Kategori Bidang (Text-muted, 11px) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '11px',
                color: '#6b7280',
                paddingTop: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {bidangSummary.map((b) => (
                <div
                  key={b.id}
                  style={{
                    width: `${100 / Math.max(bidangSummary.length, 1)}%`,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '11px',
                    color: '#6b7280',
                  }}
                  title={b.nama}
                >
                  {b.nama.length > 12 ? b.nama.substring(0, 10) + '...' : b.nama}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
