import React from 'react'
import Link from 'next/link'
import type { RecentPengajuanItem } from '@/lib/services/admin-dashboard.service'

interface DashboardPengajuanTableProps {
  items: RecentPengajuanItem[]
  loading?: boolean
}

export function DashboardPengajuanTable({ items, loading }: DashboardPengajuanTableProps) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Header Section (Sentence Case) */}
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 500,
            color: '#111827',
          }}
        >
          Antrean pengajuan magang
        </h2>
        <p style={{ margin: '0.125rem 0 0 0', fontSize: '12px', color: '#6b7280' }}>
          Perlu diverifikasi oleh administrator
        </p>
      </div>

      {/* Card Pembungkus Keseluruhan: border tipis, radius 12px, overflow hidden */}
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
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
            Memuat antrean pengajuan...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
            Belum ada antrean pengajuan magang.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item, index) => {
              const isLast = index === items.length - 1
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Kiri: Nama Pemohon - Instansi & Prodi (baris 1), Bidang, Tanggal (baris 2) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                    <div style={{ fontSize: '13px', color: '#111827' }}>
                      <span style={{ fontWeight: 500 }}>{item.nama_lengkap}</span>
                      <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '0.375rem' }}>
                        - {item.asal_instansi}, {item.jurusan}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      <span>{item.bidang_nama || 'Umum'}</span>
                      <span style={{ margin: '0 0.375rem' }}>&bull;</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Kanan: Badge Status (Kuning untuk Menunggu) + Tombol Periksa */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                      }}
                    >
                      {item.status || 'Menunggu verifikasi'}
                    </span>

                    <Link
                      href="/admin/riwayat-pengajuan"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        fontSize: '12px',
                        fontWeight: 500,
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
      </div>
    </div>
  )
}
