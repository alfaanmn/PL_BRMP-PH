import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { UserProfileForm } from '@/components/forms/pengguna/user-profile-form'
import type { AppRole, Profile } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

export default async function UserProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/profil')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0
    }}>
      {/* Navbar */}
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
        maxWidth: '720px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1rem 3.5rem 1rem',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Profil pengguna
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
            Kelola informasi data diri dan identitas akademik untuk keperluan administrasi magang di BRMP.
          </p>
        </div>

        <UserProfileForm initialProfile={profile as Profile} />
      </main>
    </div>
  )
}
