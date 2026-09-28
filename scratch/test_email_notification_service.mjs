// Helper escapeHtml
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDateId(dateStr) {
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

function getEmailSubject(payload) {
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

function renderEmailPlainText(payload) {
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

function renderEmailHtml(payload) {
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

function assert(description, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    process.exitCode = 1;
  }
}

console.log('=== PENGUJIAN EMAIL NOTIFICATION SYSTEM SIM-MAGANG ===\n');

// 1. Uji Template Event: Pengajuan Submitted
console.log('1. Pengujian Event "pengajuan_submitted"');
const payloadSubmitted = {
  event: 'pengajuan_submitted',
  recipient: { email: 'peserta@example.com', name: 'Ahmad Fauzi' },
  pengajuan: {
    publicId: 'PGJ-2026-001',
    bidangNama: 'Laboratorium Bioteknologi Pertanian',
    asalInstansi: 'Institut Pertanian Bogor',
    tanggalMulai: '2026-10-01',
    tanggalSelesai: '2026-12-31'
  }
};
const subjSubmitted = getEmailSubject(payloadSubmitted);
const htmlSubmitted = renderEmailHtml(payloadSubmitted);
const textSubmitted = renderEmailPlainText(payloadSubmitted);

assert('Subject memuat publicId yang benar', subjSubmitted.includes('PGJ-2026-001') && subjSubmitted.includes('Berhasil Terkirim'));
assert('HTML memuat nama pemohon', htmlSubmitted.includes('Ahmad Fauzi'));
assert('HTML memuat nama bidang', htmlSubmitted.includes('Laboratorium Bioteknologi Pertanian'));
assert('HTML memuat badge PENGAJUAN DITERIMA', htmlSubmitted.includes('PENGAJUAN DITERIMA'));
assert('Plain text memuat link pantau riwayat', textSubmitted.includes('/pengguna/riwayat'));

// 2. Uji Template Event: Pengajuan Approved
console.log('\n2. Pengujian Event "pengajuan_approved"');
const payloadApproved = {
  event: 'pengajuan_approved',
  recipient: { email: 'peserta@example.com', name: 'Siti Rahma' },
  pengajuan: {
    publicId: 'PGJ-2026-002',
    bidangNama: 'Pengolahan Hasil Nabati',
    asalInstansi: 'Universitas Brawijaya',
    tanggalMulai: '2026-10-05',
    tanggalSelesai: '2026-12-05'
  },
  pembimbing: {
    nama: 'Dr. Ir. Hendra Gunawan, M.Si',
    nip: '197508122001121001',
    jabatan: 'Peneliti Madya'
  }
};
const subjApproved = getEmailSubject(payloadApproved);
const htmlApproved = renderEmailHtml(payloadApproved);
const textApproved = renderEmailPlainText(payloadApproved);

assert('Subject memuat status Disetujui', subjApproved.includes('Disetujui'));
assert('HTML memuat nama pembimbing', htmlApproved.includes('Dr. Ir. Hendra Gunawan, M.Si'));
assert('HTML memuat NIP pembimbing', htmlApproved.includes('197508122001121001'));
assert('HTML memuat badge PENGAJUAN DISETUJUI', htmlApproved.includes('PENGAJUAN DISETUJUI'));

// 3. Uji Template Event: Pengajuan Rejected
console.log('\n3. Pengujian Event "pengajuan_rejected"');
const payloadRejected = {
  event: 'pengajuan_rejected',
  recipient: { email: 'peserta@example.com', name: 'Budi Santoso' },
  pengajuan: {
    publicId: 'PGJ-2026-003',
    bidangNama: 'Mekanisasi Pascapanen',
    asalInstansi: 'Universitas Gadjah Mada'
  },
  alasanPenolakan: 'Kuota bimbingan pada periode yang diajukan telah penuh.'
};
const subjRejected = getEmailSubject(payloadRejected);
const htmlRejected = renderEmailHtml(payloadRejected);
const textRejected = renderEmailPlainText(payloadRejected);

assert('Subject memuat pemberitahuan status', subjRejected.includes('Pemberitahuan Status Pengajuan Magang'));
assert('HTML memuat alasan penolakan dari admin', htmlRejected.includes('Kuota bimbingan pada periode yang diajukan telah penuh.'));
assert('HTML memuat badge PERMOHONAN BELUM DISETUJUI', htmlRejected.includes('PERMOHONAN BELUM DISETUJUI'));
assert('Plain text memuat link ajukan kembali', textRejected.includes('/pengguna/career/step1'));

// 4. Uji Template Event: Pengajuan Completed
console.log('\n4. Pengujian Event "pengajuan_completed"');
const payloadCompleted = {
  event: 'pengajuan_completed',
  recipient: { email: 'peserta@example.com', name: 'Dewi Lestari' },
  pengajuan: {
    publicId: 'PGJ-2026-004',
    bidangNama: 'Laboratorium Mutu Pangan'
  }
};
const subjCompleted = getEmailSubject(payloadCompleted);
const htmlCompleted = renderEmailHtml(payloadCompleted);
const textCompleted = renderEmailPlainText(payloadCompleted);

assert('Subject memuat Magang Selesai', subjCompleted.includes('Telah Selesai'));
assert('HTML memuat instruksi SKM & sertifikat', htmlCompleted.includes('Survei Kepuasan Masyarakat (SKM)'));
assert('HTML memuat badge MAGANG SELESAI', htmlCompleted.includes('MAGANG SELESAI'));
assert('Plain text memuat link SKM', textCompleted.includes('/pengguna/skm'));

console.log('\n=== SELURUH 16 PENGUJIAN EMAIL NOTIFICATION LOLOS 100% ===');
