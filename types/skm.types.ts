export interface SKMPertanyaan {
  id: number
  pertanyaan: string
  unsur: string | null
  urutan: number
  tipe: 'pilihan' | 'teks' | string
  opsi?: SKMQuestionOption[] | null
  is_active: boolean
  created_at: string
}

export interface SKMQuestionOption {
  skor: number // 1, 2, 3, 4
  label: string // e.g. "Sangat Sesuai", "Mudah"
  deskripsi?: string
}

export interface SKMJawaban {
  id: number
  pengajuan_id: number
  skm_pertanyaan_id: number
  jawaban: string
  is_anonim?: boolean
  created_at: string
}

export interface SKMAnswerInput {
  skmPertanyaanId: number
  jawaban: string // "1"-"4" for pilihan, text for teks
}

export interface SKMSubmissionPayload {
  pengajuanId: number
  isAnonim?: boolean
  answers: SKMAnswerInput[]
}

export interface SKMResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface SKMPresetTemplate {
  id: string
  name: string
  deskripsi: string
  options: [SKMQuestionOption, SKMQuestionOption, SKMQuestionOption, SKMQuestionOption]
}

/**
 * Template preset standar Permenpan RB untuk mempermudah Administrator
 * saat membuat atau mengedit butir pertanyaan kuesioner.
 * Catatan: Ini HANYA helper UI di form Admin.
 * Sumber kebenaran opsi tersimpan tetaplah kolom database `skm_pertanyaan.opsi`.
 */
export const SKM_PRESET_TEMPLATES: SKMPresetTemplate[] = [
  {
    id: 'kesesuaian',
    name: 'Kesesuaian (Sesuai)',
    deskripsi: 'Persyaratan, produk layanan, kesesuaian kebutuhan',
    options: [
      { skor: 1, label: 'Tidak Sesuai' },
      { skor: 2, label: 'Kurang Sesuai' },
      { skor: 3, label: 'Sesuai' },
      { skor: 4, label: 'Sangat Sesuai' },
    ],
  },
  {
    id: 'kemudahan',
    name: 'Kemudahan (Mudah)',
    deskripsi: 'Prosedur pelayanan, kemudahan akses informasi',
    options: [
      { skor: 1, label: 'Tidak Mudah' },
      { skor: 2, label: 'Kurang Mudah' },
      { skor: 3, label: 'Mudah' },
      { skor: 4, label: 'Sangat Mudah' },
    ],
  },
  {
    id: 'kecepatan',
    name: 'Kecepatan Waktu (Cepat)',
    deskripsi: 'Waktu pelayanan dan kecepatan respon',
    options: [
      { skor: 1, label: 'Tidak Cepat' },
      { skor: 2, label: 'Kurang Cepat' },
      { skor: 3, label: 'Cepat' },
      { skor: 4, label: 'Sangat Cepat' },
    ],
  },
  {
    id: 'biaya',
    name: 'Biaya / Tarif (Kewajaran)',
    deskripsi: 'Kewajaran biaya atau tarif pelayanan',
    options: [
      { skor: 1, label: 'Sangat Mahal' },
      { skor: 2, label: 'Cukup Mahal' },
      { skor: 3, label: 'Murah' },
      { skor: 4, label: 'Gratis' },
    ],
  },
  {
    id: 'sarana',
    name: 'Kualitas Sarana & Prasarana',
    deskripsi: 'Kualitas fasilitas dan sarana prasarana',
    options: [
      { skor: 1, label: 'Buruk' },
      { skor: 2, label: 'Cukup' },
      { skor: 3, label: 'Baik' },
      { skor: 4, label: 'Sangat Baik' },
    ],
  },
  {
    id: 'kompetensi',
    name: 'Kompetensi Petugas',
    deskripsi: 'Kemampuan dan keahlian petugas pelayanan',
    options: [
      { skor: 1, label: 'Tidak Kompeten' },
      { skor: 2, label: 'Kurang Kompeten' },
      { skor: 3, label: 'Kompeten' },
      { skor: 4, label: 'Sangat Kompeten' },
    ],
  },
  {
    id: 'perilaku',
    name: 'Perilaku Petugas (Sopan & Ramah)',
    deskripsi: 'Kesopanan dan keramahan petugas',
    options: [
      { skor: 1, label: 'Tidak Sopan dan Ramah' },
      { skor: 2, label: 'Kurang Sopan dan Ramah' },
      { skor: 3, label: 'Sopan dan Ramah' },
      { skor: 4, label: 'Sangat Sopan dan Ramah' },
    ],
  },
  {
    id: 'kejelasan',
    name: 'Kejelasan Informasi',
    deskripsi: 'Kejelasan informasi mengenai alur dan layanan',
    options: [
      { skor: 1, label: 'Tidak Jelas' },
      { skor: 2, label: 'Kurang Jelas' },
      { skor: 3, label: 'Jelas' },
      { skor: 4, label: 'Sangat Jelas' },
    ],
  },
  {
    id: 'pengaduan',
    name: 'Penanganan Pengaduan',
    deskripsi: 'Ketersediaan dan fungsi fasilitas pengaduan',
    options: [
      { skor: 1, label: 'Tidak Ada' },
      { skor: 2, label: 'Ada tetapi Tidak Berfungsi' },
      { skor: 3, label: 'Berfungsi Kurang Maksimal' },
      { skor: 4, label: 'Dikelola dengan Baik' },
    ],
  },
  {
    id: 'keterbukaan',
    name: 'Keterbukaan Informasi',
    deskripsi: 'Transparansi proses dan hasil pelayanan',
    options: [
      { skor: 1, label: 'Tidak Terbuka' },
      { skor: 2, label: 'Kurang Terbuka' },
      { skor: 3, label: 'Terbuka' },
      { skor: 4, label: 'Sangat Terbuka' },
    ],
  },
]
