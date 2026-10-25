import { EmailNotificationPayload } from '@/types/email.types'

/**
 * Helper untuk mengamankan string input dari karakter berbahaya (Anti-XSS pada Email Client)
 */
export function escapeHtml(str?: string | null): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Format tanggal Indonesia ramah pengguna (contoh: "1 Oktober 2026")
 */
export function formatDateId(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Menentukan base URL aplikasi dengan sanitasi trailing slash
 */
export function resolveBaseUrl(appUrl?: string): string {
  if (appUrl && appUrl.trim() !== '') {
    return appUrl.trim().replace(/\/+$/, '')
  }
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '')
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL.trim() !== '') {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
  }
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== '') {
    return `https://${process.env.VERCEL_URL.trim()}`
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  return ''
}

/**
 * Mengembalikan Subject Email resmi berdasarkan Event dan Role
 */
export function getEmailSubject(payload: EmailNotificationPayload): string {
  const publicId = payload.pengajuan.publicId || 'ID'
  const isTargetAdmin =
    payload.recipientRole === 'admin' ||
    payload.event === 'admin_pengajuan_new' ||
    payload.event === 'admin_skm_completed'

  if (isTargetAdmin) {
    const nama = payload.pengajuan.namaPemohon || payload.recipient.name || 'Pemohon'
    const instansi = payload.pengajuan.asalInstansi ? `(${payload.pengajuan.asalInstansi})` : ''

    switch (payload.event) {
      case 'admin_pengajuan_new':
      case 'pengajuan_submitted':
        return `[ADMIN SIMPUL] Pengajuan Magang Baru: ${nama} ${instansi} (#${publicId})`
      case 'admin_skm_completed':
        return `[ADMIN SIMPUL] SKM Telah Lengkap: ${nama} ${instansi} (#${publicId})`
      case 'pengajuan_cancelled':
        return `[ADMIN SIMPUL] Pengajuan Dibatalkan oleh Pemohon: ${nama} (#${publicId})`
      case 'pengajuan_completed':
        return `[ADMIN SIMPUL] Periode Magang Selesai: ${nama} ${instansi} (#${publicId})`
      default:
        return `[ADMIN SIMPUL] Update Pengajuan Magang (#${publicId})`
    }
  }

  // Subjek untuk Pengguna (Pemohon)
  switch (payload.event) {
    case 'pengajuan_submitted':
      return `[SIMPUL] Pengajuan Magang Berhasil Terkirim (#${publicId})`
    case 'pengajuan_approved':
      return `[SIMPUL] Selamat! Pengajuan Magang Anda Telah Disetujui (#${publicId})`
    case 'pengajuan_rejected':
      return `[SIMPUL] Pemberitahuan Status Pengajuan Magang (#${publicId})`
    case 'pengajuan_cancelled':
      return `[SIMPUL] Konfirmasi Pembatalan Pengajuan Magang (#${publicId})`
    case 'pengajuan_completed':
      return `[SIMPUL] Selamat! Rangkaian Kegiatan Magang Anda Telah Selesai (#${publicId})`
    case 'sertifikat_available':
      return `[SIMPUL] Sertifikat Magang Anda Telah Terbit (#${publicId})`
    default:
      return `[SIMPUL] Pemberitahuan SIMPUL BRMP PH (#${publicId})`
  }
}

/**
 * Helper untuk merender daftar anggota secara ringkas (maks 5, sisanya +N lainnya)
 */
function renderAnggotaSummary(payload: EmailNotificationPayload): string {
  const { jenisPeserta, jumlahPeserta, daftarAnggotaRingkas, sisaAnggotaCount } = payload.pengajuan

  if (jenisPeserta !== 'Kelompok' && (!jumlahPeserta || jumlahPeserta <= 1)) {
    return 'Individu (1 orang)'
  }

  let text = `Kelompok (${jumlahPeserta || 1} orang)`
  if (daftarAnggotaRingkas && daftarAnggotaRingkas.length > 0) {
    const listNames = daftarAnggotaRingkas.map((n) => escapeHtml(n)).join(', ')
    const sisaText = sisaAnggotaCount && sisaAnggotaCount > 0 ? ` +${sisaAnggotaCount} lainnya` : ''
    text += `<br/><span style="color:#64748b;font-size:12px;">Anggota: ${listNames}${sisaText}</span>`
  }
  return text
}

