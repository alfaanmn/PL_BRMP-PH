'use client'

import React from 'react'
import { SearchIcon, CloseIcon } from '@/components/ui/admin-icons'

interface LaporanFilterBarProps {
  status: string
  bidangId: string
  pembimbingId: string
  startDate: string
  endDate: string
  searchKeyword: string
  bidangList: Array<{ id: number | string; nama: string }>
  pembimbingList: Array<{ id: number | string; nama: string }>
  onStatusChange: (status: string) => void
  onBidangChange: (bidangId: string) => void
  onPembimbingChange: (pembimbingId: string) => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onSearchChange: (keyword: string) => void
  onResetFilters: () => void
}

export function LaporanFilterBar({
  status,
  bidangId,
  pembimbingId,
  startDate,
  endDate,
  searchKeyword,
  bidangList,
  pembimbingList,
  onStatusChange,
  onBidangChange,
  onPembimbingChange,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onResetFilters,
}: LaporanFilterBarProps) {
  const hasActiveFilter =
    status !== 'semua' ||
    bidangId !== 'semua' ||
    pembimbingId !== 'semua' ||
    startDate !== '' ||
    endDate !== '' ||
    searchKeyword !== ''

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
            Filter & parameter laporan
          </span>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <CloseIcon width={14} height={14} />
            <span>Reset filter</span>
          </button>
        )}
      </div>

      {/* Grid Filter Inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
        }}
      >
        {/* 1. Filter Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Status pengajuan
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="semua">Semua status</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Sedang Magang">Sedang Magang</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>

        {/* 2. Filter Bidang */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Bidang magang
          </label>
          <select
            value={bidangId}
            onChange={(e) => onBidangChange(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="semua">Semua bidang</option>
            {bidangList.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.nama}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Filter Pembimbing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Pembimbing lapangan
          </label>
          <select
            value={pembimbingId}
            onChange={(e) => onPembimbingChange(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="semua">Semua pembimbing</option>
            {pembimbingList.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Filter Tanggal Mulai */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Tanggal mulai (sejak)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#0f172a',
              outline: 'none',
            }}
          />
        </div>

        {/* 5. Filter Tanggal Selesai */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Tanggal selesai (hingga)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#0f172a',
              outline: 'none',
            }}
          />
        </div>

        {/* 6. Pencarian Keyword */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Pencarian peserta / nomor
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Nama, NIM, instansi, no surat..."
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                fontSize: '0.8125rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <SearchIcon width={14} height={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
