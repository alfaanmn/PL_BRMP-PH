import * as XLSX from 'xlsx'
import type {
  LaporanExportPackage,
  ExportDatasetCategory,
  LaporanSKMQuestionMeta,
  LaporanSKMRow,
} from '@/types/laporan.types'

/**
 * Utility helper untuk menghasilkan buffer berkas Excel (.xlsx) 7-Worksheet atau string CSV (.csv)
 */
export const exportExcelUtil = {
  /**
   * Menghitung lebar kolom otomatis berdasarkan panjang data
   */
  fitColumnWidths(data: any[], customHeaders?: string[]): { wch: number }[] {
    if (!data || data.length === 0) return []

    const keys = customHeaders || Object.keys(data[0])
    return keys.map((key) => {
      let maxLen = key.length
      for (const row of data) {
        const val = row[key]
        if (val !== undefined && val !== null) {
          const str = String(val)
          if (str.length > maxLen) {
            maxLen = Math.min(str.length, 60) // cap max width at 60
          }
        }
      }
      return { wch: Math.max(maxLen + 3, 10) }
    })
  },

  /**
   * Format Sheet 1 — Ringkasan Laporan Terstruktur
   */
  generateRingkasanSheet(pkg: LaporanExportPackage) {
    const rows: (string | number)[][] = [
      ['LAPORAN EKSEKUTIF SISTEM INFORMASI MANAJEMEN MAGANG (SIM-MAGANG) BRMP PH'],
      ['Balai Riset Standardisasi dan Pengujian Mutu Hasil Pertanian'],
      [''],
      ['I. PARAMETER & FILTER LAPORAN'],
      ['Waktu Unduh', pkg.generatedAt],
      ['Periode / Rentang Tanggal', pkg.filterSummary.dateRange],
      ['Filter Status', pkg.filterSummary.status],
      ['Filter Bidang', pkg.filterSummary.bidang],
      ['Filter Pembimbing', pkg.filterSummary.pembimbing],
      ['Kata Kunci Pencarian', pkg.filterSummary.keyword],
      [''],
      ['II. REKAPITULASI METRIK UTAMA'],
      ['Indikator', 'Nilai'],
      ['Total Permohonan Pengajuan', pkg.summaryStats.totalPengajuan],
      ['Total Peserta Magang (Orang)', pkg.summaryStats.totalPeserta],
      ['Total Bidang Magang Aktif', pkg.summaryStats.totalBidang],
      ['Total Pembimbing Lapangan Aktif', pkg.summaryStats.totalPembimbing],
      [
        'Nilai Rata-rata Kepuasan SKM',
        pkg.summaryStats.rataRataSKM !== null ? `${pkg.summaryStats.rataRataSKM} / 4.00` : '-',
      ],
      [''],
      ['III. DISTRIBUSI STATUS PENGAJUAN (DATA TERFILTER)'],
      ['No', 'Status Pengajuan', 'Jumlah Pengajuan', 'Total Peserta (Orang)', 'Persentase'],
    ]

    pkg.statusData.forEach((st) => {
      rows.push([st.no, st.status, st.totalPengajuan, st.totalPeserta, st.persentase])
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 36 }, { wch: 30 }, { wch: 20 }, { wch: 24 }, { wch: 16 }]
    return ws
  },

  /**
   * Format Sheet 2 — Data Pengajuan
   */
  formatPengajuanSheet(rows: any[]) {
    if (!rows || rows.length === 0) {
      return [
        {
          'No': 1,
          'Public ID': 'Tidak ada data pada periode/filter ini',
          'ID DB': '-',
          'Nama Pemohon': '-',
          'Email Pemohon': '-',
          'No. HP': '-',
          'NIM / NIS': '-',
          'Asal Instansi': '-',
          'Jurusan': '-',
          'Jenjang': '-',
          'Topik Magang': '-',
          'Bidang Magang': '-',
          'Pembimbing Lapangan': '-',
          'NIP Pembimbing': '-',
          'Jumlah Anggota': 0,
          'Nomor Surat': '-',
          'Tanggal Surat': '-',
          'Tanggal Mulai': '-',
          'Tanggal Selesai': '-',
          'Durasi (Bulan)': 0,
          'Status': '-',
          'Tanggal Pengajuan': '-',
          'Tanggal Update': '-',
        },
      ]
    }

    return rows.map((r) => ({
      'No': r.no,
      'Public ID': r.publicId,
      'ID DB': r.dbId,
      'Nama Pemohon': r.namaPemohon,
      'Email Pemohon': r.email || '-',
      'No. HP': r.noHp || '-',
      'NIM / NIS': r.nimNis || '-',
      'Asal Instansi': r.asalInstansi || '-',
      'Jurusan': r.jurusan || '-',
      'Jenjang': r.jenjang || '-',
      'Topik Magang': r.topikMagang || '-',
      'Bidang Magang': r.bidangNama || '-',
      'Pembimbing Lapangan': r.pembimbingNama || '-',
      'NIP Pembimbing': r.pembimbingNip || '-',
      'Jumlah Anggota': r.jumlahAnggota,
      'Nomor Surat': r.nomorSurat || '-',
      'Tanggal Surat': r.tanggalSurat || '-',
      'Tanggal Mulai': r.tanggalMulai || '-',
      'Tanggal Selesai': r.tanggalSelesai || '-',
      'Durasi (Bulan)': r.durasiBulan,
      'Status': r.status,
      'Tanggal Pengajuan': r.tanggalPengajuan || '-',
      'Tanggal Update': r.tanggalUpdate || '-',
    }))
  },

  /**
   * Format Sheet 3 — Rekap Peserta
   */
  formatPesertaSheet(rows: any[]) {
    if (!rows || rows.length === 0) {
      return [
        {
          'No': 1,
          'Public ID Pengajuan': '-',
          'Nama Peserta': 'Tidak ada data pada periode/filter ini',
          'Peran': '-',
          'NIM / NIS': '-',
          'Email': '-',
          'No. HP': '-',
          'Jurusan': '-',
          'Asal Instansi': '-',
          'Bidang Magang': '-',
          'Pembimbing Lapangan': '-',
          'Status Pengajuan': '-',
          'Tanggal Mulai': '-',
          'Tanggal Selesai': '-',
        },
      ]
    }

    return rows.map((r) => ({
      'No': r.no,
      'Public ID Pengajuan': r.publicId,
      'Nama Peserta': r.namaPeserta,
      'Peran': r.peran,
      'NIM / NIS': r.nimNis || '-',
      'Email': r.email || '-',
      'No. HP': r.noHp || '-',
      'Jurusan': r.jurusan || '-',
      'Asal Instansi': r.asalInstansi || '-',
      'Bidang Magang': r.bidangNama || '-',
      'Pembimbing Lapangan': r.pembimbingNama || '-',
      'Status Pengajuan': r.statusPengajuan,
      'Tanggal Mulai': r.tanggalMulai || '-',
      'Tanggal Selesai': r.tanggalSelesai || '-',
    }))
  },

  /**
   * Format Sheet 4 — Rekap Bidang
   */
  formatBidangSheet(rows: any[]) {
    if (!rows || rows.length === 0) {
      return [
        {
          'No': 1,
          'ID Bidang': '-',
          'Nama Bidang': 'Tidak ada data pada periode/filter ini',
          'Kuota Maksimal': 0,
          'Peserta Aktif': 0,
          'Sisa Kuota': 0,
          'Jumlah Pembimbing': 0,
          'Status Aktif': '-',
        },
      ]
    }

    return rows.map((r) => ({
      'No': r.no,
      'ID Bidang': r.id,
      'Nama Bidang': r.namaBidang,
      'Kuota Maksimal': r.kuotaMaksimal,
      'Peserta Aktif': r.pesertaAktif,
      'Sisa Kuota': r.sisaKuota,
      'Jumlah Pembimbing': r.jumlahPembimbing,
      'Status Aktif': r.statusAktif,
    }))
  },

  /**
   * Format Sheet 5 — Rekap Pembimbing
   */
  formatPembimbingSheet(rows: any[]) {
    if (!rows || rows.length === 0) {
      return [
        {
          'No': 1,
          'ID Pembimbing': '-',
          'Nama Pembimbing': 'Tidak ada data pada periode/filter ini',
          'NIP': '-',
          'Jabatan': '-',
          'Email': '-',
          'No. HP': '-',
          'Bidang Diampu': '-',
          'Kapasitas Kuota': 0,
          'Bimbingan Aktif': 0,
          'Sisa Kapasitas': 0,
          'Status Aktif': '-',
        },
      ]
    }

    return rows.map((r) => ({
      'No': r.no,
      'ID Pembimbing': r.id,
      'Nama Pembimbing': r.namaPembimbing,
      'NIP': r.nip || '-',
      'Jabatan': r.jabatan || '-',
      'Email': r.email || '-',
      'No. HP': r.noHp || '-',
      'Bidang Diampu': r.bidangDiampu || '-',
      'Kapasitas Kuota': r.kuotaKapasitas,
      'Bimbingan Aktif': r.bimbinganAktif,
      'Sisa Kapasitas': r.sisaKapasitas,
      'Status Aktif': r.statusAktif,
    }))
  },

  /**
   * Format Sheet 6 — Distribusi Status
   */
  formatStatusSheet(rows: any[]) {
    if (!rows || rows.length === 0) {
      return [
        {
          'No': 1,
          'Status Pengajuan': 'Tidak ada data pada periode/filter ini',
          'Total Pengajuan': 0,
          'Total Peserta (Orang)': 0,
          'Persentase': '0.0%',
        },
      ]
    }

    return rows.map((r) => ({
      'No': r.no,
      'Status Pengajuan': r.status,
      'Total Pengajuan': r.totalPengajuan,
      'Total Peserta (Orang)': r.totalPeserta,
      'Persentase': r.persentase,
    }))
  },

  /**
   * Format Sheet 7 — Rekapitulasi SKM Dinamis (Berdasarkan skm_pertanyaan aktual di database)
   */
  formatSKMSheet(rows: LaporanSKMRow[], questions: LaporanSKMQuestionMeta[]) {
    if (!rows || rows.length === 0) {
      const emptyRow: Record<string, any> = {
        'No': 1,
        'ID Permohonan': '-',
        'Public ID': '-',
        'Tanggal Pengisian': '-',
        'Nama Pemohon': 'Belum ada data SKM pada periode/filter ini',
        'Asal Instansi': '-',
        'Bidang Magang': '-',
        'Rata-Rata Skor Pilihan': '-',
        'Status SKM': '-',
      }
      questions.forEach((q) => {
        const headerKey = `Q${q.urutan} (${q.unsur || (q.tipe === 'teks' ? 'Masukan' : 'Butir ' + q.urutan)})`
        emptyRow[headerKey] = '-'
      })
      return [emptyRow]
    }

    return rows.map((r) => {
      const item: Record<string, any> = {
        'No': r.no,
        'ID Permohonan': r.idPermohonan,
        'Public ID': r.publicId || '-',
        'Tanggal Pengisian': r.tanggalPengisian || '-',
        'Nama Pemohon': r.namaPemohon,
        'Asal Instansi': r.asalInstansi || '-',
        'Bidang Magang': r.bidangNama || '-',
        'Rata-Rata Skor Pilihan': r.rataRataSkor,
        'Status SKM': r.statusSKM || 'Sudah Mengisi',
      }

      // Tambahkan kolom jawaban dinamis sesuai urutan pertanyaan aktual di database
      questions.forEach((q) => {
        const headerKey = `Q${q.urutan} (${q.unsur || (q.tipe === 'teks' ? 'Masukan' : 'Butir ' + q.urutan)})`
        item[headerKey] = r.answers[q.urutan] || '-'
      })

      return item
    })
  },

  /**
   * Helper untuk menambahkan freeze pane dan autofilter pada worksheet
   */
  applySheetEnhancements(ws: XLSX.WorkSheet, rowCount: number, colCount: number) {
    if (rowCount > 0 && colCount > 0) {
      // Freeze header baris 1
      ws['!views'] = [{ state: 'frozen', ySplit: 1 }]
      // Autofilter pada baris header
      const endColLetter = XLSX.utils.encode_col(colCount - 1)
      ws['!autofilter'] = { ref: `A1:${endColLetter}${rowCount + 1}` }
    }
  },

  /**
   * Generate Master Workbook Excel (.xlsx) dengan 7 Worksheet Terpadu
   */
  generateWorkbook(pkg: LaporanExportPackage): Uint8Array {
    const wb = XLSX.utils.book_new()

    // 1. Sheet 1: Ringkasan Laporan Eksekutif
    const ringkasanWs = this.generateRingkasanSheet(pkg)
    XLSX.utils.book_append_sheet(wb, ringkasanWs, 'Ringkasan')

    // 2. Sheet 2: Data Pengajuan Magang
    const pengajuanData = this.formatPengajuanSheet(pkg.pengajuanData)
    const pengajuanWs = XLSX.utils.json_to_sheet(pengajuanData)
    pengajuanWs['!cols'] = this.fitColumnWidths(pengajuanData)
    this.applySheetEnhancements(pengajuanWs, pengajuanData.length, Object.keys(pengajuanData[0] || {}).length)
    XLSX.utils.book_append_sheet(wb, pengajuanWs, 'Pengajuan')

    // 3. Sheet 3: Rekap Peserta & Anggota
    const pesertaData = this.formatPesertaSheet(pkg.pesertaData)
    const pesertaWs = XLSX.utils.json_to_sheet(pesertaData)
    pesertaWs['!cols'] = this.fitColumnWidths(pesertaData)
    this.applySheetEnhancements(pesertaWs, pesertaData.length, Object.keys(pesertaData[0] || {}).length)
    XLSX.utils.book_append_sheet(wb, pesertaWs, 'Peserta')

    // 4. Sheet 4: Rekap Bidang Magang
    const bidangData = this.formatBidangSheet(pkg.bidangData)
    const bidangWs = XLSX.utils.json_to_sheet(bidangData)
    bidangWs['!cols'] = this.fitColumnWidths(bidangData)
    this.applySheetEnhancements(bidangWs, bidangData.length, Object.keys(bidangData[0] || {}).length)
    XLSX.utils.book_append_sheet(wb, bidangWs, 'Bidang')

    // 5. Sheet 5: Rekap Pembimbing Lapangan
    const pembimbingData = this.formatPembimbingSheet(pkg.pembimbingData)
    const pembimbingWs = XLSX.utils.json_to_sheet(pembimbingData)
    pembimbingWs['!cols'] = this.fitColumnWidths(pembimbingData)
    this.applySheetEnhancements(pembimbingWs, pembimbingData.length, Object.keys(pembimbingData[0] || {}).length)
    XLSX.utils.book_append_sheet(wb, pembimbingWs, 'Pembimbing')

    // 6. Sheet 6: Distribusi Status Pengajuan
    const statusData = this.formatStatusSheet(pkg.statusData)
    const statusWs = XLSX.utils.json_to_sheet(statusData)
    statusWs['!cols'] = this.fitColumnWidths(statusData)
    this.applySheetEnhancements(statusWs, statusData.length, Object.keys(statusData[0] || {}).length)
    XLSX.utils.book_append_sheet(wb, statusWs, 'Status')

    // 7. Sheet 7: Rekapitulasi Hasil SKM (Dinamis Berdasarkan skm_pertanyaan)
    const skmData = this.formatSKMSheet(pkg.skmData, pkg.skmQuestions)
    const skmWs = XLSX.utils.json_to_sheet(skmData)
    skmWs['!cols'] = this.fitColumnWidths(skmData)
    this.applySheetEnhancements(skmWs, skmData.length, Object.keys(skmData[0] || {}).length)
    XLSX.utils.book_append_sheet(wb, skmWs, 'SKM')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new Uint8Array(buffer)
  },

  /**
   * Generate berkas CSV (.csv) per dataset dengan UTF-8 BOM untuk kompatibilitas Excel
   */
  generateCSV(pkg: LaporanExportPackage, category: ExportDatasetCategory): string {
    let data: any[] = []

    switch (category) {
      case 'pengajuan':
      case 'all':
        data = this.formatPengajuanSheet(pkg.pengajuanData)
        break
      case 'peserta':
        data = this.formatPesertaSheet(pkg.pesertaData)
        break
      case 'bidang':
        data = this.formatBidangSheet(pkg.bidangData)
        break
      case 'pembimbing':
        data = this.formatPembimbingSheet(pkg.pembimbingData)
        break
      case 'status':
        data = this.formatStatusSheet(pkg.statusData)
        break
      case 'skm':
        data = this.formatSKMSheet(pkg.skmData, pkg.skmQuestions)
        break
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const csvContent = XLSX.utils.sheet_to_csv(ws)
    return '\uFEFF' + csvContent // Tambahkan UTF-8 BOM agar rapi di Microsoft Excel
  },
}
