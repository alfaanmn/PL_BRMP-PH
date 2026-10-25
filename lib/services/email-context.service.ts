import { createAdminClient } from '@/lib/supabase/admin'
import { getPesertaList } from '@/lib/helpers/peserta.helper'
import { EmailPengajuanData, EmailPembimbingData } from '@/types/email.types'

/**
 * Format tanggal dan waktu dalam zona WIB (Asia/Jakarta)
 */
export function formatWaktuWib(dateInput?: Date | string | null): string {
  const d = dateInput ? new Date(dateInput) : new Date()
  if (isNaN(d.getTime())) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(d) + ' WIB'
  } catch {
    return d.toISOString()
  }
}

export interface PengajuanEmailContextResult {
  pengajuan: EmailPengajuanData
  pembimbing: EmailPembimbingData | null
  pemohonEmail: string
  pemohonNama: string
  userId?: string
}

/**
 * Mengambil konteks data pengajuan terpusat untuk keperluan notifikasi email & web
 * Menggunakan admin client server-side, fail-safe (tidak melempar error unhandled).
 */
export async function getPengajuanEmailContext(
  pengajuanIdOrPublicId: number | string
): Promise<PengajuanEmailContextResult> {
  const defaultFallback: PengajuanEmailContextResult = {
    pengajuan: {
      publicId: String(pengajuanIdOrPublicId),
      namaPemohon: '-',
      bidangNama: '-',
      asalInstansi: '-',
      jurusan: '-',
      jenjang: '-',
      jenisPeserta: 'Individu',
      jumlahPeserta: 1,
      daftarAnggotaRingkas: [],
      sisaAnggotaCount: 0,
      waktuKejadianWib: formatWaktuWib(new Date()),
    },
    pembimbing: null,
    pemohonEmail: '',
    pemohonNama: 'Peserta',
  }

  if (!pengajuanIdOrPublicId) {
    return defaultFallback
  }

  try {
    const supabase = createAdminClient()
    if (!supabase) {
      console.warn('[getPengajuanEmailContext] Supabase admin client tidak tersedia (cek env service role).')
      return defaultFallback
    }

    // 1. Query pengajuans dengan relasi bidangs, pembimbings, profiles
    let query = supabase
      .from('pengajuans')
      .select(`
        id,
        public_id,
        user_id,
        nama_lengkap,
        asal_instansi,
        jurusan,
        jenjang,
        jumlah_anggota,
        anggota,
        nomor_surat,
        tanggal_mulai,
        tanggal_selesai,
        durasi_bulan,
        status,
        bidangs (
          id,
          nama
        ),
        pembimbings (
          id,
          nama,
          nip,
          jabatan
        ),
        profiles (
          id,
          name,
          email
        )
      `)

    if (typeof pengajuanIdOrPublicId === 'number' || /^\d+$/.test(String(pengajuanIdOrPublicId))) {
      query = query.eq('id', Number(pengajuanIdOrPublicId))
    } else {
      query = query.eq('public_id', String(pengajuanIdOrPublicId))
    }

    const { data: pData, error: pError } = await query.maybeSingle()

    if (pError || !pData) {
      console.warn('[getPengajuanEmailContext] Gagal mengambil pengajuan:', pError?.message || 'Data tidak ditemukan')
      return defaultFallback
    }

    // 2. Query anggota dari pengajuan_anggotas jika ada
    let dbAnggotas: any[] = []
    try {
      const { data: aData } = await supabase
        .from('pengajuan_anggotas')
        .select('id, nama, nim_nis, is_ketua')
        .eq('pengajuan_id', pData.id)
        .order('id', { ascending: true })

      if (aData && aData.length > 0) {
        dbAnggotas = aData
      }
    } catch (aErr) {
      console.warn('[getPengajuanEmailContext] Query pengajuan_anggotas error:', aErr)
    }

    // 3. Ekstrak peserta memakai helper definitif getPesertaList
    const pesertaList = getPesertaList(pData, dbAnggotas)
    const ketuaNama = pData.nama_lengkap || (pData.profiles as any)?.name || 'Pemohon Magang'
    const instansi = pData.asal_instansi || '-'
    const jurusan = pData.jurusan || '-'
    const jenjang = pData.jenjang || '-'
    const bidangNama = (pData.bidangs as any)?.nama || '-'

    // Evaluasi anggota tambahan (selain ketua)
    const anggotaTambahan = pesertaList.filter((p) => !p.is_ketua)
    const isKelompok = pesertaList.length > 1 || (Number(pData.jumlah_anggota) || 1) > 1

    let daftarAnggotaRingkas: string[] = []
    let sisaAnggotaCount = 0

    if (anggotaTambahan.length > 0) {
      daftarAnggotaRingkas = anggotaTambahan.slice(0, 5).map((a) => a.nama)
      if (anggotaTambahan.length > 5) {
        sisaAnggotaCount = anggotaTambahan.length - 5
      }
    }

    const pembimbingObj: EmailPembimbingData | null = (pData.pembimbings as any)?.nama
      ? {
          nama: (pData.pembimbings as any).nama,
          nip: (pData.pembimbings as any).nip || null,
          jabatan: (pData.pembimbings as any).jabatan || null,
        }
      : null

    const pemohonEmail = (pData.profiles as any)?.email || ''

    return {
      pengajuan: {
        id: pData.id,
        publicId: pData.public_id,
        namaPemohon: ketuaNama,
        bidangNama,
        asalInstansi: instansi,
        jurusan,
        jenjang,
        jenisPeserta: isKelompok ? 'Kelompok' : 'Individu',
        jumlahPeserta: pesertaList.length,
        daftarAnggotaRingkas,
        sisaAnggotaCount,
        nomorSurat: pData.nomor_surat || undefined,
        tanggalMulai: pData.tanggal_mulai || undefined,
        tanggalSelesai: pData.tanggal_selesai || undefined,
        durasiBulan: pData.durasi_bulan || undefined,
        waktuKejadianWib: formatWaktuWib(new Date()),
      },
      pembimbing: pembimbingObj,
      pemohonEmail,
      pemohonNama: ketuaNama,
      userId: pData.user_id,
    }
  } catch (err) {
    console.warn('[getPengajuanEmailContext] Exception saat fetch context:', err)
    return defaultFallback
  }
}
