import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sertifikatService } from '@/lib/services/sertifikat.service'
import { getPesertaList, type PesertaIdentitas } from '@/lib/helpers/peserta.helper'
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

    // 4. Verifikasi Hak Akses & Ambil Data Lengkap Pengajuan Beserta Anggota
    const { data: pengajuan, error: pengajuanErr } = await supabase
      .from('pengajuans')
      .select('id, user_id, status, nama_lengkap, nim_nis, anggota, jumlah_anggota')
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

    // 6. Validasi Identitas Responden dari Server (TIDAK PERCAYA DATA CLIENT)
    const { data: dbAnggotas } = await supabase
      .from('pengajuan_anggotas')
      .select('id, pengajuan_id, nama, nim_nis, is_ketua')
      .eq('pengajuan_id', pengajuanId)

    const pesertaList = getPesertaList(pengajuan, dbAnggotas)
    const isKelompok = pesertaList.length > 1

    let targetPeserta: PesertaIdentitas | null = null

    if (!isKelompok) {
      // Individu: selalu atas nama ketua
      targetPeserta = pesertaList[0]
    } else {
      // Kelompok: cocokkan dengan peserta yang dikirim oleh ketua
      const reqNama = String(payload.pesertaNama || '').trim().toLowerCase()
      const reqNim = String(payload.pesertaNim || '').trim().toLowerCase()
      const reqAnggotaId = payload.anggotaId ? Number(payload.anggotaId) : null
      const reqIsKetua = Boolean(payload.isKetua)

      targetPeserta =
        pesertaList.find((p) => {
          if (reqAnggotaId && p.id && p.id === reqAnggotaId) return true
          if (reqIsKetua && p.is_ketua) return true
          const pNama = p.nama.trim().toLowerCase()
          const pNim = p.nim_nis.trim().toLowerCase()
          return pNama === reqNama && (!reqNim || pNim === reqNim)
        }) || null

      if (!targetPeserta) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PARTICIPANT',
              message: 'Peserta yang dipilih tidak terdaftar dalam daftar anggota pengajuan magang ini.',
            },
          },
          { status: 400 }
        )
      }
    }

    // 7. Pencegahan Double-Submission per Peserta
    const { data: existingParticipantAnswer } = await supabase
      .from('skm_jawaban')
      .select('id')
      .eq('pengajuan_id', pengajuanId)
      .eq('peserta_nama', targetPeserta.nama)
      .eq('peserta_nim', targetPeserta.nim_nis)
      .limit(1)

    if (existingParticipantAnswer && existingParticipantAnswer.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: `Peserta "${targetPeserta.nama}" sudah pernah mengisi survei kepuasan untuk permohonan ini.`,
          },
        },
        { status: 409 }
      )
    }

    // 8. Ambil Pertanyaan Aktif dari Database & Validasi Kelayakan Jawaban
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

    // 9. Format dan Susun Baris Data Jawaban (seluruh 17 butir disimpan dengan identitas responden)
    const rowsToInsert = activeQuestions.map((q) => ({
      pengajuan_id: pengajuanId,
      skm_pertanyaan_id: q.id,
      jawaban: answerMap.get(q.id) || '',
      is_anonim: false,
      peserta_nama: targetPeserta.nama,
      peserta_nim: targetPeserta.nim_nis,
      is_ketua: targetPeserta.is_ketua,
      anggota_id: targetPeserta.id || null,
      is_legacy: false,
    }))

    // 10. Eksekusi Batch INSERT ke Database Supabase secara atomik
    const { data: insertedData, error: insertError } = await supabase
      .from('skm_jawaban')
      .insert(rowsToInsert)
      .select('id, pengajuan_id, skm_pertanyaan_id, jawaban, is_anonim, peserta_nama, peserta_nim, is_ketua, created_at')

    if (insertError) {
      console.error('[SKM API] INSERT skm_jawaban failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })

      // Kode PostgreSQL 23505 = Unique Violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_SUBMITTED',
              message: `Peserta "${targetPeserta.nama}" sudah pernah mengisi survei kepuasan.`,
            },
          },
          { status: 409 }
        )
      }

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

    // 11. Pemicu Pengecekan Notifikasi Sertifikat (Diisolasi dalam try/catch terpisah)
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
