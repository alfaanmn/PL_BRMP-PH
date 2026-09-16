'use client'

import React, { useState, useEffect } from 'react'
import {
  AdminPembimbingListItem,
  CreatePembimbingPayload,
  UpdatePembimbingPayload,
  adminPembimbingService,
} from '@/lib/services/admin-pembimbing.service'
import { CloseIcon, LoaderIcon, PlusIcon, SaveIcon, AlertCircleIcon } from '@/components/ui/admin-icons'

interface PembimbingFormModalProps {
  isOpen: boolean
  pembimbingToEdit: AdminPembimbingListItem | null
  onClose: () => void
  onSuccess: () => void
}

export function PembimbingFormModal({ isOpen, pembimbingToEdit, onClose, onSuccess }: PembimbingFormModalProps) {
  const isEdit = Boolean(pembimbingToEdit)

  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    jabatan: '',
    email: '',
    no_hp: '',
    spesialisasi: '',
    kuota_default: 5,
    is_active: true,
  })

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (pembimbingToEdit) {
      setFormData({
        nama: pembimbingToEdit.nama || '',
        nip: pembimbingToEdit.nip || '',
        jabatan: pembimbingToEdit.jabatan || '',
        email: pembimbingToEdit.email || '',
        no_hp: pembimbingToEdit.no_hp || '',
        spesialisasi: pembimbingToEdit.spesialisasi || '',
        kuota_default: pembimbingToEdit.kuota_default ?? 5,
        is_active: pembimbingToEdit.is_active ?? true,
      })
    } else {
      setFormData({
        nama: '',
        nip: '',
        jabatan: '',
        email: '',
        no_hp: '',
        spesialisasi: '',
        kuota_default: 5,
        is_active: true,
      })
    }
    setErrorMsg(null)
  }, [pembimbingToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!formData.nama.trim()) {
      setErrorMsg('Nama pembimbing wajib diisi.')
      return
    }

    if (formData.kuota_default < 0) {
      setErrorMsg('Kuota bimbingan tidak boleh kurang dari 0.')
      return
    }

    setLoading(true)

    try {
      if (isEdit && pembimbingToEdit) {
        const payload: UpdatePembimbingPayload = {
          nama: formData.nama.trim(),
          nip: formData.nip.trim() || null,
          jabatan: formData.jabatan.trim() || null,
          email: formData.email.trim() || null,
          no_hp: formData.no_hp.trim() || null,
          spesialisasi: formData.spesialisasi.trim() || null,
          kuota_default: Number(formData.kuota_default) || 0,
          is_active: formData.is_active,
        }
        const res = await adminPembimbingService.updatePembimbing(pembimbingToEdit.id, payload)
        if (res.error) {
          setErrorMsg(res.error)
          setLoading(false)
          return
        }
      } else {
        const payload: CreatePembimbingPayload = {
          nama: formData.nama.trim(),
          nip: formData.nip.trim() || null,
          jabatan: formData.jabatan.trim() || null,
          email: formData.email.trim() || null,
          no_hp: formData.no_hp.trim() || null,
          spesialisasi: formData.spesialisasi.trim() || null,
          kuota_default: Number(formData.kuota_default) || 5,
          is_active: formData.is_active,
        }
        const res = await adminPembimbingService.createPembimbing(payload)
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
              {isEdit ? 'Edit Data Pembimbing Lapangan' : 'Tambah Pembimbing Lapangan Baru'}
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '12px', color: '#64748b' }}>
              {isEdit
                ? 'Perbarui data identitas, jabatan, kontak, atau kuota bimbingan.'
                : 'Lengkapi identitas pembimbing lapangan untuk penugasan magang.'}
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
              Nama Lengkap beserta Gelar <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Dr. Ir. Danang Santoso, M.Si"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                NIP (Nomor Induk Pegawai)
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="198501012010121001"
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
                Jabatan / Fungsional
              </label>
              <input
                type="text"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Peneliti Ahli Muda / Analis"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@pertanian.go.id"
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
                Nomor HP / WhatsApp
              </label>
              <input
                type="text"
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                placeholder="081234567890"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Spesialisasi / Keahlian
              </label>
              <input
                type="text"
                value={formData.spesialisasi}
                onChange={(e) => setFormData({ ...formData, spesialisasi: e.target.value })}
                placeholder="Bioteknologi Tanaman"
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
                Kuota Maksimal <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.kuota_default}
                onChange={(e) => setFormData({ ...formData, kuota_default: parseInt(e.target.value) || 0 })}
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

          <div style={{ paddingTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#15803d', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                Pembimbing Aktif (Dapat dipilih untuk penugasan peserta magang)
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
                  <span>Perbarui Pembimbing</span>
                </>
              ) : (
                <>
                  <PlusIcon width={14} height={14} />
                  <span>Tambah Pembimbing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
