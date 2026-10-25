import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { UserPengajuanDetailView } from '@/components/pengguna/user-pengajuan-detail-view'
import { evaluateSKMCompletion } from '@/lib/helpers/peserta.helper'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    publicId: string
  }>
}

export default async function PengajuanDetailPage({ params }: PageProps) {
  // Await params sesuai standar Next.js 15
  const { publicId } = await params

  const supabase = await createClient()

  // 1. Verifikasi Sesi User
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/pengguna/pengajuan/${publicId}`)
  }

  // 2. Ambil Profil & Guard Role Pengguna
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'pengguna') {
    redirect('/admin/dashboard')
  }

  // 3. Query Pengajuan Berdasarkan public_id dan user_id dengan .maybeSingle()
  const { data: pengajuan, error: pengajuanError } = await supabase
    .from('pengajuans')
    .select(`
      *,
      bidangs (
        id,
        nama,
        deskripsi
      ),
      pembimbings (
        id,
        nama,
        nip,
        jabatan,
        email,
        no_hp
      )
    `)
    .eq('public_id', publicId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (pengajuanError) {
    console.error('[PengajuanDetailPage] Error query detail pengajuan:', pengajuanError)
  }

  // 4. State "Pengajuan Tidak Ditemukan" jika data null / bukan milik user
  if (!pengajuan) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Navbar
          user={{
            id: user.id,
            email: user.email,
          }}
          profile={{
            name: profile.name,
            role: (profile.role as AppRole) || 'pengguna',
          }}
        />

        <main style={{
          flex: 1,
          maxWidth: '560px',
          width: '100%',
          margin: '3rem auto',
          padding: '0 1rem',
          boxSizing: 'border-box',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 1.25rem auto',
            }}>
              🔍
            </div>

            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 0.5rem 0',
            }}>
              Pengajuan Tidak Ditemukan
            </h1>

            <p style={{
              fontSize: '0.875rem',
              color: '#64748b',
              margin: '0 0 1.75rem 0',
              lineHeight: 1.5,
            }}>
              Pengajuan dengan kode pengenal <strong>{publicId}</strong> tidak ditemukan pada akun Anda,
              atau Anda tidak memiliki akses untuk melihat berkas ini.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
              maxWidth: '280px',
              margin: '0 auto',
            }}>
              <Link
                href="/pengguna/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background-color 0.2s',
                }}
              >
                ← Kembali ke Dashboard
              </Link>

              <Link
                href="/pengguna/riwayat"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Lihat Riwayat Pengajuan
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 5. Ambil Audit Log Status Pengajuan
  const { data: logs } = await supabase
    .from('pengajuan_status_logs')
    .select('id, pengajuan_id, status, catatan, created_at')
    .eq('pengajuan_id', pengajuan.id)
    .order('created_at', { ascending: true })

  // 6. Cek status SKM jika pengajuan sudah Selesai
  let hasSubmittedSKM = false
  if (pengajuan.status === 'Selesai') {
    const [anggotasRes, answersRes] = await Promise.all([
      supabase
        .from('pengajuan_anggotas')
        .select('id, pengajuan_id, nama, nim')
        .eq('pengajuan_id', pengajuan.id),
      supabase
        .from('skm_jawaban')
        .select('pengajuan_id, peserta_nama, peserta_nim, is_ketua, is_legacy')
        .eq('pengajuan_id', pengajuan.id),
    ])

    const skmEval = evaluateSKMCompletion(
      pengajuan,
      anggotasRes.data || [],
      answersRes.data || []
    )
    hasSubmittedSKM = skmEval.isComplete
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
      padding: 0,
    }}>
      {/* Navbar Pengguna */}
      <Navbar
        user={{
          id: user.id,
          email: user.email,
        }}
        profile={{
          name: profile.name,
          role: (profile.role as AppRole) || 'pengguna',
        }}
      />

      {/* Main Container */}
      <main style={{
        flex: 1,
        maxWidth: '860px',
        width: '100%',
        margin: '0 auto',
        padding: '1.75rem 1rem 3.5rem 1rem',
        boxSizing: 'border-box',
      }}>
        <UserPengajuanDetailView
          pengajuan={pengajuan}
          logs={logs || []}
          hasSubmittedSKM={hasSubmittedSKM}
        />
      </main>
    </div>
  )
}
