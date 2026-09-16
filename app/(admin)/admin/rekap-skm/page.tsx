'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { adminSKMService } from '@/lib/services/admin-skm.service'
import type {
  AdminSKMStats,
  AdminSKMTextItem,
  AdminSKMSubmissionItem,
  AdminSKMSubmissionDetail,
} from '@/types/admin-skm.types'
import {
  SearchIcon,
  LoaderIcon,
  CloseIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  DownloadIcon,
  ChartBarIcon,
} from '@/components/ui/admin-icons'

export default function AdminRekapSKMPage() {
  // Stats & Analysis state
  const [stats, setStats] = useState<AdminSKMStats>({
    totalResponden: 0,
    totalJawabanPilihan: 0,
    rataRataKeseluruhan: null,
    tingkatKepuasan: null,
    unsurStats: [],
  })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [periodFilter, setPeriodFilter] = useState<'all' | '30days' | 'this_month' | 'this_year'>('all')

  // Text Responses (Q14 & Q15) state
  const [textTab, setTextTab] = useState<'memuaskan' | 'saran'>('memuaskan')
  const [textList, setTextList] = useState<AdminSKMTextItem[]>([])
  const [textTotal, setTextTotal] = useState(0)
  const [textPage, setTextPage] = useState(1)
  const [textLoading, setTextLoading] = useState(false)
  const textLimit = 6

  // Submissions List state
  const [submissions, setSubmissions] = useState<AdminSKMSubmissionItem[]>([])
  const [submissionTotal, setSubmissionTotal] = useState(0)
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionSearch, setSubmissionSearch] = useState('')
  const [submissionLoading, setSubmissionLoading] = useState(false)
  const submissionLimit = 10

  // Modal Detail Responden state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null)
  const [detailData, setDetailData] = useState<AdminSKMSubmissionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Export state
  const [exporting, setExporting] = useState(false)
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message })
    setTimeout(() => {
      setFeedbackToast(null)
    }, 4000)
  }

  // 1. Load Overall Stats
  const loadStats = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await adminSKMService.getRekapStats(periodFilter)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setStats(res.data)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat statistik SKM.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [periodFilter])

  // 2. Load Text Responses
  const loadTextResponses = useCallback(async () => {
    setTextLoading(true)
    try {
      const res = await adminSKMService.getTextResponses({
        type: textTab,
        page: textPage,
        limit: textLimit,
        periodFilter,
      })
      if (res.data) {
        setTextList(res.data)
        setTextTotal(res.totalCount)
      }
    } catch (err) {
      console.warn('Gagal memuat masukan teks:', err)
    } finally {
      setTextLoading(false)
    }
  }, [textTab, textPage, periodFilter])

  // 3. Load Submissions List
  const loadSubmissions = useCallback(async () => {
    setSubmissionLoading(true)
    try {
      const res = await adminSKMService.getSubmissionsList({
        page: submissionPage,
        limit: submissionLimit,
        search: submissionSearch,
        periodFilter,
      })
      if (res.data) {
        setSubmissions(res.data)
        setSubmissionTotal(res.totalCount)
      }
    } catch (err) {
      console.warn('Gagal memuat riwayat submission:', err)
    } finally {
      setSubmissionLoading(false)
    }
  }, [submissionPage, submissionSearch, periodFilter])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadTextResponses()
  }, [loadTextResponses])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  // Open Detail Modal
  const handleOpenDetail = async (pengajuanId: number) => {
    setSelectedSubmissionId(pengajuanId)
    setIsDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await adminSKMService.getSubmissionDetail(pengajuanId)
      if (res.data) {
        setDetailData(res.data)
      } else {
        showToast('error', res.error || 'Gagal memuat rincian responden.')
        setIsDetailOpen(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      showToast('error', msg)
      setIsDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  // Handler Export CSV
  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const res = await adminSKMService.generateCSVData(periodFilter)
      if (res.csvString) {
        const blob = new Blob([res.csvString], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `rekap_skm_brmp_${periodFilter}_${Date.now()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        showToast('success', 'Data rekapitulasi SKM berhasil diekspor ke CSV.')
      } else {
        showToast('error', res.error || 'Gagal menghasilkan berkas CSV.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat ekspor CSV.'
      showToast('error', msg)
    } finally {
      setExporting(false)
    }
  }

  const totalTextPages = Math.ceil(textTotal / textLimit) || 1
  const totalSubmissionPages = Math.ceil(submissionTotal / submissionLimit) || 1

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .stat-card-custom {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.875rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .dist-bar-seg {
          height: 8px;
          transition: width 0.3s ease;
        }
        .text-response-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .text-response-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }
      `}</style>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: feedbackToast.type === 'success' ? '#02482e' : '#991b1b',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircleIcon width={20} height={20} className="text-emerald-300" />
          ) : (
            <AlertCircleIcon width={20} height={20} className="text-red-300" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.375rem 0', letterSpacing: '-0.02em' }}>
            Rekapitulasi hasil SKM
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Dashboard analisis kepuasan masyarakat
          </p>
        </div>

        {/* Filter Periode & Tombol Ekspor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value as any)
              setTextPage(1)
              setSubmissionPage(1)
            }}
            style={{
              padding: '0.45rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Semua periode</option>
            <option value="30days">30 hari terakhir</option>
            <option value="this_month">Bulan ini</option>
            <option value="this_year">Tahun ini</option>
          </select>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting || stats.totalResponden === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1rem',
              backgroundColor: stats.totalResponden === 0 ? '#94a3b8' : '#16a34a',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: stats.totalResponden === 0 || exporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <DownloadIcon width={16} height={16} />
            <span>{exporting ? 'Mengekspor...' : 'Ekspor CSV'}</span>
          </button>
        </div>
      </div>

      {/* 1. Summary Cards (4 Metrik Utama dalam Sentence Case, 20px numbers) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* Total Responden */}
        <div className="stat-card-custom">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Total responden
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>
            {stats.totalResponden}
          </span>
        </div>

        {/* Nilai Rata-rata SKM */}
        <div className="stat-card-custom">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Nilai rata-rata
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>
              {stats.rataRataKeseluruhan !== null ? stats.rataRataKeseluruhan.toFixed(2) : '-'}
            </span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              / 4.00
            </span>
          </div>
        </div>

        {/* Tingkat Kepuasan */}
        <div className="stat-card-custom">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Tingkat kepuasan
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>
            {stats.tingkatKepuasan !== null ? `${stats.tingkatKepuasan}%` : '-'}
          </span>
        </div>

        {/* Total Jawaban Valid */}
        <div className="stat-card-custom">
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Jawaban valid
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>
            {stats.totalJawabanPilihan}
          </span>
        </div>
      </div>

      {/* 2. Breakdown Skor per Unsur Pelayanan (Q1–Q13) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Analisis nilai per unsur pelayanan
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              Distribusi skor 1-4 (Q1-Q13)
            </p>
          </div>

          {/* Legend 1 Keluarga Warna Hijau */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#dcfce7', borderRadius: '2px' }} /> Skor 1
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#86efac', borderRadius: '2px' }} /> Skor 2
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '2px' }} /> Skor 3
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#16a34a', borderRadius: '2px' }} /> Skor 4
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <LoaderIcon width={24} height={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Memproses data rekapitulasi unsur...</p>
          </div>
        ) : stats.totalResponden === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <ChartBarIcon width={28} height={28} className="text-slate-400 mx-auto mb-2" />
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Belum ada data SKM yang masuk
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              Hasil akan tampil otomatis setelah peserta mengisi survei
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '50px', textAlign: 'center' }}>No</th>
                  <th style={{ padding: '0.75rem 1rem', width: '180px' }}>Unsur pelayanan</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Pertanyaan</th>
                  <th style={{ padding: '0.75rem 1rem', width: '100px', textAlign: 'center' }}>Respon</th>
                  <th style={{ padding: '0.75rem 1rem', width: '110px', textAlign: 'center' }}>Rata-rata</th>
                  <th style={{ padding: '0.75rem 1rem', width: '260px' }}>Distribusi jawaban (1–4)</th>
                </tr>
              </thead>
              <tbody>
                {stats.unsurStats.map((item) => (
                  <tr key={item.pertanyaanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                      {item.urutan}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#16a34a',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #bbf7d0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}>
                        {item.unsur}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#334155', fontWeight: 500 }}>
                      {item.pertanyaan}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                      {item.totalJawaban}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#02482e',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        {item.rataRata.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {item.totalJawaban > 0 ? (
                        <div>
                          {/* Segmented Distribution Bar (1 Keluarga Gradasi Hijau) */}
                          <div style={{
                            display: 'flex',
                            width: '100%',
                            height: '10px',
                            borderRadius: '5px',
                            overflow: 'hidden',
                            backgroundColor: '#f1f5f9',
                            marginBottom: '4px',
                          }}>
                            <div style={{ width: `${item.persentaseDistribusi.skor1}%`, backgroundColor: '#dcfce7' }} title={`Skor 1: ${item.distribusi.skor1} (${item.persentaseDistribusi.skor1}%)`} />
                            <div style={{ width: `${item.persentaseDistribusi.skor2}%`, backgroundColor: '#86efac' }} title={`Skor 2: ${item.distribusi.skor2} (${item.persentaseDistribusi.skor2}%)`} />
                            <div style={{ width: `${item.persentaseDistribusi.skor3}%`, backgroundColor: '#22c55e' }} title={`Skor 3: ${item.distribusi.skor3} (${item.persentaseDistribusi.skor3}%)`} />
                            <div style={{ width: `${item.persentaseDistribusi.skor4}%`, backgroundColor: '#16a34a' }} title={`Skor 4: ${item.distribusi.skor4} (${item.persentaseDistribusi.skor4}%)`} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>1: {item.distribusi.skor1}</span>
                            <span>2: {item.distribusi.skor2}</span>
                            <span>3: {item.distribusi.skor3}</span>
                            <span>4: {item.distribusi.skor4}</span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Belum ada data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Masukan & Umpan Balik Teks Bebas (Q14 & Q15 - Pill Tabs) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Umpan balik & masukan responden
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              Jawaban esai kualitatif dari peserta magang untuk evaluasi pelayanan
            </p>
          </div>

          {/* Pill Tab Selector */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              type="button"
              onClick={() => {
                setTextTab('memuaskan')
                setTextPage(1)
              }}
              style={{
                padding: '0.35rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: textTab === 'memuaskan' ? 600 : 500,
                backgroundColor: textTab === 'memuaskan' ? '#16a34a' : '#ffffff',
                color: textTab === 'memuaskan' ? '#ffffff' : '#64748b',
                border: textTab === 'memuaskan' ? '1px solid #16a34a' : '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Hal yang memuaskan
            </button>
            <button
              type="button"
              onClick={() => {
                setTextTab('saran')
                setTextPage(1)
              }}
              style={{
                padding: '0.35rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: textTab === 'saran' ? 600 : 500,
                backgroundColor: textTab === 'saran' ? '#16a34a' : '#ffffff',
                color: textTab === 'saran' ? '#ffffff' : '#64748b',
                border: textTab === 'saran' ? '1px solid #16a34a' : '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Saran & masukan
            </button>
          </div>
        </div>

        {textLoading ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <LoaderIcon width={24} height={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Memuat masukan teks responden...</p>
          </div>
        ) : textList.length === 0 ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Belum ada masukan untuk kategori ini</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {textList.map((item) => (
              <div key={item.id} className="text-response-card">
                <div style={{ fontSize: '0.875rem', color: '#0f172a', lineHeight: 1.5, fontStyle: 'italic' }}>
                  &ldquo;{item.teks}&rdquo;
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                  <div>
                    <strong style={{ color: '#334155' }}>{item.namaPemohon}</strong> ({item.asalInstansi})
                  </div>
                  <div>
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text Pagination */}
        {totalTextPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              disabled={textPage <= 1}
              onClick={() => setTextPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: textPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Sebelumnya
            </button>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Halaman {textPage} dari {totalTextPages}
            </span>
            <button
              disabled={textPage >= totalTextPages}
              onClick={() => setTextPage((p) => p + 1)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: textPage >= totalTextPages ? 'not-allowed' : 'pointer',
              }}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* 4. Tabel Daftar Responden SKM */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Daftar Pengisian Kuesioner Responden
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              Riwayat permohonan magang yang telah menyelesaikan survei SKM.
            </p>
          </div>

          {/* Search Bar Responden */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Cari pemohon / instansi..."
              value={submissionSearch}
              onChange={(e) => {
                setSubmissionSearch(e.target.value)
                setSubmissionPage(1)
              }}
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
            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <SearchIcon width={14} height={14} />
            </div>
          </div>
        </div>

        {submissionLoading ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <LoaderIcon width={24} height={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Memuat daftar responden...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Tidak ada data responden ditemukan.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '90px' }}>ID Permohonan</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Pemohon / Instansi</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bidang Magang</th>
                  <th style={{ padding: '0.75rem 1rem', width: '130px' }}>Tanggal Pengisian</th>
                  <th style={{ padding: '0.75rem 1rem', width: '110px', textAlign: 'center' }}>Rata-Rata Skor</th>
                  <th style={{ padding: '0.75rem 1rem', width: '100px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((row) => (
                  <tr key={row.pengajuanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                      #{row.pengajuanId}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.namaPemohon}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.asalInstansi || '-'}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#334155' }}>
                      {row.bidangNama}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#64748b' }}>
                      {new Date(row.tanggalPengisian).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#02482e',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        {row.rataRataSkor !== null ? `${row.rataRataSkor.toFixed(2)} / 4` : '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(row.pengajuanId)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#ffffff',
                          color: '#16a34a',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Lihat Rincian
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Submissions Pagination */}
        {totalSubmissionPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              disabled={submissionPage <= 1}
              onClick={() => setSubmissionPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: submissionPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Sebelumnya
            </button>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Halaman {submissionPage} dari {totalSubmissionPages}
            </span>
            <button
              disabled={submissionPage >= totalSubmissionPages}
              onClick={() => setSubmissionPage((p) => p + 1)}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: submissionPage >= totalSubmissionPages ? 'not-allowed' : 'pointer',
              }}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* 5. Modal Rincian Jawaban 15 Butir Responden */}
      {isDetailOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          boxSizing: 'border-box',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              backgroundColor: '#ffffff',
              zIndex: 10,
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.125rem 0' }}>
                  Rincian Jawaban SKM Responden #{selectedSubmissionId}
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Evaluasi kuesioner lengkap 15 butir pertanyaan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false)
                  setDetailData(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {detailLoading || !detailData ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: '#64748b' }}>
                  <LoaderIcon width={24} height={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>Memuat rincian jawaban...</p>
                </div>
              ) : (
                <>
                  {/* Info Pemohon Card */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.8125rem',
                  }}>
                    <div>
                      <div style={{ color: '#64748b' }}>Nama Pemohon:</div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{detailData.pengajuan.namaPemohon}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Asal Instansi:</div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{detailData.pengajuan.asalInstansi || '-'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Bidang Magang:</div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{detailData.pengajuan.bidangNama}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Rata-Rata Skor Q1–Q13:</div>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>
                        {detailData.rataRataSkor !== null ? `${detailData.rataRataSkor.toFixed(2)} / 4.00` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* 15 Answers List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {detailData.answers.map((ans) => (
                      <div
                        key={ans.pertanyaanId}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '0.875rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.375rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              backgroundColor: '#02482e',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {ans.urutan}
                            </span>
                            <div>
                              {ans.unsur && (
                                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, marginRight: '6px' }}>
                                  [{ans.unsur}]
                                </span>
                              )}
                              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a' }}>
                                {ans.pertanyaan}
                              </span>
                            </div>
                          </div>

                          {ans.tipe === 'Pilihan' && (
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#15803d',
                              backgroundColor: '#dcfce7',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}>
                              Skor {ans.skor}
                            </span>
                          )}
                        </div>

                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          color: '#334155',
                          marginLeft: '26px',
                        }}>
                          {ans.tipe === 'Pilihan' ? (
                            <span>Opsi: <strong>{ans.labelOpsi || `Skor ${ans.skor}`}</strong></span>
                          ) : (
                            <span style={{ fontStyle: 'italic' }}>
                              &ldquo;{ans.jawabanRaw || '(Tidak diisi)'}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
            }}>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false)
                  setDetailData(null)
                }}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
