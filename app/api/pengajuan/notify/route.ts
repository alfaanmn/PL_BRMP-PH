import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPengajuanEmailContext } from '@/lib/services/email-context.service'
import { emailService } from '@/lib/services/email.service'
import { createNotificationServer } from '@/lib/services/server-notifikasi'

interface NotifyRequestBody {
  publicId?: string
  event?: string
  alasan?: string
}

/**
 * Route Handler Server-Side untuk Pemicu Notifikasi Pengajuan (Web & Email)
 * Berjalan aman di sisi SERVER dengan Service Role (createAdminClient)
 * Dilengkapi proteksi otorisasi, verifikasi status database, dan guard idempotensi.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verifikasi Sesi Pengguna
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak valid' },
        { status: 401 }
      )
    }

    // 2. Parse dan Validasi Input Payload
    let body: NotifyRequestBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { publicId, event, alasan } = body

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'publicId wajib diisi dan harus berupa string' },
        { status: 400 }
      )
    }

    const allowedEvents = ['pengajuan_submitted', 'pengajuan_cancelled']
    if (!event || !allowedEvents.includes(event)) {
      return NextResponse.json(
        { success: false, error: `Event tidak didukung. Pilihan: ${allowedEvents.join(', ')}` },
        { status: 400 }
      )
    }

    // Validasi alasan pembatalan jika ada
    let cleanAlasan: string | undefined = undefined
    if (alasan !== undefined && alasan !== null) {
      if (typeof alasan !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Alasan harus berupa string' },
          { status: 400 }
        )
      }
      cleanAlasan = alasan.trim().slice(0, 500)
    }

    // 3. Inisialisasi Admin Client untuk Akses Database Server-Side
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error('[API /api/pengajuan/notify] Supabase Admin Client tidak tersedia (cek env service role).')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // 4. Ambil Profil Pemanggil untuk Cek Role
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    const isCallerAdmin = callerProfile?.role === 'administrator'

    // 5. Ambil Data Pengajuan Lengkap Berdasarkan publicId
    const { data: pengajuan, error: pErr } = await adminClient
      .from('pengajuans')
      .select(`
        id,
        public_id,
        user_id,
        status,
        nama_lengkap,
        asal_instansi,
        jurusan,
        jenjang,
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
      .eq('public_id', publicId)
      .single()

    if (pErr || !pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      )
    }

    // 6. Cek Otorisasi Kepemilikan (Pemilik Pengajuan atau Administrator)
    const isOwner = pengajuan.user_id === user.id
    if (!isOwner && !isCallerAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' },
        { status: 403 }
      )
    }

    // 7. Verifikasi Status Aktual Pengajuan di Database (Strict State Guard)
    if (event === 'pengajuan_submitted' && pengajuan.status !== 'Menunggu Verifikasi') {
      return NextResponse.json(
        {
          success: false,
          error: `Event pengajuan_submitted ditolak: status aktual pengajuan adalah "${pengajuan.status}", bukan "Menunggu Verifikasi"`,
        },
        { status: 400 }
      )
    }

    if (event === 'pengajuan_cancelled' && pengajuan.status !== 'Dibatalkan') {
      return NextResponse.json(
        {
          success: false,
          error: `Event pengajuan_cancelled ditolak: status aktual pengajuan adalah "${pengajuan.status}", bukan "Dibatalkan"`,
        },
        { status: 400 }
      )
    }

    // 8. Guard Pencegahan Pengiriman Ganda (Idempotency Check)
    const expectedAdminLink = `/admin/riwayat-pengajuan/${pengajuan.public_id}`
    let duplicateQuery = adminClient
      .from('notifikasi')
      .select('id')
      .eq('link', expectedAdminLink)

    if (event === 'pengajuan_submitted') {
      duplicateQuery = duplicateQuery.eq('judul', 'Pengajuan Magang Baru')
    } else if (event === 'pengajuan_cancelled') {
      duplicateQuery = duplicateQuery.eq('judul', 'Pengajuan Magang Dibatalkan Pemohon')
    }

    const { data: existingNotifs } = await duplicateQuery.limit(1)
    if (existingNotifs && existingNotifs.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Notifikasi sudah pernah diproses sebelumnya (idempotent)',
      })
    }

    // 9. Ambil Konteks Lengkap Pengajuan di Sisi Server dengan Guard Anti-Fallback
    const emailContext = await getPengajuanEmailContext(pengajuan.id)
    const ctxPengajuan = emailContext.pengajuan

    const namaPemohon =
      (ctxPengajuan.namaPemohon && ctxPengajuan.namaPemohon !== '-' ? ctxPengajuan.namaPemohon : null) ||
      (emailContext.pemohonNama && emailContext.pemohonNama !== 'Peserta' ? emailContext.pemohonNama : null) ||
      pengajuan.nama_lengkap ||
      user.user_metadata?.name ||
      'Peserta'

    const pemohonEmail =
      emailContext.pemohonEmail ||
      (ctxPengajuan.pemohonEmail && ctxPengajuan.pemohonEmail !== '-' ? ctxPengajuan.pemohonEmail : null) ||
      user.email ||
      ''

    const namaBidang =
      (ctxPengajuan.bidangNama && ctxPengajuan.bidangNama !== '-' ? ctxPengajuan.bidangNama : null) ||
      (pengajuan.bidangs as any)?.nama ||
      'Bidang Magang'

    const asalInstansi =
      (ctxPengajuan.asalInstansi && ctxPengajuan.asalInstansi !== '-' ? ctxPengajuan.asalInstansi : null) ||
      pengajuan.asal_instansi ||
      '-'

    const jurusan =
      (ctxPengajuan.jurusan && ctxPengajuan.jurusan !== '-' ? ctxPengajuan.jurusan : null) ||
      pengajuan.jurusan ||
      '-'

    const jenjang =
      (ctxPengajuan.jenjang && ctxPengajuan.jenjang !== '-' ? ctxPengajuan.jenjang : null) ||
      pengajuan.jenjang ||
      '-'

    const pData = {
      ...ctxPengajuan,
      id: pengajuan.id,
      publicId: pengajuan.public_id || publicId,
      userId: pengajuan.user_id,
      namaPemohon,
      pemohonEmail,
      bidangNama: namaBidang,
      asalInstansi,
      jurusan,
      jenjang,
    }

    // 10. Eksekusi Notifikasi Sesuai Event
    const emailTasks: Promise<unknown>[] = []

    if (event === 'pengajuan_submitted') {
      // 10A. Web Notification untuk Pemohon
      try {
        await createNotificationServer({
          userId: pengajuan.user_id,
          judul: 'Pengajuan Magang Berhasil Terkirim',
          pesan: `Permohonan magang Anda (#${publicId}) untuk ${namaBidang} telah berhasil diterima dan menunggu verifikasi admin.`,
          link: '/pengguna/riwayat',
        })
      } catch (err) {
        console.warn('[Notify API] Gagal membuat web notifikasi user:', err)
      }

      // 10B. Web Notification untuk Seluruh Administrator
      try {
        const { data: adminProfiles } = await adminClient
          .from('profiles')
          .select('id')
          .eq('role', 'administrator')
          .eq('is_active', true)

        if (adminProfiles && adminProfiles.length > 0) {
          const notifInserts = adminProfiles.map((adm) => ({
            user_id: adm.id,
            judul: 'Pengajuan Magang Baru',
            pesan: `${namaPemohon} dari ${asalInstansi} telah mengajukan permohonan magang untuk ${namaBidang}. Silakan verifikasi berkas permohonan.`,
            link: expectedAdminLink,
            is_read: false,
          }))
          await adminClient.from('notifikasi').insert(notifInserts)
        }
      } catch (err) {
        console.warn('[Notify API] Gagal membuat web notifikasi admin:', err)
      }

      // 10C. Email Konfirmasi ke Pemohon
      if (pemohonEmail) {
        emailTasks.push(
          emailService.sendNotification({
            event: 'pengajuan_submitted',
            recipientRole: 'user',
            recipient: {
              email: pemohonEmail,
              name: namaPemohon,
            },
            pengajuan: pData,
          })
        )
      }

      // 10D. Email Pemberitahuan ke Administrator
      const { getAdminEmailAddress } = await import('@/lib/services/server-mailer')
      const adminEmail = getAdminEmailAddress()

      emailTasks.push(
        emailService.sendNotification({
          event: 'admin_pengajuan_new',
          recipientRole: 'admin',
          recipient: {
            email: adminEmail,
            name: 'Admin SIMPUL',
          },
          pengajuan: pData,
        })
      )
    } else if (event === 'pengajuan_cancelled') {
      // 10E. Web Notification untuk Administrator
      try {
        const { data: adminProfiles } = await adminClient
          .from('profiles')
          .select('id')
          .eq('role', 'administrator')
          .eq('is_active', true)

        if (adminProfiles && adminProfiles.length > 0) {
          const notifInserts = adminProfiles.map((adm) => ({
            user_id: adm.id,
            judul: 'Pengajuan Magang Dibatalkan Pemohon',
            pesan: `Permohonan magang #${publicId} (${namaBidang}) atas nama ${namaPemohon} (${asalInstansi}) telah dibatalkan oleh pemohon.`,
            link: expectedAdminLink,
            is_read: false,
          }))
          await adminClient.from('notifikasi').insert(notifInserts)
        }
      } catch (err) {
        console.warn('[Notify API] Gagal membuat web notifikasi pembatalan admin:', err)
      }

      // 10F. Email Konfirmasi Pembatalan ke Pemohon & Admin
      const cancelPayload = {
        ...pData,
        statusSebelum: 'Menunggu Verifikasi',
        statusSesudah: 'Dibatalkan',
        alasanPembatalan: cleanAlasan,
      }

      if (pemohonEmail) {
        emailTasks.push(
          emailService.sendNotification({
            event: 'pengajuan_cancelled',
            recipientRole: 'user',
            recipient: {
              email: pemohonEmail,
              name: namaPemohon,
            },
            pengajuan: cancelPayload,
          })
        )
      }

      const { getAdminEmailAddress } = await import('@/lib/services/server-mailer')
      const adminEmail = getAdminEmailAddress()

      emailTasks.push(
        emailService.sendNotification({
          event: 'pengajuan_cancelled',
          recipientRole: 'admin',
          recipient: {
            email: adminEmail,
            name: 'Admin SIMPUL',
          },
          pengajuan: cancelPayload,
        })
      )
    }

    await Promise.allSettled(emailTasks)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[API /api/pengajuan/notify] Exception:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
