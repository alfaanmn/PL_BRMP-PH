export interface SertifikatRecord {
  id: number
  pengajuan_id: number
  file_path: string
  file_name: string
  mime_type: string
  file_size: number
  uploaded_by: string | null
  uploaded_at: string
  notified_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminSertifikatListItem {
  pengajuanId: number
  publicId: string
  namaPemohon: string
  nimNis: string
  asalInstansi: string
  jurusan: string
  bidangNama: string
  tanggalMulai: string
  tanggalSelesai: string
  durasiBulan: number
  hasSubmittedSKM: boolean
  skmSubmittedAt?: string | null
  sertifikat: SertifikatRecord | null
  notifiedAt?: string | null
}

export interface UserSertifikatItem {
  pengajuanId: number
  publicId: string
  topikMagang: string
  bidangNama: string
  asalInstansi: string
  tanggalMulai: string
  tanggalSelesai: string
  status: string
  hasSubmittedSKM: boolean
  hasSertifikat: boolean
  sertifikatName?: string
  uploadedAt?: string
}
