'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SKMReminderModalProps {
  pengajuan: {
    id: number
    public_id?: string | null
    bidang_nama?: string | null
  }
}

export function SKMReminderModal({ pengajuan }: SKMReminderModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!pengajuan?.id) return

    // Cek apakah pengguna sudah menunda pengingat untuk sesi browser ini
    const dismissedKey = `skm_reminder_dismissed_${pengajuan.id}`
    const isDismissed = sessionStorage.getItem(dismissedKey)

    if (!isDismissed) {
      setIsOpen(true)
    }
  }, [pengajuan?.id])

  if (!isOpen) return null

  const handleDismiss = () => {
    if (pengajuan?.id) {
      sessionStorage.setItem(`skm_reminder_dismissed_${pengajuan.id}`, 'true')
    }
    setIsOpen(false)
  }

  const handleFillNow = () => {
    setIsOpen(false)
    router.push(`/pengguna/skm?pengajuan_id=${pengajuan.id}`)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header Visual Bar */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white relative">
          <button
            onClick={handleDismiss}
            aria-label="Tutup modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                <svg className="w-3 h-3 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Periode Magang Selesai
              </span>
              <h2 id="skm-modal-title" className="text-lg font-bold text-white mt-0.5">
                Survei Kepuasan Masyarakat (SKM)
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Selamat! Masa magang Anda pada bidang{' '}
            <strong className="text-slate-900 font-semibold">
              {pengajuan.bidang_nama || 'Bidang Magang BRMP'}
            </strong>{' '}
            telah selesai.
          </p>

          <div className="mt-4 p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-800 leading-relaxed flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold block mb-0.5">Tahap Akhir Magang & Penerbitan Sertifikat</span>
              Mohon luangkan waktu 3–5 menit untuk mengisi 17 butir instrumen evaluasi kepuasan layanan magang. Jawaban Anda sangat berharga bagi peningkatan mutu layanan kami.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleFillNow}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              Isi SKM Sekarang
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
