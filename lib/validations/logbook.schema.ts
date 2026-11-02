/**
 * VALIDASI LOGBOOK SERVER-SIDE
 * - Maksimal ukuran berkas 2 MB (2.097.152 bytes)
 * - Ekstensi yang diizinkan: .pdf, .jpg, .jpeg, .png
 * - MIME types yang diizinkan: application/pdf, image/jpeg, image/png
 * - Magic bytes verification
 * - Catatan maksimal 500 karakter
 */

export const LOGBOOK_MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
export const LOGBOOK_ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
export const LOGBOOK_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

export interface FileValidationResult {
  valid: boolean
  error?: string
  detectedMime?: string
  detectedExt?: string
}

/**
 * Validasi Buffer / Uint8Array terhadap Magic Bytes
 * PDF:  %PDF-   (0x25 0x50 0x44 0x46 0x2D)
 * JPEG: FF D8 FF
 * PNG:  89 50 4E 47 (0x89 'P' 'N' 'G')
 */
export function validateMagicBytes(buffer: Uint8Array): { valid: boolean; mime?: string; ext?: string } {
  if (!buffer || buffer.length < 5) {
    return { valid: false }
  }

  // 1. Check PDF (%PDF-)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { valid: true, mime: 'application/pdf', ext: 'pdf' }
  }

  // 2. Check PNG (0x89 0x50 0x4E 0x47)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, mime: 'image/png', ext: 'png' }
  }

  // 3. Check JPEG (0xFF 0xD8 0xFF)
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { valid: true, mime: 'image/jpeg', ext: 'jpg' }
  }

  return { valid: false }
}

/**
 * Validasi Berkas Logbook Komprehensif
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
      error: 'Format berkas tidak didukung. Harap gunakan berkas PDF, JPG, JPEG, atau PNG.',
    }
  }

  // 3. Cek Client MIME Type
  const normalizedMime = clientMime === 'image/jpg' ? 'image/jpeg' : clientMime
  if (!LOGBOOK_ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      valid: false,
      error: 'Tipe MIME berkas tidak valid. Harap gunakan berkas PDF, JPG, JPEG, atau PNG.',
    }
  }

  // 4. Cek Magic Bytes (Header Binary)
  const magic = validateMagicBytes(buffer)
  if (!magic.valid) {
    return {
      valid: false,
      error: 'Isi berkas tidak sesuai dengan format yang diizinkan (Magic Bytes mismatch).',
    }
  }

  // 5. Kesesuaian Magic Bytes dengan Ekstensi / MIME
  if (magic.mime !== normalizedMime) {
    // Toleransi jpeg vs jpg
    if (!(magic.mime === 'image/jpeg' && normalizedMime === 'image/jpeg')) {
      return {
        valid: false,
        error: `Header berkas (${magic.mime}) tidak cocok dengan tipe berkas (${normalizedMime}).`,
      }
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
