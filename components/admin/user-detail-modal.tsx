'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  adminUserService,
  type AdminUserDetailItem,
} from '@/lib/services/admin-user.service'
import {
  CloseIcon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MailIcon,
  PhoneIcon,
  BriefcaseIcon,
  UsersIcon,
  LayersIcon,
} from '@/components/ui/admin-icons'

interface UserDetailModalProps {
  isOpen: boolean
  userId: string | null
  onClose: () => void
}

export function UserDetailModal({
  isOpen,
  userId,
  onClose,
}: UserDetailModalProps) {
  const [detailData, setDetailData] = useState<AdminUserDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !userId) {
      setDetailData(null)
      setErrorMsg(null)
      return
    }

    let isMounted = true

    async function fetchDetail() {
      setLoading(true)
      setErrorMsg(null)
      try {
        const res = await adminUserService.getAdminUserDetail(userId as string)
        if (!isMounted) return
        if (res.error) {
          setErrorMsg(res.error)
        } else {
          setDetailData(res.data)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat detail profil pengguna.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDetail()

    return () => {
      isMounted = false
    }
  }, [isOpen, userId])

  if (!isOpen) return null

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' }
      case 'Sedang Magang':
      case 'Disetujui':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
      case 'Selesai':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
      case 'Ditolak':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' }
      case 'Dibatalkan':
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(2px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafafa',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Detail Informasi Pengguna
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Profil akun dan rekam jejak pengajuan magang di SIM-Magang
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {loading ? (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#15803d' }}>
                <LoaderIcon width={24} height={24} />
              </div>
              Memuat rincian profil pengguna...
            </div>
          ) : errorMsg ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <AlertCircleIcon width={28} height={28} />
              </div>
              <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px', fontWeight: 500 }}>{errorMsg}</p>
            </div>
          ) : detailData ? (
            <>
              {/* Profile Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Avatar Icon */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#02482e',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {detailData.profile.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {detailData.profile.name}
                    </h3>

                    {/* Role Badge (Dark Green Solid for Administrator, Green Outline for Pengguna) */}
                    {detailData.profile.role === 'administrator' ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#166534',
                          color: '#ffffff',
                          border: '1px solid #14532d',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        ADMINISTRATOR
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        PENGGUNA
                      </span>
                    )}

                    {/* Active Status Badge */}
                    {detailData.profile.is_active ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckCircleIcon width={11} height={11} />
                        Akun Aktif
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <XCircleIcon width={11} height={11} />
                        Nonaktif
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    {detailData.profile.email}
                  </p>
                </div>
              </div>

              {/* Data Identitas Detail Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.875rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                    Asal Instansi / Universitas
                  </span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {detailData.profile.asal_instansi || '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                    Program Studi / Jurusan
                  </span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {detailData.profile.jurusan || '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                    Nomor WhatsApp / Kontak
                  </span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {detailData.profile.no_hp || '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                    Jenis Kelamin
                  </span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {detailData.profile.jenis_kelamin || '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                    Tanggal Terdaftar
                  </span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                    {formatDate(detailData.profile.created_at)}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                    Terakhir Diperbarui
                  </span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                    {formatDate(detailData.profile.updated_at || detailData.profile.created_at)}
                  </p>
                </div>
              </div>

              {/* Riwayat Pengajuan Magang Section */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Riwayat Pengajuan Magang ({detailData.pengajuanStats.total})
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px' }}>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>
                      Aktif: {detailData.pengajuanStats.sedangMagang}
                    </span>
                    <span style={{ color: '#94a3b8' }}>•</span>
                    <span style={{ color: '#b45309', fontWeight: 600 }}>
                      Menunggu: {detailData.pengajuanStats.menungguVerifikasi}
                    </span>
                    <span style={{ color: '#94a3b8' }}>•</span>
                    <span style={{ color: '#047857', fontWeight: 600 }}>
                      Selesai: {detailData.pengajuanStats.selesai}
                    </span>
                  </div>
                </div>

                {detailData.pengajuanList.length === 0 ? (
                  <div
                    style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px dashed #cbd5e1',
                      color: '#64748b',
                      fontSize: '12px',
                    }}
                  >
                    Pengguna ini belum pernah membuat permohonan pengajuan magang.
                  </div>
                ) : (
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    {detailData.pengajuanList.map((item, idx) => {
                      const badge = getStatusBadge(item.status)
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '0.875rem 1rem',
                            borderBottom: idx === detailData.pengajuanList.length - 1 ? 'none' : '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                Bidang: {item.bidang_nama}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  backgroundColor: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '9999px',
                                }}
                              >
                                {item.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.2rem' }}>
                              Pembimbing: {item.pembimbing_nama} • {item.durasi_bulan || 1} Bulan ({item.jumlah_anggota || 1} Peserta)
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {formatDate(item.created_at)}
                            </span>
                            <Link
                              href={`/admin/riwayat-pengajuan/${item.public_id}`}
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#15803d',
                                textDecoration: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0',
                                backgroundColor: '#f0fdf4',
                              }}
                            >
                              Buka Permohonan
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#fafafa',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
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
