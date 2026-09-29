'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DownloadIcon, LoaderIcon } from '@/components/ui/admin-icons'
import type { ExportDatasetCategory, ExportFormat, LaporanFilterParams } from '@/types/laporan.types'

interface ExportButtonGroupProps {
  filterParams: LaporanFilterParams
  onExportStart?: () => void
  onExportSuccess?: (message: string) => void
  onExportError?: (error: string) => void
}

export function ExportButtonGroup({
  filterParams,
  onExportStart,
  onExportSuccess,
  onExportError,
}: ExportButtonGroupProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ExportDatasetCategory>('all')
  const menuRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const categories: Array<{ id: ExportDatasetCategory; label: string; desc: string }> = [
    { id: 'all', label: 'Laporan Lengkap (Semua Sheet)', desc: 'Seluruh sheet (Pengajuan, Peserta, Bidang, Pembimbing, Status, SKM)' },
    { id: 'pengajuan', label: 'Data Pengajuan Magang', desc: 'Rincian public_id, instansi, status, nomor surat & periode' },
    { id: 'peserta', label: 'Rekap Peserta & Anggota', desc: 'Daftar ketua dan seluruh anggota kelompok magang' },
    { id: 'bidang', label: 'Rekap Bidang Magang', desc: 'Kuota maksimal, peserta aktif, dan sisa slot per bidang' },
    { id: 'pembimbing', label: 'Rekap Pembimbing Lapangan', desc: 'Kapasitas kuota, bimbingan aktif, dan sisa kapasitas' },
    { id: 'status', label: 'Distribusi Status Pengajuan', desc: 'Agregasi total pengajuan dan peserta per status' },
    { id: 'skm', label: 'Rekapitulasi Hasil SKM', desc: 'Skor butir Q1–Q13 dan masukan kualitatif Q14–Q15' },
  ]

  const triggerDownload = async (format: ExportFormat, category: ExportDatasetCategory) => {
    setIsMenuOpen(false)
    setExporting(true)
    onExportStart?.()

    try {
      const params = new URLSearchParams()
      params.set('format', format)
      params.set('category', category)

      if (filterParams.status && filterParams.status !== 'semua') params.set('status', filterParams.status)
      if (filterParams.bidangId && filterParams.bidangId !== 'semua') params.set('bidangId', String(filterParams.bidangId))
      if (filterParams.pembimbingId && filterParams.pembimbingId !== 'semua') params.set('pembimbingId', String(filterParams.pembimbingId))
      if (filterParams.startDate) params.set('startDate', filterParams.startDate)
      if (filterParams.endDate) params.set('endDate', filterParams.endDate)
      if (filterParams.search) params.set('search', filterParams.search)

      const response = await fetch(`/api/laporan/export?${params.toString()}`, {
        method: 'GET',
      })

      if (!response.ok) {
        let errMessage = 'Gagal mengunduh berkas laporan.'
        try {
          const errJson = await response.json()
          if (errJson.error?.message) {
            errMessage = errJson.error.message
          }
        } catch {
          // ignore parsing error
        }
        throw new Error(errMessage)
      }

      // Ambil nama file dari header Content-Disposition atau fallback
      const disposition = response.headers.get('Content-Disposition')
      let filename = `laporan-magang-${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      onExportSuccess?.(`Ekspor berkas ${filename} berhasil diunduh.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengekspor laporan.'
      onExportError?.(msg)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }} ref={menuRef}>
      {/* 1. Tombol Utama Export Excel (.xlsx) */}
      <button
        type="button"
        disabled={exporting}
        onClick={() => triggerDownload('xlsx', activeCategory)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.55rem 1.125rem',
          backgroundColor: '#16a34a',
          color: '#ffffff',
          borderRadius: '8px',
          border: 'none',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: exporting ? 'not-allowed' : 'pointer',
          boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
          transition: 'background-color 0.15s ease',
        }}
      >
        {exporting ? (
          <LoaderIcon width={16} height={16} className="animate-spin" />
        ) : (
          <DownloadIcon width={16} height={16} />
        )}
        <span>{exporting ? 'Mengekspor...' : 'Ekspor Excel (.xlsx)'}</span>
      </button>

      {/* 2. Tombol Dropdown Opsi Dataset & CSV */}
      <button
        type="button"
        disabled={exporting}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.55rem 0.875rem',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: exporting ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s ease',
        }}
      >
        <span>Pilihan Ekspor</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 3. Dropdown Menu */}
      {isMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            padding: '0.625rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pilih Kategori Dataset
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '240px', overflowY: 'auto' }}>
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.5rem 0.625rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#16a34a' : '#0f172a' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>
                    {cat.desc}
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => triggerDownload('xlsx', activeCategory)}
              style={{
                flex: 1,
                padding: '0.45rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Unduh XLSX
            </button>
            <button
              type="button"
              onClick={() => triggerDownload('csv', activeCategory)}
              style={{
                flex: 1,
                padding: '0.45rem',
                backgroundColor: '#02482e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Unduh CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