/**
 * Plain Text fallback untuk Email Client yang tidak mendukung HTML
 */
export function renderEmailPlainText(payload: EmailNotificationPayload): string {
  const { recipient, recipientRole, pengajuan, pembimbing, alasanPenolakan, appUrl } = payload
  const baseUrl = resolveBaseUrl(appUrl)
  const isTargetAdmin =
    recipientRole === 'admin' ||
    payload.event === 'admin_pengajuan_new' ||
    payload.event === 'admin_skm_completed'

  if (isTargetAdmin) {
    const pemohon = pengajuan.namaPemohon || recipient.name
    const instansi = pengajuan.asalInstansi || '-'
    const jurusan = pengajuan.jurusan || '-'
    const bidang = pengajuan.bidangNama || '-'

    let adminBody = `Halo Admin SIMPUL,\n\n`

    switch (payload.event) {
      case 'admin_pengajuan_new':
      case 'pengajuan_submitted':
        adminBody += `${pemohon} dari ${instansi} (${jurusan}) telah mengajukan permohonan magang baru untuk bidang "${bidang}".\n\n`
        break
      case 'admin_skm_completed':
        adminBody += `Seluruh peserta dari permohonan magang ${pemohon} (${instansi}) pada bidang "${bidang}" telah melengkapi kuesioner Survei Kepuasan Masyarakat (SKM).\n\n`
        break
      case 'pengajuan_completed':
        adminBody += `Periode kegiatan magang untuk ${pemohon} dari ${instansi} pada bidang "${bidang}" telah selesai.\n\n`
        break
      case 'pengajuan_cancelled':
        adminBody += `${pemohon} dari ${instansi} telah membatalkan pengajuan magang di bidang "${bidang}". (Status: Langsung Dibatalkan, Kuota tidak berubah).\n\n`
        break
      default:
        adminBody += `Terdapat pembaruan pada pengajuan magang ${pemohon} (${instansi}) di bidang "${bidang}".\n\n`
        break
    }

    adminBody += `RINCIAN PENGAJUAN:\n`
    adminBody += `- Nama Pemohon: ${pemohon}\n`
    adminBody += `- Asal Instansi: ${instansi}\n`
    adminBody += `- Jurusan / Jenjang: ${jurusan} (${pengajuan.jenjang || '-'})\n`
    adminBody += `- Jenis Kepesertaan: ${pengajuan.jenisPeserta || 'Individu'} (${pengajuan.jumlahPeserta || 1} orang)\n`
    if (pengajuan.daftarAnggotaRingkas && pengajuan.daftarAnggotaRingkas.length > 0) {
      adminBody += `  Anggota: ${pengajuan.daftarAnggotaRingkas.join(', ')}${
        pengajuan.sisaAnggotaCount ? ` +${pengajuan.sisaAnggotaCount} lainnya` : ''
      }\n`
    }
    adminBody += `- Bidang Dituju: ${bidang}\n`
    adminBody += `- Rencana Periode: ${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(pengajuan.tanggalSelesai)}\n`
    adminBody += `- Waktu Kejadian: ${pengajuan.waktuKejadianWib || '-'}\n`
    if (alasanPenolakan || payload.catatan) {
      adminBody += `- Keterangan: ${alasanPenolakan || payload.catatan}\n`
    }
    adminBody += `- ID Pengajuan: #${pengajuan.publicId}\n\n`

    const adminLink = pengajuan.publicId
      ? `${baseUrl}/admin/riwayat-pengajuan/${pengajuan.publicId}`
      : `${baseUrl}/admin/riwayat-pengajuan`
    adminBody += `Buka di Dashboard Admin: ${adminLink}\n\n`
    adminBody += `--\nSIMPUL BRMP PH (Portal Administrator)\n`
    return adminBody
  }

  // Plain Text untuk Pengguna (Pemohon)
  let userBody = `Halo ${recipient.name},\n\n`

  switch (payload.event) {
    case 'pengajuan_submitted':
      userBody += `Pengajuan magang Anda untuk bidang "${pengajuan.bidangNama || '-'}" telah berhasil diterima sistem dan sedang menunggu proses verifikasi oleh tim BRMP PH.\n\n`
      userBody += `Detail Pengajuan:\n`
      userBody += `- Bidang: ${pengajuan.bidangNama || '-'}\n`
      userBody += `- Asal Instansi: ${pengajuan.asalInstansi || '-'}\n`
      userBody += `- Periode: ${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(pengajuan.tanggalSelesai)}\n`
      userBody += `- ID Permohonan: #${pengajuan.publicId}\n\n`
      userBody += `Langkah berikutnya: Tim kami akan meninjau kelengkapan dokumen dan kesesuaian kuota. Anda akan menerima notifikasi status berikutnya melalui email ini.\n\n`
      userBody += `Pantau status permohonan Anda melalui: ${baseUrl ? `${baseUrl}/pengguna/riwayat` : '/pengguna/riwayat'}\n`
      break

    case 'pengajuan_approved':
      userBody += `Selamat! Permohonan magang Anda untuk bidang "${pengajuan.bidangNama || '-'}" telah DISETUJUI oleh tim BRMP PH.\n\n`
      if (payload.catatan) {
        userBody += `Catatan Status:\n${payload.catatan}\n\n`
      }
      userBody += `Informasi Penugasan:\n`
      userBody += `- Bidang: ${pengajuan.bidangNama || '-'}\n`
      userBody += `- Pembimbing Lapangan: ${pembimbing?.nama || 'Akan dikonfirmasi'}${pembimbing?.nip ? ` (NIP: ${pembimbing.nip})` : ''}\n`
      userBody += `- Periode Magang: ${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(pengajuan.tanggalSelesai)}\n`
      userBody += `- ID Permohonan: #${pengajuan.publicId}\n\n`
      userBody += `Silakan login ke portal untuk melihat informasi lengkap dan persiapan magang: ${baseUrl ? `${baseUrl}/pengguna/riwayat` : '/pengguna/riwayat'}\n`
      break

    case 'pengajuan_rejected':
      userBody += `Mohon maaf, permohonan magang Anda untuk bidang "${pengajuan.bidangNama || '-'}" belum dapat disetujui.\n\n`
      userBody += `Alasan Penolakan:\n"${alasanPenolakan || 'Persyaratan administrasi atau kuota belum terpenuhi'}"\n\n`
      userBody += `ID Permohonan: #${pengajuan.publicId}\n\n`
      userBody += `Anda dapat memeriksa kembali kelengkapan dokumen dan mengajukan permohonan baru melalui portal SIMPUL: ${baseUrl ? `${baseUrl}/pengguna/career/step1` : '/pengguna/career/step1'}\n`
      break

    case 'pengajuan_cancelled':
      userBody += `Permohonan magang Anda untuk bidang "${pengajuan.bidangNama || '-'}" telah resmi dibatalkan atas permintaan Anda sendiri.\n\n`
      if (payload.catatan) {
        userBody += `Catatan Pembatalan:\n${payload.catatan}\n\n`
      }
      userBody += `Keterangan Kuota: Pengajuan dibatalkan dari status verifikasi awal, tidak ada perubahan kuota magang yang terpotong.\n`
      userBody += `ID Permohonan: #${pengajuan.publicId}\n\n`
      userBody += `Jika Anda ingin mengajukan permohonan magang di lain waktu, silakan akses: ${baseUrl ? `${baseUrl}/pengguna/career/step1` : '/pengguna/career/step1'}\n`
      break

    case 'pengajuan_completed':
      userBody += `Selamat! Anda telah menyelesaikan seluruh rangkaian kegiatan magang di BRMP PH untuk bidang "${pengajuan.bidangNama || '-'}".\n\n`
      userBody += `Langkah berikutnya: Mohon luangkan waktu 2-3 menit untuk mengisi kuesioner Survei Kepuasan Masyarakat (SKM) guna mengaktifkan penerbitan sertifikat magang resmi Anda.\n\n`
      userBody += `Isi kuesioner sekarang: ${baseUrl ? `${baseUrl}/pengguna/skm` : '/pengguna/skm'}\n`
      break

    case 'sertifikat_available':
      userBody += `Kabar baik! Sertifikat resmi kelulusan magang Anda untuk bidang "${pengajuan.bidangNama || '-'}" telah selesai diterbitkan oleh BRMP PH.\n\n`
      userBody += `Berkas sertifikat resmi telah kami lampirkan langsung pada email ini. Anda juga dapat mengunduh ulang sertifikat kapan saja melalui portal SIMPUL:\n`
      userBody += `${baseUrl ? `${baseUrl}/pengguna/sertifikat` : '/pengguna/sertifikat'}\n`
      break

    default:
      userBody += `Terdapat informasi terbaru mengenai status pengajuan magang Anda (#${pengajuan.publicId}).\n\n`
      userBody += `Silakan buka portal SIMPUL: ${baseUrl ? `${baseUrl}/pengguna/riwayat` : '/pengguna/riwayat'}\n`
      break
  }

  userBody += `\n--\nSIMPUL BRMP PH\n(Sistem Informasi Magang dan Pelatihan Unggulan Lanjutan)\nBalai Pengelola Hasil Perakitan dan Modernisasi Pertanian\n`
  return userBody
}

