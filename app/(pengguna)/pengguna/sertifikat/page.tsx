import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { sertifikatService } from '@/lib/services/sertifikat.service'
import type { AppRole } from '@/types/auth.types'
import { UserSertifikatListClient } from './user-sertifikat-list-client'

export const dynamic = 'force-dynamic'

export default async function UserSertifikatPage() {
  const supabase = await createClient()

  // 1. Verifikasi Sesi Pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/sertifikat')
  }

  // 2. Ambil Profil Pengguna
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  // 3. Ambil data sertifikat pengguna
  const { data: certItems, error: certErr } = await sertifikatService.getUserSertifikatList(user.id)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
    }}>
      {/* Navbar Konsisten */}
      <Navbar
        user={{
          id: user.id,
          email: user.email,
        }}
        profile={{
          name: profile?.name,
          role: (profile?.role as AppRole) || 'pengguna',
        }}
      />

      {/* Main Content */}
      <main style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.25rem 4rem 1.25rem',
        boxSizing: 'border-box',
      }}>
        {/* Header Breadcrumb & Title */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Sertifikat Kelulusan Magang
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Pantau dan unduh sertifikat resmi kegiatan magang Anda di Balai Pengelola Hasil BRMP PH.
          </p>
        </div>

        {/* Client Component untuk daftar interaktif & modal pratinjau */}
        <UserSertifikatListClient initialItems={certItems || []} errorMsg={certErr} />
      </main>
    </div>
  )
}
