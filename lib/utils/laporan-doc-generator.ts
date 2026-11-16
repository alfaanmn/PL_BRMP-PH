import type { LaporanExportPackage, ExportDatasetCategory } from '@/types/laporan.types'
import {
  exportTableToPDF,
  exportTableToWord,
  exportMultiSectionDocToPDF,
  exportMultiSectionDocToWord,
  type ExportTableColumn,
  type ExportDocSection,
} from '@/lib/utils/export-doc'

// Definisi kolom tabel per kategori
export const PENGAJUAN_DOC_COLUMNS: ExportTableColumn[] = [
  { header: 'No', key: 'no' },
  { header: 'ID Pengajuan', key: 'publicId' },
  { header: 'Nama Pemohon', key: 'namaPemohon' },
  { header: 'Asal Instansi', key: 'asalInstansi' },
  { header: 'Jurusan', key: 'jurusan' },
  { header: 'Bidang Magang', key: 'bidangNama' },
  { header: 'Pembimbing', key: 'pembimbingNama' },
  { header: 'Status', key: 'status' },
  { header: 'Tgl Pengajuan', key: 'tanggalPengajuan' },
]

export const PESERTA_DOC_COLUMNS: ExportTableColumn[] = [
  { header: 'No', key: 'no' },
  { header: 'ID Pengajuan', key: 'publicId' },
  { header: 'Nama Peserta', key: 'namaPeserta' },
  { header: 'Peran', key: 'peran' },
  { header: 'NIM / NIS', key: 'nimNis' },
  { header: 'Asal Instansi', key: 'asalInstansi' },
  { header: 'Bidang Magang', key: 'bidangNama' },
  { header: 'Status', key: 'statusPengajuan' },
]

export const BIDANG_DOC_COLUMNS: ExportTableColumn[] = [
  { header: 'No', key: 'no' },
  { header: 'Nama Bidang Magang', key: 'namaBidang' },
  { header: 'Kuota Maksimal', key: 'kuotaMaksimal' },
  { header: 'Peserta Aktif', key: 'pesertaAktif' },
  { header: 'Sisa Kuota', key: 'sisaKuota' },
  { header: 'Status', key: 'statusAktif' },
]

export const PEMBIMBING_DOC_COLUMNS: ExportTableColumn[] = [
  { header: 'No', key: 'no' },
  { header: 'Nama Pembimbing', key: 'namaPembimbing' },
  { header: 'NIP', key: 'nip' },
  { header: 'Kapasitas Kuota', key: 'kuotaKapasitas' },
  { header: 'Bimbingan Aktif', key: 'bimbinganAktif' },
  { header: 'Sisa Kapasitas', key: 'sisaKapasitas' },
  { header: 'Status', key: 'statusAktif' },
]

export const STATUS_DOC_COLUMNS: ExportTableColumn[] = [
  { header: 'No', key: 'no' },
  { header: 'Status Pengajuan', key: 'status' },
  { header: 'Total Pengajuan', key: 'totalPengajuan' },
  { header: 'Total Peserta', key: 'totalPeserta' },
  { header: 'Persentase', key: 'persentase' },
]

export const SKM_DOC_COLUMNS: ExportTableColumn[] = [
  { header: 'No', key: 'no' },
  { header: 'ID Pengajuan', key: 'publicId' },
  { header: 'Nama Responden', key: 'namaPemohon' },
  { header: 'Asal Instansi', key: 'asalInstansi' },
  { header: 'Bidang', key: 'bidangNama' },
  { header: 'Rata-Rata Skor', key: 'rataRataSkor' },
  { header: 'Status SKM', key: 'statusSKM' },
  { header: 'Tgl Pengisian', key: 'tanggalPengisian' },
]

