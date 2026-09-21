import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SKMForm } from '@/components/pengguna/skm-form'
import type { AppRole } from '@/types/auth.types'

export const dynamic = 'force-dynamic'

interface UserSKMPageProps {
  searchParams?: Promise<{
    pengajuan_id?: string
  }>
}

export default async function UserSKMPage({ searchParams }: UserSKMPageProps) {
  // 1. Inisialisasi Supabase Server Client (Membawa Session & Cookies Pengguna)
  const supabase = await createClient()

  // 2. Verifikasi Autentikasi Pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/pengguna/skm')
  }

  // 3. Ambil Profil Pengguna
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // 4. Ambil parameter pengajuan_id jika ada
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const preselectedPengajuanId = resolvedSearchParams.pengajuan_id
    ? Number(resolvedSearchParams.pengajuan_id)
    : null

  // 5. Ambil 15 Pertanyaan Aktif dari Database Supabase menggunakan Server Client
  const { data: rawQuestions, error: qError } = await supabase
    .from('skm_pertanyaan')
    .select('id, pertanyaan, unsur, urutan, tipe, opsi, is_active, created_at')
    .eq('is_active', true)
    .order('urutan', { ascending: true })

  const questions = rawQuestions || []

  // 6. Ambil Seluruh Pengajuan Magang Milik User Menggunakan Server Client Berotentikasi
  const { data: rawPengajuans, error: pError } = await supabase
    .from('pengajuans')
    .select(`
      id,
      public_id,
      status,
      sertifikat_url,
      created_at,
      bidangs (
        id,
        nama
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 7. Ambil Riwayat Pengisian SKM untuk Seluruh Pengajuan User
  const pengajuanIds = (rawPengajuans || []).map((p) => p.id)
  const submittedSet = new Set<number>()

  if (pengajuanIds.length > 0) {
    const { data: existingAnswers } = await supabase
      .from('skm_jawaban')
      .select('pengajuan_id')
      .in('pengajuan_id', pengajuanIds)

    if (existingAnswers) {
      existingAnswers.forEach((ans) => {
        if (ans.pengajuan_id) {
          submittedSet.add(ans.pengajuan_id)
        }
      })
    }
  }

  const userPengajuans = (rawPengajuans || []).map((p: any) => ({
    id: p.id,
    public_id: p.public_id,
    status: p.status,
    sertifikat_url: p.sertifikat_url || null,
    bidang_nama: p.bidangs?.nama || 'Bidang Magang BRMP',
    created_at: p.created_at,
    hasSubmittedSKM: submittedSet.has(p.id),
  }))

  // 8. Evaluasi Validasi Khusus Parameter `pengajuan_id`
  let accessError: { title: string; message: string; actionUrl: string; actionText: string } | null = null
  let requestedPengajuanObj = preselectedPengajuanId
    ? userPengajuans.find((p) => p.id === preselectedPengajuanId) || null
    : null

  if (preselectedPengajuanId && !requestedPengajuanObj) {
    // Cek apakah ID pengajuan tersebut ada di database (apakah milik user lain atau tidak ditemukan)
    const { data: foreignPengajuan } = await supabase
      .from('pengajuans')
      .select('id, user_id')
      .eq('id', preselectedPengajuanId)
      .maybeSingle()

    if (foreignPengajuan && foreignPengajuan.user_id !== user.id) {
      accessError = {
        title: 'Akses Ditolak',
        message: 'Permohonan magang ini bukan milik akun Anda. Anda hanya dapat mengisi survei untuk permohonan magang Anda sendiri.',
        actionUrl: '/pengguna/riwayat',
        actionText: 'Kembali ke Riwayat Saya'
      }
    } else {
      accessError = {
        title: 'Permohonan Tidak Ditemukan',
        message: `Permohonan magang dengan ID #${preselectedPengajuanId} tidak ditemukan dalam database sistem.`,
        actionUrl: '/pengguna/riwayat',
        actionText: 'Lihat Riwayat Pengajuan'
      }
    }
  } else if (requestedPengajuanObj && requestedPengajuanObj.status !== 'Selesai') {
    // Pengajuan ditemukan tetapi statusnya belum 'Selesai'
    accessError = {
      title: 'Status Magang Belum Selesai',
      message: `Survei Kepuasan Masyarakat (SKM) hanya dapat diisi setelah masa magang Anda dinyatakan "Selesai" oleh pihak administrasi BRMP. Status permohonan #${requestedPengajuanObj.id} saat ini adalah "${requestedPengajuanObj.status}".`,
      actionUrl: '/pengguna/riwayat',
      actionText: 'Kembali ke Riwayat Pengajuan'
    }
  }

  // Pengajuan yang eligible untuk SKM (berstatus Selesai)
  const eligiblePengajuans = userPengajuans.filter((p) => p.status === 'Selesai')

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
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
          <Link href="/pengguna/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/pengguna/riwayat" style={{ color: '#64748b', textDecoration: 'none' }}>
            Riwayat
          </Link>
          <span>/</span>
          <span style={{ color: '#0F6E56', fontWeight: 600 }}>Survei Kepuasan (SKM)</span>
        </div>

        {/* 1. Blok Judul + Icon + Deskripsi */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Icon Container 44x44px */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#0F6E56'
          }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
            </svg>
          </div>

          {/* Title & Description */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 500,
              color: '#0f172a',
              margin: '0 0 0.35rem 0',
              lineHeight: 1.3
            }}>
              Survei kepuasan masyarakat
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.6
            }}>
              Bantu kami meningkatkan kualitas pelayanan magang BRMP Kementerian Pertanian RI dengan memberikan penilaian objektif Anda.
            </p>
          </div>
        </div>

        {/* 1. Kondisi Akses Error (Forbidden / Not Found / Status Belum Selesai) */}
        {accessError ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fed7aa',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fff7ed',
              color: '#c2410c',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              {accessError.title}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              {accessError.message}
            </p>
            <Link
              href={accessError.actionUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)'
              }}
            >
              {accessError.actionText}
            </Link>
          </div>
        ) : userPengajuans.length === 0 ? (
          /* 2. Kondisi Jika Pengguna Belum Memiliki Permohonan Magang Sama Sekali */
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
        ) : eligiblePengajuans.length === 0 && !preselectedPengajuanId ? (
          /* 3. Kondisi Jika User Punya Pengajuan tapi Belum Ada yang Berstatus 'Selesai' */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              ⏳
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Belum Ada Magang yang Berstatus &quot;Selesai&quot;
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              Pengisian Survei Kepuasan Masyarakat (SKM) dapat dilakukan setelah masa magang Anda selesai dan diverifikasi oleh pihak BRMP.
            </p>
            <Link
              href="/pengguna/riwayat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)'
              }}
            >
              Pantau Status di Riwayat
            </Link>
          </div>
        ) : questions.length === 0 ? (
          /* 4. Kondisi Jika Tabel Pertanyaan Kosong */
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
              {qError?.message || 'Daftar pertanyaan survei kepuasan sedang dalam pemeliharaan administrator.'}
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
          /* 5. Tampilkan Form Kuesioner SKM */
          <SKMForm
            questions={questions}
            userPengajuans={eligiblePengajuans.length > 0 ? eligiblePengajuans : userPengajuans}
            preselectedPengajuanId={preselectedPengajuanId}
          />
        )}
      </main>
    </div>
  )
}
