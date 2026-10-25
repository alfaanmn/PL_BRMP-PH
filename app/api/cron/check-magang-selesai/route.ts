import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailService } from '@/lib/services/email.service'
import { notifikasiService } from '@/lib/services/notifikasi.service'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron Job: Pemeriksaan Otomatis Pengajuan Magang Selesai & Pengingat SKM
 * Jadwal: 0 0 * * * (Setiap hari pukul 00:00 UTC = 07:00 WIB)
 * Keamanan: Bearer Authorization matching process.env.CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verifikasi Kredensial Cron Secret
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

    // 2. Inisialisasi Supabase Admin Client (Service Role Key pada sisi server)
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error('[Cron check-magang-selesai] Supabase Admin Client gagal diinisialisasi (Service Role Key belum dikonfigurasi).')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ADMIN_CLIENT_UNAVAILABLE',
            message: 'Supabase admin client tidak tersedia. Periksa SUPABASE_SERVICE_ROLE_KEY di environment.',
          },
        },
        { status: 500 }
      )
    }

    // 3. Hitung Tanggal Hari Ini menurut Zona Waktu Asia/Jakarta (format 'YYYY-MM-DD')
    const nowJakarta = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    console.log(`[Cron check-magang-selesai] Memulai pemrosesan untuk tanggal Jakarta: ${nowJakarta}`)

    let processedExpiredCount = 0
    let processedRetryCount = 0

    // =========================================================================
    // LANGKAH A: Pengajuan 'Sedang Magang' yang Masa Magangnya Telah Habis
    // (tanggal_selesai < nowJakarta) -> Ubah ke 'Selesai' + Log + Notif + Email
    // =========================================================================
    const { data: expiredPengajuans, error: expFetchErr } = await adminClient
      .from('pengajuans')
      .select(`
        id,
        public_id,
        status,
        tanggal_mulai,
        tanggal_selesai,
        asal_instansi,
        user_id,
        profiles:user_id (
          id,
          name,
          email
        ),
        bidangs (
          id,
          nama
        ),
        pembimbings (
          id,
          nama,
          nip,
          jabatan
        )
      `)
      .eq('status', 'Sedang Magang')
      .lt('tanggal_selesai', nowJakarta)
      .limit(50)

    if (expFetchErr) {
      console.error('[Cron check-magang-selesai] Gagal mengambil daftar pengajuan expired:', expFetchErr)
    } else if (expiredPengajuans && expiredPengajuans.length > 0) {
      console.log(`[Cron check-magang-selesai] Ditemukan ${expiredPengajuans.length} pengajuan Sedang Magang yang telah berakhir.`)

      for (const item of expiredPengajuans) {
        try {
          // (a.1) Update status bersyarat: pastikan baris masih berstatus 'Sedang Magang'
          const { data: updatedRows, error: updErr } = await adminClient
            .from('pengajuans')
            .update({ status: 'Selesai' })
            .eq('id', item.id)
            .eq('status', 'Sedang Magang')
            .select('id')

          // Jika 0 baris terupdate atau gagal (misalnya sudah diubah oleh admin paralel), lewati
          if (updErr || !updatedRows || updatedRows.length === 0) {
            console.warn(`[Cron] Pengajuan #${item.id} dilewati karena status telah berubah atau error:`, updErr?.message)
            continue
          }

          // (a.2) Catat riwayat perubahan ke pengajuan_status_logs (created_by: null untuk aktor sistem)
          try {
            await adminClient.from('pengajuan_status_logs').insert([
              {
                pengajuan_id: item.id,
                status: 'Selesai',
                catatan: 'Periode magang telah berakhir (otomatis diselesaikan oleh sistem)',
                created_by: null,
              },
            ])
          } catch (logErr) {
            console.warn(`[Cron] Gagal mencatat status log untuk pengajuan #${item.id}:`, logErr)
          }

          // (a.3) Masukkan entri ke tabel notifikasi pemohon dengan deduplikasi link
          const completionLink = `/pengguna/skm?pengajuan_id=${item.public_id || item.id}`
          try {
            const { data: existingNotif } = await adminClient
              .from('notifikasi')
              .select('id')
              .eq('user_id', item.user_id)
              .eq('link', completionLink)
              .limit(1)

            if (!existingNotif || existingNotif.length === 0) {
              await adminClient.from('notifikasi').insert([
                {
                  user_id: item.user_id,
                  judul: 'Periode Magang Selesai',
                  pesan: 'Selamat! Periode magang Anda telah selesai. Silakan isi Survei Kepuasan Masyarakat (SKM) untuk membantu kami meningkatkan kualitas layanan & penerbitan sertifikat.',
                  link: completionLink,
                  is_read: false,
                },
              ])
            }
          } catch (notifErr) {
            console.warn(`[Cron] Gagal membuat notifikasi untuk pengajuan #${item.id}:`, notifErr)
          }

          // Notifikasi Web ke Administrator
          try {
            await notifikasiService.notifyAdmins({
              judul: 'Kegiatan Magang Selesai (Otomatis)',
              pesan: `Periode magang #${item.public_id || item.id} (${(item.bidangs as any)?.nama || '-'}) atas nama ${(item.profiles as any)?.name || 'Peserta'} telah berakhir otomatis hari ini.`,
              link: `/admin/riwayat-pengajuan/${item.public_id || item.id}`,
            })
          } catch (admNotifErr) {
            console.warn(`[Cron] Gagal notifikasi admin untuk #${item.id}:`, admNotifErr)
          }

          // (a.4) Klaim atomik skm_reminder_sent_at untuk pengiriman email
          const { data: claimed, error: claimErr } = await adminClient
            .from('pengajuans')
            .update({ skm_reminder_sent_at: new Date().toISOString() })
            .eq('id', item.id)
            .is('skm_reminder_sent_at', null)
            .select('id')

          if (!claimErr && claimed && claimed.length > 0) {
            const profile = item.profiles as any
            if (profile?.email) {
              const emailTasks: Promise<any>[] = []

              let emailContext: any = null
              try {
                const { getPengajuanEmailContext } = await import('@/lib/services/email-context.service')
                emailContext = await getPengajuanEmailContext(item.id)
              } catch (ctxErr) {
                console.warn('[Cron] Gagal load email context:', ctxErr)
              }

              const basePengajuanData = {
                id: item.id,
                publicId: item.public_id || String(item.id),
                bidangNama: (item.bidangs as any)?.nama,
                asalInstansi: item.asal_instansi,
                tanggalMulai: item.tanggal_mulai,
                tanggalSelesai: item.tanggal_selesai,
                ...(emailContext?.pengajuan || {}),
              }

              // Email ke Peserta
              emailTasks.push(
                emailService.sendNotification({
                  event: 'pengajuan_completed',
                  recipientRole: 'user',
                  recipient: {
                    email: profile.email,
                    name: profile.name || 'Peserta Magang',
                  },
                  pengajuan: basePengajuanData,
                  pembimbing: item.pembimbings
                    ? {
                        nama: (item.pembimbings as any).nama,
                        nip: (item.pembimbings as any).nip,
                        jabatan: (item.pembimbings as any).jabatan,
                      }
                    : null,
                  catatan: 'Periode magang telah berakhir (otomatis diselesaikan oleh sistem)',
                })
              )

              // Email ke Admin Pengelola
              try {
                const { getAdminEmailAddress } = await import('@/lib/services/server-mailer')
                const admEmailTarget = getAdminEmailAddress()
                emailTasks.push(
                  emailService.sendNotification({
                    event: 'pengajuan_completed',
                    recipientRole: 'admin',
                    recipient: {
                      email: admEmailTarget,
                      name: 'Admin SIMPUL',
                    },
                    pengajuan: basePengajuanData,
                    catatan: `Periode magang atas nama ${profile.name || 'Peserta'} telah berakhir otomatis via cron sistem.`,
                  })
                )
              } catch (admEmailErr) {
                console.warn('[Cron] Gagal setup email admin:', admEmailErr)
              }

              const results = await Promise.allSettled(emailTasks)
              const emailRes = results[0]?.status === 'fulfilled' ? (results[0].value as any) : { success: false }

              if (!emailRes.success) {
                console.error(`[Cron] Email pengajuan_completed gagal untuk #${item.id}, rollback skm_reminder_sent_at:`, emailRes.error)
                // Rollback penanda agar percobaan cron berikutnya dapat mencoba kembali
                await adminClient
                  .from('pengajuans')
                  .update({ skm_reminder_sent_at: null })
                  .eq('id', item.id)
              }
            }
          }

          processedExpiredCount++
        } catch (itemErr) {
          console.error(`[Cron] Gagal memproses pengajuan expired #${item.id}:`, itemErr)
        }
      }
    }

    // =========================================================================
    // LANGKAH B: Pengajuan 'Selesai' dengan skm_reminder_sent_at IS NULL (Retry)
    // Memeriksa apakah ada yang belum menerima email (termasuk jalur admin gagal)
    // dan belum mengisi SKM di skm_jawaban.
    // =========================================================================
    const { data: retryPengajuans, error: retryFetchErr } = await adminClient
      .from('pengajuans')
      .select(`
        id,
        public_id,
        status,
        tanggal_mulai,
        tanggal_selesai,
        asal_instansi,
        user_id,
        profiles:user_id (
          id,
          name,
          email
        ),
        bidangs (
          id,
          nama
        ),
        pembimbings (
          id,
          nama,
          nip,
          jabatan
        )
      `)
      .eq('status', 'Selesai')
      .is('skm_reminder_sent_at', null)
      .limit(50)

    if (retryFetchErr) {
      console.error('[Cron check-magang-selesai] Gagal mengambil daftar pengajuan retry:', retryFetchErr)
    } else if (retryPengajuans && retryPengajuans.length > 0) {
      console.log(`[Cron check-magang-selesai] Ditemukan ${retryPengajuans.length} pengajuan Selesai tanpa email terkirim.`)

      for (const item of retryPengajuans) {
        try {
          // (b.1) Periksa apakah pemohon sudah pernah mengisi jawaban SKM
          const { count: ansCount, error: countErr } = await adminClient
            .from('skm_jawaban')
            .select('id', { count: 'exact', head: true })
            .eq('pengajuan_id', item.id)

          if (countErr) {
            console.warn(`[Cron Retry] Gagal mengecek skm_jawaban untuk #${item.id}:`, countErr)
          }

          if ((ansCount || 0) > 0) {
            // SKM sudah diisi! Tandai skm_reminder_sent_at dengan waktu saat ini agar tidak di-query ulang
            await adminClient
              .from('pengajuans')
              .update({ skm_reminder_sent_at: new Date().toISOString() })
              .eq('id', item.id)
              .is('skm_reminder_sent_at', null)
            continue
          }

          // (b.2) Klaim atomik skm_reminder_sent_at untuk pengiriman email
          const { data: claimed, error: claimErr } = await adminClient
            .from('pengajuans')
            .update({ skm_reminder_sent_at: new Date().toISOString() })
            .eq('id', item.id)
            .is('skm_reminder_sent_at', null)
            .select('id')

          if (!claimErr && claimed && claimed.length > 0) {
            const profile = item.profiles as any
            if (profile?.email) {
              const emailRes = await emailService.sendNotification({
                event: 'pengajuan_completed',
                recipient: {
                  email: profile.email,
                  name: profile.name || 'Peserta Magang',
                },
                pengajuan: {
                  id: item.id,
                  publicId: item.public_id || String(item.id),
                  bidangNama: (item.bidangs as any)?.nama,
                  asalInstansi: item.asal_instansi,
                  tanggalMulai: item.tanggal_mulai,
                  tanggalSelesai: item.tanggal_selesai,
                },
                pembimbing: item.pembimbings
                  ? {
                      nama: (item.pembimbings as any).nama,
                      nip: (item.pembimbings as any).nip,
                      jabatan: (item.pembimbings as any).jabatan,
                    }
                  : null,
                catatan: 'Pengingat pengisian Survei Kepuasan Masyarakat (SKM)',
              })

              if (!emailRes.success) {
                console.error(`[Cron Retry] Email pengajuan_completed gagal untuk #${item.id}, rollback skm_reminder_sent_at:`, emailRes.error)
                await adminClient
                  .from('pengajuans')
                  .update({ skm_reminder_sent_at: null })
                  .eq('id', item.id)
              }
            }
          }

          processedRetryCount++
        } catch (retryItemErr) {
          console.error(`[Cron Retry] Gagal memproses retry pengajuan #${item.id}:`, retryItemErr)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        jakartaDate: nowJakarta,
        processedExpired: processedExpiredCount,
        processedRetries: processedRetryCount,
      },
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kegagalan server pada eksekusi cron.'
    console.error('[Cron check-magang-selesai] Unhandled error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMsg,
        },
      },
      { status: 500 }
    )
  }
}
