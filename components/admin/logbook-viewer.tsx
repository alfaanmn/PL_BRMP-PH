'use client'

import React, { useState, useEffect } from 'react'
import { FileTextIcon, LoaderIcon, EyeIcon } from '@/components/ui/admin-icons'

interface LogbookItem {
  id: string
  minggu_ke: number
  periode_mulai: string
  periode_selesai: string
  file_name: string
  file_size: number
  mime_type: string
  catatan?: string | null
  created_at: string
  updated_at: string
}

interface WeekRow {
  minggu_ke: number
  periode_mulai: string
  periode_selesai: string
  is_current: boolean
  is_future: boolean
  is_past: boolean
  logbook: LogbookItem | null
}

interface LogbookViewerProps {
  pengajuanId: number | string
}

export function LogbookViewer({ pengajuanId }: LogbookViewerProps) {
  const [weeks, setWeeks] = useState<WeekRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalWeeks, setTotalWeeks] = useState(0)

  const fetchLogbooks = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const res = await fetch(`/api/admin/logbook?pengajuan_id=${pengajuanId}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat daftar logbook.')
      }
      setWeeks(data.weeks || [])
      setUploadedCount(data.uploadedCount || 0)
      setTotalWeeks(data.totalWeeks || 0)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat memuat logbook.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogbooks()
  }, [pengajuanId])

  const handleOpenDoc = async (logbookId: string) => {
    try {
      setOpeningId(logbookId)
      const res = await fetch(`/api/logbook/signed-url?id=${logbookId}`)
      const data = await res.json()
      if (!res.ok || !data.success || !data.signedUrl) {
        throw new Error(data.error || 'Gagal membuat URL akses.')
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuka berkas logbook.'
      alert(msg)
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '1.25rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
            }}
          >
            <FileTextIcon width={18} height={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Rekapitulasi Logbook Mingguan
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Daftar pelaporan berkas kegiatan peserta per minggu. Akses berkas via Signed URL (60 detik).
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: uploadedCount === totalWeeks && totalWeeks > 0 ? '#dcfce7' : '#f1f5f9',
            color: uploadedCount === totalWeeks && totalWeeks > 0 ? '#15803d' : '#475569',
            border: '1px solid #cbd5e1',
          }}
        >
          {uploadedCount} dari {totalWeeks} Minggu Terunggah
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.5rem', color: '#64748b' }}>
          <LoaderIcon width={18} height={18} />
          <span style={{ fontSize: '0.875rem' }}>Memuat rekap logbook...</span>
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.8125rem' }}>
          {errorMsg}
        </div>
      ) : weeks.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
          Belum ada jadwal minggu magang yang terdaftar.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Minggu</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Periode</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Nama Berkas</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Ukuran</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Waktu Unggah</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Catatan</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((row) => {
                const lb = row.logbook
                return (
                  <tr key={row.minggu_ke} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>
                      Minggu {row.minggu_ke}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {row.periode_mulai} s/d {row.periode_selesai}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      {lb ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', backgroundColor: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          Terunggah
                        </span>
                      ) : row.is_future ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', backgroundColor: '#f8fafc', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          Mendatang
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#b45309', backgroundColor: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          Belum Diunggah
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#0f172a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lb ? lb.file_name : '-'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {lb ? `${(lb.file_size / 1024).toFixed(0)} KB` : '-'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {lb ? new Date(lb.updated_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#475569', maxWidth: '220px' }}>
                      {lb?.catatan ? lb.catatan : '-'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                      {lb ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDoc(lb.id)}
                          disabled={openingId === lb.id}
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#2563eb',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {openingId === lb.id ? <LoaderIcon width={12} height={12} /> : <EyeIcon width={12} height={12} />}
                          Lihat
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
