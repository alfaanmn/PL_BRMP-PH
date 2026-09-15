import { PengajuanStep1State, PengajuanStep2State } from '@/types/pengajuan.types'

export function validatePengajuanStep1(data: Partial<PengajuanStep1State>): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  if (!data.bidang_id) {
    errors.bidang_id = 'Pilih salah satu bidang magang'
  }

  if (!data.jenjang || !data.jenjang.trim()) {
    errors.jenjang = 'Jenjang pendidikan wajib dipilih'
  }

  if (!data.asal_instansi || !data.asal_instansi.trim()) {
    errors.asal_instansi = 'Asal instansi / universitas / sekolah wajib diisi'
  }

  if (!data.jurusan || !data.jurusan.trim()) {
    errors.jurusan = 'Program studi / jurusan wajib diisi'
  }

  if (!data.nim_nis || !data.nim_nis.trim()) {
    errors.nim_nis = 'NIM / NIS / NISN wajib diisi'
  }

  if (!data.topik_magang || !data.topik_magang.trim()) {
    errors.topik_magang = 'Topik / judul rencana magang wajib diisi'
  } else if (data.topik_magang.trim().length < 5) {
    errors.topik_magang = 'Topik magang minimal 5 karakter'
  }

  if (!data.nomor_surat || !data.nomor_surat.trim()) {
    errors.nomor_surat = 'Nomor surat pengantar wajib diisi'
  }

  if (!data.tanggal_surat) {
    errors.tanggal_surat = 'Tanggal surat pengantar wajib diisi'
  }

  if (!data.tanggal_mulai) {
    errors.tanggal_mulai = 'Tanggal mulai magang wajib diisi'
  }

  if (!data.tanggal_selesai) {
    errors.tanggal_selesai = 'Tanggal selesai magang wajib diisi'
  }

  if (data.tanggal_mulai && data.tanggal_selesai) {
    const start = new Date(data.tanggal_mulai)
    const end = new Date(data.tanggal_selesai)
    if (end < start) {
      errors.tanggal_selesai = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
    }
  }

  // Validasi anggota jika jumlah_anggota > 1
  if (data.jumlah_anggota && data.jumlah_anggota > 1 && Array.isArray(data.anggota)) {
    data.anggota.forEach((member, idx) => {
      if (!member.nama || !member.nama.trim()) {
        errors[`anggota_${idx}_nama`] = `Nama anggota ke-${idx + 2} wajib diisi`
      }
      if (!member.nim_nis || !member.nim_nis.trim()) {
        errors[`anggota_${idx}_nim_nis`] = `NIM/NIS anggota ke-${idx + 2} wajib diisi`
      }
    })
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validatePengajuanStep2(data: Partial<PengajuanStep2State>): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  if (!data.surat_pengantar_url || !data.surat_pengantar_url.trim()) {
    errors.surat_pengantar_url = 'Surat pengantar kampus/sekolah wajib diunggah'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Menghitung durasi bulan antara dua tanggal secara otomatis
 */
export function calculateDurationMonths(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const months = Math.max(1, Math.round(diffDays / 30))
  return months
}
