import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAllLogbookWeeks, getCurrentWeekNumber } from '@/lib/utils/logbook-date'
import { AdminLogbookClient, type ParticipantLogbookSummary } from './admin-logbook-client'

export const dynamic = 'force-dynamic'

export default async function AdminLogbookPage() {
  const supabase = await createClient()

  // 1. Verifikasi Sesi & Hak Akses Administrator di Server (Strict Guard)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin/logbook')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'administrator' || profile.is_active === false) {
    redirect('/pengguna/dashboard')
  }

  // 2. Inisialisasi Admin Client untuk Pengambilan Data
  const adminClient = createAdminClient()
  if (!adminClient) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        Konfigurasi server bermasalah: Admin Client tidak tersedia.
      </div>
    )
  }

  // 3. Ambil Seluruh Pengajuan Magang Terkait (Sedang Magang, Terjadwal, Selesai)
  const { data: pengajuans, error: pError } = await adminClient
    .from('pengajuans')
    .select(`
      id,
      public_id,
      nama_lengkap,
      nim_nis,
      asal_instansi,
      jurusan,
      status,
      tanggal_mulai,
      tanggal_selesai,
      durasi_bulan,
      bidangs:bidang_id (id, nama)
    `)
    .in('status', ['Sedang Magang', 'Disetujui', 'Terjadwal', 'Selesai'])
    .order('created_at', { ascending: false })

  if (pError) {
    console.error('[Admin Logbook Page] Error fetching pengajuans:', pError)
  }

  // 4. Ambil Data Logbooks Eksisting (dengan penanganan aman jika tabel belum dibuat)
  let logbooksList: Array<{ id: string; pengajuan_id: number; minggu_ke: number }> = []
  try {
    const { data: lData, error: lError } = await adminClient
      .from('logbooks')
      .select('id, pengajuan_id, minggu_ke')

    if (!lError && lData) {
      logbooksList = lData as any
    }
  } catch (err) {
    console.warn('[Admin Logbook Page] Tabel logbooks belum dapat diakses:', err)
  }

  // Petakan upload logbook per pengajuan_id
  const logbookCountMap = new Map<number, number>()
  for (const lb of logbooksList) {
    const current = logbookCountMap.get(lb.pengajuan_id) || 0
    logbookCountMap.set(lb.pengajuan_id, current + 1)
  }

  // 5. Rakit Ringkasan Peserta dengan Perhitungan Minggu Dinamis (Asia/Jakarta)
  const participants: ParticipantLogbookSummary[] = (pengajuans || []).map((p) => {
    const startStr = p.tanggal_mulai || '2026-11-01'
    const endStr = p.tanggal_selesai || '2026-11-30'

    const weeks = calculateAllLogbookWeeks(startStr, endStr)
    const totalWeeks = weeks.length
    const currentWeek = getCurrentWeekNumber(startStr, endStr)
    const uploadedCount = logbookCountMap.get(p.id) || 0

    return {
      id: p.id,
      public_id: p.public_id,
      nama_lengkap: p.nama_lengkap || 'Peserta Magang',
      nim_nis: p.nim_nis || '-',
      asal_instansi: p.asal_instansi || '-',
      jurusan: p.jurusan || '-',
      bidang_nama: (p.bidangs as any)?.nama || 'Bidang Magang',
      status: p.status,
      tanggal_mulai: p.tanggal_mulai || '-',
      tanggal_selesai: p.tanggal_selesai || '-',
      durasi_bulan: p.durasi_bulan || 1,
      total_weeks: totalWeeks,
      current_week: currentWeek,
      uploaded_count: uploadedCount,
    }
  })

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 0 3rem 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    }}>
      {/* Page Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '24px' }}>📖</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
            Logbook Peserta Magang
          </h1>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
          Pantau kedisiplinan dan periksa unggahan berkas laporan aktivitas mingguan dari seluruh peserta magang aktif di BRMP.
        </p>
      </div>

      {/* Client Component with Search, Filter & Viewer */}
      <AdminLogbookClient initialParticipants={participants} />
    </div>
  )
}
