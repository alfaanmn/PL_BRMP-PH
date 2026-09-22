import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhoneNumber } from '@/lib/validations/auth.validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const rawPhone = typeof body.no_hp === 'string' ? body.no_hp.trim() : ''

    const cleanEmail = rawEmail
    const cleanPhone = normalizePhoneNumber(rawPhone)

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Email atau nomor HP wajib disertakan untuk pemeriksaan.',
          },
        },
        { status: 400 }
      )
    }

    // Gunakan Admin client (service role) jika tersedia di server untuk bypass RLS, fallback ke createClient()
    const adminSupabase = createAdminClient()
    const supabase = adminSupabase || (await createClient())

    let emailExists = false
    let phoneExists = false

    // 1. Cek RPC jika tersedia di PostgreSQL (check_registration_duplicate)
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_registration_duplicate', {
      p_email: cleanEmail || null,
      p_no_hp: cleanPhone || null,
    })

    if (!rpcError && rpcData) {
      emailExists = Boolean(rpcData.email_exists)
      phoneExists = Boolean(rpcData.phone_exists)
    } else {
      // 2. Fallback query jika RPC belum dibuat di database
      if (cleanEmail) {
        const { data: emailMatch } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', cleanEmail)
          .limit(1)

        if (emailMatch && emailMatch.length > 0) {
          emailExists = true
        }
      }

      if (cleanPhone) {
        const { data: phoneMatch } = await supabase
          .from('profiles')
          .select('id')
          .eq('no_hp', cleanPhone)
          .limit(1)

        if (phoneMatch && phoneMatch.length > 0) {
          phoneExists = true
        }
      }
    }

    if (emailExists && phoneExists) {
      return NextResponse.json({
        success: false,
        data: { emailExists: true, phoneExists: true },
        error: {
          code: 'EMAIL_AND_PHONE_ALREADY_REGISTERED',
          message: 'Email dan nomor HP sudah terdaftar.',
        },
      })
    }

    if (emailExists) {
      return NextResponse.json({
        success: false,
        data: { emailExists: true, phoneExists: false },
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
        },
      })
    }

    if (phoneExists) {
      return NextResponse.json({
        success: false,
        data: { emailExists: false, phoneExists: true },
        error: {
          code: 'PHONE_ALREADY_REGISTERED',
          message: 'Nomor HP sudah terdaftar. Gunakan nomor HP lain.',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        emailExists: false,
        phoneExists: false,
        normalizedPhone: cleanPhone,
        normalizedEmail: cleanEmail,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memeriksa data pendaftaran.'
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: msg,
        },
      },
      { status: 500 }
    )
  }
}
