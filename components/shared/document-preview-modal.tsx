'use client'

import React, { useEffect, useState } from 'react'
import { pengajuanService } from '@/lib/services/pengajuan.service'
import {
  CloseIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LoaderIcon,
  AlertCircleIcon,
} from '@/components/ui/admin-icons'

export interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  url?: string | null
  title?: string
  subtitle?: string
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  url,
  title = 'Pratinjau Dokumen',
  subtitle,
}: DocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Resolve Signed URL saat modal dibuka atau URL berganti
  useEffect(() => {
    let isMounted = true

    if (isOpen && url && typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder')) {
      setIsLoading(true)
      setHasError(false)
      setErrorMessage(null)

      // Jika URL sudah merupakan signed URL lengkap / blob / data URI, gunakan langsung
      if (
        url.startsWith('blob:') ||
        url.startsWith('data:') ||
        (url.includes('token=') && (url.startsWith('http://') || url.startsWith('https://')))
      ) {
        setSignedUrl(url)
        setIsLoading(false)
      } else {
        // Reset signedUrl ke null sebelum request selesai untuk mencegah penggunaan relative path
        setSignedUrl(null)

        // Dapatkan Signed URL dari private bucket 'dokumen' secara on-demand (TTL: 3600s)
        pengajuanService
          .getSignedDocumentUrl(url, 3600)
          .then((res) => {
            if (!isMounted) return
            if (res.url) {
              setSignedUrl(res.url)
              setIsLoading(false)
            } else {
              setSignedUrl(null)
              setHasError(true)
              setErrorMessage(res.error || 'Gagal memuat akses dokumen aman.')
              setIsLoading(false)
            }
          })
          .catch(() => {
            if (!isMounted) return
            setSignedUrl(null)
            setHasError(true)
            setErrorMessage('Terjadi kegagalan jaringan saat memuat berkas.')
            setIsLoading(false)
          })
      }
    } else {
      setSignedUrl(null)
      setIsLoading(false)
      setHasError(false)
      setErrorMessage(null)
    }

    return () => {
      isMounted = false
    }
  }, [isOpen, url])

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handler Download Berkas secara Aman (Blob Fetch + Signed URL Attachment)
  const handleDownload = async () => {
    if (!url && !signedUrl) return
    setIsDownloading(true)

    try {
      // Dapatkan signed URL khusus download
      const targetDoc = url || signedUrl
      const res = await pengajuanService.getSignedDocumentUrl(targetDoc, 3600, { download: true })
      const downloadUrl = res.url || signedUrl

      if (!downloadUrl) {
        alert(res.error || 'Gagal menyiapkan berkas unduhan.')
        return
      }

      // Fetch sebagai blob untuk memicu download browser secara andal
      const response = await fetch(downloadUrl)
      if (response.ok) {
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        const fallbackName = title
          ? `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`
          : 'dokumen.pdf'
        link.download = fallbackName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      } else {
        // Fallback langsung ke URL download Supabase
        window.open(downloadUrl, '_blank')
      }
    } catch {
      if (signedUrl) {
        window.open(signedUrl, '_blank')
      } else {
        alert('Gagal mengunduh berkas dokumen.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  if (!isOpen) return null

  // PENTING: activeUrl HANYA boleh bernilai string jika merupakan absolute URL (http/https/blob/data).
  // Jangan pernah menggunakan relative path string sebagai activeUrl untuk mencegah route localhost 404!
  const isValidAbsoluteUrl = Boolean(
    signedUrl &&
      (signedUrl.startsWith('http://') ||
        signedUrl.startsWith('https://') ||
        signedUrl.startsWith('blob:') ||
        signedUrl.startsWith('data:'))
  )
  const activeUrl = isValidAbsoluteUrl ? signedUrl : null
  const isAvailable = Boolean(url && typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder'))

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '0.75rem',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .doc-preview-modal-box {
            height: 94vh !important;
            height: 94dvh !important;
            max-height: 94dvh !important;
            border-radius: 12px !important;
          }
          .doc-preview-header {
            padding: 0.75rem 1rem !important;
            gap: 0.5rem !important;
          }
          .doc-preview-toolbar {
            width: 100% !important;
            justifyContent: space-between !important;
          }
          .doc-preview-action-btn {
            min-height: 40px !important;
            padding: 0.5rem 0.875rem !important;
            font-size: 13px !important;
          }
          .doc-preview-close-btn {
            min-width: 40px !important;
            min-height: 40px !important;
          }
        }
      `}</style>

      <div
        className="doc-preview-modal-box"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '960px',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          className="doc-preview-header"
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileTextIcon width={20} height={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </h3>
              {subtitle && (
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="doc-preview-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {Boolean(isAvailable && activeUrl) && (
              <>
                <a
                  href={activeUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="doc-preview-action-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#334155',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    minHeight: '36px',
                    boxSizing: 'border-box',
                  }}
                  title="Buka dokumen di tab baru browser"
                >
                  <ExternalLinkIcon width={14} height={14} />
                  <span>Tab Baru</span>
                </a>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="doc-preview-action-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: '#15803d',
                    border: 'none',
                    cursor: isDownloading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(21, 128, 61, 0.2)',
                    minHeight: '36px',
                    boxSizing: 'border-box',
                    opacity: isDownloading ? 0.8 : 1,
                  }}
                  title="Unduh berkas dokumen"
                >
                  {isDownloading ? (
                    <LoaderIcon width={14} height={14} className="animate-spin" />
                  ) : (
                    <DownloadIcon width={14} height={14} />
                  )}
                  <span>{isDownloading ? 'Mengunduh...' : 'Unduh'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="doc-preview-close-btn"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              title="Tutup pratinjau"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer Area */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#f8fafc',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!isAvailable ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1.5rem',
                maxWidth: '420px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircleIcon width={24} height={24} />
              </div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Dokumen Belum Tersedia
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Tautan berkas tidak ditemukan atau dokumen belum diunggah untuk pengajuan ini.
              </p>
            </div>
          ) : (
            <>
              {isLoading && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    backgroundColor: '#ffffff',
                    zIndex: 2,
                  }}
                >
                  <LoaderIcon width={28} height={28} className="animate-spin text-green-700" />
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                    Memuat pratinjau dokumen...
                  </span>
                </div>
              )}

              {hasError ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem 1.5rem',
                    maxWidth: '460px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileTextIcon width={24} height={24} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {errorMessage || 'Pratinjau Tidak Dapat Ditampilkan Langsung'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    {activeUrl
                      ? 'Format berkas atau pengaturan peramban tidak mendukung pratinjau tertanam. Anda dapat membuka berkas di tab baru atau mengunduhnya langsung.'
                      : 'Berkas dokumen privat tidak dapat diakses atau tidak ditemukan di storage server.'}
                  </p>
                  {activeUrl && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <a
                        href={activeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          minHeight: '40px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: '#15803d',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Buka di Tab Baru
                      </a>
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        style={{
                          minHeight: '40px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isDownloading ? (
                          <LoaderIcon width={14} height={14} className="animate-spin" />
                        ) : (
                          <DownloadIcon width={14} height={14} />
                        )}
                        <span>{isDownloading ? 'Mengunduh...' : 'Unduh Berkas'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : activeUrl ? (
                <iframe
                  src={activeUrl}
                  title={title}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#ffffff',
                  }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false)
                    setHasError(true)
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
