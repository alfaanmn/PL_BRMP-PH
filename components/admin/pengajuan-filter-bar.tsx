'use client'

import React from 'react'

interface BidangOption {
  id: number | string
  nama: string
}

interface PengajuanFilterBarProps {
  selectedStatus: string
  selectedBidang: string
  searchKeyword: string
  bidangs: BidangOption[]
  onStatusChange: (status: string) => void
  onBidangChange: (bidangId: string) => void
  onSearchChange: (keyword: string) => void
}

export function PengajuanFilterBar({
  selectedStatus,
  selectedBidang,
  searchKeyword,
  bidangs,
  onStatusChange,
  onBidangChange,
  onSearchChange,
}: PengajuanFilterBarProps) {
  const statusTabs = [
    { key: 'semua', label: 'Semua status' },
    { key: 'Menunggu Verifikasi', label: 'Menunggu verifikasi' },
    { key: 'Sedang Magang', label: 'Sedang magang' },
    { key: 'Selesai', label: 'Selesai' },
    { key: 'Ditolak', label: 'Ditolak' },
    { key: 'Dibatalkan', label: 'Dibatalkan' },
  ]

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* 1. Status Tabs (Pill Segmented Control) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {statusTabs.map((tab) => {
          const active = selectedStatus === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusChange(tab.key)}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: active ? 600 : 500,
                color: active ? '#ffffff' : '#64748b',
                backgroundColor: active ? '#15803d' : '#f8fafc',
                border: active ? '1px solid #15803d' : '1px solid #e2e8f0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 2. Search Box & Bidang Dropdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '420px', minWidth: '160px' }}>
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama pemohon, NIM, instansi, atau no. surat..."
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
              color: '#111827',
              backgroundColor: '#ffffff',
            }}
          />
        </div>

        {/* Dropdown Filter Bidang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
            Filter bidang:
          </span>
          <select
            value={selectedBidang}
            onChange={(e) => onBidangChange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '100%',
            }}
          >
            <option value="semua">Semua bidang magang</option>
            {bidangs.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.nama}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
