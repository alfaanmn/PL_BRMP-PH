/**
 * Konstanta Status Pengajuan SIMPUL BRMP-PH
 * Berbasis enum `pengajuan_status` di database PostgreSQL.
 *
 * Catatan: Status 'Terjadwal' ada di enum PostgreSQL tetapi sengaja tidak dihitung sebagai status aktif berjalan.
 */

export const ACTIVE_PENGAJUAN_STATUSES = [
  'Menunggu Verifikasi',
  'Disetujui',
  'Sedang Magang',
] as const

export type ActivePengajuanStatus = (typeof ACTIVE_PENGAJUAN_STATUSES)[number]
