import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { bidangService } from '@/lib/services/bidang.service'
import { ApplicationStepTracker } from '@/components/forms/pengajuan/step-tracker'
import { CareerStep3Review } from '@/components/forms/pengajuan/career-step3-review'

export const dynamic = 'force-dynamic'

export default async function CareerStep3Page() {
  const supabase = await createClient()

  // Ambil user dan profil
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile: any = null
  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('id, name, email, asal_instansi, jurusan, no_hp, jenis_kelamin')
      .eq('id', user.id)
      .single()

    const meta = (user.user_metadata as Record<string, any>) || {}

    userProfile = {
      id: user.id,
      email: user.email,
      name: p?.name || meta.name || meta.full_name || '',
      asal_instansi: p?.asal_instansi || meta.asal_instansi || '',
      jurusan: p?.jurusan || meta.jurusan || '',
      no_hp: p?.no_hp || meta.no_hp || meta.phone || '',
      jenis_kelamin: p?.jenis_kelamin || meta.jenis_kelamin || '',
    }
  }

  // Ambil daftar bidang
  const { data: bidangList } = await bidangService.getPublicBidangs()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. STEPPER WIZARD */}
      <ApplicationStepTracker currentStep={3} />

      {/* 2. REVIEW & SUBMIT STEP 3 */}
      <CareerStep3Review
        bidangList={bidangList || []}
        userProfile={userProfile}
      />
    </div>
  )
}
