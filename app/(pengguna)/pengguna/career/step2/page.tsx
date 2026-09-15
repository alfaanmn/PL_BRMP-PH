import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { bidangService } from '@/lib/services/bidang.service'
import { ApplicationStepTracker } from '@/components/forms/pengajuan/step-tracker'
import { CareerStep2Form } from '@/components/forms/pengajuan/career-step2-form'

export const dynamic = 'force-dynamic'

export default async function CareerStep2Page() {
  const supabase = await createClient()

  // Ambil user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Ambil daftar bidang
  const { data: bidangList } = await bidangService.getPublicBidangs()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. STEPPER WIZARD */}
      <ApplicationStepTracker currentStep={2} />

      {/* 2. FORM STEP 2 (UNGGAH DOKUMEN) */}
      <CareerStep2Form
        bidangList={bidangList || []}
        userId={user?.id || 'guest'}
      />
    </div>
  )
}
