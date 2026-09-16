'use client'

import React, { useState, useEffect } from 'react'
import {
  AdminBidangListItem,
  CreateBidangPayload,
  UpdateBidangPayload,
  adminBidangService,
} from '@/lib/services/admin-bidang.service'
import { CloseIcon, LoaderIcon, PlusIcon, SaveIcon, AlertCircleIcon } from '@/components/ui/admin-icons'

interface BidangFormModalProps {
  isOpen: boolean
  bidangToEdit: AdminBidangListItem | null
  onClose: () => void
  onSuccess: () => void
}

export function BidangFormModal({ isOpen, bidangToEdit, onClose, onSuccess }: BidangFormModalProps) {
  const isEdit = Boolean(bidangToEdit)

  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    kuota: 10,
    jenjang: '',
    persyaratan: '',
    tugas: '',
    is_active: true,
  })

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (bidangToEdit) {
      setFormData({
        nama: bidangToEdit.nama || '',
        deskripsi: bidangToEdit.deskripsi || '',
        kuota: bidangToEdit.kuota || 10,
        jenjang: bidangToEdit.jenjang || '',
        persyaratan: bidangToEdit.persyaratan || '',
        tugas: bidangToEdit.tugas || '',
        is_active: bidangToEdit.is_active ?? true,
      })
    } else {
      setFormData({
        nama: '',
        deskripsi: '',
        kuota: 10,
        jenjang: '',
        persyaratan: '',
        tugas: '',
        is_active: true,
      })
    }
    setErrorMsg(null)
  }, [bidangToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!formData.nama.trim()) {
      setErrorMsg('Nama bidang wajib diisi.')
      return
    }

    if (formData.kuota < 0) {
      setErrorMsg('Kuota tidak boleh kurang dari 0.')
      return
    }

    setLoading(true)

    try {
      if (isEdit && bidangToEdit) {
        const payload: UpdateBidangPayload = {
          nama: formData.nama.trim(),
          deskripsi: formData.deskripsi.trim() || null,
          kuota: Number(formData.kuota) || 0,
          jenjang: formData.jenjang.trim() || null,
          persyaratan: formData.persyaratan.trim() || null,
          tugas: formData.tugas.trim() || null,
          is_active: formData.is_active,
        }
        const res = await adminBidangService.updateBidang(bidangToEdit.id, payload)
        if (res.error) {
          setErrorMsg(res.error)
          setLoading(false)
          return
        }
      } else {
        const payload: CreateBidangPayload = {
          nama: formData.nama.trim(),
          deskripsi: formData.deskripsi.trim() || null,
          kuota: Number(formData.kuota) || 0,
          jenjang: formData.jenjang.trim() || null,
          persyaratan: formData.persyaratan.trim() || null,
          tugas: formData.tugas.trim() || null,
          is_active: formData.is_active,
        }
        const res = await adminBidangService.createBidang(payload)
        if (res.error) {
          setErrorMsg(res.error)
          setLoading(false)
          return
        }
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
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
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
              {isEdit ? 'Edit Data Bidang' : 'Tambah Bidang Magang Baru'}
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '12px', color: '#64748b' }}>
              {isEdit
                ? 'Perbarui informasi bidang, kuota, atau status ketersediaan.'
                : 'Lengkapi formulir untuk menambahkan unit/bidang magang baru.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '1.25rem', gap: '1rem' }}>
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Nama Bidang / Unit Kerja <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Tata Usaha & Kearsipan"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Jelaskan ruang lingkup atau deskripsi pekerjaan pada bidang ini..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Kuota Maksimum <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.kuota}
                onChange={(e) => setFormData({ ...formData, kuota: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Jenjang Pendidikan
              </label>
              <input
                type="text"
                value={formData.jenjang}
                onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                placeholder="SMK / D3 / S1"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Persyaratan Khusus (Opsional)
            </label>
            <textarea
              rows={2}
              value={formData.persyaratan}
              onChange={(e) => setFormData({ ...formData, persyaratan: e.target.value })}
              placeholder="Contoh: Menguasai MS Excel, memiliki laptop sendiri"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ paddingTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#15803d', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                Bidang Aktif (Tersedia untuk pilihan pendaftaran peserta)
              </span>
            </label>
          </div>

          {/* Footer */}
          <div
            style={{
              paddingTop: '0.75rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.45rem 0.875rem',
                fontSize: '12px',
                fontWeight: 500,
                color: '#475569',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '12px',
                fontWeight: 500,
                color: '#ffffff',
                backgroundColor: '#15803d',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <LoaderIcon width={14} height={14} />
                  <span>Menyimpan...</span>
                </>
              ) : isEdit ? (
                <>
                  <SaveIcon width={14} height={14} />
                  <span>Perbarui Bidang</span>
                </>
              ) : (
                <>
                  <PlusIcon width={14} height={14} />
                  <span>Tambah Bidang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
