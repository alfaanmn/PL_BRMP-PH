'use client'

import React, { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { usePengajuanWizard } from '@/hooks/use-pengajuan'
import { validatePengajuanStep2 } from '@/lib/validations/pengajuan.schema'
import { pengajuanService } from '@/lib/services/pengajuan.service'
import { BidangItem } from '@/lib/services/bidang.service'
import { PengajuanStep2State } from '@/types/pengajuan.types'

interface CareerStep2FormProps {
  bidangList: BidangItem[]
  userId?: string
}

interface DocumentItemConfig {
  key: 'surat_pengantar' | 'proposal' | 'dokumen_tambahan'
  label: string
  sublabel: string
  required: boolean
  urlField: keyof PengajuanStep2State
  nameField: keyof PengajuanStep2State
  prefix: string
}

const DOCUMENTS_CONFIG: DocumentItemConfig[] = [
  {
    key: 'surat_pengantar',
    label: 'Surat pengantar magang',
    sublabel: 'Surat rekomendasi resmi dari kampus / sekolah yang ditujukan kepada Kepala BRMP',
    required: true,
    urlField: 'surat_pengantar_url',
    nameField: 'surat_pengantar_name',
    prefix: 'surat_pengantar',
  },
  {
    key: 'proposal',
    label: 'Proposal kegiatan magang',
    sublabel: 'Rencana kerja, latar belakang, dan metodologi kegiatan atau riset magang',
    required: false,
    urlField: 'proposal_url',
    nameField: 'proposal_name',
    prefix: 'proposal',
  },
  {
    key: 'dokumen_tambahan',
    label: 'Dokumen tambahan / CV / KTM',
    sublabel: 'Berkas pendukung seperti Curriculum Vitae, portofolio, atau scan identitas pelajar',
    required: false,
    urlField: 'dokumen_tambahan_url',
    nameField: 'dokumen_tambahan_name',
    prefix: 'dokumen_tambahan',
  },
]

export function CareerStep2Form({ bidangList, userId = 'guest' }: CareerStep2FormProps) {
  const router = useRouter()
  const { state, updateStep2, isLoaded } = usePengajuanWizard()

  const [formData, setFormData] = useState<PengajuanStep2State>(state.step2)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})

  const fileInputRefs = {
    surat_pengantar: useRef<HTMLInputElement | null>(null),
    proposal: useRef<HTMLInputElement | null>(null),
    dokumen_tambahan: useRef<HTMLInputElement | null>(null),
  }

  useEffect(() => {
    if (isLoaded && state.step2) {
      setFormData((prev) => ({
        ...prev,
        ...state.step2,
      }))
    }
  }, [isLoaded, state.step2])

  // Hitung jumlah dokumen yang sudah terunggah
  const uploadedCount = DOCUMENTS_CONFIG.filter(
    (doc) => Boolean(formData[doc.urlField])
  ).length
  const totalCount = DOCUMENTS_CONFIG.length
  const progressPercent = Math.round((uploadedCount / totalCount) * 100)

  const handleFileUpload = async (doc: DocumentItemConfig, file: File) => {
    // Reset local error
    setUploadErrors((prev) => {
      const copy = { ...prev }
      delete copy[doc.key]
      return copy
    })

    // Validasi Ekstensi PDF
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (extension !== 'pdf') {
      setUploadErrors((prev) => ({
        ...prev,
        [doc.key]: 'Hanya dokumen berformat PDF yang diperbolehkan.',
      }))
      return
    }

    // Validasi Ukuran File (Maksimal 5MB)
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      setUploadErrors((prev) => ({
        ...prev,
        [doc.key]: 'Ukuran berkas maksimal 5 MB.',
      }))
      return
    }

    setUploadingKeys((prev) => ({ ...prev, [doc.key]: true }))

    try {
      const res = await pengajuanService.uploadDokumen(file, userId, doc.prefix)
      if (res.error || !res.url) {
        setUploadErrors((prev) => ({
          ...prev,
          [doc.key]: res.error || 'Gagal mengunggah berkas. Coba lagi.',
        }))
      } else {
        const updated = {
          ...formData,
          [doc.urlField]: res.url,
          [doc.nameField]: file.name,
        }
        setFormData(updated)
        updateStep2(updated)

        if (errors.surat_pengantar_url && doc.key === 'surat_pengantar') {
          setErrors((prev) => {
            const copy = { ...prev }
            delete copy.surat_pengantar_url
            return copy
          })
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah berkas.'
      setUploadErrors((prev) => ({ ...prev, [doc.key]: msg }))
    } finally {
      setUploadingKeys((prev) => ({ ...prev, [doc.key]: false }))
    }
  }

  const handleRemoveFile = (doc: DocumentItemConfig) => {
    const updated = {
      ...formData,
      [doc.urlField]: '',
      [doc.nameField]: '',
    }
    setFormData(updated)
    updateStep2(updated)

    if (fileInputRefs[doc.key].current) {
      fileInputRefs[doc.key].current!.value = ''
    }
  }

  const handleSubmitStep2 = (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors: validationErrors } = validatePengajuanStep2(formData)
    if (!isValid) {
      setErrors(validationErrors)
      window.scrollTo({ top: 150, behavior: 'smooth' })
      return
    }

    updateStep2(formData)
    router.push('/pengguna/career/step3')
  }

  const handleBackToStep1 = () => {
    updateStep2(formData)
    router.push('/pengguna/career/step1')
  }

  return (
    <form onSubmit={handleSubmitStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. PROGRESS RINGKASAN DOKUMEN */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.625rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Dokumen persyaratan
            </h3>
          </div>

          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#16a34a' }}>
            {uploadedCount} dari {totalCount} dokumen terunggah
          </span>
        </div>

        {/* Progress Bar Tipis Hijau */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e2e8f0',
          borderRadius: '9999px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: '#16a34a',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {errors.surat_pengantar_url && (
        <div style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '0.8125rem',
          borderRadius: '8px'
        }}>
          ⚠️ {errors.surat_pengantar_url}
        </div>
      )}

      {/* 2. CARD LIST DOKUMEN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {DOCUMENTS_CONFIG.map((doc) => {
          const fileUrl = formData[doc.urlField] as string
          const fileName = formData[doc.nameField] as string
          const isUploading = Boolean(uploadingKeys[doc.key])
          const uploadError = uploadErrors[doc.key]

          return (
            <div
              key={doc.key}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              {/* Hidden File Input */}
              <input
                ref={fileInputRefs[doc.key]}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(doc, e.target.files[0])
                  }
                }}
                disabled={isUploading}
              />

              {/* Left & Center: Icon + Metadata */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: '1 1 300px' }}>
                {/* 36x36px Icon Box */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {doc.label}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {doc.required ? 'Wajib' : 'Opsional'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    {doc.sublabel}
                  </p>

                  {/* Status Badges */}
                  <div style={{ marginTop: '0.375rem' }}>
                    {isUploading ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        color: '#16a34a',
                        fontWeight: 600
                      }}>
                        <span>⏳ Mengunggah berkas...</span>
                      </span>
                    ) : fileUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#16a34a',
                          backgroundColor: '#ecfdf5',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #bbf7d0'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span>{fileName || 'Dokumen.pdf'}</span>
                        </span>

                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            color: '#16a34a',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          Lihat file
                        </a>
                      </div>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        backgroundColor: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        Belum diunggah
                      </span>
                    )}

                    {uploadError && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>
                        ⚠️ {uploadError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {fileUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRefs[doc.key].current?.click()}
                      disabled={isUploading}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(doc)}
                      disabled={isUploading}
                      style={{
                        padding: '0.375rem 0.625rem',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#dc2626',
                        backgroundColor: '#ffffff',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRefs[doc.key].current?.click()}
                    disabled={isUploading}
                    style={{
                      padding: '0.4375rem 0.875rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#16a34a',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Unggah</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* FOOTER ACTIONS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <button
          type="button"
          onClick={handleBackToStep1}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Kembali
        </button>

        <button
          type="submit"
          style={{
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#16a34a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <span>Lanjut ke review</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </form>
  )
}
