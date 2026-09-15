'use client'

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { pengajuanService } from '@/lib/services/pengajuan.service'

export interface FileDropzoneProps {
  id: string
  label: string
  sublabel?: string
  required?: boolean
  maxSizeMB?: number
  valueUrl?: string
  valueFileName?: string
  userId?: string
  prefix?: string
  onFileUploaded: (url: string, fileName: string) => void
  onFileRemoved: () => void
  error?: string
}

export function FileDropzone({
  id,
  label,
  sublabel = 'Format yang didukung: Dokumen PDF (Maks. 5 MB).',
  required = false,
  maxSizeMB = 5,
  valueUrl,
  valueFileName,
  userId = 'guest',
  prefix = 'doc',
  onFileUploaded,
  onFileRemoved,
  error,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (file: File) => {
    setLocalError(null)

    // Validasi Ekstensi PDF
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (extension !== 'pdf') {
      setLocalError('Format berkas tidak valid! Hanya dokumen PDF yang diizinkan.')
      return
    }

    // Validasi Ukuran File (Maksimal 5MB)
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setLocalError(`Ukuran berkas melebihi batas maksimum ${maxSizeMB} MB.`)
      return
    }

    // Mulai Upload
    setIsUploading(true)
    try {
      const res = await pengajuanService.uploadDokumen(file, userId, prefix)
      if (res.error || !res.url) {
        setLocalError(res.error || 'Gagal mengunggah berkas. Coba lagi.')
      } else {
        onFileUploaded(res.url, file.name)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan upload.'
      setLocalError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0])
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleRemove = () => {
    setLocalError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onFileRemoved()
  }

  const displayError = localError || error

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {valueUrl && (
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: '#15803d',
            backgroundColor: '#dcfce7',
            padding: '2px 8px',
            borderRadius: '9999px',
            border: '1px solid #bbf7d0'
          }}>
            ✓ Berkas Terunggah
          </span>
        )}
      </div>

      {sublabel && (
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
          {sublabel}
        </p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={isUploading}
      />

      {/* Upload Box or Existing File Card */}
      {valueUrl ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              border: '1px solid #a7f3d0',
              flexShrink: 0
            }}>
              📄
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {valueFileName || 'Dokumen_Pengajuan.pdf'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                Dokumen PDF Resmi Siap Diverifikasi
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#15803d',
                backgroundColor: '#ffffff',
                border: '1px solid #15803d',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Ganti File
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#dc2626',
                backgroundColor: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{
            border: isDragOver
              ? '2px dashed #15803d'
              : displayError
              ? '2px dashed #f87171'
              : '2px dashed #cbd5e1',
            backgroundColor: isDragOver
              ? '#ecfdf5'
              : displayError
              ? '#fef2f2'
              : '#f8fafc',
            borderRadius: '12px',
            padding: '1.75rem 1rem',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #15803d',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#15803d' }}>
                Mengunggah berkas PDF...
              </span>
            </div>
          ) : (
            <>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                ☁️
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  <span style={{ color: '#15803d', fontWeight: 800, textDecoration: 'underline' }}>
                    Klik untuk memilih file
                  </span>{' '}
                  atau seret berkas ke sini
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  Format PDF resmi (Maks. {maxSizeMB} MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#dc2626',
          margin: '2px 0 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⚠️ {displayError}
        </p>
      )}
    </div>
  )
}
