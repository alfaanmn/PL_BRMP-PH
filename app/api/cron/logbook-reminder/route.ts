import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  formatJakartaDate,
  calculateAllLogbookWeeks,
  getCurrentWeekNumber,
} from '@/lib/utils/logbook-date'
import { sendLogbookReminderNotification } from '@/lib/services/logbook-notify.service'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron Job: Pengingat Logbook Mingguan (Kamis & Jumat 09:00 WIB)
 * Jadwal vercel.json: 0 2 * * 4,5 (02:00 UTC = 09:00 WIB)
 * Keamanan: Header "Authorization: Bearer ${CRON_SECRET}"
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validasi Kredensial Cron Secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Akses ditolak: Kredensial Cron Secret tidak valid.',
          },
        },
        { status: 401 }
      )
    }

    // 2. Inisialisasi Admin Client (Service Role)
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ADMIN_CLIENT_UNAVAILABLE',
            message: 'Supabase admin client tidak tersedia. Periksa SUPABASE_SERVICE_ROLE_KEY.',
          },
        },
        { status: 500 }
      )
    }

    // 3. Tentukan Hari dan Tanggal menurut Zona Waktu Asia/Jakarta (WIB)
    const now = new Date()
    const todayJakarta = formatJakartaDate(now)

    // Dapatkan nama hari dalam bahasa Indonesia / nomor hari menurut waktu Jakarta
    const dayOfWeekStr = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
    })
      .format(now)
      .toLowerCase()

    const { searchParams } = new URL(request.url)
    const isDryRun = searchParams.get('dry') === '1'
    const forceDay = searchParams.get('force_day')?.toLowerCase()

    // Mode force_day HANYA diizinkan jika bukan production
    let activeDay = dayOfWeekStr
    if (process.env.NODE_ENV !== 'production' && (forceDay === 'kamis' || forceDay === 'jumat')) {
      activeDay = forceDay
    }

    let jenis: 'kamis' | 'jumat' | null = null
    if (activeDay.includes('kamis')) {
      jenis = 'kamis'
    } else if (activeDay.includes('jumat')) {
      jenis = 'jumat'
    }

    if (!jenis) {
      return NextResponse.json({
        success: true,
        message: `Hari ini (${activeDay}, ${todayJakarta}) bukan jadwal pengingat logbook (hanya Kamis dan Jumat).`,
        dijalankan: false,
      })
    }

    // 4. Query Pengajuan yang Berstatus 'Sedang Magang' dan Periode Aktif
    const { data: pengajuans, error: pError } = await adminClient
      .from('pengajuans')
      .select('id, public_id, user_id, nama_lengkap, tanggal_mulai, tanggal_selesai, bidangs(nama), profiles:user_id(email, name)')
      .eq('status', 'Sedang Magang')
      .lte('tanggal_mulai', todayJakarta)
      .gte('tanggal_selesai', todayJakarta)

    if (pError) {
      return NextResponse.json(
        { success: false, error: `Gagal mengambil data pengajuan aktif: ${pError.message}` },
        { status: 500 }
      )
    }

    const candidates = []
    let dilewatiSudahUpload = 0
    let dilewatiSudahDikirim = 0
    let dilewatiTanpaEmail = 0

    // 5. Evaluasi Kandidat
    for (const p of pengajuans || []) {
      const userEmail = (p.profiles as any)?.email?.trim() || null
      if (!userEmail || !userEmail.includes('@')) {
        dilewatiTanpaEmail++
        continue
      }

      const currentWeek = getCurrentWeekNumber(p.tanggal_mulai, p.tanggal_selesai, todayJakarta)
      if (currentWeek < 1) continue

      const weeks = calculateAllLogbookWeeks(p.tanggal_mulai, p.tanggal_selesai, todayJakarta)
      const weekInfo = weeks.find((w) => w.minggu_ke === currentWeek)
      if (!weekInfo) continue

      // Cek apakah sudah upload untuk minggu ini
      const { data: existingUpload } = await adminClient
        .from('logbooks')
        .select('id')
        .eq('pengajuan_id', p.id)
        .eq('minggu_ke', currentWeek)
        .maybeSingle()

      if (existingUpload) {
        dilewatiSudahUpload++
        continue
      }

      // Cek apakah email pengingat untuk jenis (kamis/jumat) dan minggu ini sudah pernah terkirim
      const { data: existingReminder } = await adminClient
        .from('logbook_reminder_log')
        .select('id')
        .eq('pengajuan_id', p.id)
        .eq('minggu_ke', currentWeek)
        .eq('jenis', jenis)
        .maybeSingle()

      if (existingReminder) {
        dilewatiSudahDikirim++
        continue
      }

      candidates.push({
        pengajuanId: p.id,
        publicId: p.public_id,
        email: userEmail,
        nama: p.nama_lengkap || (p.profiles as any)?.name || 'Peserta Magang',
        mingguKe: currentWeek,
        periodeMulai: weekInfo.periode_mulai,
        periodeSelesai: weekInfo.periode_selesai,
      })
    }

    // 6. Mode Uji (Dry-Run): Kembalikan daftar tanpa mengirim dan tanpa menulis log
    if (isDryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        hari: jenis,
        tanggalJakarta: todayJakarta,
        totalKandidat: candidates.length,
        dilewati: {
          sudahUpload: dilewatiSudahUpload,
          sudahDikirim: dilewatiSudahDikirim,
          tanpaEmail: dilewatiTanpaEmail,
        },
        daftarKandidat: candidates.map((c) => ({
          nama: c.nama,
          mingguKe: c.mingguKe,
          periode: `${c.periodeMulai} s/d ${c.periodeSelesai}`,
        })),
      })
    }

    // 7. Pengiriman Email Berkelompok (Batching maks 5 paralel) dengan Idempotensi Ketat
    let terkirim = 0
    let gagal = 0
    const BATCH_SIZE = 5

    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (item) => {
          // A. Insert ke logbook_reminder_log terlebih dahulu (Idempotency Lock)
          const { data: logRow, error: logInsertError } = await adminClient
            .from('logbook_reminder_log')
            .insert({
              pengajuan_id: item.pengajuanId,
              minggu_ke: item.mingguKe,
              jenis,
            })
            .select('id')
            .maybeSingle()

          // Jika baris gagal di-insert (misal terjadi duplicate race), jangan kirim ulang
          if (logInsertError || !logRow) {
            dilewatiSudahDikirim++
            return
          }

          // B. Kirim email notifikasi pengingat
          try {
            const sendOk = await sendLogbookReminderNotification({
              toEmail: item.email,
              namaPemohon: item.nama,
              mingguKe: item.mingguKe,
              periodeMulai: item.periodeMulai,
              periodeSelesai: item.periodeSelesai,
              jenis,
              publicId: item.publicId,
            })

            if (sendOk) {
              terkirim++
            } else {
              // Jika pengiriman gagal: Hapus baris log agar dapat dicoba lagi di eksekusi berikutnya
              await adminClient
                .from('logbook_reminder_log')
                .delete()
                .eq('id', logRow.id)
              gagal++
            }
          } catch (sendErr) {
            console.error('[Cron Logbook Reminder] Pengiriman email gagal:', sendErr)
            await adminClient
              .from('logbook_reminder_log')
              .delete()
              .eq('id', logRow.id)
            gagal++
          }
        })
      )
    }

    return NextResponse.json({
      success: true,
      hari: jenis,
      tanggalJakarta: todayJakarta,
      totalKandidat: candidates.length,
      terkirim,
      gagal,
      dilewati: {
        sudahUpload: dilewatiSudahUpload,
        sudahDikirim: dilewatiSudahDikirim,
        tanpaEmail: dilewatiTanpaEmail,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server cron.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
