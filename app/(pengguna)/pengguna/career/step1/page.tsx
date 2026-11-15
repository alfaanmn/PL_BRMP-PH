import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bidangService } from '@/lib/services/bidang.service'
import { ApplicationStepTracker } from '@/components/forms/pengajuan/step-tracker'
import { CareerStep1Form } from '@/components/forms/pengajuan/career-step1-form'

export const dynamic = 'force-dynamic'

export default async function CareerStep1Page() {
  const supabase = await createClient()

  // Ambil user dan profil
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/career/step1')
  }

  let userProfile: any = null
  const { data: p } = await supabase
    .from('profiles')
    .select('id, name, email, asal_instansi, jurusan, no_hp, jenis_kelamin, status_peserta')
    .eq('id', user.id)
    .single()
  userProfile = p || { id: user.id, email: user.email, name: '', status_peserta: null }

  // Validasi profil lengkap: nama, asal_instansi, jurusan, no_hp, jenis_kelamin, status_peserta
  const isProfileIncomplete =
    !userProfile?.name?.trim() ||
    !userProfile?.asal_instansi?.trim() ||
    !userProfile?.jurusan?.trim() ||
    !userProfile?.no_hp?.trim() ||
    !userProfile?.jenis_kelamin?.trim() ||
    !userProfile?.status_peserta

  if (isProfileIncomplete) {
    redirect('/pengguna/profil?notice=incomplete')
  }

  // Ambil daftar bidang aktif dari database
  const { data: bidangList } = await bidangService.getPublicBidangs()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. STEPPER WIZARD */}
      <ApplicationStepTracker currentStep={1} />

      {/* 2. FORM STEP 1 */}
      <CareerStep1Form
        bidangList={bidangList || []}
        userProfile={userProfile}
      />
    </div>
  )
}
