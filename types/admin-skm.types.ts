import type { SKMPertanyaan } from './skm.types'

export interface AdminSKMPertanyaanItem extends SKMPertanyaan {
  tipe: 'pilihan' | 'teks' | string
}

export interface AdminSKMPertanyaanStats {
  totalPertanyaan: number
  totalPilihan: number
  totalTeks: number
  totalAktif: number
  totalNonaktif: number
}

export interface AdminSKMUnsurStat {
  pertanyaanId: number
  urutan: number
  unsur: string
  pertanyaan: string
  totalJawaban: number
  rataRata: number
  distribusi: {
    skor1: number
    skor2: number
    skor3: number
    skor4: number
  }
  persentaseDistribusi: {
    skor1: number
    skor2: number
    skor3: number
    skor4: number
  }
}

export interface AdminSKMStats {
  totalResponden: number
  totalJawabanPilihan: number
  rataRataKeseluruhan: number | null
  tingkatKepuasan: number | null // % skor 3 & 4
  unsurStats: AdminSKMUnsurStat[]
}

export interface AdminSKMTextItem {
  id: number
  pengajuanId: number
  namaPemohon: string
  asalInstansi: string
  bidangNama: string
  teks: string
  isAnonim?: boolean
  createdAt: string
}

export interface AdminSKMSubmissionItem {
  pengajuanId: number
  publicId: string | null
  namaPemohon: string
  nimNis: string | null
  asalInstansi: string | null
  bidangNama: string
  tanggalPengisian: string
  rataRataSkor: number | null
  totalJawaban: number
  isAnonim?: boolean
}

export interface AdminSKMSubmissionDetail {
  pengajuan: {
    id: number
    publicId: string | null
    namaPemohon: string
    nimNis: string | null
    asalInstansi: string | null
    jurusan: string | null
    bidangNama: string
    status: string
  }
  answers: Array<{
    pertanyaanId: number
    urutan: number
    unsur: string | null
    pertanyaan: string
    tipe: 'Pilihan' | 'Teks'
    jawabanRaw: string
    skor: number | null
    labelOpsi: string | null
  }>
  rataRataSkor: number | null
  submittedAt: string
  isAnonim?: boolean
}
