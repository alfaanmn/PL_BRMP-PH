import React from 'react'
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

  let userProfile: any = null
  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('id, name, email, asal_instansi, jurusan, no_hp, jenis_kelamin, status_peserta')
      .eq('id', user.id)
      .single()
    userProfile = p || { id: user.id, email: user.email, name: '', status_peserta: null }
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
