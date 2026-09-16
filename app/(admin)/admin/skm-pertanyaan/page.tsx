'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { adminSKMService } from '@/lib/services/admin-skm.service'
import type { AdminSKMPertanyaanItem, AdminSKMPertanyaanStats } from '@/types/admin-skm.types'
import { SKM_PRESET_TEMPLATES, type SKMQuestionOption } from '@/types/skm.types'
import {
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  CloseIcon,
  PlusIcon,
} from '@/components/ui/admin-icons'

const DEFAULT_OPTIONS: [SKMQuestionOption, SKMQuestionOption, SKMQuestionOption, SKMQuestionOption] = [
  { skor: 1, label: 'Tidak Sesuai' },
  { skor: 2, label: 'Kurang Sesuai' },
  { skor: 3, label: 'Sesuai' },
  { skor: 4, label: 'Sangat Sesuai' },
]

export default function AdminSKMPertanyaanPage() {
  const [questions, setQuestions] = useState<AdminSKMPertanyaanItem[]>([])
  const [stats, setStats] = useState<AdminSKMPertanyaanStats>({
    totalPertanyaan: 0,
    totalPilihan: 0,
    totalTeks: 0,
    totalAktif: 0,
    totalNonaktif: 0,
  })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modal Tambah / Edit state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingQuestion, setEditingQuestion] = useState<AdminSKMPertanyaanItem | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('kesesuaian')
  const [formData, setFormData] = useState({
    unsur: '',
    pertanyaan: '',
    urutan: 1,
    tipe: 'pilihan',
    opsi: DEFAULT_OPTIONS,
    is_active: true,
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Modal Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminSKMPertanyaanItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message })
    setTimeout(() => {
      setFeedbackToast(null)
    }, 4000)
  }

  // Load Questions & Stats
  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [qRes, sRes] = await Promise.all([
        adminSKMService.getAllQuestions(),
        adminSKMService.getQuestionStats(),
      ])

      if (qRes.error) {
        setErrorMsg(qRes.error)
      } else {
        setQuestions(qRes.data)
      }

      if (sRes.data) {
        setStats(sRes.data)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data pertanyaan SKM.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handler toggle status
  const handleToggleStatus = async (item: AdminSKMPertanyaanItem) => {
    setActionLoadingId(item.id)
    try {
      const res = await adminSKMService.toggleQuestionStatus(item.id, item.is_active)
      if (res.success) {
        const nextStatus = !item.is_active
        setQuestions((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, is_active: nextStatus } : q))
        )
        setStats((prev) => ({
          ...prev,
          totalAktif: nextStatus ? prev.totalAktif + 1 : prev.totalAktif - 1,
          totalNonaktif: nextStatus ? prev.totalNonaktif - 1 : prev.totalNonaktif + 1,
        }))
        showToast(
          'success',
          `Pertanyaan #${item.urutan} berhasil di-${nextStatus ? 'aktifkan' : 'nonaktifkan'}.`
        )
      } else {
        showToast('error', res.error?.message || 'Gagal mengubah status pertanyaan.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      showToast('error', msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Apply Preset Template Helper
  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId)
    if (presetId === 'kustom') {
      return
    }
    const template = SKM_PRESET_TEMPLATES.find((p) => p.id === presetId)
    if (template) {
      setFormData((prev) => ({
        ...prev,
        opsi: [
          { skor: 1, label: template.options[0].label },
          { skor: 2, label: template.options[1].label },
          { skor: 3, label: template.options[2].label },
          { skor: 4, label: template.options[3].label },
        ],
      }))
    }
  }

  // Update Individual Option Label (Custom State)
  const handleOptionLabelChange = (skor: number, label: string) => {
    setFormData((prev) => ({
      ...prev,
      opsi: prev.opsi.map((o) => (o.skor === skor ? { ...o, label } : o)) as [
        SKMQuestionOption,
        SKMQuestionOption,
        SKMQuestionOption,
        SKMQuestionOption
      ],
    }))
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextUrutan = questions.length > 0 ? Math.max(...questions.map((q) => q.urutan)) + 1 : 1
    const defaultTemplate = SKM_PRESET_TEMPLATES[0]
    setModalMode('create')
    setEditingQuestion(null)
    setSelectedPresetId('kesesuaian')
    setFormData({
      unsur: '',
      pertanyaan: '',
      urutan: nextUrutan,
      tipe: 'pilihan',
      opsi: [
        { skor: 1, label: defaultTemplate.options[0].label },
        { skor: 2, label: defaultTemplate.options[1].label },
        { skor: 3, label: defaultTemplate.options[2].label },
        { skor: 4, label: defaultTemplate.options[3].label },
      ],
      is_active: true,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: AdminSKMPertanyaanItem) => {
    setModalMode('edit')
    setEditingQuestion(item)

    let loadedOpsi: [SKMQuestionOption, SKMQuestionOption, SKMQuestionOption, SKMQuestionOption] = DEFAULT_OPTIONS
    let matchedPresetId = 'kustom'

    if (item.tipe === 'pilihan' && Array.isArray(item.opsi) && item.opsi.length === 4) {
      loadedOpsi = [
        { skor: 1, label: item.opsi.find((o) => o.skor === 1)?.label || '' },
        { skor: 2, label: item.opsi.find((o) => o.skor === 2)?.label || '' },
        { skor: 3, label: item.opsi.find((o) => o.skor === 3)?.label || '' },
        { skor: 4, label: item.opsi.find((o) => o.skor === 4)?.label || '' },
      ]

      const matched = SKM_PRESET_TEMPLATES.find((tmpl) => {
        return (
          tmpl.options[0].label.trim().toLowerCase() === loadedOpsi[0].label.trim().toLowerCase() &&
          tmpl.options[1].label.trim().toLowerCase() === loadedOpsi[1].label.trim().toLowerCase() &&
          tmpl.options[2].label.trim().toLowerCase() === loadedOpsi[2].label.trim().toLowerCase() &&
          tmpl.options[3].label.trim().toLowerCase() === loadedOpsi[3].label.trim().toLowerCase()
        )
      })

      if (matched) {
        matchedPresetId = matched.id
      } else {
        matchedPresetId = 'kustom'
      }
    } else {
      matchedPresetId = 'kesesuaian'
    }

    setSelectedPresetId(matchedPresetId)

    setFormData({
      unsur: item.unsur || '',
      pertanyaan: item.pertanyaan,
      urutan: item.urutan,
      tipe: item.tipe === 'teks' ? 'teks' : 'pilihan',
      opsi: loadedOpsi,
      is_active: item.is_active,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Submit Modal Form (Create / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.pertanyaan.trim()) {
      setFormError('Teks pertanyaan wajib diisi.')
      return
    }

    // Validasi 4 opsi jika tipe pilihan
    if (formData.tipe === 'pilihan') {
      const emptyOpsi = formData.opsi.some((o) => !o.label || !o.label.trim())
      if (emptyOpsi) {
        setFormError('Seluruh 4 label pilihan jawaban (Skor 1–4) wajib diisi.')
        return
      }
    }

    setFormSubmitting(true)
    setFormError(null)

    try {
      const payloadOpsi =
        formData.tipe === 'pilihan'
          ? formData.opsi.map((o) => ({ skor: o.skor, label: o.label.trim() }))
          : null

      if (modalMode === 'create') {
        const res = await adminSKMService.createQuestion({
          unsur: formData.unsur,
          pertanyaan: formData.pertanyaan,
          urutan: Number(formData.urutan) || 1,
          tipe: formData.tipe,
          opsi: payloadOpsi,
          is_active: formData.is_active,
        })

        if (res.success) {
          showToast('success', 'Butir pertanyaan SKM baru berhasil ditambahkan.')
          setIsModalOpen(false)
          loadData()
        } else {
          setFormError(res.error?.message || 'Gagal menambahkan pertanyaan.')
        }
      } else if (modalMode === 'edit' && editingQuestion) {
        const res = await adminSKMService.updateQuestion(editingQuestion.id, {
          unsur: formData.unsur,
          pertanyaan: formData.pertanyaan,
          urutan: Number(formData.urutan),
          tipe: formData.tipe,
          opsi: payloadOpsi,
          is_active: formData.is_active,
        })

        if (res.success) {
          showToast('success', `Pertanyaan #${formData.urutan} berhasil diperbarui.`)
          setIsModalOpen(false)
          loadData()
        } else {
          setFormError(res.error?.message || 'Gagal memperbarui pertanyaan.')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      setFormError(msg)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Confirm Delete / Deactivate Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    try {
      const res = await adminSKMService.deleteQuestionSafe(deleteTarget.id)
      if (res.success) {
        if (res.data?.mode === 'deactivated') {
          showToast(
            'success',
            `Pertanyaan #${deleteTarget.urutan} dinonaktifkan (karena telah memiliki riwayat jawaban responden).`
          )
        } else {
          showToast('success', `Pertanyaan #${deleteTarget.urutan} berhasil dihapus.`)
        }
        setDeleteTarget(null)
        loadData()
      } else {
        showToast('error', res.error?.message || 'Gagal menghapus pertanyaan.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      showToast('error', msg)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Filtered List
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter === 'active' && !q.is_active) return false
      if (statusFilter === 'inactive' && q.is_active) return false

      if (search.trim()) {
        const term = search.toLowerCase()
        const matchPertanyaan = q.pertanyaan.toLowerCase().includes(term)
        const matchUnsur = (q.unsur || '').toLowerCase().includes(term)
        const matchUrutan = String(q.urutan).includes(term)
        return matchPertanyaan || matchUnsur || matchUrutan
      }

      return true
    })
  }, [questions, statusFilter, search])

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .2s ease;
          border-radius: 20px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .2s ease;
          border-radius: 50%;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        input:checked + .toggle-slider {
          background-color: #16a34a;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(16px);
        }
        .list-row-hover {
          transition: background-color 0.15s ease;
        }
        .list-row-hover:hover {
          background-color: #f8fafc;
        }
        .btn-action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          color: #475569;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .btn-action-icon:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .btn-action-icon.edit:hover {
          border-color: #86efac;
          background-color: #ecfdf5;
          color: #16a34a;
        }
        .btn-action-icon.delete:hover {
          border-color: #fca5a5;
          background-color: #fef2f2;
          color: #dc2626;
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
            Konfigurasi pertanyaan SKM
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Kelola visibilitas, teks unsur, dan butir kuesioner
          </p>
        </div>

        {/* Action Buttons: Tambah Pertanyaan & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.125rem',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <PlusIcon width={16} height={16} />
            <span>+ Tambah pertanyaan</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#334155',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <span style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Stat Cards Row (Sentence case, 20px numbers, green for choice & text) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {/* Total Pertanyaan */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Total pertanyaan
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>
            {stats.totalPertanyaan}
          </span>
        </div>

        {/* Pilihan (skala 1-4) */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Pilihan (skala 1-4)
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#16a34a', lineHeight: '1.2' }}>
            {stats.totalPilihan}
          </span>
        </div>

        {/* Teks / esai */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Teks / esai
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#16a34a', lineHeight: '1.2' }}>
            {stats.totalTeks}
          </span>
        </div>

        {/* Status aktif */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
            Status aktif
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>
            {stats.totalAktif}
          </span>
        </div>
      </div>

      {/* 2. Filter & Search Bar (Pill buttons) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Cari butir pertanyaan atau unsur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.25rem',
              fontSize: '0.8125rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <SearchIcon width={15} height={15} />
          </div>
        </div>

        {/* Status Filter Tabs (Pill style: green solid when active, neutral when inactive) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {[
            { key: 'all', label: 'Semua', count: stats.totalPertanyaan },
            { key: 'active', label: 'Aktif', count: stats.totalAktif },
            { key: 'inactive', label: 'Nonaktif', count: stats.totalNonaktif },
          ].map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as any)}
                style={{
                  padding: '0.35rem 0.875rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? '#16a34a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: isActive ? '1px solid #16a34a' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span>{tab.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. List Container Data (Compact single container with 1-line ellipsis rows) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <LoaderIcon width={28} height={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Memuat konfigurasi pertanyaan SKM...</p>
          </div>
        ) : errorMsg ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#ef4444' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Gagal Memuat Data</p>
            <p style={{ fontSize: '0.8125rem', margin: '0 0 1rem 0' }}>{errorMsg}</p>
            <button
              onClick={loadData}
              style={{
                padding: '0.45rem 1rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Tidak ada pertanyaan yang sesuai
            </p>
            <p style={{ fontSize: '0.8125rem', margin: 0 }}>Coba ubah kata kunci pencarian atau filter status.</p>
          </div>
        ) : (
          <div>
            {filteredQuestions.map((item, index) => {
              const isActionLoading = actionLoadingId === item.id
              const isLast = index === filteredQuestions.length - 1
              return (
                <div
                  key={item.id}
                  className="list-row-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: '#ffffff',
                    gap: '1rem',
                  }}
                >
                  {/* Sisi Kiri: Kotak Nomor Hijau Solid + Badge Unsur + Teks 1 Baris Ellipsis */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    {/* Kotak Nomor Urut 22x22px */}
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {item.urutan}
                    </div>

                    {/* Unsur & Teks Pertanyaan */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                      <div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#16a34a',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #bbf7d0',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}>
                          {item.unsur || `Unsur #${item.urutan}`}
                        </span>
                      </div>
                      <div
                        title={item.pertanyaan}
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 500,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          lineHeight: '1.4',
                        }}
                      >
                        {item.pertanyaan}
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Tipe Abu Polos + Toggle + Edit (26px) + Hapus (26px) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {/* Kolom Tipe Abu Polos */}
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                      {item.tipe === 'pilihan' ? 'Pilihan' : 'Teks'}
                    </span>

                    {/* Switch Toggle */}
                    <label className="toggle-switch" title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        disabled={isActionLoading}
                        onChange={() => handleToggleStatus(item)}
                      />
                      <span className="toggle-slider" />
                    </label>

                    {/* Tombol Edit 26x26px */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="btn-action-icon edit"
                      title="Edit Pertanyaan"
                    >
                      ✏️
                    </button>

                    {/* Tombol Hapus 26x26px */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="btn-action-icon delete"
                      title="Hapus / Nonaktifkan"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Modal Tambah / Edit Pertanyaan */}
      {isModalOpen && (
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
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.125rem 0' }}>
                  {modalMode === 'create' ? 'Tambah butir pertanyaan SKM' : `Edit pertanyaan #${editingQuestion?.urutan}`}
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  {modalMode === 'create'
                    ? 'Tambahkan butir kuesioner baru ke dalam survei pelayanan BRMP.'
                    : 'Perbarui teks butir pertanyaan atau kategori unsur pelayanan.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.625rem 0.875rem',
                  color: '#b91c1c',
                  fontSize: '0.8125rem',
                }}>
                  {formError}
                </div>
              )}

              {/* Tipe Pertanyaan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Tipe pertanyaan: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label
                    style={{
                      border: formData.tipe === 'pilihan' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: formData.tipe === 'pilihan' ? '#ecfdf5' : '#ffffff',
                      borderRadius: '8px',
                      padding: '0.625rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="tipe_pertanyaan"
                      value="pilihan"
                      checked={formData.tipe === 'pilihan'}
                      onChange={() => setFormData((prev) => ({ ...prev, tipe: 'pilihan' }))}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                        Pilihan ganda
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        Skala Likert (1–4)
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      border: formData.tipe === 'teks' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: formData.tipe === 'teks' ? '#ecfdf5' : '#ffffff',
                      borderRadius: '8px',
                      padding: '0.625rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="tipe_pertanyaan"
                      value="teks"
                      checked={formData.tipe === 'teks'}
                      onChange={() => setFormData((prev) => ({ ...prev, tipe: 'teks' }))}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                        Teks bebas / esai
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        Tanggapan & saran tertulis
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Unsur Pelayanan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Unsur Pelayanan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Persyaratan, Prosedur, Sarana Prasarana..."
                  value={formData.unsur}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unsur: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Teks Pertanyaan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Teks Butir Pertanyaan: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan butir pertanyaan survei kepuasan..."
                  value={formData.pertanyaan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pertanyaan: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Pilihan Jawaban (Hanya jika tipe = pilihan) */}
              {formData.tipe === 'pilihan' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                      Pilihan jawaban:
                    </label>
                  </div>

                  {/* Dropdown Preset Selector */}
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handleApplyPreset(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    {SKM_PRESET_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                    <option value="kustom">Kustom</option>
                  </select>

                  {/* State 1: Preset (Read-Only Preview Box Compact) */}
                  {selectedPresetId !== 'kustom' && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      maxHeight: '110px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxSizing: 'border-box',
                    }}>
                      {formData.opsi.map((opt) => (
                        <div
                          key={opt.skor}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            lineHeight: '1.4',
                          }}
                        >
                          <span style={{ color: '#94a3b8', fontWeight: 500, width: '20px' }}>
                            {opt.skor}
                          </span>
                          <span style={{ color: '#334155', flex: 1, textAlign: 'right' }}>
                            {opt.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* State 2: Kustom (4 Editable Text Inputs dengan Nomor Hijau Brand Seragam) */}
                  {selectedPresetId === 'kustom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {formData.opsi.map((opt) => (
                        <div key={opt.skor} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {opt.skor}
                          </div>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => handleOptionLabelChange(opt.skor, e.target.value)}
                            placeholder={`Label opsi skor ${opt.skor}...`}
                            required
                            style={{
                              flex: 1,
                              padding: '0.35rem 0.625rem',
                              fontSize: '0.8125rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      ))}
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Skor 1-4 tetap, hanya label yang bisa diubah
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Nomor Urut & Status Aktif */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Nomor Urut:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.urutan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, urutan: Number(e.target.value) || 1 }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Status Aktif */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Status Ketersediaan:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                      />
                      <span className="toggle-slider" />
                    </label>
                    <span style={{ fontSize: '0.8125rem', color: formData.is_active ? '#15803d' : '#64748b', fontWeight: 500 }}>
                      {formData.is_active ? 'Aktif (Tampil di form)' : 'Nonaktif (Disembunyikan)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: formSubmitting ? '#94a3b8' : '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: formSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {formSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Tambah Pertanyaan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Konfirmasi Hapus / Nonaktifkan */}
      {deleteTarget && (
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
            maxWidth: '460px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Hapus / Nonaktifkan Pertanyaan #{deleteTarget.urutan}?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              &ldquo;{deleteTarget.pertanyaan}&rdquo;
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0 0 1.5rem 0', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
              💡 <em>Catatan Keamanan:</em> Jika pertanyaan sudah memiliki riwayat pengisian dari responden, sistem akan otomatis mengubah statusnya menjadi <strong>Nonaktif</strong> (soft deactivate) agar data laporan tidak terganggu.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>

              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: deleteSubmitting ? '#94a3b8' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: deleteSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleteSubmitting ? 'Memproses...' : 'Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
