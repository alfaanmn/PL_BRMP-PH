'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { LogbookViewer } from '@/components/admin/logbook-viewer'

export interface ParticipantLogbookSummary {
  id: number
  public_id: string
  nama_lengkap: string
  nim_nis: string
  asal_instansi: string
  jurusan: string
  bidang_nama: string
  status: string
  tanggal_mulai: string
  tanggal_selesai: string
  durasi_bulan: number
  total_weeks: number
  current_week: number
  uploaded_count: number
}

interface AdminLogbookClientProps {
  initialParticipants: ParticipantLogbookSummary[]
}

export function AdminLogbookClient({ initialParticipants }: AdminLogbookClientProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'semua' | 'Sedang Magang' | 'Terjadwal' | 'Selesai'>('semua')
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantLogbookSummary | null>(null)

  // Filter list
  const filteredList = useMemo(() => {
    return initialParticipants.filter((p) => {
      const matchSearch =
        search.trim() === '' ||
        p.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
        p.asal_instansi.toLowerCase().includes(search.toLowerCase()) ||
        p.bidang_nama.toLowerCase().includes(search.toLowerCase()) ||
        p.public_id.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'semua' || p.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [initialParticipants, search, statusFilter])

  // Stats
  const totalSedangMagang = initialParticipants.filter((p) => p.status === 'Sedang Magang').length
  const totalUploaded = initialParticipants.reduce((acc, curr) => acc + curr.uploaded_count, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header & Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Peserta Sedang Magang</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {totalSedangMagang}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aktif menjalankan program</span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Total Berkas Logbook</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {totalUploaded}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Laporan mingguan terunggah</span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Total Terdata</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
            {initialParticipants.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Peserta magang terdaftar</span>
        </div>
      </div>

      {/* 2. Filter & Pencarian */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {/* Search Input */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama peserta, instansi, atau unit kerja..."
            style={{
              width: '100%',
              padding: '0.5rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Status Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="semua">Semua Status</option>
            <option value="Sedang Magang">Sedang Magang</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* 3. Tabel Daftar Peserta */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Peserta</th>
                <th style={{ padding: '0.875rem 1rem' }}>Unit / Bidang</th>
                <th style={{ padding: '0.875rem 1rem' }}>Periode Magang</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem' }}>Progres Logbook</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    Tidak ada peserta magang yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((p) => {
                  const progressPct = p.total_weeks > 0 ? Math.min(100, Math.round((p.uploaded_count / p.total_weeks) * 100)) : 0

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      {/* Peserta */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.nama_lengkap}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {p.asal_instansi} • {p.jurusan}
                        </div>
                      </td>

                      {/* Unit / Bidang */}
                      <td style={{ padding: '0.875rem 1rem', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>{p.bidang_nama}</div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{p.public_id}</span>
                      </td>

                      {/* Periode */}
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#475569' }}>
                        <div>{p.tanggal_mulai} s/d {p.tanggal_selesai}</div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.durasi_bulan} Bulan ({p.total_weeks} Minggu)</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor:
                            p.status === 'Sedang Magang' ? '#dcfce7' :
                            p.status === 'Selesai' ? '#e0e7ff' :
                            p.status === 'Terjadwal' ? '#fef3c7' : '#f1f5f9',
                          color:
                            p.status === 'Sedang Magang' ? '#15803d' :
                            p.status === 'Selesai' ? '#4338ca' :
                            p.status === 'Terjadwal' ? '#92400e' : '#475569',
                          border:
                            p.status === 'Sedang Magang' ? '1px solid #bbf7d0' :
                            p.status === 'Selesai' ? '1px solid #c7d2fe' :
                            p.status === 'Terjadwal' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                        }}>
                          {p.status}
                        </span>
                      </td>

                      {/* Progres Logbook */}
                      <td style={{ padding: '0.875rem 1rem', minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          <span>{p.uploaded_count} / {p.total_weeks} Minggu</span>
                          <span style={{ color: progressPct === 100 ? '#16a34a' : '#64748b' }}>{progressPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            backgroundColor: progressPct === 100 ? '#16a34a' : '#2563eb',
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedParticipant(p)}
                          style={{
                            padding: '0.45rem 0.875rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            backgroundColor: '#16a34a',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
                          }}
                        >
                          <span>📖</span>
                          <span>Periksa</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Viewer Logbook Peserta */}
      {selectedParticipant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '840px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                  <span style={{ fontSize: '18px' }}>📖</span>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Logbook Peserta: {selectedParticipant.nama_lengkap}
                  </h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                  {selectedParticipant.asal_instansi} • {selectedParticipant.bidang_nama} (#{selectedParticipant.public_id})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Reuse LogbookViewer Component */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <LogbookViewer pengajuanId={selectedParticipant.id} />
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '0.875rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
            }}>
              <Link
                href={`/admin/riwayat-pengajuan/${selectedParticipant.public_id}`}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1A6FC4',
                  textDecoration: 'none',
                }}
              >
                Lihat Detail Pengajuan Lengkap →
              </Link>

              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
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

