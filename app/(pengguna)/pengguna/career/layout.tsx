import React from 'react'
import { WizardProvider } from '@/hooks/use-pengajuan'
import { Navbar } from '@/components/layout/navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

export default async function CareerWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Ambil sesi user yang login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/career/step1')
  }

  // Ambil data profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role, asal_instansi, jurusan, no_hp, jenis_kelamin')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'pengguna') {
    if (profile?.role === 'administrator') {
      redirect('/admin/dashboard')
    }
  }

  return (
    <WizardProvider>
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

        {/* Wizard Main Content Container */}
        <main style={{
          flex: 1,
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1rem 3rem 1rem',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>
      </div>
    </WizardProvider>
  )
}
