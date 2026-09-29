import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { laporanService } from '@/lib/services/laporan.service'
import { exportExcelUtil } from '@/lib/utils/export-excel'
import type { ExportDatasetCategory, ExportFormat, LaporanFilterParams } from '@/types/laporan.types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 1. Verifikasi Autentikasi & Otorisasi Administrator Server-Side
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesi login tidak valid. Silakan masuk terlebih dahulu.',
          },
        },
        { status: 401 }
      )
    }

    // Ambil profil user untuk validasi role administrator
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile || profile.role !== 'administrator' || !profile.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Akses ditolak. Fitur ekspor laporan hanya dapat diakses oleh Administrator.',
          },
        },
        { status: 403 }
      )
    }

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams
    const format = (searchParams.get('format') || 'xlsx').toLowerCase() as ExportFormat
    const category = (searchParams.get('category') || 'all').toLowerCase() as ExportDatasetCategory

    const filterParams: LaporanFilterParams = {
      status: searchParams.get('status') || undefined,
      bidangId: searchParams.get('bidangId') || undefined,
      pembimbingId: searchParams.get('pembimbingId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // 3. Bangun paket dataset laporan menggunakan Server Client terautentikasi
    const { data: exportPkg, error: pkgErr } = await laporanService.buildExportPackage(
      filterParams,
      category,
      format,
      supabase
    )

    if (pkgErr || !exportPkg) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXPORT_FAILED',
            message: pkgErr || 'Gagal menyusun data laporan untuk diekspor.',
          },
        },
        { status: 500 }
      )
    }

    // 4. Return berkas Excel (.xlsx) atau CSV (.csv)
    if (format === 'csv') {
      const csvData = exportExcelUtil.generateCSV(exportPkg, category)
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${exportPkg.filename}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    } else {
      const xlsxBuffer = exportExcelUtil.generateWorkbook(exportPkg)
      return new NextResponse(Buffer.from(xlsxBuffer), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${exportPkg.filename}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan sistem saat memproses ekspor.'
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: msg,
        },
      },
      { status: 500 }
    )
  }
}
