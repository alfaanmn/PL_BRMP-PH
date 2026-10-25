'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SKMPertanyaan } from '@/types/skm.types'
import { skmService } from '@/lib/services/skm.service'

interface PesertaItem {
  id?: number | null
  nama: string
  nim_nis: string
  is_ketua: boolean
}

interface UserPengajuanItem {
  id: number
  public_id: string | null
  status: string
  bidang_nama: string
  created_at: string
  hasSubmittedSKM: boolean
  sertifikat_url?: string | null
  isKelompok?: boolean
  totalPeserta?: number
  submittedCount?: number
  hasLegacy?: boolean
  pesertas?: PesertaItem[]
  submittedPesertaKeys?: string[]
}

interface SKMFormProps {
  questions: SKMPertanyaan[]
  userPengajuans: UserPengajuanItem[]
  preselectedPengajuanId?: number | null
}

function getPesertaKey(p: { nama: string; nim_nis: string }): string {
  return `${(p.nama || '').trim().toLowerCase()}__${(p.nim_nis || '').trim().toLowerCase()}`
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
    // Default: ambil pengajuan pertama yang belum lengkap diisi SKM, atau pengajuan pertama
    const unsubmitted = userPengajuans.find((p) => !p.hasSubmittedSKM)
    return unsubmitted ? unsubmitted.id : userPengajuans[0]?.id || null
  })

  // State pelacakan responden lokal (memungkinkan mutasi reaktif di client)
  const [localSubmittedKeysMap, setLocalSubmittedKeysMap] = useState<Record<number, string[]>>(() => {
    const map: Record<number, string[]> = {}
    userPengajuans.forEach((p) => {
      map[p.id] = p.submittedPesertaKeys || []
    })
    return map
  })

  const [modeLengkapiOpsional, setModeLengkapiOpsional] = useState(false)
  const [memberSuccessNotice, setMemberSuccessNotice] = useState<string | null>(null)

  // Pengajuan aktif
  const currentPengajuan = useMemo(() => {
    return userPengajuans.find((p) => p.id === selectedPengajuanId) || null
  }, [userPengajuans, selectedPengajuanId])

  const isKelompok = currentPengajuan?.isKelompok || false
  const pesertaList: PesertaItem[] = useMemo(() => {
    if (!currentPengajuan) return []
    if (currentPengajuan.pesertas && currentPengajuan.pesertas.length > 0) {
      return currentPengajuan.pesertas
    }
    return [
      {
        id: null,
        nama: 'Pemohon Magang',
        nim_nis: '',
        is_ketua: true,
      },
    ]
  }, [currentPengajuan])

  // Set responden yang sudah mengisi
  const currentSubmittedKeys = useMemo(() => {
    if (!currentPengajuan) return new Set<string>()
    const list = localSubmittedKeysMap[currentPengajuan.id] || currentPengajuan.submittedPesertaKeys || []
    return new Set(list)
  }, [localSubmittedKeysMap, currentPengajuan])

  // Peserta yang saat ini dipilih untuk mengisi
  const [selectedPesertaKey, setSelectedPesertaKey] = useState<string>(() => {
    const unsubmitted = pesertaList.find((p) => !currentSubmittedKeys.has(getPesertaKey(p)))
    return unsubmitted ? getPesertaKey(unsubmitted) : getPesertaKey(pesertaList[0] || { nama: '', nim_nis: '' })
  })

  // Sinkronkan peserta terpilih saat pengajuan berganti
  React.useEffect(() => {
    if (!currentPengajuan) return
    const unsubmitted = pesertaList.find((p) => !currentSubmittedKeys.has(getPesertaKey(p)))
    setSelectedPesertaKey(unsubmitted ? getPesertaKey(unsubmitted) : getPesertaKey(pesertaList[0]))
    setAnswers({})
    setErrorMessage(null)
    setMemberSuccessNotice(null)
  }, [selectedPengajuanId, currentPengajuan])

  const activePeserta = useMemo(() => {
    return (
      pesertaList.find((p) => getPesertaKey(p) === selectedPesertaKey) ||
      pesertaList[0] || { id: null, nama: 'Pemohon Magang', nim_nis: '', is_ketua: true }
    )
  }, [pesertaList, selectedPesertaKey])

  const isActivePesertaSubmitted = currentSubmittedKeys.has(getPesertaKey(activePeserta))

  // Kelompok dianggap sudah lengkap jika seluruh peserta terisi ATAU pengajuan kelompok legacy (is_legacy=true)
  const isEntirePengajuanComplete = useMemo(() => {
    if (!currentPengajuan) return false
    if (!isKelompok) {
      return currentSubmittedKeys.size >= 1 || currentPengajuan.hasSubmittedSKM
    }
    // Kelompok: lengkap jika seluruh peserta terisi atau punya baris legacy
    return currentSubmittedKeys.size >= pesertaList.length || (currentPengajuan.hasLegacy && currentSubmittedKeys.size >= 1)
  }, [currentPengajuan, isKelompok, currentSubmittedKeys, pesertaList])

  // State Form Jawaban: Record<skmPertanyaanId, string>
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [unansweredHighlight, setUnansweredHighlight] = useState<number[]>([])

  // Pertanyaan pilihan ganda dan pertanyaan esai/teks berdasarkan kolom tipe dari database
  const choiceQuestions = useMemo(() => {
    return questions.filter((q) => q.tipe === 'pilihan')
  }, [questions])

  const textQuestions = useMemo(() => {
    return questions.filter((q) => q.tipe === 'teks')
  }, [questions])

  // Hitung progres pengisian butir pertanyaan
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
    setUnansweredHighlight((prev) => prev.filter((id) => id !== questionId))
    if (errorMessage) setErrorMessage(null)
  }

  // Handler update jawaban teks
  const handleTextChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }))
    if (text.trim().length > 0) {
      setUnansweredHighlight((prev) => prev.filter((id) => id !== questionId))
      if (errorMessage) setErrorMessage(null)
    }
  }

  // Ganti peserta yang dinilai (khusus kelompok)
  const handleSwitchPeserta = (peserta: PesertaItem) => {
    const key = getPesertaKey(peserta)
    setSelectedPesertaKey(key)
    setAnswers({})
    setErrorMessage(null)
    setUnansweredHighlight([])
    setMemberSuccessNotice(null)
  }

  // Handler submit formulir
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPengajuanId) {
      setErrorMessage('Silakan pilih permohonan pengajuan magang yang ingin dinilai.')
      return
    }

    if (isActivePesertaSubmitted) {
      setErrorMessage(`Peserta "${activePeserta.nama}" sudah pernah mengisi survei kepuasan.`)
      return
    }

    // 1. Validasi pertanyaan pilihan (wajib diisi)
    const missingChoiceIds: number[] = []
    choiceQuestions.forEach((q) => {
      const val = answers[q.id]
      if (!val || val.trim().length === 0) {
        missingChoiceIds.push(q.id)
      }
    })

    // 2. Validasi pertanyaan teks terbuka (wajib diisi)
    const missingTextIds: number[] = []
    textQuestions.forEach((q) => {
      const val = answers[q.id]
      if (!val || val.trim().length === 0) {
        missingTextIds.push(q.id)
      }
    })

    if (missingChoiceIds.length > 0) {
      setUnansweredHighlight([...missingChoiceIds, ...missingTextIds])
      setErrorMessage(`Mohon lengkapi seluruh pertanyaan pilihan wajib (Terdapat ${missingChoiceIds.length} butir pertanyaan yang belum dipilih).`)
      const firstMissingElem = document.getElementById(`question-card-${missingChoiceIds[0]}`)
      if (firstMissingElem) {
        firstMissingElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    if (missingTextIds.length > 0) {
      setUnansweredHighlight(missingTextIds)
      setErrorMessage('Kolom saran dan masukan untuk Layanan BRMP Pengelola Hasil wajib diisi.')
      const textElem = document.getElementById(`question-card-${missingTextIds[0]}`)
      if (textElem) {
        textElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    // Anti double-click
    setSubmitting(true)
    setErrorMessage(null)

    try {
      // Susun payload submission dengan identitas responden terikat
      const formattedAnswers = questions.map((q) => ({
        skmPertanyaanId: q.id,
        jawaban: (answers[q.id] || '').trim(),
      }))

      const response = await skmService.submitSKMJawaban({
        pengajuanId: selectedPengajuanId,
        pesertaNama: activePeserta.nama,
        pesertaNim: activePeserta.nim_nis,
        isKetua: activePeserta.is_ketua,
        anggotaId: activePeserta.id || null,
        isAnonim: false,
        answers: formattedAnswers,
      })

      if (response.success) {
        const submittedKey = getPesertaKey(activePeserta)
        const updatedKeys = Array.from(new Set([...Array.from(currentSubmittedKeys), submittedKey]))

        setLocalSubmittedKeysMap((prev) => ({
          ...prev,
          [selectedPengajuanId]: updatedKeys,
        }))

        // Cek apakah sekarang sudah seluruh peserta terisi
        const isNowAllDone = isKelompok
          ? updatedKeys.length >= pesertaList.length
          : true

        if (isNowAllDone) {
          setSubmittedSuccess(true)
          setModeLengkapiOpsional(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          // Masih ada anggota yang belum mengisi
          setMemberSuccessNotice(`✅ Jawaban SKM atas nama "${activePeserta.nama}" berhasil disimpan! Silakan lanjutkan untuk peserta berikutnya.`)
          // Pindahkan otomatis ke peserta berikutnya yang belum mengisi
          const nextUnsubmitted = pesertaList.find((p) => !updatedKeys.includes(getPesertaKey(p)))
          if (nextUnsubmitted) {
            setSelectedPesertaKey(getPesertaKey(nextUnsubmitted))
          }
          setAnswers({})
          setUnansweredHighlight([])
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
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
  // KONDISI TAMPILAN SUKSES / TELAH LENGKAP:
  if ((submittedSuccess || isEntirePengajuanComplete) && !modeLengkapiOpsional) {
    const isSelesai = currentPengajuan?.status === 'Selesai'
    const hasSertifikat = Boolean(currentPengajuan?.sertifikat_url)

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
          {submittedSuccess ? 'Terima Kasih Atas Penilaian Anda!' : 'Survei Kepuasan Telah Lengkap'}
        </h2>

        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
          {submittedSuccess
            ? 'Seluruh butir penilaian survei kepuasan telah berhasil disimpan secara resmi. Partisipasi Anda sangat berharga bagi BRMP Pengelola Hasil Kementerian Pertanian RI.'
            : isKelompok
            ? `Seluruh responden (${currentSubmittedKeys.size} dari ${pesertaList.length} peserta) telah mengisi kuesioner SKM untuk pengajuan ini.`
            : `Survei Kepuasan Masyarakat untuk pengajuan #${selectedPengajuanId} (${currentPengajuan?.bidang_nama || 'Magang BRMP'}) telah lengkap tercatat dalam sistem kami.`}
        </p>

        {/* Info Card Pengajuan */}
        {currentPengajuan && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            textAlign: 'left',
            marginBottom: '1.5rem',
            fontSize: '0.8125rem'
          }}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.375rem' }}>
              Rincian Permohonan:
            </div>
            <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• ID Pengajuan: <strong>#{currentPengajuan.id}</strong> {currentPengajuan.public_id ? `(${currentPengajuan.public_id})` : ''}</div>
              <div>• Bidang: <strong>{currentPengajuan.bidang_nama}</strong></div>
              <div>• Status Magang: <span style={{ color: '#16a34a', fontWeight: 600 }}>{currentPengajuan.status}</span></div>
              <div>
                • Status SKM:{' '}
                <span style={{ color: '#16a34a', fontWeight: 600 }}>
                  ✓ {isKelompok ? `Lengkap (${currentSubmittedKeys.size}/${pesertaList.length} Peserta)` : 'Selesai / Lengkap'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Info Sertifikat Status */}
        {isSelesai && (
          <div style={{
            backgroundColor: hasSertifikat ? '#f0fdf4' : '#fffbeb',
            border: hasSertifikat ? '1px solid #bbf7d0' : '1px solid #fde68a',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            textAlign: 'left',
            marginBottom: '1.75rem',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>{hasSertifikat ? '🎓' : '⏳'}</span>
            <div>
              <div style={{ fontWeight: 700, color: hasSertifikat ? '#166534' : '#92400e' }}>
                {hasSertifikat ? 'Sertifikat Magang Siap Diambil' : 'Sertifikat Sedang Dalam Proses Penerbitan'}
              </div>
              <div style={{ color: hasSertifikat ? '#15803d' : '#b45309', fontSize: '0.75rem', marginTop: '2px' }}>
                {hasSertifikat
                  ? 'Kuesioner SKM telah lengkap dan sertifikat magang resmi Anda telah dapat diunduh.'
                  : 'Kuesioner SKM telah lengkap. Sertifikat magang resmi akan segera diunggah oleh administrator BRMP.'}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isKelompok && currentSubmittedKeys.size < pesertaList.length && (
            <button
              type="button"
              onClick={() => {
                setModeLengkapiOpsional(true)
                setSubmittedSuccess(false)
              }}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: '#0F6E56',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(15, 110, 86, 0.25)'
              }}
            >
              + Lengkapi Isian Anggota Lain ({currentSubmittedKeys.size}/{pesertaList.length})
            </button>
          )}

          <Link
            href={isSelesai && hasSertifikat ? '/pengguna/sertifikat' : '/pengguna/riwayat'}
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
            {isSelesai && hasSertifikat ? 'Lihat & Ambil Sertifikat' : 'Lihat Riwayat Pengajuan'}
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
        .skm-bidang-banner {
          background-color: #0F6E56;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .skm-bidang-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>

      {/* Notifikasi anggota berhasil diisi */}
      {memberSuccessNotice && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          padding: '0.875rem 1.25rem',
          color: '#065f46',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          {memberSuccessNotice}
        </div>
      )}

      {/* 1. Standalone Banner Hijau Info Bidang Magang */}
      {currentPengajuan && (
        <div className="skm-bidang-banner">
          {/* Sisi Kiri: Label Uppercase & Nama Bidang */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '0.04em',
              marginBottom: '4px'
            }}>
              Sedang menilai pelayanan pengajuan magang
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#ffffff',
              lineHeight: 1.4
            }}>
              {currentPengajuan.bidang_nama}
            </div>
          </div>

          {/* Sisi Kanan: Badge Pill Nomor Pengajuan / Selector */}
          <div>
            {userPengajuans.length > 1 ? (
              <select
                value={selectedPengajuanId || ''}
                onChange={(e) => setSelectedPengajuanId(Number(e.target.value))}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {userPengajuans.map((p) => (
                  <option key={p.id} value={p.id} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                    Pengajuan #{p.id} — {p.bidang_nama}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}>
                Pengajuan #{currentPengajuan.id}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. KHUSUS KELOMPOK: KARTU PROGRES RESPONDEN & PEMILIH PESERTA */}
      {isKelompok && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F6E56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pengajuan Kelompok ({pesertaList.length} Orang)
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>
                Progres Responden: {currentSubmittedKeys.size} dari {pesertaList.length} Terisi
              </h3>
            </div>

            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: isEntirePengajuanComplete ? '#ecfdf5' : '#fffbeb',
              color: isEntirePengajuanComplete ? '#166534' : '#b45309',
              border: `1px solid ${isEntirePengajuanComplete ? '#bbf7d0' : '#fde68a'}`,
            }}>
              {isEntirePengajuanComplete ? '✓ SKM Lengkap (Sertifikat Terbuka)' : '⏳ Belum Lengkap (Sertifikat Terkunci)'}
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Kuesioner SKM diisi satu kali per peserta atas nama masing-masing. Silakan pilih peserta yang ingin diisi kuesionernya:
          </p>

          {/* Selector Peserta (Chips) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
            {pesertaList.map((p, idx) => {
              const key = getPesertaKey(p)
              const isSelected = key === selectedPesertaKey
              const isDone = currentSubmittedKeys.has(key)

              return (
                <div
                  key={key || idx}
                  onClick={() => handleSwitchPeserta(p)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: isSelected
                      ? '2px solid #0F6E56'
                      : isDone
                      ? '1px solid #bbf7d0'
                      : '1px solid #cbd5e1',
                    backgroundColor: isSelected
                      ? '#f0fdf4'
                      : isDone
                      ? '#f8fafc'
                      : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 0 2px rgba(15, 110, 86, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: p.is_ketua ? '#0F6E56' : '#64748b', textTransform: 'uppercase' }}>
                      Responden #{idx + 1} • {p.is_ketua ? 'Ketua' : 'Anggota'}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: isDone ? '#16a34a' : '#d97706',
                    }}>
                      {isDone ? 'Sudah Diisi ✓' : 'Belum Diisi'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                    {p.nama}
                  </div>
                  {p.nim_nis && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      NIM: {p.nim_nis}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Info Status Peserta Aktif */}
          {isActivePesertaSubmitted ? (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>✓</span>
              <span>
                Peserta <strong>{activePeserta.nama}</strong> sudah selesai mengisi kuesioner SKM ini. Silakan klik peserta lain di atas jika ada yang belum mengisi.
              </span>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              color: '#334155',
            }}>
              Sedang mengisi survei atas nama: <strong>{activePeserta.nama}</strong> ({activePeserta.is_ketua ? 'Ketua Kelompok' : 'Anggota'})
            </div>
          )}
        </div>
      )}

      {/* 1. Standalone Banner Hijau Info Bidang Magang */}
      {currentPengajuan && (
        <div className="skm-bidang-banner">
          {/* Sisi Kiri: Label Uppercase & Nama Bidang */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '0.04em',
              marginBottom: '4px'
            }}>
              Sedang menilai pelayanan pengajuan magang
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#ffffff',
              lineHeight: 1.4
            }}>
              {currentPengajuan.bidang_nama}
            </div>
          </div>

          {/* Sisi Kanan: Badge Pill Nomor Pengajuan / Selector */}
          <div>
            {userPengajuans.length > 1 ? (
              <select
                value={selectedPengajuanId || ''}
                onChange={(e) => setSelectedPengajuanId(Number(e.target.value))}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {userPengajuans.map((p) => (
                  <option key={p.id} value={p.id} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                    Pengajuan #{p.id} — {p.bidang_nama}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}>
                Pengajuan #{currentPengajuan.id}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Header Bagian B & Petunjuk Pengisian Sesuai Kuesioner IKM 2026 */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: '#0F6E56',
          letterSpacing: '0.04em',
          marginBottom: '4px'
        }}>

        </div>
        <h2 style={{
          fontSize: '1.0625rem',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 0.5rem 0',
          lineHeight: 1.4
        }}>
          PENDAPAT RESPONDEN TENTANG PELAYANAN
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#475569',
          margin: '0 0 0.5rem 0',
          lineHeight: 1.5
        }}>
          <strong>Petunjuk:</strong> (Pilih salah satu sesuai jawaban masyarakat/responden)
        </p>
        <div style={{
          fontSize: '0.8125rem',
          color: '#dc2626',
          fontWeight: 500
        }}>
          Tanda * = wajib diisi.
        </div>
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

          const options = isValidOpsi ? q.opsi! : [
            { skor: 1, label: 'Tidak Baik' },
            { skor: 2, label: 'Kurang Baik' },
            { skor: 3, label: 'Baik' },
            { skor: 4, label: 'Sangat Baik' },
          ]
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

      {/* 4. Pertanyaan Terbuka: Saran dan Masukan (Wajib) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {textQuestions.map((q) => {
          const currentText = answers[q.id] || ''
          const isHighlighted = unansweredHighlight.includes(q.id)

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

              {/* Textarea Input */}
              <textarea
                rows={4}
                className="skm-textarea"
                placeholder="Tuliskan saran dan masukan Anda untuk Layanan BRMP Pengelola Hasil..."
                value={currentText}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                maxLength={500}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.35rem',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                <span style={{ color: currentText.trim().length === 0 ? '#ef4444' : '#16a34a' }}>
                  {currentText.trim().length === 0 ? '* Kolom ini wajib diisi' : '✓ Telah terisi'}
                </span>
                <span>{currentText.length} / 500 karakter</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 5. Footer Aksi Submit */}
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
          <span style={{ fontSize: '0.8125rem', color: answeredCount < totalQuestions ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
            {answeredCount < totalQuestions
              ? `* Mohon lengkapi seluruh ${totalQuestions} butir pertanyaan (${answeredCount} dari ${totalQuestions} terisi).`
              : `✓ Seluruh ${totalQuestions} butir pertanyaan telah lengkap terisi.`}
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
            disabled={submitting || isActivePesertaSubmitted || answeredCount < totalQuestions}
            style={{
              padding: '0.625rem 1.5rem',
              backgroundColor: submitting || isActivePesertaSubmitted || answeredCount < totalQuestions ? '#94a3b8' : '#16a34a',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: submitting || isActivePesertaSubmitted || answeredCount < totalQuestions ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: submitting || answeredCount < totalQuestions ? 'none' : '0 2px 6px rgba(22, 163, 74, 0.25)',
              transition: 'all 0.15s ease'
            }}
            title={answeredCount < totalQuestions ? `Lengkapi ${totalQuestions - answeredCount} butir pertanyaan yang belum diisi` : 'Kirim survei kepuasan'}
          >
            {submitting ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                <span>Mengirim Jawaban...</span>
              </>
            ) : (
              <>
                <span>{isKelompok ? `Kirim Survei untuk ${activePeserta.nama}` : 'Kirim Survei Kepuasan'}</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
