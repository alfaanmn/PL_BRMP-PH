'use client'

import React, { useState, useEffect } from 'react'
import { SearchIcon, CloseIcon } from '@/components/ui/admin-icons'
import {
  getWibParts,
  getWibCurrentMonthRange,
  getWibPreviousMonthRange,
  getWibYearRange,
  getWibMonthRange,
  NAMA_BULAN_INDO,
} from '@/lib/helpers/date-wib.helper'

interface LaporanFilterBarProps {
  status: string
  bidangId: string
  pembimbingId: string
  startDate: string
  endDate: string
  searchKeyword: string
  availableYears?: number[]
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
  availableYears,
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
  const currentWib = getWibParts()
  const yearsList = (availableYears && availableYears.length > 0)
    ? availableYears
    : [currentWib.year]

  // Quick dropdown Bulan & Tahun state
  const [selectedQuickMonth, setSelectedQuickMonth] = useState<string>('')
  const [selectedQuickYear, setSelectedQuickYear] = useState<string>('')

  // Sinkronisasi state dropdown cepat jika user mereset filter
  useEffect(() => {
    if (!startDate && !endDate) {
      setSelectedQuickMonth('')
      setSelectedQuickYear('')
    }
  }, [startDate, endDate])

  const hasActiveFilter =
    status !== 'semua' ||
    bidangId !== 'semua' ||
    pembimbingId !== 'semua' ||
    startDate !== '' ||
    endDate !== '' ||
    searchKeyword !== ''

  // Handler klik preset chip
  const handleSelectPreset = (preset: 'semua' | 'bulan-ini' | 'bulan-lalu' | number) => {
    if (preset === 'semua') {
      onStartDateChange('')
      onEndDateChange('')
      setSelectedQuickMonth('')
      setSelectedQuickYear('')
    } else if (preset === 'bulan-ini') {
      const range = getWibCurrentMonthRange()
      onStartDateChange(range.startDate)
      onEndDateChange(range.endDate)
      setSelectedQuickMonth(String(currentWib.month))
      setSelectedQuickYear(String(currentWib.year))
    } else if (preset === 'bulan-lalu') {
      const range = getWibPreviousMonthRange()
      onStartDateChange(range.startDate)
      onEndDateChange(range.endDate)
      let prevM = currentWib.month - 1
      let prevY = currentWib.year
      if (prevM < 1) {
        prevM = 12
        prevY -= 1
      }
      setSelectedQuickMonth(String(prevM))
      setSelectedQuickYear(String(prevY))
    } else if (typeof preset === 'number') {
      const range = getWibYearRange(preset)
      onStartDateChange(range.startDate)
      onEndDateChange(range.endDate)
      setSelectedQuickMonth('')
      setSelectedQuickYear(String(preset))
    }
  }

  // Handler dropdown cepat Bulan & Tahun
  const handleQuickMonthYearApply = (newMonth: string, newYear: string) => {
    setSelectedQuickMonth(newMonth)
    setSelectedQuickYear(newYear)

    const y = Number(newYear) || currentWib.year
    const m = Number(newMonth)

    if (m >= 1 && m <= 12) {
      const range = getWibMonthRange(y, m)
      onStartDateChange(range.startDate)
      onEndDateChange(range.endDate)
    } else if (newYear) {
      const range = getWibYearRange(y)
      onStartDateChange(range.startDate)
      onEndDateChange(range.endDate)
    }
  }

  // Cek preset yang sedang aktif untuk styling chip
  const isBulanIniActive = Boolean(
    startDate &&
    endDate &&
    startDate === getWibCurrentMonthRange().startDate &&
    endDate === getWibCurrentMonthRange().endDate
  )

  const isBulanLaluActive = Boolean(
    startDate &&
    endDate &&
    startDate === getWibPreviousMonthRange().startDate &&
    endDate === getWibPreviousMonthRange().endDate
  )

  const isYearActive = (year: number) => {
    const yr = getWibYearRange(year)
    return startDate === yr.startDate && endDate === yr.endDate
  }

  const isSemuaWaktu = !startDate && !endDate

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      {/* Header bar filter */}
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
            onClick={() => {
              setSelectedQuickMonth('')
              setSelectedQuickYear('')
              onResetFilters()
            }}
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

      {/* Bagian Preset Shortcut Periode Cepat */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          padding: '0.875rem',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
              Periode Cepat (WIB):
            </span>

            {/* Chip Semua Waktu */}
            <button
              type="button"
              onClick={() => handleSelectPreset('semua')}
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: isSemuaWaktu ? '1px solid #16a34a' : '1px solid #cbd5e1',
                backgroundColor: isSemuaWaktu ? '#dcfce7' : '#ffffff',
                color: isSemuaWaktu ? '#15803d' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Semua Waktu
            </button>

            {/* Chip Bulan Ini */}
            <button
              type="button"
              onClick={() => handleSelectPreset('bulan-ini')}
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: isBulanIniActive ? '1px solid #16a34a' : '1px solid #cbd5e1',
                backgroundColor: isBulanIniActive ? '#dcfce7' : '#ffffff',
                color: isBulanIniActive ? '#15803d' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Bulan Ini
            </button>

            {/* Chip Bulan Lalu */}
            <button
              type="button"
              onClick={() => handleSelectPreset('bulan-lalu')}
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: isBulanLaluActive ? '1px solid #16a34a' : '1px solid #cbd5e1',
                backgroundColor: isBulanLaluActive ? '#dcfce7' : '#ffffff',
                color: isBulanLaluActive ? '#15803d' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Bulan Lalu
            </button>

            {/* Chips Tahun Dinamis */}
            {yearsList.map((yr) => {
              const active = isYearActive(yr)
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleSelectPreset(yr)}
                  style={{
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    border: active ? '1px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: active ? '#dcfce7' : '#ffffff',
                    color: active ? '#15803d' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Tahun {yr}
                </button>
              )
            })}
          </div>

          {/* Dropdown Cepat Pilih Bulan & Tahun */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pilih Bulan:</span>
            <select
              value={selectedQuickMonth}
              onChange={(e) => handleQuickMonthYearApply(e.target.value, selectedQuickYear || String(currentWib.year))}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="">Semua Bulan</option>
              {NAMA_BULAN_INDO.map((m) => (
                <option key={m.value} value={String(m.value)}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedQuickYear}
              onChange={(e) => handleQuickMonthYearApply(selectedQuickMonth, e.target.value)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="">Pilih Tahun</option>
              {yearsList.map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
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
            onChange={(e) => {
              onStartDateChange(e.target.value)
              setSelectedQuickMonth('')
              setSelectedQuickYear('')
            }}
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
            onChange={(e) => {
              onEndDateChange(e.target.value)
              setSelectedQuickMonth('')
              setSelectedQuickYear('')
            }}
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
