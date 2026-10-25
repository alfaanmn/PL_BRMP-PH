import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendServerMail } from '@/lib/services/server-mailer'
import { getPesertaList, evaluateSKMCompletion } from '@/lib/helpers/peserta.helper'
import {
  getEmailSubject,
  renderEmailHtml,
  renderEmailPlainText,
} from '@/lib/templates/email-templates'
import type { EmailNotificationPayload } from '@/types/email.types'
import type {
  SertifikatRecord,
  AdminSertifikatListItem,
  UserSertifikatItem,
} from '@/types/sertifikat.types'

/**
 * Validasi Magic Bytes untuk file berkas (PDF & JPEG saja)
 * PDF: 0x25 0x50 0x44 0x46 (%PDF)
 * JPEG: 0xFF 0xD8 0xFF
 */
export function validateFileMagicBytes(buffer: Buffer): {
  valid: boolean
  mimeType: 'application/pdf' | 'image/jpeg' | null
  error?: string
} {
  if (!buffer || buffer.length < 4) {
    return { valid: false, mimeType: null, error: 'Berkas kosong atau rusak.' }
  }

  // Cek PDF
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, mimeType: 'application/pdf' }
  }

  // Cek JPEG / JPG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' }
  }

  return {
    valid: false,
    mimeType: null,
    error: 'Format berkas tidak diizinkan. Hanya berkas PDF dan JPG/JPEG asli yang diperbolehkan.',
  }
}

