'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { usePengajuanWizard } from '@/hooks/use-pengajuan'
import { validatePengajuanStep1, calculateDurationMonths } from '@/lib/validations/pengajuan.schema'
import { BidangItem } from '@/lib/services/bidang.service'
import { AnggotaMagang, PengajuanStep1State } from '@/types/pengajuan.types'

interface CareerStep1FormProps {
  bidangList: BidangItem[]
  userProfile?: {
    id: string
    name: string
    email: string
    asal_instansi?: string | null
    jurusan?: string | null
    no_hp?: string | null
    jenis_kelamin?: string | null
  }
}

export function CareerStep1Form({ bidangList, userProfile }: CareerStep1FormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, updateStep1, isLoaded } = usePengajuanWizard()

  const [formData, setFormData] = useState<PengajuanStep1State>(() => ({
    ...state.step1,
    asal_instansi: state.step1?.asal_instansi || userProfile?.asal_instansi || '',
    jurusan: state.step1?.jurusan || userProfile?.jurusan || '',
    nama_lengkap: state.step1?.nama_lengkap || userProfile?.name || '',
    no_hp: state.step1?.no_hp || userProfile?.no_hp || '',
    jenis_kelamin: state.step1?.jenis_kelamin || userProfile?.jenis_kelamin || '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isChangingBidang, setIsChangingBidang] = useState(false)

  // Prefill dari search param ?bidangId= atau profil saat pertama kali load
  useEffect(() => {
    if (!isLoaded) return

    const queryBidangId = searchParams.get('bidangId')
    const updates: Partial<PengajuanStep1State> = {}

    if (queryBidangId) {
      updates.bidang_id = Number(queryBidangId)
    } else if (state.step1?.bidang_id) {
      updates.bidang_id = state.step1.bidang_id
    } else if (bidangList.length > 0 && !formData.bidang_id) {
      updates.bidang_id = bidangList[0].id
    }

    if (userProfile) {
      if ((!formData.asal_instansi || formData.asal_instansi.trim() === '') && userProfile.asal_instansi) {
        updates.asal_instansi = userProfile.asal_instansi
      }
      if ((!formData.jurusan || formData.jurusan.trim() === '') && userProfile.jurusan) {
        updates.jurusan = userProfile.jurusan
      }
      if ((!formData.nama_lengkap || formData.nama_lengkap.trim() === '') && userProfile.name) {
        updates.nama_lengkap = userProfile.name
      }
      if ((!formData.no_hp || formData.no_hp.trim() === '') && userProfile.no_hp) {
        updates.no_hp = userProfile.no_hp
      }
      if ((!formData.jenis_kelamin || formData.jenis_kelamin.trim() === '') && userProfile.jenis_kelamin) {
        updates.jenis_kelamin = userProfile.jenis_kelamin
      }
    }

    if (Object.keys(updates).length > 0) {
      setFormData((prev: PengajuanStep1State) => ({ ...prev, ...updates }))
    }
  }, [isLoaded, searchParams, userProfile, bidangList])

  // Sinkronisasi durasi saat tanggal berubah
  const handleStartDateChange = (val: string) => {
    const durasi = calculateDurationMonths(val, formData.tanggal_selesai)
    setFormData((prev: PengajuanStep1State) => ({
      ...prev,
      tanggal_mulai: val,
      durasi_bulan: durasi,
    }))
    if (errors.tanggal_mulai || errors.tanggal_selesai) {
      setErrors((prev: Record<string, string>) => {
        const copy = { ...prev }
        delete copy.tanggal_mulai
        delete copy.tanggal_selesai
        return copy
      })
    }
  }

  const handleEndDateChange = (val: string) => {
    const durasi = calculateDurationMonths(formData.tanggal_mulai, val)
    setFormData((prev: PengajuanStep1State) => ({
      ...prev,
      tanggal_selesai: val,
      durasi_bulan: durasi,
    }))
    if (errors.tanggal_selesai) {
      setErrors((prev: Record<string, string>) => {
        const copy = { ...prev }
        delete copy.tanggal_selesai
        return copy
      })
    }
  }

  const handleJumlahAnggotaChange = (count: number) => {
    const num = Math.max(1, Math.min(10, count))
    let newAnggota: AnggotaMagang[] = [...(formData.anggota || [])]

    if (num > 1) {
      const extraCount = num - 1
      while (newAnggota.length < extraCount) {
        newAnggota.push({ nama: '', nim_nis: '', jurusan: '', no_hp: '' })
      }
      if (newAnggota.length > extraCount) {
        newAnggota = newAnggota.slice(0, extraCount)
      }
    } else {
      newAnggota = []
    }

    setFormData((prev: PengajuanStep1State) => ({
      ...prev,
      jumlah_anggota: num,
      anggota: newAnggota,
    }))
  }

  const handleAnggotaFieldChange = (index: number, field: keyof AnggotaMagang, value: string) => {
    const updated = [...(formData.anggota || [])]
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
      setFormData((prev: PengajuanStep1State) => ({ ...prev, anggota: updated }))
    }
  }

  const handleSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors: validationErrors } = validatePengajuanStep1(formData)
    if (!isValid) {
      setErrors(validationErrors)
      window.scrollTo({ top: 150, behavior: 'smooth' })
      return
    }

    // Simpan ke wizard context
    updateStep1(formData)

    // Lanjut ke Step 2
    router.push('/pengguna/career/step2')
  }

  const selectedBidang = bidangList.find(
    (b) => String(b.id) === String(formData.bidang_id)
  )

  return (
    <form onSubmit={handleSubmitStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`
        .form-input-control {
          width: 100%;
          padding: 0.5625rem 0.8125rem;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input-control:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }
        .form-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.3125rem;
        }
        .form-error {
          font-size: 0.75rem;
          font-weight: 600;
          color: #dc2626;
          margin-top: 0.25rem;
        }
        @media (max-width: 640px) {
          .responsive-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .responsive-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* 1. UNIT KERJA TERPILIH */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
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

        {errors.bidang_id && (
          <div style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.8125rem',
            borderRadius: '8px',
            marginBottom: '0.75rem'
          }}>
            ⚠️ {errors.bidang_id}
          </div>
        )}

        {!isChangingBidang && selectedBidang ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
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
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  {selectedBidang.nama}
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  {selectedBidang.kuota ? `${selectedBidang.kuota} kuota tersedia` : 'Kuota tersedia'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsChangingBidang(true)}
              style={{
                padding: '0.375rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Ganti
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Pilih unit kerja:
              </span>
              {selectedBidang && (
                <button
                  type="button"
                  onClick={() => setIsChangingBidang(false)}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
              )}
            </div>

            <select
              value={formData.bidang_id}
              onChange={(e) => {
                setFormData((prev: PengajuanStep1State) => ({ ...prev, bidang_id: Number(e.target.value) }))
                setIsChangingBidang(false)
                if (errors.bidang_id) setErrors((prev: Record<string, string>) => ({ ...prev, bidang_id: '' }))
              }}
              className="form-input-control"
            >
              <option value="">Pilih bidang magang</option>
              {bidangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama} (Kuota: {b.kuota ?? 'Tersedia'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. IDENTITAS AKADEMIK */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Identitas akademik
          </h3>
        </div>

        <div className="responsive-grid-2" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.875rem'
        }}>
          {/* Jenjang */}
          <div>
            <label className="form-label">
              Jenjang pendidikan <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={formData.jenjang === 'Siswa' ? 'Siswa' : 'Mahasiswa'}
              onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
              className="form-input-control"
            >
              <option value="Mahasiswa">Mahasiswa (D3 / D4 / S1 / S2)</option>
              <option value="Siswa">Siswa (SMK / SMA Kejuruan)</option>
            </select>
          </div>

          {/* NIM / NIS */}
          <div>
            <label className="form-label">
              NIM / NIS <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nomor induk mahasiswa / siswa"
              value={formData.nim_nis}
              onChange={(e) => {
                setFormData({ ...formData, nim_nis: e.target.value })
                if (errors.nim_nis) setErrors({ ...errors, nim_nis: '' })
              }}
              className="form-input-control"
            />
            {errors.nim_nis && <div className="form-error">{errors.nim_nis}</div>}
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="form-label">
              Nama lengkap <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nama sesuai identitas"
              value={formData.nama_lengkap || ''}
              onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
              className="form-input-control"
            />
          </div>

          {/* Program Studi */}
          <div>
            <label className="form-label">
              Program studi <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Jurusan atau program studi"
              value={formData.jurusan}
              onChange={(e) => {
                setFormData({ ...formData, jurusan: e.target.value })
                if (errors.jurusan) setErrors({ ...errors, jurusan: '' })
              }}
              className="form-input-control"
            />
            {errors.jurusan && <div className="form-error">{errors.jurusan}</div>}
          </div>

          {/* Asal Instansi */}
          <div>
            <label className="form-label">
              Asal instansi / perguruan tinggi <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nama universitas / institut / sekolah"
              value={formData.asal_instansi}
              onChange={(e) => {
                setFormData({ ...formData, asal_instansi: e.target.value })
                if (errors.asal_instansi) setErrors({ ...errors, asal_instansi: '' })
              }}
              className="form-input-control"
            />
            {errors.asal_instansi && <div className="form-error">{errors.asal_instansi}</div>}
          </div>

          {/* No WhatsApp */}
          <div>
            <label className="form-label">No WhatsApp</label>
            <input
              type="text"
              placeholder="08xxxxxxxxxx"
              value={formData.no_hp || ''}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              className="form-input-control"
            />
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="form-label">Jenis kelamin</label>
            <select
              value={formData.jenis_kelamin || ''}
              onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
              className="form-input-control"
            >
              <option value="">Pilih jenis kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
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
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
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

        {/* 1 Baris Catatan Info Hijau */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.75rem',
          color: '#64748b',
          marginBottom: '1rem'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Surat pengantar diunggah pada tahap dokumen</span>
        </div>

        {/* Topik / Judul Magang */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">
            Topik magang <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Fokus kegiatan atau riset yang akan dilakukan"
            value={formData.topik_magang}
            onChange={(e) => {
              setFormData({ ...formData, topik_magang: e.target.value })
              if (errors.topik_magang) setErrors({ ...errors, topik_magang: '' })
            }}
            className="form-input-control"
            style={{ resize: 'vertical', lineHeight: 1.5 }}
          />
          {errors.topik_magang && <div className="form-error">{errors.topik_magang}</div>}
        </div>

        <div className="responsive-grid-2" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.875rem',
          marginBottom: '0.875rem'
        }}>
          <div>
            <label className="form-label">
              Nomor surat pengantar <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 124/UN1.FAPET/AK/2025"
              value={formData.nomor_surat}
              onChange={(e) => {
                setFormData({ ...formData, nomor_surat: e.target.value })
                if (errors.nomor_surat) setErrors({ ...errors, nomor_surat: '' })
              }}
              className="form-input-control"
            />
            {errors.nomor_surat && <div className="form-error">{errors.nomor_surat}</div>}
          </div>

          <div>
            <label className="form-label">
              Tanggal surat pengantar <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_surat}
              onChange={(e) => {
                setFormData({ ...formData, tanggal_surat: e.target.value })
                if (errors.tanggal_surat) setErrors({ ...errors, tanggal_surat: '' })
              }}
              className="form-input-control"
            />
            {errors.tanggal_surat && <div className="form-error">{errors.tanggal_surat}</div>}
          </div>
        </div>

        {/* Tanggal Pelaksanaan & Estimasi Durasi */}
        <div className="responsive-grid-3" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '0.875rem'
        }}>
          <div>
            <label className="form-label">
              Tanggal mulai <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_mulai}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="form-input-control"
            />
            {errors.tanggal_mulai && <div className="form-error">{errors.tanggal_mulai}</div>}
          </div>

          <div>
            <label className="form-label">
              Tanggal selesai <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_selesai}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="form-input-control"
            />
            {errors.tanggal_selesai && <div className="form-error">{errors.tanggal_selesai}</div>}
          </div>

          <div>
            <label className="form-label">Estimasi durasi</label>
            <div style={{
              padding: '0.5625rem 0.8125rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '38px',
              boxSizing: 'border-box'
            }}>
              <span>{formData.durasi_bulan || 1} bulan</span>
              <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>(otomatis)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TIM & ANGGOTA */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Tim &amp; anggota
            </h3>
          </div>

          {/* Toggle Jumlah Orang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Jumlah anggota:</span>
            <select
              value={formData.jumlah_anggota}
              onChange={(e) => handleJumlahAnggotaChange(Number(e.target.value))}
              style={{
                padding: '0.3125rem 0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                outline: 'none'
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'orang (individu)' : 'orang (kelompok)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.jumlah_anggota > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>Lengkapi data {formData.jumlah_anggota - 1} anggota tim lainnya di bawah</span>
            </div>

            {formData.anggota?.map((item: AnggotaMagang, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '0.875rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem'
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                  Anggota ke-{idx + 2}
                </div>
                <div className="responsive-grid-3" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '0.625rem'
                }}>
                  <div>
                    <label className="form-label">Nama lengkap *</label>
                    <input
                      type="text"
                      placeholder="Nama anggota"
                      value={item.nama}
                      onChange={(e) => handleAnggotaFieldChange(idx, 'nama', e.target.value)}
                      className="form-input-control"
                    />
                    {errors[`anggota_${idx}_nama`] && (
                      <div className="form-error">{errors[`anggota_${idx}_nama`]}</div>
                    )}
                  </div>
                  <div>
                    <label className="form-label">NIM / NIS *</label>
                    <input
                      type="text"
                      placeholder="NIM/NIS anggota"
                      value={item.nim_nis}
                      onChange={(e) => handleAnggotaFieldChange(idx, 'nim_nis', e.target.value)}
                      className="form-input-control"
                    />
                    {errors[`anggota_${idx}_nim_nis`] && (
                      <div className="form-error">{errors[`anggota_${idx}_nim_nis`]}</div>
                    )}
                  </div>
                  <div>
                    <label className="form-label">No WhatsApp</label>
                    <input
                      type="text"
                      placeholder="08..."
                      value={item.no_hp || ''}
                      onChange={(e) => handleAnggotaFieldChange(idx, 'no_hp', e.target.value)}
                      className="form-input-control"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
          onClick={() => router.push('/pengguna/dashboard')}
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
          <span>Lanjut ke dokumen</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </form>
  )
}
