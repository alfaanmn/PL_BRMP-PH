'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  PengajuanStep1State,
  PengajuanStep2State,
  PengajuanWizardState,
} from '@/types/pengajuan.types'

const STORAGE_KEY = 'sim_magang_wizard_session'

const defaultStep1: PengajuanStep1State = {
  bidang_id: '',
  jenjang: 'Mahasiswa',
  asal_instansi: '',
  jurusan: '',
  nim_nis: '',
  topik_magang: '',
  nomor_surat: '',
  tanggal_surat: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  durasi_bulan: 1,
  jumlah_anggota: 1,
  anggota: [],
  nama_lengkap: '',
  no_hp: '',
  alamat: '',
  jenis_kelamin: '',
}

const defaultStep2: PengajuanStep2State = {
  surat_pengantar_url: '',
  surat_pengantar_name: '',
  proposal_url: '',
  proposal_name: '',
  dokumen_tambahan_url: '',
  dokumen_tambahan_name: '',
}

interface WizardContextType {
  state: PengajuanWizardState
  updateStep1: (data: Partial<PengajuanStep1State>) => void
  updateStep2: (data: Partial<PengajuanStep2State>) => void
  setPernyataanBenar: (val: boolean) => void
  resetWizard: () => void
  isLoaded: boolean
}

const WizardContext = createContext<WizardContextType | null>(null)

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PengajuanWizardState>({
    step1: defaultStep1,
    step2: defaultStep2,
    pernyataan_benar: false,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Baca session state saat mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState((prev) => ({
          ...prev,
          ...parsed,
          step1: { ...prev.step1, ...(parsed.step1 || {}) },
          step2: { ...prev.step2, ...(parsed.step2 || {}) },
        }))
      }
    } catch (e) {
      console.error('Failed to load session storage:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Simpan ke session storage setiap state berubah
  const saveToSession = (newState: PengajuanWizardState) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to save to session storage:', e)
    }
  }

  const updateStep1 = (data: Partial<PengajuanStep1State>) => {
    setState((prev) => {
      const next = {
        ...prev,
        step1: { ...prev.step1, ...data },
      }
      saveToSession(next)
      return next
    })
  }

  const updateStep2 = (data: Partial<PengajuanStep2State>) => {
    setState((prev) => {
      const next = {
        ...prev,
        step2: { ...prev.step2, ...data },
      }
      saveToSession(next)
      return next
    })
  }

  const setPernyataanBenar = (val: boolean) => {
    setState((prev) => {
      const next = { ...prev, pernyataan_benar: val }
      saveToSession(next)
      return next
    })
  }

  const resetWizard = () => {
    const fresh: PengajuanWizardState = {
      step1: defaultStep1,
      step2: defaultStep2,
      pernyataan_benar: false,
    }
    setState(fresh)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (e) {}
  }

  return (
    <WizardContext.Provider
      value={{
        state,
        updateStep1,
        updateStep2,
        setPernyataanBenar,
        resetWizard,
        isLoaded,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function usePengajuanWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) {
    throw new Error('usePengajuanWizard must be used within a WizardProvider')
  }
  return ctx
}
