import React from 'react'
import type { StatusLogItem } from '@/lib/services/admin-pengajuan.service'

interface PengajuanTimelineLogProps {
  logs: StatusLogItem[]
  loading?: boolean
}

export function PengajuanTimelineLog({ logs, loading }: PengajuanTimelineLogProps) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return { dot: '#f59e0b', bg: '#fef3c7', text: '#b45309' }
      case 'Sedang Magang':
      case 'Disetujui':
        return { dot: '#16a34a', bg: '#dcfce7', text: '#15803d' }
      case 'Selesai':
        return { dot: '#059669', bg: '#ecfdf5', text: '#047857' }
      case 'Ditolak':
        return { dot: '#dc2626', bg: '#fee2e2', text: '#b91c1c' }
      case 'Dibatalkan':
        return { dot: '#64748b', bg: '#f1f5f9', text: '#475569' }
      default:
        return { dot: '#16a34a', bg: '#dcfce7', text: '#15803d' }
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        padding: '1.25rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '13px', fontWeight: 600, color: '#111827' }}>
        Riwayat status &amp; audit trail
      </h3>

      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: '12px', padding: '1rem 0', textAlign: 'center' }}>
          Memuat riwayat log...
        </div>
      ) : logs.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '12px', padding: '1rem 0', textAlign: 'center' }}>
          Belum ada catatan riwayat perubahan status.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '1.25rem' }}>
          {/* Vertical line behind dots */}
          <div
            style={{
              position: 'absolute',
              left: '6px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              backgroundColor: '#e5e7eb',
            }}
          />

          {logs.map((log, idx) => {
            const color = getStatusColor(log.status)
            return (
              <div
                key={log.id || idx}
                style={{
                  position: 'relative',
                  paddingBottom: idx === logs.length - 1 ? '0' : '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                {/* Timeline Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.25rem',
                    top: '3px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: `3px solid ${color.dot}`,
                    zIndex: 2,
                  }}
                />

                {/* Status Badge & Timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: color.bg,
                      color: color.text,
                    }}
                  >
                    {log.status}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {formatDate(log.created_at)}
                  </span>
                </div>

                {/* Catatan / Alasan */}
                {log.catatan && (
                  <p
                    style={{
                      margin: '0.125rem 0 0 0',
                      fontSize: '12px',
                      color: '#4b5563',
                      lineHeight: 1.4,
                      backgroundColor: '#f8fafc',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    {log.catatan}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
