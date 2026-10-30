export type EmailNotificationEvent =
  | 'pengajuan_submitted'
  | 'pengajuan_approved'
  | 'pengajuan_rejected'
  | 'pengajuan_completed'
  | 'pengajuan_cancelled'
  | 'admin_pengajuan_new'
  | 'admin_skm_completed'
  | 'sertifikat_available'

export interface EmailRecipient {
  email: string
  name: string
}

export interface EmailPengajuanData {
  id?: number | string
  publicId: string
  namaPemohon?: string
  pemohonEmail?: string
  userId?: string
  statusPeserta?: string | null
  statusSebelum?: string
  statusSesudah?: string
  alasanPembatalan?: string
  bidangNama?: string
  asalInstansi?: string
  jurusan?: string
  jenjang?: string
  jenisPeserta?: 'Individu' | 'Kelompok'
  jumlahPeserta?: number
  daftarAnggotaRingkas?: string[] // Maks 5 nama
  sisaAnggotaCount?: number // sisa jumlah anggota jika > 5
  nomorSurat?: string
  tanggalMulai?: string
  tanggalSelesai?: string
  durasiBulan?: number
  waktuKejadianWib?: string
}

export interface EmailPembimbingData {
  nama: string
  nip?: string | null
  jabatan?: string | null
  email?: string | null
}

export interface EmailNotificationPayload {
  event: EmailNotificationEvent
  recipient: EmailRecipient
  recipientRole?: 'user' | 'admin'
  pengajuan: EmailPengajuanData
  pembimbing?: EmailPembimbingData | null
  alasanPenolakan?: string | null
  catatan?: string | null
  appUrl?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string | null
}
