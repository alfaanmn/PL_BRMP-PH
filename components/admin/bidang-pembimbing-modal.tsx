'use client'

import React, { useState, useEffect } from 'react'
import {
  AdminBidangListItem,
  adminBidangService,
} from '@/lib/services/admin-bidang.service'
import {
  CloseIcon,
  LoaderIcon,
  PlusIcon,
  TrashIcon,
  UserCheckIcon,
  AlertCircleIcon,
  UsersIcon,
} from '@/components/ui/admin-icons'

interface BidangPembimbingModalProps {
  isOpen: boolean
  bidang: AdminBidangListItem | null
  onClose: () => void
  onSuccess: () => void
}

export function BidangPembimbingModal({ isOpen, bidang, onClose, onSuccess }: BidangPembimbingModalProps) {
  const [availablePembimbings, setAvailablePembimbings] = useState<
    Array<{ id: number | string; nama: string; nip?: string | null; jabatan?: string | null; email?: string | null }>
  >([])
  const [selectedPembimbingId, setSelectedPembimbingId] = useState<string>('')
  const [loadingList, setLoadingList] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && bidang) {
      setErrorMsg(null)
      setSuccessMsg(null)
      setSelectedPembimbingId('')
      loadAvailableOptions()
    }
  }, [isOpen, bidang])

  const loadAvailableOptions = async () => {
    setLoadingList(true)
    try {
      const res = await adminBidangService.getAvailablePembimbings()
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setAvailablePembimbings(res.data)
      }
    } catch {
      setErrorMsg('Gagal memuat daftar pembimbing.')
    } finally {
      setLoadingList(false)
    }
  }

  if (!isOpen || !bidang) return null

  // Filter out pembimbings that are already assigned and active in this bidang
  const assignedPembimbingIds = new Set(
    bidang.pembimbing_list.filter((p) => p.is_active).map((p) => String(p.pembimbing_id))
  )
  const unassignedOptions = availablePembimbings.filter((p) => !assignedPembimbingIds.has(String(p.id)))

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPembimbingId) return

    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await adminBidangService.assignPembimbing(bidang.id, selectedPembimbingId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Pembimbing berhasil ditugaskan ke bidang ini.')
        setSelectedPembimbingId('')
        onSuccess()
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async (assignmentId: number | string, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin melepaskan ${nama} dari bidang ini?`)) {
      return
    }

    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await adminBidangService.removePembimbingAssignment(assignmentId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg(`Penugasan ${nama} berhasil dilepaskan.`)
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
                <UsersIcon width={16} height={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                Pembimbing Lapangan Terkait
              </h3>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Bidang: <strong style={{ color: '#334155' }}>{bidang.nama}</strong>
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
                <UserCheckIcon width={14} height={14} />
              </div>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Assign Pembimbing Baru */}
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
              Tugaskan Pembimbing ke Bidang Ini
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedPembimbingId}
                onChange={(e) => setSelectedPembimbingId(e.target.value)}
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
                    ? 'Memuat daftar pembimbing...'
                    : unassignedOptions.length === 0
                    ? 'Semua pembimbing sudah ditugaskan'
                    : '-- Pilih Pembimbing Lapangan --'}
                </option>
                {unassignedOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} {p.jabatan ? `(${p.jabatan})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedPembimbingId || actionLoading}
                style={{
                  padding: '0.45rem 0.875rem',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#ffffff',
                  backgroundColor: selectedPembimbingId ? '#15803d' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedPembimbingId ? 'pointer' : 'not-allowed',
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

          {/* List Pembimbing Saat Ini */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Daftar Pembimbing Aktif pada Bidang Ini
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Total: {bidang.pembimbing_list.filter((p) => p.is_active).length} Pembimbing
              </span>
            </div>

            {bidang.pembimbing_list.filter((p) => p.is_active).length === 0 ? (
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
                Belum ada pembimbing yang ditugaskan pada bidang ini.
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
                {bidang.pembimbing_list
                  .filter((p) => p.is_active)
                  .map((p, idx) => (
                    <div
                      key={p.assignment_id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: idx === bidang.pembimbing_list.filter((x) => x.is_active).length - 1 ? 'none' : '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{p.nama}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '11px', color: '#64748b' }}>
                          {p.nip && <span>NIP. {p.nip}</span>}
                          {p.jabatan && (
                            <>
                              <span>•</span>
                              <span>{p.jabatan}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(p.assignment_id, p.nama)}
                        disabled={actionLoading}
                        title="Lepaskan Penugasan"
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
