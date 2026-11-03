/**
 * VALIDASI LOGBOOK SERVER-SIDE
 * - Maksimal ukuran berkas 2 MB (2.097.152 bytes)
 * - Format berkas WAJIB PDF (.pdf)
 * - MIME types yang diizinkan: application/pdf
 * - Magic bytes verification: %PDF-
 * - Catatan maksimal 500 karakter
 */

export const LOGBOOK_MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
export const LOGBOOK_ALLOWED_EXTENSIONS = ['.pdf']
export const LOGBOOK_ALLOWED_MIME_TYPES = ['application/pdf']

export interface FileValidationResult {
  valid: boolean
  error?: string
  detectedMime?: string
  detectedExt?: string
}

/**
 * Validasi Buffer / Uint8Array terhadap Magic Bytes
 * PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
 */
export function validateMagicBytes(buffer: Uint8Array): { valid: boolean; mime?: string; ext?: string } {
  if (!buffer || buffer.length < 5) {
    return { valid: false }
  }

  // Check PDF (%PDF-)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { valid: true, mime: 'application/pdf', ext: 'pdf' }
  }

  return { valid: false }
}

/**
 * Validasi Berkas Logbook Komprehensif (Khusus PDF)
 */
export function validateLogbookFile(
  fileName: string,
  fileSize: number,
  clientMime: string,
  buffer: Uint8Array
): FileValidationResult {
  // 1. Cek Ukuran Berkas
  if (fileSize <= 0) {
    return { valid: false, error: 'Berkas kosong tidak dapat diunggah.' }
  }
  if (fileSize > LOGBOOK_MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Ukuran berkas (${(fileSize / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum 2 MB.`,
    }
  }

  // 2. Cek Ekstensi Nama Berkas
  const lowerName = fileName.toLowerCase()
  const hasValidExt = LOGBOOK_ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Format berkas tidak didukung. Harap unggah berkas PDF (.pdf).',
    }
  }

  // 3. Cek Client MIME Type
  const normalizedMime = clientMime.toLowerCase()
  if (!LOGBOOK_ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      valid: false,
      error: 'Tipe MIME berkas tidak valid. Harap gunakan berkas PDF (application/pdf).',
    }
  }

  // 4. Cek Magic Bytes (Header Binary)
  const magic = validateMagicBytes(buffer)
  if (!magic.valid || magic.mime !== 'application/pdf') {
    return {
      valid: false,
      error: 'Isi berkas tidak sesuai format PDF (Magic Bytes mismatch). Pastikan berkas adalah PDF asli.',
    }
  }

  return {
    valid: true,
    detectedMime: magic.mime,
    detectedExt: magic.ext,
  }
}

/**
 * Validasi Catatan Logbook Opsional
 */
export function validateLogbookCatatan(catatan?: string | null): { valid: boolean; error?: string } {
  if (!catatan) return { valid: true }
  if (catatan.length > 500) {
    return {
      valid: false,
      error: `Catatan terlalu panjang (${catatan.length} karakter). Maksimal 500 karakter.`,
    }
  }
  return { valid: true }
}
