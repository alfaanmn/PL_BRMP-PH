import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { UserRiwayatList } from '@/components/pengguna/user-riwayat-list'
import { pengajuanService } from '@/lib/services/pengajuan.service'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

export default async function UserRiwayatPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/riwayat')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Ambil seluruh pengajuan milik user yang login menggunakan server Supabase client berotentikasi
  const { data: pengajuans, error: pengajuanError } = await supabase
    .from('pengajuans')
    .select(`
      id,
      public_id,
      user_id,
      bidang_id,
      pembimbing_id,
      nomor_surat,
      tanggal_surat,
      jenjang,
      asal_instansi,
      jurusan,
      tanggal_mulai,
      tanggal_selesai,
      durasi_bulan,
      jumlah_anggota,
      anggota,
      nama_lengkap,
      nim_nis,
      jenis_kelamin,
      no_hp,
      alamat,
      topik_magang,
      surat_pengantar_url,
      proposal_url,
      dokumen_tambahan_url,
      status,
      created_at,
      updated_at,
      bidangs (
        id,
        nama,
        deskripsi
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (pengajuanError) {
    console.error('Error loading pengajuans:', pengajuanError)
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
        maxWidth: '780px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1rem 3.5rem 1rem',
        boxSizing: 'border-box'
      }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Riwayat pengajuan
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              Pantau status verifikasi, administrasi surat, dan riwayat permohonan magang Anda di BRMP.
            </p>
          </div>

          <a
            href="/pengguna/career/step1"
            style={{
              padding: '0.45rem 0.875rem',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)'
            }}
          >
            <span>+</span>
            <span>Pengajuan baru</span>
          </a>
        </div>

        {/* Riwayat List & Modal */}
        <UserRiwayatList initialPengajuans={pengajuans || []} />
      </main>
    </div>
  )
}
