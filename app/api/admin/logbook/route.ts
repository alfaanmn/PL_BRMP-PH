import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAllLogbookWeeks } from '@/lib/utils/logbook-date'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/logbook?pengajuan_id=<id>
 * Mengambil daftar seluruh minggu dan logbook untuk panel admin.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pengajuanId = searchParams.get('pengajuan_id')?.trim()

    if (!pengajuanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter pengajuan_id wajib disertakan.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid atau telah berakhir.' },
        { status: 401 }
      )
    }

    // Cek role admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'administrator') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya administrator yang dapat mengakses rute ini.' },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: 'Admin client tidak tersedia pada server.' },
        { status: 500 }
      )
    }

    // 1. Ambil data pengajuan
    const { data: pengajuan, error: pError } = await adminClient
      .from('pengajuans')
      .select('id, user_id, status, tanggal_mulai, tanggal_selesai, nama_lengkap, asal_instansi')
      .eq('id', pengajuanId)
      .single()

    if (pError || !pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan magang tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 2. Ambil seluruh logbook
    const { data: logbooks, error: lError } = await adminClient
      .from('logbooks')
      .select('id, minggu_ke, periode_mulai, periode_selesai, file_name, file_size, mime_type, catatan, created_at, updated_at')
      .eq('pengajuan_id', pengajuan.id)
      .order('minggu_ke', { ascending: true })

    if (lError) {
      return NextResponse.json(
        { success: false, error: `Gagal mengambil logbook: ${lError.message}` },
        { status: 500 }
      )
    }

    const weeks = calculateAllLogbookWeeks(
      pengajuan.tanggal_mulai || '',
      pengajuan.tanggal_selesai || ''
    )

    const logbookMap = new Map((logbooks || []).map((l) => [l.minggu_ke, l]))

    const mergedWeeks = weeks.map((w) => {
      const existing = logbookMap.get(w.minggu_ke) || null
      return {
        ...w,
        logbook: existing,
      }
    })

    return NextResponse.json({
      success: true,
      pengajuanStatus: pengajuan.status,
      namaLengkap: pengajuan.nama_lengkap,
      asalInstansi: pengajuan.asal_instansi,
      totalWeeks: weeks.length,
      uploadedCount: (logbooks || []).length,
      weeks: mergedWeeks,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
