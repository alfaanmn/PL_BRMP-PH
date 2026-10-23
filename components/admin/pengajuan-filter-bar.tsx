'use client'

import React from 'react'
import { SearchIcon, CloseIcon } from '@/components/ui/admin-icons'

export interface FilterOption {
  id: number | string
  nama: string
}

interface PengajuanFilterBarProps {
  selectedStatus: string
  selectedBidang: string
  selectedPembimbing: string
  selectedJenjang: string
  startDate: string
  endDate: string
  searchKeyword: string
  bidangs: FilterOption[]
  pembimbings: FilterOption[]
  onStatusChange: (status: string) => void
  onBidangChange: (bidangId: string) => void
  onPembimbingChange: (pembimbingId: string) => void
  onJenjangChange: (jenjang: string) => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onSearchChange: (keyword: string) => void
  onResetFilters: () => void
}

export function PengajuanFilterBar({
  selectedStatus,
  selectedBidang,
  selectedPembimbing,
  selectedJenjang,
  startDate,
  endDate,
  searchKeyword,
  bidangs,
  pembimbings,
  onStatusChange,
  onBidangChange,
  onPembimbingChange,
  onJenjangChange,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onResetFilters,
}: PengajuanFilterBarProps) {
  const statusTabs = [
    { key: 'semua', label: 'Semua status' },
    { key: 'Menunggu Verifikasi', label: 'Menunggu verifikasi' },
    { key: 'Sedang Magang', label: 'Sedang magang' },
    { key: 'Selesai', label: 'Selesai' },
    { key: 'Ditolak', label: 'Ditolak' },
    { key: 'Dibatalkan', label: 'Dibatalkan' },
  ]

  const hasActiveFilter =
    selectedStatus !== 'semua' ||
    selectedBidang !== 'semua' ||
    selectedPembimbing !== 'semua' ||
    selectedJenjang !== 'semua' ||
    startDate !== '' ||
    endDate !== '' ||
    searchKeyword.trim() !== ''

  const activeCount = [
    selectedStatus !== 'semua',
    selectedBidang !== 'semua',
    selectedPembimbing !== 'semua',
    selectedJenjang !== 'semua',
    startDate !== '',
    endDate !== '',
    searchKeyword.trim() !== '',
  ].filter(Boolean).length

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* 1. Header Filter Bar & Reset Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Status Tabs (Pill Segmented Control) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            overflowX: 'auto',
            paddingBottom: '2px',
            maxWidth: '100%',
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
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#ffffff' : '#64748b',
                  backgroundColor: active ? '#16a34a' : '#f8fafc',
                  border: active ? '1px solid #16a34a' : '1px solid #e2e8f0',
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

        {/* Reset Filter Button & Indicator */}
        {hasActiveFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#16a34a',
                backgroundColor: '#f0fdf4',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #bbf7d0',
              }}
            >
              {activeCount} filter aktif
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              <CloseIcon width={13} height={13} />
              <span>Reset filter</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Grid Filter Controls Lanjutan */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {/* Search Keyword Input */}
        <div style={{ position: 'relative', gridColumn: 'span 1' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Pencarian kata kunci
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Nama, NIM, instansi, jurusan..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#0f172a',
                backgroundColor: '#ffffff',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <SearchIcon width={13} height={13} />
            </div>
          </div>
        </div>

        {/* Filter Bidang */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Bidang magang
          </label>
          <select
            value={selectedBidang}
            onChange={(e) => onBidangChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 500,
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="semua">Semua bidang</option>
            {bidangs.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Pembimbing */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Pembimbing lapangan
          </label>
          <select
            value={selectedPembimbing}
            onChange={(e) => onPembimbingChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 500,
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="semua">Semua pembimbing</option>
            {pembimbings.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Jenjang */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Jenjang pendidikan
          </label>
          <select
            value={selectedJenjang}
            onChange={(e) => onJenjangChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 500,
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="semua">Semua jenjang</option>
            <option value="S1">S1 / Sarjana</option>
            <option value="D4">D4 / Sarjana Terapan</option>
            <option value="D3">D3 / Diploma</option>
            <option value="SMK">SMK / Sederajat</option>
          </select>
        </div>

        {/* Filter Tanggal Mulai */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Periode sejak
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter Tanggal Selesai */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Periode hingga
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
  )
}