export const sertifikatService = {
  /**
   * Mengambil daftar peserta magang berstatus "Selesai" untuk admin
   */
  async getAdminSertifikatList(filters?: {
    search?: string
    skmStatus?: 'semua' | 'sudah' | 'belum'
    sertifikatStatus?: 'semua' | 'sudah' | 'belum'
    notifikasiStatus?: 'semua' | 'sudah' | 'belum'
  }): Promise<{ data: AdminSertifikatListItem[]; error: string | null }> {
    try {
      const supabase = await createClient()

      // 1. Ambil seluruh pengajuan dengan status "Selesai"
      let query = supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          nama_lengkap,
          nim_nis,
          asal_instansi,
          jurusan,
          tanggal_mulai,
          tanggal_selesai,
          durasi_bulan,
          status,
          user_id,
          anggota,
          bidangs (
            id,
            nama
          )
        `)
        .eq('status', 'Selesai')
        .order('id', { ascending: false })

      const { data: pengajuans, error: pErr } = await query

      if (pErr) {
        return { data: [], error: `Gagal memuat daftar pengajuan: ${pErr.message}` }
      }

      if (!pengajuans || pengajuans.length === 0) {
        return { data: [], error: null }
      }

      const pengajuanIds = pengajuans.map((p) => p.id)

      // 2. Ambil seluruh sertifikat yang terkait dengan pengajuan-pengajuan ini
      const { data: sertifikats, error: sErr } = await supabase
        .from('sertifikats')
        .select('*')
        .in('pengajuan_id', pengajuanIds)
        .order('is_ketua', { ascending: false })
        .order('id', { ascending: true })

      if (sErr) {
        console.warn('Gagal memuat sertifikats:', sErr.message)
      }

      const sertifikatsByPengajuan = new Map<number, SertifikatRecord[]>()
      sertifikats?.forEach((s: any) => {
        const arr = sertifikatsByPengajuan.get(s.pengajuan_id) || []
        arr.push(s as SertifikatRecord)
        sertifikatsByPengajuan.set(s.pengajuan_id, arr)
      })

      // 3. Ambil data anggota kelompok dari pengajuan_anggotas
      const { data: anggotasRows, error: aErr } = await supabase
        .from('pengajuan_anggotas')
        .select('id, pengajuan_id, nama, nim_nis, is_ketua')
        .in('pengajuan_id', pengajuanIds)
        .order('id', { ascending: true })

      if (aErr) {
        console.warn('Gagal memuat pengajuan_anggotas:', aErr.message)
      }

      const anggotasByPengajuan = new Map<number, any[]>()
      anggotasRows?.forEach((a: any) => {
        const arr = anggotasByPengajuan.get(a.pengajuan_id) || []
        arr.push(a)
        anggotasByPengajuan.set(a.pengajuan_id, arr)
      })

      // 4. Ambil data status SKM dari tabel skm_jawaban beserta identitas responden
      const { data: skmRows, error: skmErr } = await supabase
        .from('skm_jawaban')
        .select('pengajuan_id, peserta_nama, peserta_nim, is_ketua, is_legacy, created_at')
        .in('pengajuan_id', pengajuanIds)

      if (skmErr) {
        console.warn('Gagal memuat skm_jawaban:', skmErr.message)
      }

      const skmRowsByPengajuan = new Map<number, any[]>()
      skmRows?.forEach((r: any) => {
        if (r.pengajuan_id) {
          const arr = skmRowsByPengajuan.get(r.pengajuan_id) || []
          arr.push(r)
          skmRowsByPengajuan.set(r.pengajuan_id, arr)
        }
      })

      // 5. Susun list item beserta daftar peserta dan sertifikat masing-masing
      let list: AdminSertifikatListItem[] = pengajuans.map((p: any) => {
        const certsForThis = sertifikatsByPengajuan.get(p.id) || []
        const dbAnggotas = anggotasByPengajuan.get(p.id) || []
        const skmRowsForThis = skmRowsByPengajuan.get(p.id) || []

        const skmEval = evaluateSKMCompletion(p, dbAnggotas, skmRowsForThis)
        const hasSubmittedSKM = skmEval.isComplete
        const skmSubmittedAt = skmRowsForThis[0]?.created_at || null

        // Susun daftar peserta definitif menggunakan helper
        const basePesertas = getPesertaList(p, dbAnggotas)
        const pesertas: Array<{
          id?: number
          nama: string
          nim_nis: string
          is_ketua: boolean
          sertifikat?: SertifikatRecord | null
        }> = basePesertas.map((bp) => ({
          id: bp.id || undefined,
          nama: bp.nama,
          nim_nis: bp.nim_nis,
          is_ketua: bp.is_ketua,
          sertifikat: null,
        }))

        // Pasangkan sertifikat terunggah dengan tiap peserta
        pesertas.forEach((peserta) => {
          const matched = certsForThis.find((c) => {
            if (peserta.id && c.anggota_id && c.anggota_id === peserta.id) return true
            if (peserta.is_ketua && c.is_ketua) return true
            return (
              c.peserta_nama.trim().toLowerCase() === peserta.nama.trim().toLowerCase() &&
              (peserta.nim_nis ? c.peserta_nim.trim() === peserta.nim_nis.trim() : true)
            )
          })
          peserta.sertifikat = matched || null
        })

        const ketuaCert = certsForThis.find((c) => c.is_ketua) || certsForThis[0] || null

        return {
          pengajuanId: p.id,
          publicId: p.public_id || String(p.id),
          namaPemohon: p.nama_lengkap || 'Tanpa Nama',
          nimNis: p.nim_nis || '-',
          asalInstansi: p.asal_instansi || '-',
          jurusan: p.jurusan || '-',
          bidangNama: p.bidangs?.nama || '-',
          tanggalMulai: p.tanggal_mulai || '',
          tanggalSelesai: p.tanggal_selesai || '',
          durasiBulan: p.durasi_bulan || 1,
          jumlahAnggota: pesertas.length,
          pesertas,
          hasSubmittedSKM,
          skmSubmittedAt,
          sertifikat: ketuaCert,
          sertifikats: certsForThis,
          notifiedAt: certsForThis.find((c) => c.notified_at !== null)?.notified_at || null,
        }
      })

      // 6. Terapkan filter di memory
      if (filters?.search) {
        const kw = filters.search.toLowerCase().trim()
        list = list.filter(
          (item) =>
            item.namaPemohon.toLowerCase().includes(kw) ||
            item.publicId.toLowerCase().includes(kw) ||
            item.asalInstansi.toLowerCase().includes(kw) ||
            item.nimNis.toLowerCase().includes(kw) ||
            item.bidangNama.toLowerCase().includes(kw) ||
            item.pesertas.some((peserta) => peserta.nama.toLowerCase().includes(kw))
        )
      }

      if (filters?.skmStatus && filters.skmStatus !== 'semua') {
        const needSubmitted = filters.skmStatus === 'sudah'
        list = list.filter((item) => item.hasSubmittedSKM === needSubmitted)
      }

      if (filters?.sertifikatStatus && filters.sertifikatStatus !== 'semua') {
        const needUploaded = filters.sertifikatStatus === 'sudah'
        list = list.filter((item) => (item.sertifikats.length > 0) === needUploaded)
      }

      if (filters?.notifikasiStatus && filters.notifikasiStatus !== 'semua') {
        const needNotified = filters.notifikasiStatus === 'sudah'
        list = list.filter((item) => Boolean(item.notifiedAt) === needNotified)
      }

      return { data: list, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
      return { data: [], error: msg }
    }
  },

  /**
   * Mengambil daftar sertifikat untuk portal pengguna
   */
  async getUserSertifikatList(userId: string): Promise<{
    data: UserSertifikatItem[]
    error: string | null
  }> {
    try {
      const supabase = await createClient()

      // Ambil seluruh pengajuan milik user
      const { data: pengajuans, error: pErr } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          topik_magang,
          asal_instansi,
          tanggal_mulai,
          tanggal_selesai,
          status,
          bidangs (
            id,
            nama
          )
        `)
        .eq('user_id', userId)
        .order('id', { ascending: false })

      if (pErr) {
        return { data: [], error: `Gagal memuat data pengajuan: ${pErr.message}` }
      }

      if (!pengajuans || pengajuans.length === 0) {
        return { data: [], error: null }
      }

      const pengajuanIds = pengajuans.map((p) => p.id)

      // Ambil data anggota untuk pengajuan kelompok
      const { data: anggotasRows } = await supabase
        .from('pengajuan_anggotas')
        .select('id, pengajuan_id, nama, nim_nis, is_ketua')
        .in('pengajuan_id', pengajuanIds)

      const anggotasByPengajuan = new Map<number, any[]>()
      anggotasRows?.forEach((a: any) => {
        const arr = anggotasByPengajuan.get(a.pengajuan_id) || []
        arr.push(a)
        anggotasByPengajuan.set(a.pengajuan_id, arr)
      })

      // Cek SKM jawaban dengan kolom identitas dan is_legacy
      const { data: skmRows } = await supabase
        .from('skm_jawaban')
        .select('pengajuan_id, peserta_nama, peserta_nim, is_ketua, is_legacy')
        .in('pengajuan_id', pengajuanIds)

      const skmRowsByPengajuan = new Map<number, any[]>()
      skmRows?.forEach((r: any) => {
        if (r.pengajuan_id) {
          const arr = skmRowsByPengajuan.get(r.pengajuan_id) || []
          arr.push(r)
          skmRowsByPengajuan.set(r.pengajuan_id, arr)
        }
      })

      // Ambil seluruh sertifikat
      const { data: sertifikats } = await supabase
        .from('sertifikats')
        .select('*')
        .in('pengajuan_id', pengajuanIds)
        .order('is_ketua', { ascending: false })
        .order('id', { ascending: true })

      const sertifikatsByPengajuan = new Map<number, SertifikatRecord[]>()
      sertifikats?.forEach((s: any) => {
        const arr = sertifikatsByPengajuan.get(s.pengajuan_id) || []
        arr.push(s as SertifikatRecord)
        sertifikatsByPengajuan.set(s.pengajuan_id, arr)
      })

      const list: UserSertifikatItem[] = pengajuans.map((p: any) => {
        const certs = sertifikatsByPengajuan.get(p.id) || []
        const primaryCert = certs.find((c) => c.is_ketua) || certs[0] || null

        let certName = primaryCert?.file_name
        if (certs.length > 1) {
          certName = `${certs.length} Berkas Sertifikat (${certs.map((c) => c.peserta_nama).join(', ')})`
        }

        const dbAnggotas = anggotasByPengajuan.get(p.id) || []
        const skmRowsForThis = skmRowsByPengajuan.get(p.id) || []
        const skmEval = evaluateSKMCompletion(p, dbAnggotas, skmRowsForThis)

        return {
          pengajuanId: p.id,
          publicId: p.public_id || String(p.id),
          topikMagang: p.topik_magang || 'Magang BRMP PH',
          bidangNama: p.bidangs?.nama || 'Bidang BRMP',
          asalInstansi: p.asal_instansi || '-',
          tanggalMulai: p.tanggal_mulai || '',
          tanggalSelesai: p.tanggal_selesai || '',
          status: p.status,
          hasSubmittedSKM: skmEval.isComplete,
          hasSertifikat: certs.length > 0,
          sertifikatName: certName,
          uploadedAt: primaryCert?.uploaded_at,
          sertifikats: certs,
        }
      })

      return { data: list, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan memuat data sertifikat.'
      return { data: [], error: msg }
    }
  },

  /**
   * Pengecekan dan pemicu notifikasi otomatis (Idempoten via klaim atomik)
   * Syarat: Status Selesai + Sertifikat sudah diunggah + SKM sudah diisi
   */
  async checkAndTriggerNotification(pengajuanId: number): Promise<{
    triggered: boolean
    error: string | null
  }> {
    try {
      const supabase = await createClient()

      // 1. Cek status pengajuan
      const { data: pengajuan, error: pErr } = await supabase
        .from('pengajuans')
        .select(`
          id,
          public_id,
          status,
          user_id,
          asal_instansi,
          tanggal_mulai,
          tanggal_selesai,
          bidangs (
            nama
          )
        `)
        .eq('id', pengajuanId)
        .single()

      if (pErr || !pengajuan || pengajuan.status !== 'Selesai') {
        return { triggered: false, error: 'Pengajuan belum berstatus Selesai.' }
      }

      // 2. Cek apakah seluruh peserta sudah mengisi SKM
      const [{ data: dbAnggotas }, { data: skmRows }] = await Promise.all([
        supabase
          .from('pengajuan_anggotas')
          .select('id, pengajuan_id, nama, nim_nis, is_ketua')
          .eq('pengajuan_id', pengajuanId),
        supabase
          .from('skm_jawaban')
          .select('peserta_nama, peserta_nim, is_ketua, is_legacy')
          .eq('pengajuan_id', pengajuanId),
      ])

      const skmEval = evaluateSKMCompletion(pengajuan, dbAnggotas, skmRows)
      if (!skmEval.isComplete) {
        return { triggered: false, error: 'SKM belum lengkap diisi oleh seluruh peserta magang.' }
      }

      // 3. Cek apakah sertifikat sudah diunggah untuk pengajuan ini
      const { data: certRows, error: certErr } = await supabase
        .from('sertifikats')
        .select('id, file_path, file_name, mime_type, notified_at, peserta_nama, is_ketua')
        .eq('pengajuan_id', pengajuanId)

      if (certErr || !certRows || certRows.length === 0) {
        return { triggered: false, error: 'Berkas sertifikat belum diunggah admin.' }
      }

      // Cek apakah ada sertifikat yang belum pernah dinotifikasi
      const hasUnnotified = certRows.some((c) => c.notified_at === null)
      if (!hasUnnotified) {
        // Semua sertifikat sudah pernah dinotifikasi
        return { triggered: false, error: null }
      }

      // 4. Klaim atomik: UPDATE sertifikats SET notified_at = now() WHERE pengajuan_id = X AND notified_at IS NULL
      const nowIso = new Date().toISOString()
      const { data: claimed, error: claimErr } = await supabase
        .from('sertifikats')
        .update({ notified_at: nowIso, updated_at: nowIso })
        .eq('pengajuan_id', pengajuanId)
        .is('notified_at', null)
        .select('id')

      if (claimErr || !claimed || claimed.length === 0) {
        // Gagal mengklaim karena sudah diklaim proses lain bersamaan
        return { triggered: false, error: null }
      }

      // 5. Buat entri notifikasi in-app
      try {
        await supabase.from('notifikasi').insert([
          {
            user_id: pengajuan.user_id,
            judul: 'Sertifikat Magang Telah Siap',
            pesan: `Selamat! Sertifikat resmi kelulusan magang Anda (#${pengajuan.public_id || pengajuan.id}) telah diterbitkan. Silakan buka menu Sertifikat untuk melihat dan mengunduh berkas.`,
            is_read: false,
          },
        ])
      } catch (notifErr) {
        console.warn('[SertifikatService] Gagal membuat entri notifikasi in-app:', notifErr)
      }

      // 6. Ambil profil pemohon untuk kirim email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', pengajuan.user_id)
        .maybeSingle()

      if (!profile?.email) {
        return { triggered: true, error: null }
      }

      // 7. Unduh seluruh berkas sertifikat yang terunggah dari bucket privat via Admin Client (Service Role)
      const attachments: Array<{
        filename: string
        content: Buffer
        contentType: string
      }> = []

      const adminClient = createAdminClient()
      if (adminClient) {
        for (const certItem of certRows) {
          if (!certItem.file_path) continue
          try {
            const { data: blobData, error: dlErr } = await adminClient.storage
              .from('sertifikat')
              .download(certItem.file_path)

            if (dlErr || !blobData) {
              console.warn(
                `[SertifikatService] Unduh storage gagal untuk file_path="${certItem.file_path}":`,
                dlErr
              )
            } else {
              const arrayBuffer = await blobData.arrayBuffer()
              const fileBuffer = Buffer.from(arrayBuffer)
              const isJpeg = certItem.mime_type === 'image/jpeg'
              const ext = isJpeg ? 'jpg' : 'pdf'
              const contentType = isJpeg ? 'image/jpeg' : 'application/pdf'

              const cleanPeserta = (certItem.peserta_nama || profile.name || 'Peserta')
                .replace(/[^a-zA-Z0-9\s._-]/g, '')
                .trim()
              const attachmentFilename = `Sertifikat Magang - ${cleanPeserta}.${ext}`

              attachments.push({
                filename: attachmentFilename,
                content: fileBuffer,
                contentType,
              })
            }
          } catch (storageErr) {
            console.warn('[SertifikatService] Exception saat mengambil lampiran sertifikat:', storageErr)
          }
        }
      } else {
        console.warn('[SertifikatService] Admin client tidak tersedia, email dikirim tanpa lampiran.')
      }

      // 8. Kirim Email Notifikasi Sertifikat Menggunakan Helper Bersama
      const emailPayload: EmailNotificationPayload = {
        event: 'sertifikat_available',
        recipient: {
          email: profile.email,
          name: profile.name || 'Peserta Magang',
        },
        pengajuan: {
          id: pengajuan.id,
          publicId: pengajuan.public_id || String(pengajuan.id),
          bidangNama: (pengajuan.bidangs as any)?.nama,
          asalInstansi: pengajuan.asal_instansi,
          tanggalMulai: pengajuan.tanggal_mulai,
          tanggalSelesai: pengajuan.tanggal_selesai,
        },
      }

      const subject = getEmailSubject(emailPayload)
      const htmlContent = renderEmailHtml(emailPayload)
      const textContent = renderEmailPlainText(emailPayload)

      const sendResult = await sendServerMail({
        to: profile.email,
        subject,
        html: htmlContent,
        text: textContent,
        attachments: attachments.length > 0 ? attachments : undefined,
        event: 'sertifikat_available',
      })

      if (!sendResult.success) {
        console.error('[SertifikatService] Pengiriman email gagal, rollback notified_at:', sendResult.error)

        // Rollback notified_at ke NULL jika email gagal terkirim
        await supabase
          .from('sertifikats')
          .update({ notified_at: null })
          .eq('pengajuan_id', pengajuanId)

        return { triggered: false, error: sendResult.error || 'Gagal mengirim email.' }
      }

      return { triggered: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan pemicu notifikasi.'
      console.error('[SertifikatService] checkAndTriggerNotification exception:', msg)
      return { triggered: false, error: msg }
    }
  },
}
