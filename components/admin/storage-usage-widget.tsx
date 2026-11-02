'use client'

import React, { useState, useEffect } from 'react'
import { LoaderIcon } from '@/components/ui/admin-icons'

interface StorageStats {
  totalLimitBytes: number
  totalUsedBytes: number
  percentUsed: number
  isWarning: boolean
  breakdown: {
    logbook: number
    dokumen: number
    sertifikat: number
  }
}

export function StorageUsageWidget() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/storage/stats')
        const data = await res.json()
        if (isMounted && data.success && data.data) {
          setStats(data.data)
        }
      } catch {
        // Fallback silent
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchStats()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
        <LoaderIcon width={14} height={14} />
        <span>Memuat kapasitas penyimpanan...</span>
      </div>
    )
  }

  if (!stats) return null

  const usedMB = (stats.totalUsedBytes / (1024 * 1024)).toFixed(1)
  const limitMB = (stats.totalLimitBytes / (1024 * 1024)).toFixed(0)

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: stats.isWarning ? '1px solid #fca5a5' : '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
            Kapasitas Penyimpanan Berkas (Supabase Storage Free Plan)
          </h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Akumulasi berkas logbook, surat pengantar, proposal, dan sertifikat.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: stats.isWarning ? '#dc2626' : '#0f172a' }}>
            {usedMB} MB
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}> / {limitMB} MB ({stats.percentUsed}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#f1f5f9',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, stats.percentUsed)}%`,
            height: '100%',
            backgroundColor: stats.isWarning ? '#ef4444' : '#16a34a',
            borderRadius: '9999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Breakdown Badges */}
      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
        <span>• Logbook: <strong>{(stats.breakdown.logbook / (1024 * 1024)).toFixed(1)} MB</strong></span>
        <span>• Berkas Pengajuan: <strong>{(stats.breakdown.dokumen / (1024 * 1024)).toFixed(1)} MB</strong></span>
        <span>• Sertifikat: <strong>{(stats.breakdown.sertifikat / (1024 * 1024)).toFixed(1)} MB</strong></span>
      </div>

      {stats.isWarning && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          ⚠️ Peringatan: Penggunaan storage telah melampaui 80% dari batas paket gratis (1 GB). Disarankan membersihkan berkas logbook pengajuan yang sudah berstatus "Selesai" untuk menghemat ruang.
        </div>
      )}
    </div>
  )
}
