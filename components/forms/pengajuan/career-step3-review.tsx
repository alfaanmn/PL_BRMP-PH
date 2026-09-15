'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePengajuanWizard } from '@/hooks/use-pengajuan'
import { pengajuanService } from '@/lib/services/pengajuan.service'
import { BidangItem } from '@/lib/services/bidang.service'
import { AnggotaMagang, PengajuanInsertPayload } from '@/types/pengajuan.types'

interface CareerStep3ReviewProps {
  bidangList: BidangItem[]
  userProfile?: {
    id: string
    name: string
    email: string
    asal_instansi?: string | null
    jurusan?: string | null
    no_hp?: string | null
  }
}

export function CareerStep3Review({ bidangList, userProfile }: CareerStep3ReviewProps) {
  const router = useRouter()
  const { state, setPernyataanBenar, resetWizard } = usePengajuanWizard()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const selectedBidang = bidangList.find(
    (b) => String(b.id) === String(state.step1.bidang_id)
  )

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (submitSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (submitSuccess && countdown === 0) {
      router.push('/pengguna/riwayat')
    }
    return () => clearTimeout(timer)
  }, [submitSuccess, countdown, router])

  const handleFinalSubmit = async () => {
    if (!state.pernyataan_benar) return
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Siapkan payload insert pengajuan
      const payload: PengajuanInsertPayload = {
        user_id: userProfile?.id || '',
        bidang_id: Number(state.step1.bidang_id),
        pembimbing_id: null, // Pembimbing diplot oleh admin
        nomor_surat: state.step1.nomor_surat,
        tanggal_surat: state.step1.tanggal_surat,
        jenjang: state.step1.jenjang === 'Siswa' ? 'Siswa' : 'Mahasiswa',
        asal_instansi: state.step1.asal_instansi || userProfile?.asal_instansi || '',
        jurusan: state.step1.jurusan || userProfile?.jurusan || '',
        tanggal_mulai: state.step1.tanggal_mulai,
        tanggal_selesai: state.step1.tanggal_selesai,
        durasi_bulan: state.step1.durasi_bulan || 1,
        jumlah_anggota: state.step1.jumlah_anggota || 1,
        anggota: state.step1.jumlah_anggota > 1 ? state.step1.anggota : [],
        nama_lengkap: state.step1.nama_lengkap || userProfile?.name || '',
        nim_nis: state.step1.nim_nis,
        jenis_kelamin: state.step1.jenis_kelamin || null,
        no_hp: state.step1.no_hp || userProfile?.no_hp || null,
        alamat: state.step1.alamat || null,
        topik_magang: state.step1.topik_magang,
        surat_pengantar_url: state.step2.surat_pengantar_url,
        proposal_url: state.step2.proposal_url || null,
        dokumen_tambahan_url: state.step2.dokumen_tambahan_url || null,
        status: 'Menunggu Verifikasi',
      }

      const res = await pengajuanService.submitPengajuan(payload)

      if (!res.success) {
        setSubmitError(res.error?.message || 'Gagal mengirim pengajuan magang. Silakan coba kembali.')
        setIsSubmitting(false)
        return
      }

      // Berhasil
      setSubmitSuccess(true)
      resetWizard()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      setSubmitError(msg)
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #bbf7d0',
        borderRadius: '20px',
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: '0 10px 25px -5px rgba(21, 128, 61, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: '2.25rem',
          border: '2px solid #86efac',
          boxShadow: '0 0 0 8px rgba(236, 253, 245, 0.8)'
        }}>
          ✓
        </div>

        <div>
          <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Pengajuan Magang Berhasil Dikirim!
          </h3>
          <p style={{ fontSize: '0.9375rem', color: '#475569', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
            Permohonan magang Anda telah tercatat dengan status{' '}
            <span style={{
              display: 'inline-block',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              border: '1px solid #fde68a'
            }}>
              Menunggu Verifikasi
            </span>.
            Tim Admin BRMP akan segera memverifikasi berkas Anda.
          </p>
        </div>

        <div style={{
          fontSize: '0.8125rem',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
          Otomatis dialihkan ke halaman riwayat dalam <strong>{countdown}</strong> detik...
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.875rem',
          marginTop: '0.75rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={() => router.push('/pengguna/riwayat')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#15803d',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 10px rgba(21, 128, 61, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            📋 Lihat Riwayat &amp; Status Pengajuan
          </button>
          <button
            type="button"
            onClick={() => router.push('/pengguna/dashboard')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            🏠 Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. UNIT KERJA TERPILIH */}
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
          marginBottom: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01"/>
              <path d="M16 6h.01"/>
              <path d="M8 10h.01"/>
              <path d="M16 10h.01"/>
              <path d="M8 14h.01"/>
              <path d="M16 14h.01"/>
            </svg>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Unit kerja terpilih
            </h3>
          </div>

          <button
            type="button"
            onClick={() => router.push('/pengguna/career/step1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#16a34a',
              backgroundColor: '#ecfdf5',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            <span>Edit</span>
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }}>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
              <path d="M10 6h4"/>
              <path d="M10 10h4"/>
              <path d="M10 14h4"/>
              <path d="M10 18h4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              {selectedBidang?.nama || `Bidang ID #${state.step1.bidang_id}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {selectedBidang?.kuota ? `${selectedBidang.kuota} kuota tersedia` : 'Kuota tersedia'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. IDENTITAS AKADEMIK */}
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
          marginBottom: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Identitas akademik
            </h3>
          </div>

          <button
            type="button"
            onClick={() => router.push('/pengguna/career/step1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#16a34a',
              backgroundColor: '#ecfdf5',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            <span>Edit</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.8125rem'
        }}>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Nama lengkap</span>
            <strong style={{ color: '#0f172a' }}>{state.step1.nama_lengkap || userProfile?.name || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>NIM / NIS</span>
            <strong style={{ color: '#0f172a' }}>{state.step1.nim_nis || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Asal instansi</span>
            <strong style={{ color: '#0f172a' }}>{state.step1.asal_instansi || userProfile?.asal_instansi || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Program studi</span>
            <strong style={{ color: '#0f172a' }}>{state.step1.jurusan || '-'} ({state.step1.jenjang === 'Siswa' ? 'Siswa' : 'Mahasiswa'})</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>No WhatsApp</span>
            <strong style={{ color: '#0f172a' }}>{state.step1.no_hp || userProfile?.no_hp || '-'}</strong>
          </div>
          <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Jenis kelamin</span>
            <strong style={{ color: '#0f172a' }}>{state.step1.jenis_kelamin || '-'}</strong>
          </div>
        </div>
      </div>

      {/* 3. RENCANA MAGANG */}
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
          marginBottom: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Rencana magang
            </h3>
          </div>

          <button
            type="button"
            onClick={() => router.push('/pengguna/career/step1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#16a34a',
              backgroundColor: '#ecfdf5',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            <span>Edit</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>
              Topik magang:
            </span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
              "{state.step1.topik_magang || '-'}"
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.625rem'
          }}>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Nomor surat</span>
              <strong style={{ color: '#0f172a', fontSize: '0.8125rem' }}>{state.step1.nomor_surat || '-'}</strong>
            </div>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Tanggal surat</span>
              <strong style={{ color: '#0f172a', fontSize: '0.8125rem' }}>{state.step1.tanggal_surat || '-'}</strong>
            </div>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Periode pelaksanaan</span>
              <strong style={{ color: '#0f172a', fontSize: '0.8125rem' }}>{state.step1.tanggal_mulai || '-'} s/d {state.step1.tanggal_selesai || '-'}</strong>
            </div>
            <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Estimasi durasi</span>
              <strong style={{ color: '#0f172a', fontSize: '0.8125rem' }}>{state.step1.durasi_bulan || 1} bulan</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TIM & ANGGOTA (Jika Kelompok) */}
      {state.step1.jumlah_anggota > 1 && (
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
            marginBottom: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Anggota tim ({state.step1.jumlah_anggota} orang)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => router.push('/pengguna/career/step1')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#16a34a',
                backgroundColor: '#ecfdf5',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              <span>Edit</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {state.step1.anggota?.map((item: AnggotaMagang, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '0.625rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.nama || '-'}</span>
                  <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>NIM: {item.nim_nis || '-'}</span>
                </div>
                <span style={{ color: '#64748b' }}>{item.no_hp || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DOKUMEN PERSYARATAN */}
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
          marginBottom: '0.875rem'
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

          <button
            type="button"
            onClick={() => router.push('/pengguna/career/step2')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#16a34a',
              backgroundColor: '#ecfdf5',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            <span>Edit</span>
          </button>
        </div>

        {/* List Ringkas Dokumen Terunggah */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Surat Pengantar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.625rem 0.75rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.8125rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Surat pengantar magang</span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Wajib)</span>
            </div>
            {state.step2.surat_pengantar_url ? (
              <a
                href={state.step2.surat_pengantar_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#16a34a', textDecoration: 'underline', fontSize: '0.75rem' }}
              >
                {state.step2.surat_pengantar_name || 'Lihat berkas'}
              </a>
            ) : (
              <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>Belum diunggah</span>
            )}
          </div>

          {/* Proposal */}
          {state.step2.proposal_url && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Proposal kegiatan</span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Opsional)</span>
              </div>
              <a
                href={state.step2.proposal_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#16a34a', textDecoration: 'underline', fontSize: '0.75rem' }}
              >
                {state.step2.proposal_name || 'Lihat berkas'}
              </a>
            </div>
          )}

          {/* Dokumen Tambahan */}
          {state.step2.dokumen_tambahan_url && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Dokumen tambahan / CV</span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Opsional)</span>
              </div>
              <a
                href={state.step2.dokumen_tambahan_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#16a34a', textDecoration: 'underline', fontSize: '0.75rem' }}
              >
                {state.step2.dokumen_tambahan_name || 'Lihat berkas'}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 6. CHECKBOX PERNYATAAN */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1rem 1.25rem'
      }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={state.pernyataan_benar}
            onChange={(e) => setPernyataanBenar(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#16a34a',
              marginTop: '3px',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              Pernyataan kebenaran data
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0', lineHeight: 1.4 }}>
              Saya menyatakan bahwa seluruh data yang diisi dan berkas yang diunggah adalah benar dan sah sesuai ketentuan BRMP Kementerian Pertanian RI.
            </p>
          </div>
        </label>
      </div>

      {submitError && (
        <div style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '0.8125rem',
          borderRadius: '8px'
        }}>
          ⚠️ {submitError}
        </div>
      )}

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
          onClick={() => router.push('/pengguna/career/step2')}
          disabled={isSubmitting}
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
          type="button"
          onClick={handleFinalSubmit}
          disabled={!state.pernyataan_benar || isSubmitting}
          style={{
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: !state.pernyataan_benar || isSubmitting ? '#94a3b8' : '#16a34a',
            border: 'none',
            borderRadius: '8px',
            cursor: !state.pernyataan_benar || isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: !state.pernyataan_benar || isSubmitting ? 'none' : '0 2px 4px rgba(22, 163, 74, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          {isSubmitting ? (
            <span>Memproses pendaftaran...</span>
          ) : (
            <>
              <span>Kirim pendaftaran</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
