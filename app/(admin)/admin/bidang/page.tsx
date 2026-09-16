'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AdminBidangListItem, adminBidangService } from '@/lib/services/admin-bidang.service'
import { BidangFormModal } from '@/components/admin/bidang-form-modal'
import { BidangPembimbingModal } from '@/components/admin/bidang-pembimbing-modal'
import {
  SearchIcon,
  PlusIcon,
  LayersIcon,
  UsersIcon,
  EditIcon,
  PowerIcon,
  RefreshIcon,
  AlertCircleIcon,
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from '@/components/ui/admin-icons'

export default function AdminBidangPage() {
  const [bidangs, setBidangs] = useState<AdminBidangListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedBidangForEdit, setSelectedBidangForEdit] = useState<AdminBidangListItem | null>(null)

  const [isPembimbingModalOpen, setIsPembimbingModalOpen] = useState(false)
  const [selectedBidangForPembimbing, setSelectedBidangForPembimbing] = useState<AdminBidangListItem | null>(null)

  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null)
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message })
    setTimeout(() => {
      setFeedbackToast(null)
    }, 4000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await adminBidangService.getBidangList({
        search,
        status: statusFilter,
      })
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setBidangs(res.data)
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat daftar bidang.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData()
    }, 250)
    return () => clearTimeout(timeout)
  }, [loadData])

  const handleToggleStatus = async (bidang: AdminBidangListItem) => {
    const targetStatus = !bidang.is_active
    const confirmText = targetStatus
      ? `Aktifkan bidang "${bidang.nama}" agar dapat dipilih oleh pendaftar magang?`
      : `Nonaktifkan bidang "${bidang.nama}"? Pendaftar baru tidak akan dapat memilih bidang ini.`

    if (!window.confirm(confirmText)) return

    setActionLoadingId(bidang.id)
    try {
      const res = await adminBidangService.toggleStatus(bidang.id, targetStatus)
      if (res.error) {
        showToast('error', res.error)
      } else {
        showToast(
          'success',
          `Bidang "${bidang.nama}" berhasil ${targetStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
        )
        loadData()
      }
    } catch {
      showToast('error', 'Gagal memperbarui status bidang.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Stats
  const totalBidang = bidangs.length
  const activeBidang = bidangs.filter((b) => b.is_active).length
  const totalKuota = bidangs.reduce((acc, b) => acc + (b.kuota || 0), 0)
  const totalTerisi = bidangs.reduce((acc, b) => acc + (b.terisi || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px' }}>
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: feedbackToast.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircleIcon width={16} height={16} />
          ) : (
            <AlertCircleIcon width={16} height={16} />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              Kelola Bidang Magang
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              Master Data
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Kelola unit kerja, kapasitas kuota peserta, deskripsi penempatan, dan penugasan pembimbing lapangan.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedBidangForEdit(null)
            setIsFormModalOpen(true)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#15803d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <PlusIcon width={15} height={15} />
          <span>Tambah Bidang</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d',
            }}
          >
            <LayersIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Total Bidang</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{totalBidang}</p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <ShieldCheckIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Bidang Aktif</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{activeBidang}</p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <UsersIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Total Kuota</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{totalKuota} Slot</p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
            }}
          >
            <UserCheckIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Peserta Terisi</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{totalTerisi} Peserta</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '0.875rem 1rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '360px' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <SearchIcon width={15} height={15} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama bidang atau deskripsi..."
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'all' ? '#15803d' : '#f1f5f9',
              color: statusFilter === 'all' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            Semua ({totalBidang})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'active' ? '#15803d' : '#f1f5f9',
              color: statusFilter === 'active' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            Aktif ({bidangs.filter((b) => b.is_active).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'inactive' ? '#15803d' : '#f1f5f9',
              color: statusFilter === 'inactive' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            Nonaktif ({bidangs.filter((b) => !b.is_active).length})
          </button>

          <button
            onClick={() => loadData()}
            disabled={loading}
            title="Muat ulang data"
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              cursor: 'pointer',
              marginLeft: '0.25rem',
            }}
          >
            <RefreshIcon width={14} height={14} />
          </button>
        </div>
      </div>

      {/* Main List Container (12px rounded single container) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {loading ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#15803d' }}>
              <LoaderIcon width={24} height={24} />
            </div>
            Memuat master bidang magang...
          </div>
        ) : errorMsg ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <AlertCircleIcon width={28} height={28} />
            </div>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px', fontWeight: 500 }}>{errorMsg}</p>
            <button
              onClick={() => loadData()}
              style={{
                marginTop: '0.75rem',
                padding: '0.4rem 0.875rem',
                fontSize: '12px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : bidangs.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#cbd5e1' }}>
              <LayersIcon width={32} height={32} />
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#475569' }}>
              Tidak ada data bidang yang ditemukan.
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '11px' }}>
              Silakan sesuaikan filter pencarian atau tambah bidang baru.
            </p>
          </div>
        ) : (
          <div>
            {bidangs.map((bidang, idx) => {
              const kuota = bidang.kuota || 0
              const terisi = bidang.terisi || 0
              const sisa = bidang.sisa_kuota
              const persentase = kuota > 0 ? Math.min(100, Math.round((terisi / kuota) * 100)) : 0
              const isLoadingAction = actionLoadingId === bidang.id

              return (
                <div
                  key={bidang.id}
                  style={{
                    padding: '1.125rem 1.25rem',
                    borderBottom: idx === bidangs.length - 1 ? 'none' : '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  {/* Left Column */}
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                        {bidang.nama}
                      </h3>
                      {bidang.is_active ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <CheckCircleIcon width={10} height={10} />
                          Aktif
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <XCircleIcon width={10} height={10} />
                          Nonaktif
                        </span>
                      )}
                      {bidang.jenjang && (
                        <span
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '6px',
                          }}
                        >
                          {bidang.jenjang}
                        </span>
                      )}
                    </div>

                    {bidang.deskripsi && (
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                        {bidang.deskripsi}
                      </p>
                    )}

                    {/* Metadata & Kuota Meter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>
                          Kuota: <strong style={{ color: '#0f172a' }}>{kuota}</strong> (Terisi:{' '}
                          <strong style={{ color: '#15803d' }}>{terisi}</strong> | Sisa:{' '}
                          <strong style={{ color: '#d97706' }}>{sisa}</strong>)
                        </span>
                        <div
                          style={{
                            width: '70px',
                            height: '6px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${persentase}%`,
                              height: '100%',
                              backgroundColor: persentase >= 100 ? '#ef4444' : persentase >= 80 ? '#f59e0b' : '#15803d',
                              borderRadius: '9999px',
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBidangForPembimbing(bidang)
                          setIsPembimbingModalOpen(true)
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <UsersIcon width={12} height={12} />
                        <span>{bidang.pembimbing_count} Pembimbing Terkait</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBidangForPembimbing(bidang)
                        setIsPembimbingModalOpen(true)
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <UsersIcon width={13} height={13} />
                      <span>Pembimbing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBidangForEdit(bidang)
                        setIsFormModalOpen(true)
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <EditIcon width={13} height={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(bidang)}
                      disabled={isLoadingAction}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: bidang.is_active ? '#fffbeb' : '#f0fdf4',
                        color: bidang.is_active ? '#b45309' : '#15803d',
                        border: bidang.is_active ? '1px solid #fde68a' : '1px solid #bbf7d0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {isLoadingAction ? (
                        <LoaderIcon width={13} height={13} />
                      ) : (
                        <PowerIcon width={13} height={13} />
                      )}
                      <span>{bidang.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal (Add / Edit) */}
      <BidangFormModal
        isOpen={isFormModalOpen}
        bidangToEdit={selectedBidangForEdit}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedBidangForEdit(null)
        }}
        onSuccess={() => {
          showToast(
            'success',
            selectedBidangForEdit ? 'Data bidang berhasil diperbarui.' : 'Bidang baru berhasil ditambahkan.'
          )
          loadData()
        }}
      />

      {/* Pembimbing Assignment Modal */}
      <BidangPembimbingModal
        isOpen={isPembimbingModalOpen}
        bidang={selectedBidangForPembimbing}
        onClose={() => {
          setIsPembimbingModalOpen(false)
          setSelectedBidangForPembimbing(null)
        }}
        onSuccess={() => {
          loadData()
        }}
      />
    </div>
  )
}
