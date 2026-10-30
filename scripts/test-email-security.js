const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { createServerClient } = require('@supabase/ssr')

// 1. Baca konfigurasi env dari .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
const envVars = {}
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = envVars.SUPABASE_SECRET_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY)

async function runSecurityTests() {
  console.log('======================================================================')
  console.log('       PENGUJIAN KEAMANAN ENDPOINT: /api/notifications/email          ')
  console.log('======================================================================')

  // -------------------------------------------------------------------------
  // KASUS 1: Tembak TANPA Login (Unauthenticated) -> Wajib HTTP 401
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] Tembak POST /api/notifications/email TANPA LOGIN')
  const res1 = await fetch('http://localhost:3000/api/notifications/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: 'pengajuan_approved',
      pengajuan: { publicId: 'dummy-unauth' },
    }),
  })
  const body1 = await res1.json()
  console.log(`Status Code : HTTP ${res1.status}`)
  console.log(`Response    :`, JSON.stringify(body1))
  if (res1.status === 401) {
    console.log('=> EVALUASI 1: [LOLOS] Berhasil ditolak 401 Unauthorized')
  } else {
    console.error('=> EVALUASI 1: [GAGAL] Respon tidak sesuai 401')
  }

  // -------------------------------------------------------------------------
  // Buat sesi autentikasi akun Pemohon Biasa (role: pengguna)
  // -------------------------------------------------------------------------
  const { data: penggunaList } = await adminClient
    .from('profiles')
    .select('id, email, role, name')
    .eq('role', 'pengguna')
    .limit(1)

  if (!penggunaList || penggunaList.length === 0) {
    console.error('Tidak ada akun pengguna di database.')
    return
  }

  const testUser = penggunaList[0]
  console.log(`\nInformasi Akun Pemohon Uji: ${testUser.name} (${testUser.email}) - Role: "${testUser.role}"`)

  const cookiesObj = {}
  const ssrClient = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookiesObj).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          cookiesObj[name] = value
        })
      },
    },
  })

  const { data: linkData } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: testUser.email,
  })

  await ssrClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  const cookieHeader = Object.entries(cookiesObj)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ')

  // -------------------------------------------------------------------------
  // KASUS 2: Akun Pemohon Biasa memicu event verifikasi admin: 'pengajuan_approved' -> Wajib HTTP 403
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] Akun Pemohon mencoba memicu event verifikasi "pengajuan_approved"')
  const res2 = await fetch('http://localhost:3000/api/notifications/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
    body: JSON.stringify({
      event: 'pengajuan_approved',
      recipientRole: 'user',
      pengajuan: {
        publicId: 'dummy-approved',
      },
    }),
  })
  const body2 = await res2.json()
  console.log(`Status Code : HTTP ${res2.status}`)
  console.log(`Response    :`, JSON.stringify(body2))
  if (res2.status === 403) {
    console.log('=> EVALUASI 2: [LOLOS] Berhasil ditolak 403 Forbidden')
  } else {
    console.error('=> EVALUASI 2: [GAGAL] Respon tidak sesuai 403')
  }

  // -------------------------------------------------------------------------
  // KASUS 3: Akun Pemohon Biasa memicu event notifikasi admin: 'admin_pengajuan_new' -> Wajib HTTP 403
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] Akun Pemohon mencoba memicu event internal admin "admin_pengajuan_new"')
  const res3 = await fetch('http://localhost:3000/api/notifications/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
    body: JSON.stringify({
      event: 'admin_pengajuan_new',
      recipientRole: 'admin',
      pengajuan: {
        publicId: 'dummy-admin-new',
      },
    }),
  })
  const body3 = await res3.json()
  console.log(`Status Code : HTTP ${res3.status}`)
  console.log(`Response    :`, JSON.stringify(body3))
  if (res3.status === 403) {
    console.log('=> EVALUASI 3: [LOLOS] Berhasil ditolak 403 Forbidden')
  } else {
    console.error('=> EVALUASI 3: [GAGAL] Respon tidak sesuai 403')
  }

  // -------------------------------------------------------------------------
  // KASUS 4: Akun Pemohon Biasa memicu event sertifikat: 'sertifikat_available' -> Wajib HTTP 403
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] Akun Pemohon mencoba memicu event sertifikat "sertifikat_available"')
  const res4 = await fetch('http://localhost:3000/api/notifications/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
    body: JSON.stringify({
      event: 'sertifikat_available',
      recipientRole: 'user',
      pengajuan: {
        publicId: 'dummy-cert',
      },
    }),
  })
  const body4 = await res4.json()
  console.log(`Status Code : HTTP ${res4.status}`)
  console.log(`Response    :`, JSON.stringify(body4))
  if (res4.status === 403) {
    console.log('=> EVALUASI 4: [LOLOS] Berhasil ditolak 403 Forbidden')
  } else {
    console.error('=> EVALUASI 4: [GAGAL] Respon tidak sesuai 403')
  }

  console.log('\n======================================================================')
  console.log('                  SELURUH SUITE PENGUJIAN SELESAI                     ')
  console.log('======================================================================')
}

runSecurityTests()