/**
 * Template Wrapper Utama (Kompatibel Email Client, Tabel 600px, Safe Light/Dark)
 */
function renderBaseLayout(opts: {
  title: string
  badgeText: string
  badgeBg: string
  badgeColor: string
  greetingHtml: string
  leadHtml: string
  contentHtml: string
  ctaText: string
  ctaUrl: string
  publicId: string
  logoUrl: string
  roleNotice: string
}): string {
  const {
    title,
    badgeText,
    badgeBg,
    badgeColor,
    greetingHtml,
    leadHtml,
    contentHtml,
    ctaText,
    ctaUrl,
    publicId,
    logoUrl,
    roleNotice,
  } = opts

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:24px 8px;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Outer Table Container (Max 600px) -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    
    <!-- Header Hijau SIMPUL -->
    <tr>
      <td align="center" style="background-color:#064e3b;padding:28px 20px;text-align:center;">
        <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td align="center">
              <img src="${logoUrl}" alt="Logo SIMPUL" width="68" height="68" style="display:block;margin:0 auto 12px;border-radius:10px;border:0;outline:none;text-decoration:none;" />
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.02em;line-height:1.2;">SIMPUL BRMP PH</div>
              <div style="color:#a7f3d0;font-size:12px;margin-top:4px;line-height:1.4;">Sistem Informasi Magang dan Pelatihan Unggulan Lanjutan</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content Area -->
    <tr>
      <td style="padding:28px 24px;background-color:#ffffff;">
        
        <!-- Badge Status -->
        <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="background-color:${badgeBg};color:${badgeColor};padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
              ${badgeText}
            </td>
          </tr>
        </table>

        <!-- Judul Heading -->
        <h1 style="margin:0 0 14px 0;color:#0f172a;font-size:20px;font-weight:700;line-height:1.35;">
          ${escapeHtml(title)}
        </h1>

        <!-- Salam & Lead -->
        <div style="color:#1e293b;font-size:15px;line-height:1.6;margin-bottom:8px;">
          ${greetingHtml}
        </div>
        <div style="color:#334155;font-size:14px;line-height:1.6;margin-bottom:20px;">
          ${leadHtml}
        </div>

        <!-- Dynamic Content Box -->
        ${contentHtml}

        <!-- Call to Action Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:26px 0 16px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#15803d;border-radius:8px;">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      ${escapeHtml(ctaText)} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Small Public ID footer -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;border-top:1px dashed #e2e8f0;padding-top:12px;">
          <tr>
            <td align="center" style="color:#64748b;font-size:11px;font-family:monospace;">
              Nomor Referensi Pengajuan: #${escapeHtml(publicId)}
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Footer Area -->
    <tr>
      <td style="padding:18px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#475569;font-size:12px;line-height:1.5;">
          ${roleNotice}
        </p>
        <p style="margin:6px 0 0 0;color:#64748b;font-size:11px;">
          Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP PH)
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`.trim()
}

/**
 * Render Template Varian ADMIN
 */
function renderAdminEmailHtml(payload: EmailNotificationPayload): string {
  const { recipient, pengajuan, appUrl } = payload
  const baseUrl = resolveBaseUrl(appUrl)
  const logoUrl = `${baseUrl}/images/logo.png`

  const pemohon = pengajuan.namaPemohon || recipient.name || 'Pemohon'
  const instansi = pengajuan.asalInstansi || '-'
  const jurusan = pengajuan.jurusan || '-'
  const jenjang = pengajuan.jenjang || '-'
  const bidang = pengajuan.bidangNama || '-'
  const publicId = pengajuan.publicId || '-'
  const waktuWib = pengajuan.waktuKejadianWib || '-'

  let title = 'Pemberitahuan Sistem Magang'
  let badgeText = 'ADMIN NOTIFIKASI'
  let badgeBg = '#e0f2fe'
  let badgeColor = '#0369a1'
  let leadHtml = ''
  let statusHighlight = ''

  const ctaUrl = publicId && publicId !== '-'
    ? `${baseUrl}/admin/riwayat-pengajuan/${publicId}`
    : `${baseUrl}/admin/riwayat-pengajuan`
  const ctaText = 'Buka di Dashboard Admin'

  switch (payload.event) {
    case 'admin_pengajuan_new':
    case 'pengajuan_submitted':
      title = 'Pengajuan Magang Baru Diterima'
      badgeText = 'PERMOHONAN BARU'
      badgeBg = '#e0f2fe'
      badgeColor = '#0369a1'
      leadHtml = `<strong>${escapeHtml(pemohon)}</strong> dari <strong>${escapeHtml(
        instansi
      )}</strong> (${escapeHtml(jurusan)}) telah mengajukan permohonan magang baru pada bidang <strong>${escapeHtml(
        bidang
      )}</strong>.`
      statusHighlight = `<div style="margin-top:10px;padding:8px 12px;background-color:#f0f9ff;border-left:3px solid #0284c7;font-size:13px;color:#0369a1;">Berkas menunggu peninjauan dan verifikasi ketersediaan kuota serta pembimbing.</div>`
      break

    case 'admin_skm_completed':
      title = 'Survei Kepuasan (SKM) Telah Lengkap'
      badgeText = 'SKM SELESAI'
      badgeBg = '#fef3c7'
      badgeColor = '#b45309'
      leadHtml = `Seluruh peserta dari <strong>${escapeHtml(instansi)}</strong> atas nama <strong>${escapeHtml(
        pemohon
      )}</strong> telah melengkapi pengisian kuesioner Survei Kepuasan Masyarakat (SKM).`
      statusHighlight = `<div style="margin-top:10px;padding:8px 12px;background-color:#fefce8;border-left:3px solid #ca8a04;font-size:13px;color:#854d0e;">Seluruh kuisioner selesai diisi. Pengajuan ini kini siap diproses untuk penerbitan sertifikat magang.</div>`
      break

    case 'pengajuan_completed':
      title = 'Periode Magang Telah Berakhir'
      badgeText = 'MAGANG SELESAI'
      badgeBg = '#dcfce7'
      badgeColor = '#15803d'
      leadHtml = `Rangkaian kegiatan magang untuk <strong>${escapeHtml(pemohon)}</strong> dari <strong>${escapeHtml(
        instansi
      )}</strong> pada bidang <strong>${escapeHtml(bidang)}</strong> telah memasuki tanggal akhir kegiatan.`
      statusHighlight = `<div style="margin-top:10px;padding:8px 12px;background-color:#f0fdf4;border-left:3px solid #16a34a;font-size:13px;color:#166534;">Sistem telah menginstruksikan peserta untuk mengisi kuesioner SKM sebelum penerbitan sertifikat.</div>`
      break

    case 'pengajuan_cancelled':
      title = 'Pengajuan Dibatalkan oleh Pemohon'
      badgeText = 'DIBATALKAN'
      badgeBg = '#f1f5f9'
      badgeColor = '#475569'
      leadHtml = `<strong>${escapeHtml(pemohon)}</strong> dari <strong>${escapeHtml(
        instansi
      )}</strong> membatalkan pengajuan magang di bidang <strong>${escapeHtml(bidang)}</strong>.`
      statusHighlight = `<div style="margin-top:10px;padding:8px 12px;background-color:#f8fafc;border-left:3px solid #64748b;font-size:13px;color:#475569;">Pembatalan mandiri oleh pemohon pada status awal verifikasi. Kuota bidang tidak mengalami perubahan.</div>`
      break

    default:
      leadHtml = `Terdapat pembaruan data permohonan magang atas nama <strong>${escapeHtml(
        pemohon
      )}</strong> (${escapeHtml(instansi)}) pada bidang <strong>${escapeHtml(bidang)}</strong>.`
      break
  }

  const greetingHtml = `Halo <strong>Admin SIMPUL</strong>,`

  const detailBoxHtml = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:18px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">
            Rincian Berkas Permohonan
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:13px;color:#334155;">
            <tr>
              <td style="padding:5px 0;width:140px;color:#64748b;">Nama Pemohon</td>
              <td style="padding:5px 0;font-weight:600;color:#0f172a;">${escapeHtml(pemohon)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#64748b;">Asal Instansi</td>
              <td style="padding:5px 0;color:#0f172a;">${escapeHtml(instansi)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#64748b;">Jurusan / Jenjang</td>
              <td style="padding:5px 0;color:#0f172a;">${escapeHtml(jurusan)} (${escapeHtml(jenjang)})</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#64748b;vertical-align:top;">Tipe Kepesertaan</td>
              <td style="padding:5px 0;color:#0f172a;">${renderAnggotaSummary(payload)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#64748b;">Bidang Magang</td>
              <td style="padding:5px 0;font-weight:600;color:#0369a1;">${escapeHtml(bidang)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#64748b;">Rencana Periode</td>
              <td style="padding:5px 0;color:#0f172a;">${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(
    pengajuan.tanggalSelesai
  )}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#64748b;">Waktu Kejadian</td>
              <td style="padding:5px 0;color:#0f172a;">${escapeHtml(waktuWib)}</td>
            </tr>
            ${
              payload.alasanPenolakan || payload.catatan
                ? `
            <tr>
              <td style="padding:5px 0;color:#64748b;vertical-align:top;">Alasan / Keterangan</td>
              <td style="padding:5px 0;color:#b91c1c;">${escapeHtml(
                payload.alasanPenolakan || payload.catatan
              )}</td>
            </tr>
            `
                : ''
            }
          </table>
          ${statusHighlight}
        </td>
      </tr>
    </table>
  `

  return renderBaseLayout({
    title,
    badgeText,
    badgeBg,
    badgeColor,
    greetingHtml,
    leadHtml,
    contentHtml: detailBoxHtml,
    ctaText,
    ctaUrl,
    publicId,
    logoUrl,
    roleNotice: 'Email pemberitahuan otomatis khusus Administrator SIMPUL BRMP PH.',
  })
}

