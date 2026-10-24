export interface ParsedRpcError {
  code: string
  message: string
  details?: Record<string, any>
}

/**
 * Parsing pesan error dari RPC Supabase (submit_pengajuan_atomic & admin_verifikasi_anggota_atomic)
 * Mengubah kode prefix internal PostgreSQL RAISE EXCEPTION menjadi pesan ramah pengguna.
 *
 * @param error Error object atau string dari Supabase / PostgREST
 * @param context 'user' untuk pemohon magang, 'admin' untuk administrator
 */
export function parseRpcError(error: unknown, context: 'user' | 'admin' = 'user'): ParsedRpcError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Terjadi kesalahan sistem yang tidak diketahui.',
    }
  }

  const rawMessage: string =
    typeof error === 'string'
      ? error
      : (error as any).message || (error as any).details || (error as any).hint || String(error)

  // 1. KUOTA_PENUH
  if (rawMessage.includes('KUOTA_PENUH')) {
    if (context === 'admin') {
      return {
        code: 'KUOTA_PENUH',
        message: 'Kuota bidang sudah terisi oleh pengajuan lain, muat ulang sisa kuota.',
      }
    }
    return {
      code: 'KUOTA_PENUH',
      message:
        'Kuota pada bidang ini sudah terisi penuh oleh pengajuan lain. Silakan pilih bidang magang lain yang masih tersedia.',
    }
  }

  // 2. MEMERLUKAN_KONFIRMASI_KUOTA (User alur kuota sebagian)
  if (rawMessage.includes('MEMERLUKAN_KONFIRMASI_KUOTA')) {
    // Format dari RPC: Sisa kuota bidang ini X, sedangkan pengajuan Anda Y orang.
    let sisa = 0
    let diajukan = 0

    const allNumbers = rawMessage.match(/\d+/g)
    if (allNumbers && allNumbers.length >= 2) {
      sisa = parseInt(allNumbers[0], 10)
      diajukan = parseInt(allNumbers[1], 10)
    } else {
      const sisaMatch = rawMessage.match(/(?:sisa|kuota)\D+(\d+)/i)
      const diajukanMatch = rawMessage.match(/(?:diajukan|pengajuan|Anda)\D+(\d+)/i)
      if (sisaMatch) sisa = parseInt(sisaMatch[1], 10)
      if (diajukanMatch) diajukan = parseInt(diajukanMatch[1], 10)
    }

    return {
      code: 'MEMERLUKAN_KONFIRMASI_KUOTA',
      message: `Sisa kuota bidang ini ${sisa}, sedangkan pengajuan Anda ${diajukan} orang.`,
      details: { sisa, diajukan },
    }
  }

  // 3. NIM_AKTIF_BENTROK atau NIM_BENTROK
  if (rawMessage.includes('NIM_AKTIF_BENTROK') || rawMessage.includes('NIM_BENTROK')) {
    const cleanDetail = rawMessage
      .replace(/.*(?:NIM_AKTIF_BENTROK|NIM_BENTROK):?\s*/i, '')
      .split('\n')[0]
      .trim()

    return {
      code: 'NIM_BENTROK',
      message:
        cleanDetail ||
        'Salah satu NIM/NIS anggota sudah terdaftar pada pengajuan magang lain yang sedang aktif.',
    }
  }

  // 4. AKUN_MEMILIKI_PENGAJUAN_AKTIF
  if (rawMessage.includes('AKUN_MEMILIKI_PENGAJUAN_AKTIF')) {
    return {
      code: 'AKUN_MEMILIKI_PENGAJUAN_AKTIF',
      message:
        'Akun Anda sudah memiliki pengajuan magang yang sedang aktif. Anda baru dapat mengajukan kembali setelah pengajuan sebelumnya selesai atau ditolak.',
    }
  }

  // 5. VALIDATION_ERROR
  if (rawMessage.includes('VALIDATION_ERROR')) {
    const cleanDetail = rawMessage.replace(/.*VALIDATION_ERROR:?\s*/i, '').split('\n')[0].trim()
    return {
      code: 'VALIDATION_ERROR',
      message: cleanDetail || 'Data formulir tidak valid. Mohon periksa kembali isian Anda.',
    }
  }

  // 6. UNAUTHORIZED / FORBIDDEN
  if (rawMessage.includes('UNAUTHORIZED')) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Sesi Anda telah berakhir atau belum terautentikasi. Silakan login kembali.',
    }
  }
  if (rawMessage.includes('FORBIDDEN')) {
    return {
      code: 'FORBIDDEN',
      message: 'Anda tidak memiliki hak akses untuk melakukan tindakan ini.',
    }
  }

  // 7. INVALID_STATE
  if (rawMessage.includes('INVALID_STATE')) {
    const cleanDetail = rawMessage.replace(/.*INVALID_STATE:?\s*/i, '').split('\n')[0].trim()
    return {
      code: 'INVALID_STATE',
      message:
        cleanDetail ||
        'Status pengajuan telah berubah dan tidak dapat diproses lagi dengan tindakan ini.',
    }
  }

  // 8. NOT_FOUND
  if (rawMessage.includes('NOT_FOUND')) {
    return {
      code: 'NOT_FOUND',
      message: 'Data pengajuan atau bidang magang tidak ditemukan di sistem.',
    }
  }

  // 9. DATA_CORRUPT
  if (rawMessage.includes('DATA_CORRUPT')) {
    return {
      code: 'DATA_CORRUPT',
      message: 'Terjadi inkonsistensi data pada pengajuan ini. Hubungi administrator.',
    }
  }

  // Default Fallback
  return {
    code: 'GENERAL_ERROR',
    message: rawMessage.replace(/.*(?:P0001|ERROR):?\s*/i, '').split('\n')[0].trim() || 'Gagal memproses data.',
  }
}
