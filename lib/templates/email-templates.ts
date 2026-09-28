import { EmailNotificationPayload } from '@/types/email.types'

/**
 * Helper untuk mengamankan string input dari karakter berbahaya (Anti-XSS pada Email Client)
 */
function escapeHtml(str?: string | null): string {
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
function formatDateId(dateStr?: string | null): string {
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
 * Mengembalikan Subject Email resmi berdasarkan Event
 */
export function getEmailSubject(payload: EmailNotificationPayload): string {
  const publicId = payload.pengajuan.publicId || 'ID'
  switch (payload.event) {
    case 'pengajuan_submitted':
      return `[SIM-Magang] Pengajuan Magang Berhasil Terkirim (#${publicId})`
    case 'pengajuan_approved':
      return `[SIM-Magang] Selamat! Pengajuan Magang Anda Telah Disetujui (#${publicId})`
    case 'pengajuan_rejected':
      return `[SIM-Magang] Pemberitahuan Status Pengajuan Magang (#${publicId})`
    case 'pengajuan_completed':
      return `[SIM-Magang] Selamat! Rangkaian Kegiatan Magang Anda Telah Selesai (#${publicId})`
    default:
      return `[SIM-Magang] Update Status Pengajuan Magang (#${publicId})`
  }
}

/**
 * Menghasilkan Plain Text fallback untuk Email Client yang tidak mendukung HTML
 */
export function renderEmailPlainText(payload: EmailNotificationPayload): string {
  const { recipient, pengajuan, pembimbing, alasanPenolakan, appUrl } = payload
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let body = `Halo ${recipient.name},\n\n`

  switch (payload.event) {
    case 'pengajuan_submitted':
      body += `Pengajuan magang Anda dengan ID #${pengajuan.publicId} untuk bidang "${pengajuan.bidangNama || '-'}" telah berhasil diterima sistem dan sedang menunggu proses verifikasi oleh tim BRMP PH.\n\n`
      body += `Detail Pengajuan:\n`
      body += `- ID Permohonan: #${pengajuan.publicId}\n`
      body += `- Bidang: ${pengajuan.bidangNama || '-'}\n`
      body += `- Asal Instansi: ${pengajuan.asalInstansi || '-'}\n`
      body += `- Periode: ${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(pengajuan.tanggalSelesai)}\n\n`
      body += `Pantau status permohonan Anda melalui: ${baseUrl}/pengguna/riwayat\n`
      break

    case 'pengajuan_approved':
      body += `Selamat! Permohonan magang Anda dengan ID #${pengajuan.publicId} telah DISETUJUI oleh tim BRMP PH.\n\n`
      body += `Informasi Penugasan:\n`
      body += `- Bidang: ${pengajuan.bidangNama || '-'}\n`
      body += `- Pembimbing Lapangan: ${pembimbing?.nama || 'Akan dikonfirmasi'}${pembimbing?.nip ? ` (NIP: ${pembimbing.nip})` : ''}\n`
      body += `- Periode Magang: ${formatDateId(pengajuan.tanggalMulai)} s/d ${formatDateId(pengajuan.tanggalSelesai)}\n\n`
      body += `Silakan login ke portal untuk melihat informasi lengkap: ${baseUrl}/pengguna/riwayat\n`
      break

    case 'pengajuan_rejected':
      body += `Mohon maaf, permohonan magang Anda dengan ID #${pengajuan.publicId} untuk bidang "${pengajuan.bidangNama || '-'}" belum dapat disetujui.\n\n`
      body += `Alasan Penolakan:\n"${alasanPenolakan || 'Persyaratan administrasi atau kuota belum terpenuhi'}"\n\n`
      body += `Anda dapat memperbaiki berkas dan mengajukan kembali melalui portal: ${baseUrl}/pengguna/career/step1\n`
      break

    case 'pengajuan_completed':
      body += `Selamat! Anda telah menyelesaikan seluruh rangkaian kegiatan magang di BRMP PH dengan ID #${pengajuan.publicId}.\n\n`
      body += `Mohon luangkan waktu 2 menit untuk mengisi Survei Kepuasan Masyarakat (SKM) guna penerbitan sertifikat magang:\n`
      body += `${baseUrl}/pengguna/skm\n`
      break
  }

  body += `\n--\nSIM-MAGANG BRMP PH\nBadan Perakitan dan Modernisasi Pertanian Pengelola Hasil\n`
  return body
}

/**
 * Menghasilkan HTML Responsif berstandar visual resmi BRMP PH
 */
export function renderEmailHtml(payload: EmailNotificationPayload): string {
  const { recipient, pengajuan, pembimbing, alasanPenolakan, appUrl } = payload
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const logoUrl = 'https://dlspskkmuuysmpmvklnp.supabase.co/storage/v1/object/public/smile.png/smile.png'

  let badgeBg = '#ecfdf5'
  let badgeColor = '#15803d'
  let badgeText = 'UPDATE PENGAJUAN'
  let headingTitle = 'Pemberitahuan Status Magang'
  let leadText = ''
  let ctaLink = `${baseUrl}/pengguna/riwayat`
  let ctaText = 'Lihat Detail di Portal'
  let infoContent = ''

  if (payload.event === 'pengajuan_submitted') {
    badgeBg = '#ecfdf5'
    badgeColor = '#15803d'
    badgeText = 'PENGAJUAN DITERIMA'
    headingTitle = 'Pengajuan Berhasil Terkirim'
    leadText = `Permohonan magang Anda telah berhasil kami terima di sistem dan sedang dalam antrean verifikasi oleh tim BRMP PH.`
    ctaLink = `${baseUrl}/pengguna/riwayat`
    ctaText = 'Pantau Riwayat Pengajuan'

    infoContent = `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:22px 0;">
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Rincian Pengajuan</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#334155;">
          <tr>
            <td style="padding:5px 0;width:130px;color:#64748b;">ID Permohonan</td>
            <td style="padding:5px 0;font-weight:700;color:#0f172a;">#${escapeHtml(pengajuan.publicId)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Unit Kerja / Bidang</td>
            <td style="padding:5px 0;font-weight:600;color:#064e3b;">${escapeHtml(pengajuan.bidangNama || '-')}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Asal Instansi</td>
            <td style="padding:5px 0;">${escapeHtml(pengajuan.asalInstansi || '-')}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Rencana Periode</td>
            <td style="padding:5px 0;">${formatDateId(pengajuan.tanggalMulai)} – ${formatDateId(pengajuan.tanggalSelesai)}</td>
          </tr>
        </table>
      </div>
    `
  } else if (payload.event === 'pengajuan_approved') {
    badgeBg = '#ecfdf5'
    badgeColor = '#15803d'
    badgeText = 'PENGAJUAN DISETUJUI'
    headingTitle = 'Selamat! Permohonan Diterima'
    leadText = `Permohonan magang Anda telah <strong>disetujui</strong> oleh administrator BRMP PH. Anda kini resmi terdaftar sebagai peserta magang aktif.`
    ctaLink = `${baseUrl}/pengguna/riwayat`
    ctaText = 'Lihat Lembar Persetujuan'

    infoContent = `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin:22px 0;">
        <div style="font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Penugasan Pembimbing Lapangan</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#334155;">
          <tr>
            <td style="padding:5px 0;width:130px;color:#64748b;">ID Permohonan</td>
            <td style="padding:5px 0;font-weight:700;color:#0f172a;">#${escapeHtml(pengajuan.publicId)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Unit Kerja / Bidang</td>
            <td style="padding:5px 0;font-weight:600;color:#064e3b;">${escapeHtml(pengajuan.bidangNama || '-')}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Pembimbing</td>
            <td style="padding:5px 0;font-weight:700;color:#0f172a;">${escapeHtml(pembimbing?.nama || 'Akan diinformasikan')}</td>
          </tr>
          ${pembimbing?.nip ? `
          <tr>
            <td style="padding:5px 0;color:#64748b;">NIP Pembimbing</td>
            <td style="padding:5px 0;color:#475569;">${escapeHtml(pembimbing.nip)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:5px 0;color:#64748b;">Periode Magang</td>
            <td style="padding:5px 0;font-weight:600;color:#15803d;">${formatDateId(pengajuan.tanggalMulai)} – ${formatDateId(pengajuan.tanggalSelesai)}</td>
          </tr>
        </table>
      </div>
    `
  } else if (payload.event === 'pengajuan_rejected') {
    badgeBg = '#fef2f2'
    badgeColor = '#dc2626'
    badgeText = 'PERMOHONAN BELUM DISETUJUI'
    headingTitle = 'Pemberitahuan Status Pengajuan'
    leadText = `Mohon maaf, permohonan magang Anda untuk bidang <strong>${escapeHtml(pengajuan.bidangNama || '-')}</strong> belum dapat disetujui pada periode ini.`
    ctaLink = `${baseUrl}/pengguna/career/step1`
    ctaText = 'Ajukan Permohonan Baru'

    infoContent = `
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:18px 20px;margin:22px 0;">
        <div style="font-size:11px;font-weight:700;color:#be123c;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Alasan Penolakan</div>
        <p style="margin:0;font-size:14px;color:#881337;line-height:1.6;font-style:italic;">
          &ldquo;${escapeHtml(alasanPenolakan || 'Dokumen belum lengkap atau kuota bidang telah terpenuhi.')}&rdquo;
        </p>
      </div>
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 16px;">
        Anda diperkenankan memperbaiki persyaratan dokumen atau memilih bidang magang lain yang masih memiliki kuota terbuka.
      </p>
    `
  } else if (payload.event === 'pengajuan_completed') {
    badgeBg = '#eff6ff'
    badgeColor = '#2563eb'
    badgeText = 'MAGANG SELESAI'
    headingTitle = 'Selamat! Periode Magang Selesai'
    leadText = `Terima kasih atas dedikasi dan kontribusi Anda selama menjalani kegiatan magang di <strong>BRMP PH</strong>.`
    ctaLink = `${baseUrl}/pengguna/skm`
    ctaText = 'Isi Survei Kepuasan (SKM)'

    infoContent = `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:22px 0;">
        <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.6;">
          Sebagai tahap akhir kegiatan magang, silakan mengisi <strong>Survei Kepuasan Masyarakat (SKM)</strong> untuk membantu kami meningkatkan kualitas pelayanan. Sertifikat magang Anda dapat diunduh melalui portal setelah pengisian survei.
        </p>
      </div>
    `
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(headingTitle)}</title>
</head>
<body style="margin:0;padding:40px 16px;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #dcfce7;border-radius:18px;overflow:hidden;box-shadow:0 4px 12px rgba(6,78,59,0.06);">
    
    <!-- Header -->
    <div style="background:#064e3b;padding:32px 24px 28px;text-align:center;">
      <img
        src="${logoUrl}"
        alt="SIM-MAGANG BRMP PH"
        width="76"
        height="76"
        style="display:block;margin:0 auto 14px;border-radius:12px;background:#ffffff;padding:4px;box-sizing:border-box;"
      />
      <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">
        SIM-MAGANG BRMP PH
      </div>
      <div style="margin-top:4px;color:#bbf7d0;font-size:13px;font-weight:500;">
        Sistem Informasi Manajemen Magang
      </div>
    </div>

    <!-- Content Area -->
    <div style="padding:32px 28px 28px;">
      
      <!-- Status Badge -->
      <div style="display:inline-block;padding:6px 12px;background:${badgeBg};color:${badgeColor};border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.04em;">
        ${badgeText}
      </div>

      <!-- Main Heading -->
      <h2 style="margin:16px 0 10px;color:#064e3b;font-size:22px;font-weight:700;line-height:1.3;">
        ${headingTitle}
      </h2>

      <!-- Greeting & Lead -->
      <p style="margin:0 0 8px;color:#334155;font-size:14px;line-height:1.6;">
        Halo <strong>${escapeHtml(recipient.name)}</strong>,
      </p>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
        ${leadText}
      </p>

      <!-- Dynamic Info Box -->
      ${infoContent}

      <!-- Call To Action Button -->
      <div style="margin:28px 0 12px;text-align:center;">
        <a
          href="${ctaLink}"
          target="_blank"
          style="display:inline-block;padding:12px 28px;background:#15803d;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 2px 6px rgba(21,128,61,0.25);"
        >
          ${ctaText} &rarr;
        </a>
      </div>

      <!-- Helper Notice -->
      <div style="margin-top:24px;padding:14px 16px;background:#f8fafc;border-radius:10px;">
        <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
          Email ini dikirim secara otomatis oleh sistem. Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi tim administrasi melalui portal resmi SIM-Magang.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#475569;font-size:12px;">
        Email otomatis dari <strong style="color:#15803d;">SIM-MAGANG BRMP PH</strong>
      </p>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
        Badan Perakitan dan Modernisasi Pertanian Pengelola Hasil
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()
}
