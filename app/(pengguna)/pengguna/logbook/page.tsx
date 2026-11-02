import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { LogbookSection } from '@/components/pengguna/logbook-section'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

export default async function UserLogbookPage() {
  const supabase = await createClient()

  // 1. Verifikasi Sesi Pengguna di Server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/logbook')
  }

  // 2. Ambil Profil Pengguna
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  // 3. Ambil Pengajuan HANYA Milik Pengguna yang Sedang Login
  const { data: pengajuanList, error: pError } = await supabase
    .from('pengajuans')
    .select(`
      id,
      public_id,
      status,
      tanggal_mulai,
      tanggal_selesai,
      durasi_bulan,
      bidangs:bidang_id (id, nama)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const applications = pengajuanList || []

  // Cari pengajuan aktif (utamakan 'Sedang Magang', jika tidak ada ambil yang terbaru)
  const activeMagang = applications.find((p) => p.status === 'Sedang Magang') || applications[0] || null

  const namaBidang = (activeMagang?.bidangs as any)?.nama || 'Bidang Magang'
  const isSedangMagang = activeMagang?.status === 'Sedang Magang'

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
          name: profile?.name,
          role: (profile?.role as AppRole) || 'pengguna',
        }}
      />

      <main style={{
        flex: 1,
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.25rem 4rem 1.25rem',
      }}>
        {/* Header Halaman */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '24px' }}>📖</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
              Logbook Kegiatan Magang
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Kelola dan unggah laporan aktivitas mingguan Anda selama menjalankan program magang di BRMP Kementerian Pertanian.
          </p>
        </div>

        {/* KONDISI 1: Belum Ada Pengajuan Magang */}
        {!activeMagang ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            maxWidth: '540px',
            margin: '2rem auto'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 1.25rem auto'
            }}>
              📋
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Belum Ada Permohonan Magang
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Anda belum memiliki data permohonan magang aktif. Silakan pilih bidang penempatan dan ajukan permohonan terlebih dahulu.
            </p>
            <Link
              href="/#bidang"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderRadius: '10px',
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
              }}
            >
              <span>Jelajahi Bidang Magang</span>
              <span>→</span>
            </Link>
          </div>
        ) : isSedangMagang ? (
          /* KONDISI 2: Pengajuan Aktif 'Sedang Magang' -> Render Logbook Penuh */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Ringkasan Magang Aktif */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0'
                  }}>
                    ● Sedang Magang
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    ID: #{activeMagang.public_id}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {namaBidang}
                </h2>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Periode: {activeMagang.tanggal_mulai || '-'} s/d {activeMagang.tanggal_selesai || '-'} ({activeMagang.durasi_bulan || 1} Bulan)
                </span>
              </div>

              <Link
                href={`/pengguna/pengajuan/${activeMagang.public_id}`}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1A6FC4',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                <span>Lihat Detail Pengajuan</span>
                <span>↗</span>
              </Link>
            </div>

            {/* Modul Logbook Kegiatan Interaktif */}
            <LogbookSection
              pengajuanId={activeMagang.id}
              pengajuanStatus={activeMagang.status}
            />
          </div>
        ) : (
          /* KONDISI 3: Permohonan Ada tapi Belum 'Sedang Magang' (misal: Menunggu Verifikasi) */
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            maxWidth: '620px',
            margin: '1.5rem auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: activeMagang.status === 'Menunggu Verifikasi' ? '#fffbeb' : '#eff6ff',
              color: activeMagang.status === 'Menunggu Verifikasi' ? '#d97706' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 1.25rem auto',
              border: activeMagang.status === 'Menunggu Verifikasi' ? '1px solid #fde68a' : '1px solid #bfdbfe'
            }}>
              ⏳
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              padding: '0.35rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#92400e',
              marginBottom: '1rem'
            }}>
              <span>Status Pengajuan: {activeMagang.status}</span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Modul Logbook Belum Aktif
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Permohonan magang Anda pada unit <strong>{namaBidang}</strong> saat ini masih berstatus <strong>{activeMagang.status}</strong>. Pengunggahan logbook mingguan akan aktif otomatis setelah permohonan Anda diverifikasi dan berstatus <strong>Sedang Magang</strong>.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/pengguna/riwayat"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                }}
              >
                <span>Lihat Status di Riwayat</span>
                <span>→</span>
              </Link>

              <Link
                href={`/pengguna/pengajuan/${activeMagang.public_id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  border: '1px solid #cbd5e1'
                }}
              >
                <span>Lihat Rincian Pengajuan</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
