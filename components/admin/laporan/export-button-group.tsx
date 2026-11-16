'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DownloadIcon, LoaderIcon } from '@/components/ui/admin-icons'
import type { ExportDatasetCategory, ExportFormat, LaporanFilterParams } from '@/types/laporan.types'
import { exportLaporanPackageToDoc } from '@/lib/utils/laporan-doc-generator'

interface ExportButtonGroupProps {
  filterParams: LaporanFilterParams
  totalCount?: number
  totalRowCount?: number
  onExportStart?: () => void
  onExportSuccess?: (message: string) => void
  onExportError?: (error: string) => void
}

export function ExportButtonGroup({
  filterParams,
  totalCount,
  totalRowCount,
  onExportStart,
  onExportSuccess,
  onExportError,
}: ExportButtonGroupProps) {
  const effectiveCount = totalCount ?? totalRowCount
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
    {
      id: 'all',
      label: 'Laporan Lengkap (Semua Data / All)',
      desc: 'Satu dokumen lengkap memuat seluruh tabel (Pengajuan, Peserta, Bidang, Pembimbing, Status, SKM)',
    },
    {
      id: 'pengajuan',
      label: 'Data Pengajuan Magang',
      desc: 'Rincian public_id, instansi, status, nomor surat & periode',
    },
    {
      id: 'peserta',
      label: 'Rekap Peserta & Anggota',
      desc: 'Daftar ketua dan seluruh anggota kelompok magang',
    },
    {
      id: 'bidang',
      label: 'Rekap Bidang Magang',
      desc: 'Kuota maksimal, peserta aktif, dan sisa slot per bidang',
    },
    {
      id: 'pembimbing',
      label: 'Rekap Pembimbing Lapangan',
      desc: 'Kapasitas kuota, bimbingan aktif, dan sisa kapasitas',
    },
    {
      id: 'status',
      label: 'Distribusi Status Pengajuan',
      desc: 'Agregasi total pengajuan dan peserta per status',
    },
    {
      id: 'skm',
      label: 'Rekapitulasi Hasil SKM',
      desc: 'Skor butir pertanyaan dan masukan kualitatif responden',
    },
  ]

  const triggerDownload = async (format: ExportFormat, category: ExportDatasetCategory) => {
    setIsMenuOpen(false)
    setExporting(true)
    onExportStart?.()

    try {
      const params = new URLSearchParams()
      params.set('category', category)

      if (filterParams.status && filterParams.status !== 'semua') params.set('status', filterParams.status)
      if (filterParams.bidangId && filterParams.bidangId !== 'semua') params.set('bidangId', String(filterParams.bidangId))
      if (filterParams.pembimbingId && filterParams.pembimbingId !== 'semua') params.set('pembimbingId', String(filterParams.pembimbingId))
      if (filterParams.startDate) params.set('startDate', filterParams.startDate)
      if (filterParams.endDate) params.set('endDate', filterParams.endDate)
      if (filterParams.search) params.set('search', filterParams.search)

      if (format === 'pdf' || format === 'docx') {
        // Ambil data JSON terverifikasi dari server-side API
        params.set('format', 'json')
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
            // ignore parsing
          }
          throw new Error(errMessage)
        }

        const resJson = await response.json()
        const exportPkg = resJson.data

        if (!exportPkg) {
          throw new Error('Data laporan kosong atau tidak tersedia.')
        }

        // Render PDF atau Word dokumen resmi secara client-side
        await exportLaporanPackageToDoc(exportPkg, category, format)
        onExportSuccess?.(`Ekspor berkas ${format.toUpperCase()} berhasil diunduh.`)
      } else {
        // Format Excel (.xlsx) atau CSV (.csv) via streaming response dari server
        params.set('format', format)
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
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengekspor laporan.'
      onExportError?.(msg)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={menuRef}>
      {/* Tombol Dropdown Pilihan Ekspor Terpadu */}
      <button
        type="button"
        disabled={exporting}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        title="Pilihan Ekspor Laporan & Rekapitulasi Data"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.55rem 1rem',
          backgroundColor: exporting ? '#94a3b8' : '#16a34a',
          color: '#ffffff',
          borderRadius: '8px',
          border: 'none',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: exporting ? 'not-allowed' : 'pointer',
          boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
          transition: 'all 0.15s ease',
        }}
      >
        {exporting ? (
          <LoaderIcon width={16} height={16} className="animate-spin" />
        ) : (
          <DownloadIcon width={16} height={16} />
        )}
        <span>{exporting ? 'Mengekspor...' : 'Pilihan Ekspor'}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 3. Panel Menu Dropdown Pilihan Kategori & 4 Format Berkas */}
      {isMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            width: '360px',
            maxWidth: '90vw',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            zIndex: 50,
            padding: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Header & Aksi Cepat Ekspor Semua */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pilih Kategori Dataset
            </span>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: activeCategory === 'all' ? '#16a34a' : '#64748b',
                backgroundColor: activeCategory === 'all' ? '#ecfdf5' : '#f1f5f9',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Semua (All)
            </button>
          </div>

          {/* Daftar Kategori Dataset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '220px', overflowY: 'auto' }}>
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
                  <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                    {cat.desc}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Tombol Pilihan 4 Format Berkas */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Unduh Format ({activeCategory === 'all' ? 'Semua Data' : 'Kategori Terpilih'}):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => triggerDownload('xlsx', activeCategory)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>Unduh XLSX</span>
              </button>
              <button
                type="button"
                onClick={() => triggerDownload('csv', activeCategory)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>Unduh CSV</span>
              </button>
              <button
                type="button"
                onClick={() => triggerDownload('pdf', activeCategory)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>Unduh PDF</span>
              </button>
              <button
                type="button"
                onClick={() => triggerDownload('docx', activeCategory)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>Unduh Word</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
