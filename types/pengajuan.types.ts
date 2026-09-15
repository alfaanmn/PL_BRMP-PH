export type JenjangPendidikan = 'Mahasiswa' | 'Siswa'

export interface AnggotaMagang {
  nama: string
  nim_nis: string
  no_hp?: string
  jurusan?: string
}

export interface PengajuanStep1State {
  bidang_id: number | string
  jenjang: string
  asal_instansi: string
  jurusan: string
  nim_nis: string
  topik_magang: string
  nomor_surat: string
  tanggal_surat: string
  tanggal_mulai: string
  tanggal_selesai: string
  durasi_bulan: number
  jumlah_anggota: number
  anggota: AnggotaMagang[]
  // Snapshot data pemohon
  nama_lengkap?: string
  no_hp?: string
  alamat?: string
  jenis_kelamin?: string
}

export interface PengajuanStep2State {
  surat_pengantar_url: string
  surat_pengantar_name?: string
  proposal_url: string
  proposal_name?: string
  dokumen_tambahan_url: string
  dokumen_tambahan_name?: string
}

export interface PengajuanWizardState {
  step1: PengajuanStep1State
  step2: PengajuanStep2State
  pernyataan_benar: boolean
}

export interface PengajuanInsertPayload {
  user_id: string
  bidang_id: number
  pembimbing_id?: number | null
  nomor_surat: string
  tanggal_surat: string
  jenjang: string
  asal_instansi: string
  jurusan: string
  tanggal_mulai: string
  tanggal_selesai: string
  durasi_bulan: number
  jumlah_anggota: number
  anggota: AnggotaMagang[]
  nama_lengkap: string
  nim_nis: string
  jenis_kelamin?: string | null
  no_hp?: string | null
  alamat?: string | null
  foto_url?: string | null
  topik_magang: string
  surat_pengantar_url: string
  proposal_url?: string | null
  dokumen_tambahan_url?: string | null
  status?: string
}
