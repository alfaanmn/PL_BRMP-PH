'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  PengajuanStep1State,
  PengajuanStep2State,
  PengajuanWizardState,
} from '@/types/pengajuan.types'
import { createClient } from '@/lib/supabase/client'

const STORAGE_PREFIX = 'sim_magang_wizard_session_'
const LEGACY_STORAGE_KEY = 'sim_magang_wizard_session'

/**
 * Membersihkan semua draft wizard magang di sessionStorage
 * Hanya menghapus key yang memiliki prefix sim_magang_wizard_session_ dan legacy key
 */
export function clearAllWizardSessionDrafts() {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith(STORAGE_PREFIX) || key === LEGACY_STORAGE_KEY)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k))
  } catch (err) {
    console.warn('Gagal membersihkan draft wizard session:', err)
  }
}

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
  idempotencyKey: string
  updateStep1: (data: Partial<PengajuanStep1State>) => void
  updateStep2: (data: Partial<PengajuanStep2State>) => void
  setPernyataanBenar: (val: boolean) => void
  resetWizard: () => void
  regenerateIdempotencyKey: () => string
  isLoaded: boolean
}

const WizardContext = createContext<WizardContextType | null>(null)

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PengajuanWizardState>({
    step1: defaultStep1,
    step2: defaultStep2,
    pernyataan_benar: false,
  })
  const [idempotencyKey, setIdempotencyKey] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const currentUserIdRef = useRef<string | null>(null)

  // Dapatkan storage key dinamis berbasis userId
  const getStorageKey = (uid: string | null) => {
    return uid ? `${STORAGE_PREFIX}${uid}` : `${STORAGE_PREFIX}anon`
  }

  // 1. Inisialisasi Auth & Listener Perubahan Sesi
  useEffect(() => {
    const supabase = createClient()

    // Ambil user saat awal mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      const uid = user?.id || null
      currentUserIdRef.current = uid
      setUserId(uid)
      loadDraftForUser(uid)
    })

    // Listener auth state change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUid = session?.user?.id || null

      if (event === 'SIGNED_IN' && newUid) {
        // Hapus draft HANYA jika ref TIDAK null DAN berbeda dengan user baru
        // (Mencegah penghapusan saat refresh halaman atau tab kembali difokuskan)
        if (currentUserIdRef.current !== null && currentUserIdRef.current !== newUid) {
          clearAllWizardSessionDrafts()
          resetWizardInternal()
        }
        currentUserIdRef.current = newUid
        setUserId(newUid)
        loadDraftForUser(newUid)
      } else if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null
        setUserId(null)
        clearAllWizardSessionDrafts()
        resetWizardInternal()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. Baca draft dari storage untuk user tertentu
  const loadDraftForUser = (uid: string | null) => {
    try {
      const key = getStorageKey(uid)
      const saved = sessionStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState({
          step1: { ...defaultStep1, ...(parsed.step1 || {}) },
          step2: { ...defaultStep2, ...(parsed.step2 || {}) },
          pernyataan_benar: Boolean(parsed.pernyataan_benar),
        })
        if (parsed.idempotencyKey) {
          setIdempotencyKey(parsed.idempotencyKey)
        } else {
          const freshKey = generateUUID()
          setIdempotencyKey(freshKey)
        }
      } else {
        const freshKey = generateUUID()
        setIdempotencyKey(freshKey)
      }
    } catch (e) {
      console.error('Failed to load session storage for user:', e)
      setIdempotencyKey(generateUUID())
    } finally {
      setIsLoaded(true)
    }
  }

  // 3. Simpan ke session storage spesifik user
  const saveToSession = (newState: PengajuanWizardState, keyToSave?: string) => {
    try {
      const storageKey = getStorageKey(userId)
      const dataToSave = {
        ...newState,
        idempotencyKey: keyToSave || idempotencyKey,
      }
      sessionStorage.setItem(storageKey, JSON.stringify(dataToSave))
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

  const resetWizardInternal = () => {
    const freshKey = generateUUID()
    const fresh: PengajuanWizardState = {
      step1: defaultStep1,
      step2: defaultStep2,
      pernyataan_benar: false,
    }
    setState(fresh)
    setIdempotencyKey(freshKey)
  }

  const resetWizard = () => {
    resetWizardInternal()
    try {
      const storageKey = getStorageKey(userId)
      sessionStorage.removeItem(storageKey)
    } catch (e) {}
  }

  const regenerateIdempotencyKey = () => {
    const freshKey = generateUUID()
    setIdempotencyKey(freshKey)
    saveToSession(state, freshKey)
    return freshKey
  }

  return (
    <WizardContext.Provider
      value={{
        state,
        idempotencyKey,
        updateStep1,
        updateStep2,
        setPernyataanBenar,
        resetWizard,
        regenerateIdempotencyKey,
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
