import React from 'react'
import Link from 'next/link'
import type { BidangSummaryItem } from '@/lib/services/admin-dashboard.service'

interface DashboardBidangSummaryProps {
  items: BidangSummaryItem[]
  loading?: boolean
}

export function DashboardBidangSummary({ items, loading }: DashboardBidangSummaryProps) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
            Kapasitas & Kuota Bidang
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Monitoring peserta magang aktif per bidang
          </span>
        </div>
        <Link
          href="/admin/bidang"
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#15803d',
            textDecoration: 'none',
          }}
        >
          Kelola Bidang &rarr;
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
          Memuat data bidang...
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
          Belum ada bidang magang terdaftar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {items.map((b) => {
            const kuota = b.kuota || 0
            const terisi = b.peserta_count || 0
            const persentase = kuota > 0 ? Math.min(Math.round((terisi / kuota) * 100), 100) : 0

            return (
              <div
                key={b.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                    {b.nama}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    <strong style={{ color: '#0f172a' }}>{terisi}</strong> / {kuota > 0 ? kuota : '∞'} Peserta
                  </span>
                </div>

                {kuota > 0 && (
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${persentase}%`,
                        height: '100%',
                        backgroundColor: persentase >= 90 ? '#dc2626' : persentase >= 70 ? '#ea580c' : '#15803d',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
