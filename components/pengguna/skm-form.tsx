'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SKMPertanyaan } from '@/types/skm.types'
import { skmService } from '@/lib/services/skm.service'

interface UserPengajuanItem {
  id: number
  public_id: string | null
  status: string
  bidang_nama: string
  created_at: string
  hasSubmittedSKM: boolean
}

interface SKMFormProps {
  questions: SKMPertanyaan[]
  userPengajuans: UserPengajuanItem[]
  preselectedPengajuanId?: number | null
}

export function SKMForm({
  questions,
  userPengajuans,
  preselectedPengajuanId,
}: SKMFormProps) {
  const router = useRouter()

  // 1. Tentukan Pengajuan yang dipilih
  const [selectedPengajuanId, setSelectedPengajuanId] = useState<number | null>(() => {
    if (preselectedPengajuanId && userPengajuans.some((p) => p.id === preselectedPengajuanId)) {
      return preselectedPengajuanId
    }
    // Default: ambil pengajuan pertama yang belum diisi SKM, atau pengajuan pertama
    const unsubmitted = userPengajuans.find((p) => !p.hasSubmittedSKM)
    return unsubmitted ? unsubmitted.id : userPengajuans[0]?.id || null
  })

  // State Form Jawaban: Record<skmPertanyaanId, string>
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [unansweredHighlight, setUnansweredHighlight] = useState<number[]>([])

  // Cek apakah pengajuan yang dipilih saat ini sudah pernah diisi
  const currentPengajuan = useMemo(() => {
    return userPengajuans.find((p) => p.id === selectedPengajuanId) || null
  }, [userPengajuans, selectedPengajuanId])

  const isAlreadySubmitted = currentPengajuan?.hasSubmittedSKM || false

  // Pertanyaan pilihan ganda dan pertanyaan esai/teks berdasarkan kolom tipe dari database
  const choiceQuestions = useMemo(() => {
    return questions.filter((q) => q.tipe === 'pilihan')
  }, [questions])

  const textQuestions = useMemo(() => {
    return questions.filter((q) => q.tipe === 'teks')
  }, [questions])

  // Hitung progres pengisian
  const totalQuestions = questions.length
  const answeredCount = useMemo(() => {
    return questions.reduce((acc, q) => {
      const val = answers[q.id]
      return val && val.trim().length > 0 ? acc + 1 : acc
    }, 0)
  }, [questions, answers])

  const progressPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  // Handler update jawaban pilihan
  const handleSelectOption = (questionId: number, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: String(score),
    }))
    // Bersihkan highlight error pada butir ini
    setUnansweredHighlight((prev) => prev.filter((id) => id !== questionId))
    if (errorMessage) setErrorMessage(null)
  }

  // Handler update jawaban teks
  const handleTextChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }))
  }

  // Handler submit formulir
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPengajuanId) {
      setErrorMessage('Silakan pilih permohonan pengajuan magang yang ingin dinilai.')
      return
    }

    if (isAlreadySubmitted) {
      setErrorMessage('Survei untuk pengajuan ini sudah selesai diisi sebelumnya.')
      return
    }

    // Validasi pertanyaan pilihan 1–13 (wajib diisi)
    const missingChoiceIds: number[] = []
    choiceQuestions.forEach((q) => {
      const val = answers[q.id]
      if (!val || val.trim().length === 0) {
        missingChoiceIds.push(q.id)
      }
    })

    if (missingChoiceIds.length > 0) {
      setUnansweredHighlight(missingChoiceIds)
      setErrorMessage(`Mohon lengkapi seluruh pertanyaan pilihan wajib (Terdapat ${missingChoiceIds.length} butir yang belum dipilih).`)
      // Scroll ke butir pertama yang belum dijawab
      const firstMissingElem = document.getElementById(`question-card-${missingChoiceIds[0]}`)
      if (firstMissingElem) {
        firstMissingElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      // Susun payload submission
      const formattedAnswers = questions.map((q) => ({
        skmPertanyaanId: q.id,
        jawaban: answers[q.id] || '',
      }))

      const response = await skmService.submitSKMJawaban({
        pengajuanId: selectedPengajuanId,
        answers: formattedAnswers,
      })

      if (response.success) {
        setSubmittedSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setErrorMessage(response.error?.message || 'Gagal mengirim survei kepuasan. Silakan coba kembali.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memproses pengiriman.'
      setErrorMessage(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // JIKA SUDAH PERNAH DIISI ATAU BARU SAJA SUKSES SUBMIT
  if (submittedSuccess || isAlreadySubmitted) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
        maxWidth: '680px',
        margin: '0 auto'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          color: '#16a34a',
          fontSize: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          border: '1px solid #bbf7d0'
        }}>
          ✓
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
          {submittedSuccess ? 'Terima Kasih Atas Penilaian Anda!' : 'Survei Kepuasan Telah Diisi'}
        </h2>

        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
          {submittedSuccess
            ? 'Penilaian dan masukan Anda telah tersimpan secara resmi. Partisipasi Anda sangat berharga dalam meningkatkan mutu pelayanan publik BRMP Pengelola Hasil Kementerian Pertanian RI.'
            : `Survei Kepuasan Masyarakat untuk pengajuan #${selectedPengajuanId} (${currentPengajuan?.bidang_nama || 'Magang BRMP'}) telah tercatat dalam sistem kami.`}
        </p>

        {/* Info Card Pengajuan */}
        {currentPengajuan && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            textAlign: 'left',
            marginBottom: '1.75rem',
            fontSize: '0.8125rem'
          }}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
              Rincian Pengajuan:
            </div>
            <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• ID Pengajuan: <strong>#{currentPengajuan.id}</strong> {currentPengajuan.public_id ? `(${currentPengajuan.public_id})` : ''}</div>
              <div>• Bidang: <strong>{currentPengajuan.bidang_nama}</strong></div>
              <div>• Status: <span style={{ color: '#16a34a', fontWeight: 600 }}>{currentPengajuan.status}</span></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            href="/pengguna/riwayat"
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
            }}
          >
            Lihat Riwayat Pengajuan
          </Link>

          <Link
            href="/pengguna/dashboard"
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .option-card-vertical {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.625rem 1rem;
          min-height: 44px;
          background-color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.15s ease;
          user-select: none;
          box-sizing: border-box;
        }
        .option-card-vertical:hover {
          border-color: #86efac;
          background-color: #f8fafc;
        }
        .option-card-vertical.selected {
          border-color: #16a34a;
          background-color: #ecfdf5;
          box-shadow: 0 0 0 1px #16a34a;
        }
        .option-num-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid #cbd5e1;
          background-color: #ffffff;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .option-card-vertical.selected .option-num-circle {
          border-color: #16a34a;
          background-color: #16a34a;
          color: #ffffff;
          font-weight: 700;
        }
        .skm-textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.75rem;
          font-family: inherit;
          font-size: 0.875rem;
          color: #0f172a;
          background-color: #ffffff;
          box-sizing: border-box;
          outline: none;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .skm-textarea:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }
      `}</style>

      {/* 1. Header Banner & Selector Pengajuan */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Banner Identitas Kuesioner */}
        <div style={{
          borderLeft: '4px solid #16a34a',
          paddingLeft: '1rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 0.25rem 0',
            letterSpacing: '0.01em'
          }}>
            PENDAPAT RESPONDEN TENTANG PELAYANAN BRMP
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
            (Pilih salah satu jawaban yang paling mencerminkan pengalaman Anda)
          </p>
        </div>

        {/* Pemilihan Pengajuan Magang (Jika user memiliki lebih dari 1 permohonan) */}
        {userPengajuans.length > 0 && (
          <div style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Pelayanan Pengajuan Magang:
              </span>
            </div>

            {userPengajuans.length === 1 ? (
              <div style={{
                fontSize: '0.8125rem',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <strong>#{userPengajuans[0].id}</strong> — {userPengajuans[0].bidang_nama}
              </div>
            ) : (
              <select
                value={selectedPengajuanId || ''}
                onChange={(e) => setSelectedPengajuanId(Number(e.target.value))}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {userPengajuans.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} — {p.bidang_nama} {p.hasSubmittedSKM ? '(Sudah Mengisi)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* 2. Floating Sticky Progress Bar */}
      <div style={{
        position: 'sticky',
        top: '1rem',
        zIndex: 20,
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1.25rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
            Progres Pengisian:
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: progressPercentage === 100 ? '#ecfdf5' : '#f1f5f9',
            color: progressPercentage === 100 ? '#16a34a' : '#475569',
            border: progressPercentage === 100 ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
          }}>
            {answeredCount} / {totalQuestions} Butir ({progressPercentage}%)
          </span>
        </div>

        {/* Progress bar visual */}
        <div style={{
          flex: 1,
          minWidth: '140px',
          maxWidth: '300px',
          height: '8px',
          backgroundColor: '#f1f5f9',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            backgroundColor: '#16a34a',
            transition: 'width 0.25s ease'
          }} />
        </div>
      </div>

      {/* Error Alert Message */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: '#b91c1c',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Daftar Pertanyaan Pilihan Ganda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {choiceQuestions.map((q) => {
          const isHighlighted = unansweredHighlight.includes(q.id)
          const isValidOpsi =
            Array.isArray(q.opsi) &&
            q.opsi.length === 4 &&
            q.opsi.every((o) => typeof o.skor === 'number' && typeof o.label === 'string' && o.label.trim().length > 0)

          const options = isValidOpsi ? q.opsi! : []
          const selectedScoreStr = answers[q.id] || ''

          return (
            <div
              key={q.id}
              id={`question-card-${q.id}`}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: isHighlighted ? '2px solid #ef4444' : '1px solid #e2e8f0',
                padding: '1.25rem 1.5rem',
                boxShadow: isHighlighted ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            >
              {/* Header Butir Pertanyaan */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '1rem' }}>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#02482e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {q.urutan}
                </span>

                <div style={{ flex: 1 }}>
                  {q.unsur && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#16a34a',
                      backgroundColor: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '0.35rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      Unsur: {q.unsur}
                    </span>
                  )}
                  <h3 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: 0,
                    lineHeight: 1.45
                  }}>
                    {q.pertanyaan} <span style={{ color: '#ef4444' }}>*</span>
                  </h3>
                </div>
              </div>

              {/* 4 Pilihan Opsi Jawaban (berasal dari q.opsi di database) atau Warning jika belum valid */}
              {isValidOpsi ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  {options.map((opt) => {
                    const isSelected = selectedScoreStr === String(opt.skor)
                    return (
                      <div
                        key={opt.skor}
                        onClick={() => handleSelectOption(q.id, opt.skor)}
                        className={`option-card-vertical ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="option-num-circle">
                          {opt.skor}
                        </div>
                        <span style={{
                          fontSize: '0.875rem',
                          color: isSelected ? '#15803d' : '#334155',
                          fontWeight: isSelected ? 500 : 400,
                          lineHeight: 1.4,
                        }}>
                          {opt.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  color: '#b45309',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>⚠️</span>
                  <span>Pilihan jawaban untuk butir ini belum dikonfigurasi dengan benar oleh Administrator.</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 4. Pertanyaan Masukan Teks Bebas (Q14 & Q15) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {textQuestions.map((q) => {
          const currentText = answers[q.id] || ''

          return (
            <div
              key={q.id}
              id={`question-card-${q.id}`}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              {/* Header Butir */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#02482e',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {q.urutan}
                </span>

                <div style={{ flex: 1 }}>
                  {q.unsur && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#16a34a',
                      backgroundColor: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '0.35rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      Unsur: {q.unsur}
                    </span>
                  )}
                  <h3 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: 0,
                    lineHeight: 1.45
                  }}>
                    {q.pertanyaan}
                  </h3>
                </div>
              </div>

              {/* Textarea Input */}
              <textarea
                rows={3}
                className="skm-textarea"
                placeholder={
                  q.urutan === 14
                    ? 'Tuliskan hal-hal yang paling memuaskan Anda selama pelaksanaan pelayanan/magang...'
                    : 'Tuliskan kritik, saran, atau masukan untuk perbaikan kualitas layanan ke depan...'
                }
                value={currentText}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                maxLength={500}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '0.35rem',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                {currentText.length} / 500 karakter
              </div>
            </div>
          )
        })}
      </div>

      {/* 5. Pilihan Identitas Responden (Anonim vs Tampilkan Nama) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Identitas Responden
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
            Tentukan preferensi tampilan identitas Anda pada laporan hasil survei:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {/* Opsi 1: Anonim (Default) */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              name="identitas_responden"
              value="anonim"
              defaultChecked
              style={{ marginTop: '3px', accentColor: '#16a34a' }}
            />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#02482e' }}>
                🔒 Anonim (Direkomendasikan)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                Nama dan identitas pribadi Anda dirahasiakan pada rekapitulasi penilaian.
              </div>
            </div>
          </label>

          {/* Opsi 2: Tampilkan Nama */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              name="identitas_responden"
              value="tampilkan"
              style={{ marginTop: '3px', accentColor: '#16a34a' }}
            />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                👤 Tampilkan Nama
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Nama pemohon magang Anda akan ditampilkan kepada administrator BRMP.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 6. Footer Aksi Submit */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Pastikan seluruh pertanyaan bertanda (<span style={{ color: '#ef4444' }}>*</span>) telah terisi dengan benar.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/pengguna/riwayat"
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={submitting || isAlreadySubmitted}
            style={{
              padding: '0.625rem 1.5rem',
              backgroundColor: submitting || isAlreadySubmitted ? '#94a3b8' : '#16a34a',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: submitting || isAlreadySubmitted ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: submitting ? 'none' : '0 2px 6px rgba(22, 163, 74, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {submitting ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                <span>Mengirim Jawaban...</span>
              </>
            ) : (
              <>
                <span>Kirim Survei Kepuasan</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