export async function exportLaporanPackageToDoc(
  pkg: LaporanExportPackage,
  targetCategory: ExportDatasetCategory,
  targetFormat: 'pdf' | 'docx'
): Promise<void> {
  const dateRangeStr = pkg.filterSummary?.dateRange || 'Semua Periode'
  const title =
    targetCategory === 'all'
      ? 'Laporan Lengkap Manajemen Magang & SKM'
      : targetCategory === 'pengajuan'
      ? 'Rekapitulasi Data Pengajuan Magang'
      : targetCategory === 'peserta'
      ? 'Rekapitulasi Peserta & Anggota Magang'
      : targetCategory === 'bidang'
      ? 'Rekapitulasi Bidang Magang & Kuota'
      : targetCategory === 'pembimbing'
      ? 'Rekapitulasi Pembimbing Lapangan'
      : targetCategory === 'status'
      ? 'Rekapitulasi Distribusi Status Pengajuan'
      : 'Rekapitulasi Survei Kepuasan Masyarakat (SKM)'

  const filename = `${pkg.filename.replace(/\.[^.]+$/, '')}`

  if (targetCategory === 'all') {
    // Satu dokumen utuh dengan beberapa bagian (satu tabel per kategori)
    const sections: ExportDocSection[] = [
      {
        title: '1. Data Pengajuan Magang',
        columns: PENGAJUAN_DOC_COLUMNS,
        data: pkg.pengajuanData || [],
      },
      {
        title: '2. Rekapitulasi Peserta & Anggota Kelompok',
        columns: PESERTA_DOC_COLUMNS,
        data: pkg.pesertaData || [],
      },
      {
        title: '3. Rekapitulasi Bidang Magang & Kuota',
        columns: BIDANG_DOC_COLUMNS,
        data: pkg.bidangData || [],
      },
      {
        title: '4. Rekapitulasi Pembimbing Lapangan',
        columns: PEMBIMBING_DOC_COLUMNS,
        data: pkg.pembimbingData || [],
      },
      {
        title: '5. Distribusi Status Pengajuan',
        columns: STATUS_DOC_COLUMNS,
        data: pkg.statusData || [],
      },
      {
        title: '6. Rekapitulasi Hasil SKM',
        columns: SKM_DOC_COLUMNS,
        data: pkg.skmData || [],
      },
    ]

    if (targetFormat === 'pdf') {
      await exportMultiSectionDocToPDF({
        title,
        subtitle:
          'Kementerian Pertanian Republik Indonesia — Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP-PH)',
        dateRange: dateRangeStr,
        filename,
        sections,
      })
    } else {
      await exportMultiSectionDocToWord({
        title,
        subtitle:
          'Kementerian Pertanian Republik Indonesia — Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP-PH)',
        dateRange: dateRangeStr,
        filename,
        sections,
      })
    }
  } else {
    // Single category export
    let columns = PENGAJUAN_DOC_COLUMNS
    let data: Record<string, any>[] = pkg.pengajuanData || []

    if (targetCategory === 'peserta') {
      columns = PESERTA_DOC_COLUMNS
      data = pkg.pesertaData || []
    } else if (targetCategory === 'bidang') {
      columns = BIDANG_DOC_COLUMNS
      data = pkg.bidangData || []
    } else if (targetCategory === 'pembimbing') {
      columns = PEMBIMBING_DOC_COLUMNS
      data = pkg.pembimbingData || []
    } else if (targetCategory === 'status') {
      columns = STATUS_DOC_COLUMNS
      data = pkg.statusData || []
    } else if (targetCategory === 'skm') {
      columns = SKM_DOC_COLUMNS
      data = pkg.skmData || []
    }

    if (targetFormat === 'pdf') {
      await exportTableToPDF({
        title,
        subtitle:
          'Kementerian Pertanian Republik Indonesia — Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP-PH)',
        dateRange: dateRangeStr,
        filename,
        columns,
        data,
      })
    } else {
      await exportTableToWord({
        title,
        subtitle:
          'Kementerian Pertanian Republik Indonesia — Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP-PH)',
        dateRange: dateRangeStr,
        filename,
        columns,
        data,
      })
    }
  }
}
