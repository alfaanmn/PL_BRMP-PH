export type EmailNotificationEvent =
  | 'pengajuan_submitted'
  | 'pengajuan_approved'
  | 'pengajuan_rejected'
  | 'pengajuan_completed'

export interface EmailRecipient {
  email: string
  name: string
}

export interface EmailPengajuanData {
  id?: number | string
  publicId: string
  bidangNama?: string
  asalInstansi?: string
  jurusan?: string
  nomorSurat?: string
  tanggalMulai?: string
  tanggalSelesai?: string
  durasiBulan?: number
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
