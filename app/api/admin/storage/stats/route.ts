import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const FREE_PLAN_LIMIT_BYTES = 1024 * 1024 * 1024 // 1 GB (1.073.741.824 bytes)
const WARNING_THRESHOLD_PERCENT = 80 // 80%

/**
 * GET /api/admin/storage/stats
 * Mengambil statistik akumulasi penggunaan Supabase Storage (Free Plan 1 GB).
 */
export async function GET(request: NextRequest) {
  try {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'administrator') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya administrator yang dapat mengakses data ini.' },
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

    let logbookBytes = 0
    let dokumenBytes = 0
    let sertifikatBytes = 0

    // 1. Coba hitung via query langsung ke schema storage jika diperbolehkan
    try {
      const { data: objects, error: objError } = await (adminClient as any)
        .schema('storage')
        .from('objects')
        .select('bucket_id, metadata')

      if (!objError && Array.isArray(objects)) {
        for (const obj of objects) {
          const size = Number(obj.metadata?.size || obj.metadata?.file_size || 0)
          if (obj.bucket_id === 'logbook') logbookBytes += size
          else if (obj.bucket_id === 'dokumen') dokumenBytes += size
          else if (obj.bucket_id === 'sertifikat') sertifikatBytes += size
        }
      } else {
        throw new Error(objError?.message || 'Storage objects query not supported')
      }
    } catch {
      // 2. Fallback: Hitung dari database metadata logbooks dan sertifikats
      const { data: lbRows } = await adminClient.from('logbooks').select('file_size')
      if (lbRows) {
        logbookBytes = lbRows.reduce((acc, r) => acc + (r.file_size || 0), 0)
      }

      // Estimasi bucket dokumen (surat pengantar, proposal) rata-rata 1MB per berkas aktif
      const { count: pengajuanCount } = await adminClient
        .from('pengajuans')
        .select('id', { count: 'exact', head: true })
      dokumenBytes = (pengajuanCount || 0) * 1024 * 1024 // estimasi realistis

      // Estimasi sertifikat (500KB per sertifikat terbit)
      const { count: certCount } = await adminClient
        .from('pengajuans')
        .select('id', { count: 'exact', head: true })
        .not('sertifikat_url', 'is', null)
      sertifikatBytes = (certCount || 0) * 512 * 1024
    }

    const totalUsedBytes = logbookBytes + dokumenBytes + sertifikatBytes
    const percentUsed = Number(((totalUsedBytes / FREE_PLAN_LIMIT_BYTES) * 100).toFixed(2))
    const isWarning = percentUsed >= WARNING_THRESHOLD_PERCENT

    return NextResponse.json({
      success: true,
      data: {
        totalLimitBytes: FREE_PLAN_LIMIT_BYTES,
        totalUsedBytes,
        percentUsed,
        isWarning,
        breakdown: {
          logbook: logbookBytes,
          dokumen: dokumenBytes,
          sertifikat: sertifikatBytes,
        },
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
