import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SKMForm } from '@/components/pengguna/skm-form'
import { skmService } from '@/lib/services/skm.service'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

interface UserSKMPageProps {
  searchParams?: Promise<{
    pengajuan_id?: string
  }>
}

export default async function UserSKMPage({ searchParams }: UserSKMPageProps) {
  const supabase = await createClient()

  // 1. Verifikasi Autentikasi Pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/skm')
  }

  // 2. Ambil Profil Pengguna
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // 3. Ambil parameter pengajuan_id jika ada
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const preselectedPengajuanId = resolvedSearchParams.pengajuan_id
    ? Number(resolvedSearchParams.pengajuan_id)
    : null

  // 4. Ambil 15 Pertanyaan Aktif dari Database Supabase (Source of Truth)
  const { data: questions, error: qError } = await skmService.getActivePertanyaan()

  // 5. Ambil Pengajuan Magang User beserta status SKM
  const { data: userPengajuans, error: pError } = await skmService.getUserPengajuansForSKM(user.id)

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
      {/* Navbar Pengguna */}
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

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '820px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1rem 4rem 1rem',
        boxSizing: 'border-box'
      }}>
        {/* Breadcrumb & Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>
            <Link href="/pengguna/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/pengguna/riwayat" style={{ color: '#64748b', textDecoration: 'none' }}>
              Riwayat
            </Link>
            <span>/</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Survei Kepuasan (SKM)</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Survei Kepuasan Masyarakat (SKM)
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Bantu kami meningkatkan kualitas pelayanan magang BRMP Kementerian Pertanian RI dengan memberikan penilaian objektif Anda.
          </p>
        </div>

        {/* Kondisi Jika Pengguna Belum Memiliki Pengajuan Magang */}
        {userPengajuans.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            padding: '3rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              📋
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Belum Ada Permohonan Magang
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              Survei Kepuasan Masyarakat hanya dapat diisi oleh peserta yang telah mengajukan permohonan magang di BRMP.
            </p>
            <Link
              href="/pengguna/career/step1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
              }}
            >
              <span>+</span>
              <span>Ajukan Magang Sekarang</span>
            </Link>
          </div>
        ) : questions.length === 0 ? (
          /* Kondisi Jika Tabel Pertanyaan Kosong */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '3rem 1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Pertanyaan Survei Belum Tersedia
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              {qError || 'Daftar pertanyaan survei kepuasan sedang dalam pemeliharaan administrator.'}
            </p>
            <Link
              href="/pengguna/dashboard"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                borderRadius: '6px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Kembali ke Dashboard
            </Link>
          </div>
        ) : (
          /* Tampilkan Form Kuesioner SKM */
          <SKMForm
            questions={questions}
            userPengajuans={userPengajuans}
            preselectedPengajuanId={preselectedPengajuanId}
          />
        )}
      </main>
    </div>
  )
}
