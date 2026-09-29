export type ExportFormat = 'xlsx' | 'csv'

export type ExportDatasetCategory =
  | 'all'
  | 'pengajuan'
  | 'peserta'
  | 'bidang'
  | 'pembimbing'
  | 'status'
  | 'skm'

export interface LaporanFilterParams {
  status?: string
  bidangId?: string | number
  pembimbingId?: string | number
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}

export interface LaporanSummaryStats {
  totalPengajuan: number
  totalPeserta: number
  totalBidang: number
  totalPembimbing: number
  rataRataSKM: number | null
  statusCounts: {
    menungguVerifikasi: number
    sedangMagang: number
    selesai: number
    ditolak: number
    dibatalkan: number
  }
}

export interface LaporanPengajuanRow {
  no: number
  publicId: string
  dbId: number | string
  namaPemohon: string
  email: string
  noHp: string
  nimNis: string
  asalInstansi: string
  jurusan: string
  jenjang: string
  topikMagang: string
  bidangNama: string
  pembimbingNama: string
  pembimbingNip: string
  jumlahAnggota: number
  nomorSurat: string
  tanggalSurat: string
  tanggalMulai: string
  tanggalSelesai: string
  durasiBulan: number
  status: string
  tanggalPengajuan: string
  tanggalUpdate: string
}

export interface LaporanPesertaRow {
  no: number
  publicId: string
  namaPeserta: string
  peran: 'Ketua / Pemohon' | 'Anggota'
  nimNis: string
  email: string
  noHp: string
  jurusan: string
  asalInstansi: string
  bidangNama: string
  pembimbingNama: string
  statusPengajuan: string
  tanggalMulai: string
  tanggalSelesai: string
}

export interface LaporanBidangRow {
  no: number
  id: number | string
  namaBidang: string
  kuotaMaksimal: number
  pesertaAktif: number
  sisaKuota: number
  jumlahPembimbing: number
  statusAktif: string
}

export interface LaporanPembimbingRow {
  no: number
  id: number | string
  namaPembimbing: string
  nip: string
  jabatan: string
  email: string
  noHp: string
  kuotaKapasitas: number
  bimbinganAktif: number
  sisaKapasitas: number
  bidangDiampu: string
  statusAktif: string
}

export interface LaporanStatusSummaryRow {
  no: number
  status: string
  totalPengajuan: number
  totalPeserta: number
  persentase: string
}

export interface LaporanSKMQuestionMeta {
  id: number
  urutan: number
  unsur: string | null
  pertanyaan: string
  tipe: 'pilihan' | 'teks' | string
}

export interface LaporanSKMRow {
  no: number
  idPermohonan: number | string
  publicId: string
  tanggalPengisian: string
  namaPemohon: string
  asalInstansi: string
  bidangNama: string
  rataRataSkor: string
  statusSKM: string
  // Dynamic mapping of answer per question urutan or ID
  answers: Record<number, string>
}

export interface LaporanExportPackage {
  filename: string
  category: ExportDatasetCategory
  format: ExportFormat
  generatedAt: string
  filterSummary: {
    status: string
    bidang: string
    pembimbing: string
    dateRange: string
    keyword: string
  }
  summaryStats: LaporanSummaryStats
  pengajuanData: LaporanPengajuanRow[]
  pesertaData: LaporanPesertaRow[]
  bidangData: LaporanBidangRow[]
  pembimbingData: LaporanPembimbingRow[]
  statusData: LaporanStatusSummaryRow[]
  skmQuestions: LaporanSKMQuestionMeta[]
  skmData: LaporanSKMRow[]
}
