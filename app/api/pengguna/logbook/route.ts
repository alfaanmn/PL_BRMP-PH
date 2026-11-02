import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAllLogbookWeeks } from '@/lib/utils/logbook-date'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pengguna/logbook?pengajuan_id=<id>
 * Mengambil daftar seluruh minggu dan status logbook untuk pemohon.
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

    // 1. Ambil data pengajuan dan pastikan milik pemohon
    const { data: pengajuan, error: pError } = await supabase
      .from('pengajuans')
      .select('id, user_id, status, tanggal_mulai, tanggal_selesai, durasi_bulan')
      .eq('id', pengajuanId)
      .eq('user_id', user.id)
      .single()

    if (pError || !pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan magang tidak ditemukan atau bukan milik Anda.' },
        { status: 404 }
      )
    }

    // 2. Ambil seluruh data logbook yang sudah diunggah
    const { data: logbooks, error: lError } = await supabase
      .from('logbooks')
      .select('id, minggu_ke, periode_mulai, periode_selesai, file_name, file_size, mime_type, catatan, created_at, updated_at')
      .eq('pengajuan_id', pengajuan.id)
      .order('minggu_ke', { ascending: true })

    if (lError) {
      return NextResponse.json(
        { success: false, error: `Gagal mengambil data logbook: ${lError.message}` },
        { status: 500 }
      )
    }

    // 3. Kalkulasi matriks minggu berdasarkan tanggal magang
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
      isSedangMagang: pengajuan.status === 'Sedang Magang',
      totalWeeks: weeks.length,
      weeks: mergedWeeks,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
