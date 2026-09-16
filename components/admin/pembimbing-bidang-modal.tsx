'use client'

import React, { useState, useEffect } from 'react'
import {
  AdminPembimbingListItem,
  adminPembimbingService,
} from '@/lib/services/admin-pembimbing.service'
import {
  CloseIcon,
  LoaderIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LayersIcon,
} from '@/components/ui/admin-icons'

interface PembimbingBidangModalProps {
  isOpen: boolean
  pembimbing: AdminPembimbingListItem | null
  onClose: () => void
  onSuccess: () => void
}

export function PembimbingBidangModal({ isOpen, pembimbing, onClose, onSuccess }: PembimbingBidangModalProps) {
  const [availableBidangs, setAvailableBidangs] = useState<
    Array<{ id: number | string; nama: string; kuota: number }>
  >([])
  const [selectedBidangId, setSelectedBidangId] = useState<string>('')
  const [loadingList, setLoadingList] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && pembimbing) {
      setErrorMsg(null)
      setSuccessMsg(null)
      setSelectedBidangId('')
      loadAvailableOptions()
    }
  }, [isOpen, pembimbing])

  const loadAvailableOptions = async () => {
    setLoadingList(true)
    try {
      const res = await adminPembimbingService.getAvailableBidangs()
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setAvailableBidangs(res.data)
      }
    } catch {
      setErrorMsg('Gagal memuat daftar bidang.')
    } finally {
      setLoadingList(false)
    }
  }

  if (!isOpen || !pembimbing) return null

  // Filter out bidangs that are already assigned and active for this mentor
  const assignedBidangIds = new Set(
    pembimbing.bidang_list.filter((b) => b.is_active).map((b) => String(b.bidang_id))
  )
  const unassignedOptions = availableBidangs.filter((b) => !assignedBidangIds.has(String(b.id)))

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBidangId) return

    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await adminPembimbingService.assignBidang(pembimbing.id, selectedBidangId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Bidang berhasil ditugaskan ke pembimbing.')
        setSelectedBidangId('')
        onSuccess()
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async (assignmentId: number | string, namaBidang: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin melepaskan bidang "${namaBidang}" dari pembimbing ini?`)) {
      return
    }

    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await adminPembimbingService.removeBidangAssignment(assignmentId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg(`Penugasan bidang "${namaBidang}" berhasil dilepaskan.`)
        onSuccess()
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal melepaskan penugasan.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ color: '#15803d' }}>
                <LayersIcon width={16} height={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                Penugasan Bidang Magang
              </h3>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Pembimbing: <strong style={{ color: '#334155' }}>{pembimbing.nama}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={actionLoading}
            style={{
              padding: '0.35rem',
              color: '#94a3b8',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '12px',
              }}
            >
              <div style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }}>
                <AlertCircleIcon width={14} height={14} />
              </div>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '12px',
              }}
            >
              <div style={{ color: '#15803d', flexShrink: 0, marginTop: '2px' }}>
                <CheckCircleIcon width={14} height={14} />
              </div>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Assign Bidang Baru */}
          <form
            onSubmit={handleAssign}
            style={{
              backgroundColor: '#f8fafc',
              padding: '0.875rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Tugaskan Bidang Tambahan
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedBidangId}
                onChange={(e) => setSelectedBidangId(e.target.value)}
                disabled={loadingList || actionLoading || unassignedOptions.length === 0}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.65rem',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="">
                  {loadingList
                    ? 'Memuat daftar bidang...'
                    : unassignedOptions.length === 0
                    ? 'Semua bidang sudah ditugaskan'
                    : '-- Pilih Bidang Magang --'}
                </option>
                {unassignedOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama} (Kuota: {b.kuota})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedBidangId || actionLoading}
                style={{
                  padding: '0.45rem 0.875rem',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#ffffff',
                  backgroundColor: selectedBidangId ? '#15803d' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedBidangId ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  flexShrink: 0,
                }}
              >
                {actionLoading ? <LoaderIcon width={13} height={13} /> : <PlusIcon width={13} height={13} />}
                <span>Tugaskan</span>
              </button>
            </div>
          </form>

          {/* List Bidang Saat Ini */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Daftar Bidang yang Ditugaskan
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Total: {pembimbing.bidang_list.filter((b) => b.is_active).length} Bidang
              </span>
            </div>

            {pembimbing.bidang_list.filter((b) => b.is_active).length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1.75rem 1rem',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  fontSize: '12px',
                }}
              >
                Pembimbing ini belum ditugaskan ke bidang magang manapun.
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                }}
              >
                {pembimbing.bidang_list
                  .filter((b) => b.is_active)
                  .map((b, idx) => (
                    <div
                      key={b.assignment_id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: idx === pembimbing.bidang_list.filter((x) => x.is_active).length - 1 ? 'none' : '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{b.nama}</p>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '11px', color: '#64748b' }}>
                          Kapasitas Kuota Bidang: {b.kuota ?? '-'} Peserta
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(b.assignment_id, b.nama)}
                        disabled={actionLoading}
                        title="Lepaskan Bidang"
                        style={{
                          padding: '0.35rem 0.5rem',
                          color: '#dc2626',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <TrashIcon width={13} height={13} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.4rem 0.875rem',
              fontSize: '12px',
              fontWeight: 500,
              color: '#334155',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
