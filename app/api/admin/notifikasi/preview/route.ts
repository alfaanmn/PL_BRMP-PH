import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { renderEmailHtml } from '@/lib/templates/email-templates'
import { EmailNotificationEvent, EmailNotificationPayload } from '@/types/email.types'
import { getSiteUrl } from '@/lib/utils'

/**
 * Route khusus administrator untuk mempratinjau (preview) template email notifikasi
 * Menggunakan data contoh (mock data) tanpa mengirimkan email atau menyentuh database bisnis.
 * Wajib autentikasi Supabase dan memiliki role === 'administrator'.
 *
 * Contoh URL:
 * GET /api/admin/notifikasi/preview?event=pengajuan_cancelled&role=admin
 * GET /api/admin/notifikasi/preview?event=pengajuan_cancelled&role=user
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                if (!value || options?.maxAge === 0) {
                  // Penghapusan cookie (misal signOut) - pertahankan maxAge: 0 dan path asli
                  cookieStore.set(name, value, {
                    ...options,
                    maxAge: 0,
                    path: options?.path || '/',
                  })
                } else {
                  // Session cookie murni: Hapus maxAge & expires agar terhapus otomatis saat browser ditutup
                  const { maxAge: _m, expires: _e, ...sessionOptions } = options || {}
                  cookieStore.set(name, value, {
                    ...sessionOptions,
                    path: options?.path || '/',
                  })
                }
              })
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // 1. Verifikasi Autentikasi Pengguna
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Akses ditolak: Anda harus login untuk melihat pratinjau template.',
          },
        },
        { status: 401 }
      )
    }

    // 2. Verifikasi Otorisasi Administrator
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile || profile.role !== 'administrator') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Akses ditolak: Pratinjau template hanya dapat diakses oleh administrator.',
          },
        },
        { status: 403 }
      )
    }

    // 3. Baca Parameter Query
    const searchParams = request.nextUrl.searchParams
    const eventParam = (searchParams.get('event') || 'pengajuan_submitted') as EmailNotificationEvent
    const roleParam = searchParams.get('role') === 'admin' ? 'admin' : 'user'

    // 4. Bangun Mock Data Contoh Representatif
    const mockPayload: EmailNotificationPayload = {
      event: eventParam,
      recipientRole: roleParam,
      recipient: {
        name: roleParam === 'admin' ? 'Admin SIMPUL' : 'Budi Santoso',
        email: roleParam === 'admin' ? 'admin@simpul-brmpph.id' : 'budi.santoso@contoh.ac.id',
      },
      pengajuan: {
        id: 101,
        publicId: 'PGJ-2026-X89B',
        userId: 'usr-8923-4567-89ab-cdef01234567',
        namaPemohon: 'Budi Santoso',
        pemohonEmail: 'budi.santoso@contoh.ac.id',
        statusPeserta: 'Mahasiswa',
        statusSebelum: eventParam === 'pengajuan_cancelled' ? 'Menunggu Verifikasi' : undefined,
        statusSesudah: eventParam === 'pengajuan_cancelled' ? 'Dibatalkan' : undefined,
        alasanPembatalan:
          eventParam === 'pengajuan_cancelled'
            ? 'Terjadwal agenda kuliah lapangan wajib dari program studi.'
            : undefined,
        bidangNama: 'Teknologi Informasi & Komunikasi (TIK)',
        asalInstansi: 'Universitas Indonesia',
        jurusan: 'Ilmu Komputer',
        jenjang: 'S1',
        jenisPeserta: 'Kelompok',
        jumlahPeserta: 3,
        daftarAnggotaRingkas: ['Siti Aminah', 'Rizky Pratama'],
        sisaAnggotaCount: 0,
        nomorSurat: '421/UI-FASILKOM/X/2026',
        tanggalMulai: '2026-11-01',
        tanggalSelesai: '2027-01-31',
        durasiBulan: 3,
        waktuKejadianWib: '25 Oktober 2026 19.30 WIB',
      },
      pembimbing: {
        nama: 'Dr. Ir. Hendra Gunawan, M.Sc.',
        nip: '197805122003121002',
        jabatan: 'Koordinator Fungsional Pengembang Perbenihan & Digital Pertanian',
      },
      alasanPenolakan:
        eventParam === 'pengajuan_rejected'
          ? 'Kapasitas ruangan laboratorium komputasi pada periode yang diajukan telah penuh.'
          : undefined,
      catatan:
        eventParam === 'pengajuan_cancelled'
          ? 'Alasan pembatalan: Terjadwal agenda kuliah lapangan wajib dari program studi.'
          : undefined,
      appUrl: getSiteUrl(),
    }

    // 5. Render HTML
    const htmlContent = renderEmailHtml(mockPayload)

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  } catch (err: any) {
    console.error('[API Preview Email] Exception:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || 'Gagal merender pratinjau template.',
        },
      },
      { status: 500 }
    )
  }
}