/**
 * Render Template Varian USER (Pemohon)
 */
function renderUserEmailHtml(payload: EmailNotificationPayload): string {
  const { recipient, pengajuan, pembimbing, alasanPenolakan, appUrl } = payload
  const baseUrl = resolveBaseUrl(appUrl)
  const logoUrl = `${baseUrl}/images/logo.png`

  const bidang = pengajuan.bidangNama || '-'
  const publicId = pengajuan.publicId || '-'

  let title = 'Informasi Pengajuan Magang'
  let badgeText = 'UPDATE STATUS'
  let badgeBg = '#f1f5f9'
  let badgeColor = '#475569'
  let leadHtml = ''
  let ctaUrl = `${baseUrl}/pengguna/riwayat`
  let ctaText = 'Lihat Detail Pengajuan'
  let contentHtml = ''

  switch (payload.event) {
    case 'pengajuan_submitted':
      title = 'Pengajuan Magang Berhasil Terkirim'
      badgeText = 'MENUNGGU VERIFIKASI'
      badgeBg = '#e0f2fe'
      badgeColor = '#0369a1'
      leadHtml = `Pengajuan magang Anda untuk bidang <strong>${escapeHtml(
        bidang
      )}</strong> telah berhasil diterima oleh sistem SIMPUL BRMP PH dan saat ini sedang menunggu proses verifikasi berkas oleh tim administrator.`
      ctaUrl = `${baseUrl}/pengguna/riwayat`
      ctaText = 'Pantau Status Pengajuan'

      contentHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:18px 0;border-collapse:collapse;">
          <tr>
            <td style="padding:16px 18px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:13px;color:#334155;">
                <tr>
                  <td style="padding:5px 0;width:130px;color:#64748b;">Bidang Dituju</td>
                  <td style="padding:5px 0;font-weight:600;color:#0369a1;">${escapeHtml(bidang)}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:#64748b;">Asal Instansi</td>
                  <td style="padding:5px 0;color:#0f172a;">${escapeHtml(pengajuan.asalInstansi || '-')}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:#64748b;">Rencana Periode</td>
                  <td style="padding:5px 0;color:#0f172a;">${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(
        pengajuan.tanggalSelesai
      )}</td>
                </tr>
              </table>
              <div style="margin-top:12px;padding:10px 12px;background-color:#eff6ff;border-radius:6px;font-size:12px;color:#1e40af;line-height:1.5;">
                <strong>Langkah Berikutnya:</strong> Tim administrator kami akan meninjau kelengkapan berkas surat pengantar dan proposal Anda. Anda akan menerima notifikasi email resmi saat verifikasi selesai.
              </div>
            </td>
          </tr>
        </table>
      `
      break

    case 'pengajuan_approved':
      title = 'Selamat! Pengajuan Magang Disetujui'
      badgeText = 'DISETUJUI'
      badgeBg = '#dcfce7'
      badgeColor = '#15803d'
      leadHtml = `Kabar gembira! Permohonan magang Anda pada bidang <strong>${escapeHtml(
        bidang
      )}</strong> telah resmi <strong>DISETUJUI</strong> oleh Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian.`
      ctaUrl = `${baseUrl}/pengguna/riwayat`
      ctaText = 'Lihat Penugasan Pembimbing'

      contentHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:18px 0;border-collapse:collapse;">
          <tr>
            <td style="padding:16px 18px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:13px;color:#166534;">
                <tr>
                  <td style="padding:5px 0;width:140px;color:#15803d;">Unit Kerja / Bidang</td>
                  <td style="padding:5px 0;font-weight:700;">${escapeHtml(bidang)}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:#15803d;">Pembimbing Lapangan</td>
                  <td style="padding:5px 0;font-weight:600;">${escapeHtml(pembimbing?.nama || 'Akan dikonfirmasi')}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:#15803d;">Periode Pelaksanaan</td>
                  <td style="padding:5px 0;">${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(
        pengajuan.tanggalSelesai
      )}</td>
                </tr>
              </table>
              ${
                payload.catatan
                  ? `<div style="margin-top:10px;padding:8px 12px;background-color:#ffffff;border:1px solid #bbf7d0;border-radius:6px;font-size:12px;color:#14532d;">Catatan Petugas: ${escapeHtml(
                      payload.catatan
                    )}</div>`
                  : ''
              }
              <div style="margin-top:12px;font-size:12px;color:#166534;line-height:1.5;">
                Silakan berkoordinasi dengan pembimbing dan mempersiapkan dokumen yang diperlukan sebelum tanggal mulai magang.
              </div>
            </td>
          </tr>
        </table>
      `
      break

    case 'pengajuan_rejected':
      title = 'Pemberitahuan Status Pengajuan Magang'
      badgeText = 'BELUM DAPAT DISETUJUI'
      badgeBg = '#fee2e2'
      badgeColor = '#b91c1c'
      leadHtml = `Terima kasih atas minat Anda untuk melaksanakan kegiatan magang di BRMP PH. Setelah melalui proses penelaahan berkas, kami menginformasikan bahwa permohonan Anda untuk bidang <strong>${escapeHtml(
        bidang
      )}</strong> saat ini belum dapat disetujui.`
      ctaUrl = `${baseUrl}/pengguna/career/step1`
      ctaText = 'Ajukan Permohonan Baru'

      contentHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:18px 0;border-collapse:collapse;">
          <tr>
            <td style="padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">
                Alasan Keputusan
              </div>
              <div style="font-size:13px;color:#7f1d1d;line-height:1.5;background-color:#ffffff;border:1px solid #fca5a5;border-radius:6px;padding:10px 12px;margin:8px 0;">
                "${escapeHtml(alasanPenolakan || 'Ketersediaan kuota atau kriteria administrasi belum terpenuhi.')}"
              </div>
              <div style="font-size:12px;color:#991b1b;line-height:1.5;margin-top:10px;">
                Anda dipersilakan untuk memperbaiki kelengkapan administrasi atau memilih bidang lain pada periode mendatang melalui portal SIMPUL.
              </div>
            </td>
          </tr>
        </table>
      `
      break

    case 'pengajuan_cancelled':
      title = 'Konfirmasi Pembatalan Pengajuan'
      badgeText = 'PENGAJUAN DIBATALKAN'
      badgeBg = '#f1f5f9'
      badgeColor = '#475569'
      leadHtml = `Pengajuan magang Anda untuk bidang <strong>${escapeHtml(
        bidang
      )}</strong> telah resmi dibatalkan sesuai dengan permintaan yang Anda lakukan pada sistem.`
      ctaUrl = `${baseUrl}/pengguna/career/step1`
      ctaText = 'Ajukan Magang Baru'

      contentHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:18px 0;border-collapse:collapse;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 10px 0;font-size:13px;color:#334155;line-height:1.5;">
                Pengajuan dibatalkan dari status verifikasi awal. Tidak ada kuota magang yang terpotong untuk permohonan ini.
              </p>
              ${
                payload.catatan
                  ? `
              <p style="margin:8px 0 0 0;font-size:13px;color:#64748b;font-style:italic;">
                ${escapeHtml(payload.catatan)}
              </p>`
                  : ''
              }
              <div style="margin-top:12px;padding:10px 12px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;color:#475569;line-height:1.5;">
                Anda dapat membuat pengajuan baru sewaktu-waktu apabila membutuhkan jadwal atau bidang penugasan lain.
              </div>
            </td>
          </tr>
        </table>
      `
      break

    case 'pengajuan_completed':
      title = 'Kegiatan Magang Telah Selesai'
      badgeText = 'MAGANG SELESAI'
      badgeBg = '#dcfce7'
      badgeColor = '#15803d'
      leadHtml = `Selamat! Anda telah berhasil menuntaskan seluruh rangkaian kegiatan magang di BRMP PH untuk bidang <strong>${escapeHtml(
        bidang
      )}</strong>.`
      ctaUrl = `${baseUrl}/pengguna/skm`
      ctaText = 'Isi Kuesioner SKM Sekarang'

      contentHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:18px 0;border-collapse:collapse;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 10px 0;font-size:13px;color:#166534;line-height:1.5;">
                Terima kasih atas partisipasi, karya, dan dedikasi Anda selama masa magang di balai kami.
              </p>
              <div style="padding:10px 12px;background-color:#ffffff;border:1px solid #bbf7d0;border-radius:6px;font-size:12px;color:#14532d;line-height:1.5;">
                <strong>Langkah Terakhir:</strong> Untuk mengaktifkan penerbitan dan unduhan Sertifikat Magang resmi, mohon kesediaan Anda mengisi Survei Kepuasan Masyarakat (SKM) singkat (estimasi 2 menit).
              </div>
            </td>
          </tr>
        </table>
      `
      break

    case 'sertifikat_available':
      title = 'Sertifikat Magang Anda Telah Terbit'
      badgeText = 'SERTIFIKAT TERBIT'
      badgeBg = '#dcfce7'
      badgeColor = '#15803d'
      leadHtml = `Sertifikat resmi tanda kelulusan kegiatan magang Anda di BRMP PH telah berhasil diterbitkan oleh tim administrator.`
      ctaUrl = `${baseUrl}/pengguna/sertifikat`
      ctaText = 'Unduh Sertifikat di Portal'

      contentHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:18px 0;border-collapse:collapse;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 10px 0;font-size:13px;color:#166534;line-height:1.5;">
                Berkas PDF sertifikat resmi telah dilampirkan langsung pada email ini.
              </p>
              <div style="font-size:12px;color:#14532d;line-height:1.5;">
                Sebagai cadangan arsip digital, Anda juga dapat mengunduh kembali berkas sertifikat kapan saja melalui portal SIMPUL.
              </div>
            </td>
          </tr>
        </table>
      `
      break

    default:
      leadHtml = `Terdapat pembaruan informasi pada permohonan magang Anda untuk bidang <strong>${escapeHtml(
        bidang
      )}</strong>.`
      break
  }

  const greetingHtml = `Halo <strong>${escapeHtml(recipient.name)}</strong>,`

  return renderBaseLayout({
    title,
    badgeText,
    badgeBg,
    badgeColor,
    greetingHtml,
    leadHtml,
    contentHtml,
    ctaText,
    ctaUrl,
    publicId,
    logoUrl,
    roleNotice: 'Email otomatis dari portal SIMPUL BRMP PH untuk pemohon magang.',
  })
}

/**
 * Render HTML Email lengkap dengan memilih varian (USER vs ADMIN) secara otomatis
 */
export function renderEmailHtml(payload: EmailNotificationPayload): string {
  const isTargetAdmin =
    payload.recipientRole === 'admin' ||
    payload.event === 'admin_pengajuan_new' ||
    payload.event === 'admin_skm_completed'

  if (isTargetAdmin) {
    return renderAdminEmailHtml(payload)
  }
  return renderUserEmailHtml(payload)
}
