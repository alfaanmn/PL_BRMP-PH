import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sertifikatService } from '@/lib/services/sertifikat.service'
import type { SKMSubmissionPayload, SKMResponse } from '@/types/skm.types'

export async function POST(request: Request): Promise<NextResponse<SKMResponse>> {
  try {
    // 1. Inisialisasi Supabase Server Client (membawa session cookies pengguna)
    const supabase = await createClient()

    // 2. Verifikasi Autentikasi Pengguna
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[SKM API] Auth failed:', {
        authErrorMessage: authError?.message,
        authErrorCode: authError?.status,
        userExists: Boolean(user),
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesi Anda telah berakhir. Silakan login kembali.',
          },
        },
        { status: 401 }
      )
    }

    // 3. Parse dan Validasi Payload Request
    let payload: SKMSubmissionPayload
    try {
      payload = await request.json()
    } catch (parseErr) {
      console.error('[SKM API] Payload parse error:', parseErr)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Format data survei yang dikirim tidak valid.',
          },
        },
        { status: 400 }
      )
    }

    const { pengajuanId, answers } = payload
    console.log('[SKM API] Incoming submission:', {
      userId: user.id,
      pengajuanId,
      answersCount: answers?.length,
    })

    if (!pengajuanId || typeof pengajuanId !== 'number') {
      console.error('[SKM API] Invalid pengajuanId:', { pengajuanId })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PENGAJUAN_ID',
            message: 'ID permohonan magang wajib disertakan.',
          },
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      console.error('[SKM API] Empty answers array received')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_ANSWERS',
            message: 'Jawaban butir pertanyaan survei tidak boleh kosong.',
          },
        },
        { status: 400 }
      )
    }

    // 4. Verifikasi Hak Akses & Kepemilikan Pengajuan
    const { data: pengajuan, error: pengajuanErr } = await supabase
      .from('pengajuans')
      .select('id, user_id, status')
      .eq('id', pengajuanId)
      .single()

    if (pengajuanErr || !pengajuan) {
      console.error('[SKM API] Pengajuan query failed:', {
        pengajuanId,
        pengajuanErrMessage: pengajuanErr?.message,
        pengajuanErrCode: pengajuanErr?.code,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Permohonan magang #${pengajuanId} tidak ditemukan dalam sistem.`,
          },
        },
        { status: 404 }
      )
    }

    if (pengajuan.user_id !== user.id) {
      console.error('[SKM API] Ownership mismatch:', {
        pengajuanId,
        pengajuanOwner: pengajuan.user_id,
        currentUserId: user.id,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Anda tidak memiliki hak akses terhadap permohonan pengajuan magang ini.',
          },
        },
        { status: 403 }
      )
    }

    // 5. Verifikasi Status Magang Harus 'Selesai'
    if (pengajuan.status !== 'Selesai') {
      console.error('[SKM API] Pengajuan status not eligible:', {
        pengajuanId,
        status: pengajuan.status,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STATUS_NOT_ELIGIBLE',
            message: `Survei kepuasan hanya dapat diisi untuk pengajuan yang berstatus "Selesai" (Status saat ini: "${pengajuan.status}").`,
          },
        },
        { status: 400 }
      )
    }

    // 6. Pencegahan Double-Submission (Cek apakah pengajuan sudah pernah dinilai)
    const { count, error: countErr } = await supabase
      .from('skm_jawaban')
      .select('id', { count: 'exact', head: true })
      .eq('pengajuan_id', pengajuanId)

    if (countErr) {
      console.error('[SKM API] Error checking duplicate submission:', countErr)
    }

    if ((count || 0) > 0) {
      console.warn('[SKM API] Duplicate submission detected for pengajuanId:', pengajuanId, 'Existing count:', count)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: 'Survei Kepuasan Masyarakat untuk permohonan ini sudah pernah dikirim sebelumnya.',
          },
        },
        { status: 409 }
      )
    }

    // 7. Ambil Pertanyaan Aktif dari Database & Validasi Kelayakan Jawaban
    const { data: activeQuestions, error: qErr } = await supabase
      .from('skm_pertanyaan')
      .select('id, urutan, tipe')
      .eq('is_active', true)

    if (qErr || !activeQuestions) {
      console.error('[SKM API] Failed to fetch active questions:', qErr)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Gagal memverifikasi butir pertanyaan survei.',
          },
        },
        { status: 500 }
      )
    }

    const questionMap = new Map(activeQuestions.map((q) => [q.id, q]))
    const answerMap = new Map(answers.map((a) => [a.skmPertanyaanId, String(a.jawaban ?? '').trim()]))

    // Validasi kelengkapan: seluruh butir aktif wajib dijawab
    for (const q of activeQuestions) {
      const ansVal = answerMap.get(q.id)
      if (ansVal === undefined || ansVal === '') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'REQUIRED_FIELD_EMPTY',
              message: `Pertanyaan nomor #${q.urutan} wajib diisi.`,
            },
          },
          { status: 400 }
        )
      }

      if (q.tipe === 'pilihan') {
        const scoreNum = Number(ansVal)
        if (![1, 2, 3, 4].includes(scoreNum)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_SCORE',
                message: `Pilihan jawaban untuk butir nomor #${q.urutan} harus bernilai antara 1 sampai 4.`,
              },
            },
            { status: 400 }
          )
        }
      } else if (q.tipe === 'teks') {
        if (ansVal.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'TEXT_REQUIRED',
                message: `Kolom saran dan masukan (nomor #${q.urutan}) wajib diisi.`,
              },
            },
            { status: 400 }
          )
        }
      }
    }

    // 8. Format dan Susun Baris Data Jawaban (seluruh 17 butir disimpan dengan is_anonim = false)
    const rowsToInsert = activeQuestions.map((q) => ({
      pengajuan_id: pengajuanId,
      skm_pertanyaan_id: q.id,
      jawaban: answerMap.get(q.id) || '',
      is_anonim: false,
    }))

    // 9. Eksekusi Batch INSERT ke Database Supabase
    const { data: insertedData, error: insertError } = await supabase
      .from('skm_jawaban')
      .insert(rowsToInsert)
      .select('id, pengajuan_id, skm_pertanyaan_id, jawaban, is_anonim, created_at')

    if (insertError) {
      console.error('[SKM API] INSERT skm_jawaban failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: insertError.message || 'Gagal menyimpan data survei kepuasan ke database.',
          },
        },
        { status: 500 }
      )
    }

    console.log('[SKM API] Successfully inserted answers count:', insertedData?.length || rowsToInsert.length)

    // 10. Pemicu Pengecekan Notifikasi Sertifikat (Diisolasi dalam try/catch terpisah sesuai Koreksi 3)
    try {
      await sertifikatService.checkAndTriggerNotification(pengajuanId)
    } catch (certNotifErr) {
      console.warn('[SKM API] Pengecekan notifikasi sertifikat dilewati secara aman:', certNotifErr)
    }

    // 11. Berhasil Disimpan
    return NextResponse.json(
      {
        success: true,
        data: {
          insertedCount: insertedData?.length || rowsToInsert.length,
        },
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kegagalan server saat memproses survei.'
    console.error('[SKM API] Unhandled server exception:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMsg,
        },
      },
      { status: 500 }
    )
  }
}
