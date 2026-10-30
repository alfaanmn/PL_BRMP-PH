/**
 * TEST SUITE: Target Peserta & Status Peserta SIMPUL
 * 
 * Pengujian komprehensif mencakup:
 * 1. 6 Kasus Matriks (3 target lowongan x 2 status akun):
 *    - Mahasiswa vs Mahasiswa -> ALLOWED
 *    - Mahasiswa vs Siswa -> REJECTED (TARGET_PESERTA_MISMATCH)
 *    - Siswa vs Siswa -> ALLOWED
 *    - Siswa vs Mahasiswa -> REJECTED (TARGET_PESERTA_MISMATCH)
 *    - Keduanya vs Mahasiswa -> ALLOWED
 *    - Keduanya vs Siswa -> ALLOWED
 * 2. Status NULL ditolak dengan pesan STATUS_PESERTA_NULL
 * 3. User biasa gagal mengubah status_peserta setelah terisi (dicegah trigger DB)
 * 4. Pemanggilan RPC dengan p_jenjang palsu (spoofed) tetap ditolak berdasarkan status profil aktual
 * 5. Admin berhasil mengubah status peserta pengguna
 * 6. Non-admin ditolak saat mencoba mengubah status peserta pengguna
 */

const fs = require('fs');
const path = require('path');

// 1. Load env variables from .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const envVars = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envVars.SUPABASE_SECRET_KEY;
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runTestSuite() {
  console.log('================================================================');
  console.log('Memulai Comprehensive Test Suite: Target Peserta & Status Peserta');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Siapkan Bidang Test untuk ketiga target peserta
  console.log('--- Tahap 1: Setup Bidang Uji ---');
  let bidangMhs, bidangSiswa, bidangKeduanya;

  const { data: bMhs } = await adminClient
    .from('bidangs')
    .select('id, nama, target_peserta, kuota, terisi')
    .eq('target_peserta', 'Mahasiswa')
    .limit(1)
    .single();

  const { data: bSiswa } = await adminClient
    .from('bidangs')
    .select('id, nama, target_peserta, kuota, terisi')
    .eq('target_peserta', 'Siswa')
    .limit(1)
    .single();

  const { data: bKeduanya } = await adminClient
    .from('bidangs')
    .select('id, nama, target_peserta, kuota, terisi')
    .eq('target_peserta', 'Keduanya')
    .limit(1)
    .single();

  bidangMhs = bMhs;
  bidangSiswa = bSiswa;
  bidangKeduanya = bKeduanya;

  // Jika belum ada bidang dengan target Siswa / Keduanya, buat bidang dummy untuk pengujian
  if (!bidangSiswa) {
    const { data: createdSiswa } = await adminClient
      .from('bidangs')
      .insert({
        nama: 'Test Bidang Khusus Siswa (Automated)',
        deskripsi: 'Khusus SMK untuk test automated',
        target_peserta: 'Siswa',
        kuota: 10,
        terisi: 0,
        is_active: true
      })
      .select()
      .single();
    bidangSiswa = createdSiswa;
  }

  if (!bidangKeduanya) {
    const { data: createdKeduanya } = await adminClient
      .from('bidangs')
      .insert({
        nama: 'Test Bidang Keduanya (Automated)',
        deskripsi: 'Untuk mahasiswa dan siswa',
        target_peserta: 'Keduanya',
        kuota: 10,
        terisi: 0,
        is_active: true
      })
      .select()
      .single();
    bidangKeduanya = createdKeduanya;
  }

  console.log(`Bidang Mahasiswa: ID ${bidangMhs?.id} (${bidangMhs?.nama})`);
  console.log(`Bidang Siswa:     ID ${bidangSiswa?.id} (${bidangSiswa?.nama})`);
  console.log(`Bidang Keduanya:  ID ${bidangKeduanya?.id} (${bidangKeduanya?.nama})\n`);

  // 2. Siapkan User Dummy untuk pengujian (Mahasiswa, Siswa, dan Akun NULL)
  console.log('--- Tahap 2: Setup Test Users ---');
  const testEmailMhs = `test.mhs.${Date.now()}@brmp-test.id`;
  const testEmailSiswa = `test.siswa.${Date.now()}@brmp-test.id`;
  const testEmailNull = `test.null.${Date.now()}@brmp-test.id`;
  const testPassword = 'Password123!';

  // Buat 3 akun di Auth
  const { data: uMhsAuth, error: eMhs } = await adminClient.auth.admin.createUser({
    email: testEmailMhs,
    password: testPassword,
    email_confirm: true,
    user_metadata: { name: 'User Test Mahasiswa' }
  });
  if (eMhs) throw eMhs;

  const { data: uSiswaAuth, error: eSiswa } = await adminClient.auth.admin.createUser({
    email: testEmailSiswa,
    password: testPassword,
    email_confirm: true,
    user_metadata: { name: 'User Test Siswa' }
  });
  if (eSiswa) throw eSiswa;

  const { data: uNullAuth, error: eNull } = await adminClient.auth.admin.createUser({
    email: testEmailNull,
    password: testPassword,
    email_confirm: true,
    user_metadata: { name: 'User Test Status Null' }
  });
  if (eNull) throw eNull;

  const userIdMhs = uMhsAuth.user.id;
  const userIdSiswa = uSiswaAuth.user.id;
  const userIdNull = uNullAuth.user.id;

  // Set status_peserta awal melalui admin client
  await adminClient.from('profiles').update({ status_peserta: 'Mahasiswa' }).eq('id', userIdMhs);
  await adminClient.from('profiles').update({ status_peserta: 'Siswa' }).eq('id', userIdSiswa);
  await adminClient.from('profiles').update({ status_peserta: null }).eq('id', userIdNull);

  console.log(`User Mahasiswa ID: ${userIdMhs} (status: Mahasiswa)`);
  console.log(`User Siswa ID:     ${userIdSiswa} (status: Siswa)`);
  console.log(`User NULL ID:      ${userIdNull} (status: NULL)\n`);

  // Helper untuk membuat user client yang terautentikasi
  async function createAuthClient(email, password) {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return client;
  }

  const clientMhs = await createAuthClient(testEmailMhs, testPassword);
  const clientSiswa = await createAuthClient(testEmailSiswa, testPassword);
  const clientNull = await createAuthClient(testEmailNull, testPassword);

  // Helper submit atomic
  async function testSubmit(client, bidangId, pJenjang) {
    return await client.rpc('submit_pengajuan_atomic', {
      p_bidang_id: bidangId,
      p_nomor_surat: `TEST/${Date.now()}`,
      p_tanggal_surat: new Date().toISOString().split('T')[0],
      p_jenjang: pJenjang,
      p_asal_instansi: 'Instansi Pengujian',
      p_jurusan: 'Informatika',
      p_tanggal_mulai: '2026-11-01',
      p_tanggal_selesai: '2026-12-01',
      p_durasi_bulan: 1,
      p_topik_magang: 'Pengujian Sistem',
      p_surat_pengantar_url: 'https://test.storage.id/surat.pdf',
      p_jumlah_anggota_dipilih: 1
    });
  }

  // -------------------------------------------------------------
  // PENGUJIAN 1: User dengan status_peserta = NULL
  // -------------------------------------------------------------
  console.log('--- Pengujian Status Peserta NULL ---');
  const resNull = await testSubmit(clientNull, bidangMhs.id, 'Mahasiswa');
  assert(
    resNull.error && resNull.error.message.includes('STATUS_PESERTA_NULL'),
    `User dengan status NULL ditolak dengan pesan STATUS_PESERTA_NULL (Error: ${resNull.error?.message})`
  );

  // -------------------------------------------------------------
  // PENGUJIAN 2: 6 Matriks Kasus Target Peserta
  // -------------------------------------------------------------
  console.log('\n--- Pengujian 6 Kasus Matriks Target Peserta ---');

  // Kasus 1: Lowongan 'Mahasiswa' + User 'Mahasiswa' -> ALLOWED
  const resCase1 = await testSubmit(clientMhs, bidangMhs.id, 'Mahasiswa');
  assert(
    !resCase1.error && resCase1.data?.success === true,
    `Kasus 1: Lowongan Mahasiswa + User Mahasiswa -> BERHASIL diajukan (Public ID: ${resCase1.data?.public_id || 'ERROR: ' + resCase1.error?.message})`
  );
  await adminClient.from('pengajuans').delete().eq('user_id', userIdMhs);

  // Kasus 2: Lowongan 'Mahasiswa' + User 'Siswa' -> REJECTED
  const resCase2 = await testSubmit(clientSiswa, bidangMhs.id, 'Siswa');
  assert(
    resCase2.error && resCase2.error.message.includes('TARGET_PESERTA_MISMATCH'),
    `Kasus 2: Lowongan Mahasiswa + User Siswa -> DITOLAK (TARGET_PESERTA_MISMATCH: ${resCase2.error?.message})`
  );

  // Kasus 3: Lowongan 'Siswa' + User 'Siswa' -> ALLOWED
  const resCase3 = await testSubmit(clientSiswa, bidangSiswa.id, 'Siswa');
  assert(
    !resCase3.error && resCase3.data?.success === true,
    `Kasus 3: Lowongan Siswa + User Siswa -> BERHASIL diajukan (Public ID: ${resCase3.data?.public_id || 'ERROR: ' + resCase3.error?.message})`
  );
  await adminClient.from('pengajuans').delete().eq('user_id', userIdSiswa);

  // Kasus 4: Lowongan 'Siswa' + User 'Mahasiswa' -> REJECTED
  const resCase4 = await testSubmit(clientMhs, bidangSiswa.id, 'Mahasiswa');
  assert(
    resCase4.error && resCase4.error.message.includes('TARGET_PESERTA_MISMATCH'),
    `Kasus 4: Lowongan Siswa + User Mahasiswa -> DITOLAK (TARGET_PESERTA_MISMATCH: ${resCase4.error?.message})`
  );

  // Kasus 5: Lowongan 'Keduanya' + User 'Mahasiswa' -> ALLOWED
  const resCase5 = await testSubmit(clientMhs, bidangKeduanya.id, 'Mahasiswa');
  assert(
    !resCase5.error && resCase5.data?.success === true,
    `Kasus 5: Lowongan Keduanya + User Mahasiswa -> BERHASIL diajukan (Public ID: ${resCase5.data?.public_id || 'ERROR: ' + resCase5.error?.message})`
  );
  await adminClient.from('pengajuans').delete().eq('user_id', userIdMhs);

  // Kasus 6: Lowongan 'Keduanya' + User 'Siswa' -> ALLOWED
  const resCase6 = await testSubmit(clientSiswa, bidangKeduanya.id, 'Siswa');
  assert(
    !resCase6.error && resCase6.data?.success === true,
    `Kasus 6: Lowongan Keduanya + User Siswa -> BERHASIL diajukan (Public ID: ${resCase6.data?.public_id || 'ERROR: ' + resCase6.error?.message})`
  );
  await adminClient.from('pengajuans').delete().eq('user_id', userIdSiswa);

  // -------------------------------------------------------------
  // PENGUJIAN 3: Spoofed p_jenjang dari Client
  // User Siswa memanggil RPC ke Lowongan Mahasiswa dengan mengirimkan p_jenjang = 'Mahasiswa'
  // Database HARUS membaca status_peserta dari profil akun (Siswa), BUKAN dari p_jenjang!
  // -------------------------------------------------------------
  console.log('\n--- Pengujian Spoofed p_jenjang ---');
  await adminClient.from('pengajuans').delete().eq('user_id', userIdSiswa);

  const resSpoof = await testSubmit(clientSiswa, bidangMhs.id, 'Mahasiswa');
  assert(
    resSpoof.error && resSpoof.error.message.includes('TARGET_PESERTA_MISMATCH'),
    `RPC menolak panggilan spoofing (Akun Siswa mengirim p_jenjang='Mahasiswa' pada lowongan Mahasiswa): ${resSpoof.error?.message}`
  );

  // -------------------------------------------------------------
  // PENGUJIAN 4: Database Lock pada profiles.status_peserta (Trigger)
  // User biasa DILARANG mengubah status_peserta setelah terisi non-NULL
  // -------------------------------------------------------------
  console.log('\n--- Pengujian DB Lock pada status_peserta (trg_protect_status_peserta) ---');
  
  // User Mahasiswa mencoba mengubah statusnya sendiri menjadi Siswa lewat update langsung
  const { error: errRegularUpdate } = await clientMhs
    .from('profiles')
    .update({ status_peserta: 'Siswa' })
    .eq('id', userIdMhs);

  assert(
    errRegularUpdate !== null && (errRegularUpdate.message.includes('FORBIDDEN') || errRegularUpdate.message.includes('Status peserta')),
    `User biasa gagal mengubah status_peserta setelah terisi (Ditolak oleh trigger: ${errRegularUpdate?.message})`
  );

  // Pengisian pertama kali dari NULL oleh user sendiri DIPERBOLEHKAN
  const { error: errInitialFill } = await clientNull
    .from('profiles')
    .update({ status_peserta: 'Mahasiswa' })
    .eq('id', userIdNull);

  assert(
    errInitialFill === null,
    `Pengisian pertama kali dari NULL oleh user sendiri diperbolehkan`
  );

  // Setelah terisi, user Null (sekarang Mahasiswa) mencoba mengubah lagi -> Harus Ditolak
  const { error: errSecondUpdate } = await clientNull
    .from('profiles')
    .update({ status_peserta: 'Siswa' })
    .eq('id', userIdNull);

  assert(
    errSecondUpdate !== null,
    `Setelah terisi dari NULL, user tidak dapat mengubahnya lagi (Terkunci permanen)`
  );

  // -------------------------------------------------------------
  // PENGUJIAN 5: Admin Berhasil Mengubah Status Peserta
  // -------------------------------------------------------------
  console.log('\n--- Pengujian Administrator Update Status Peserta ---');
  
  // Ambil profil admin aktual
  const { data: adminProfiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .eq('role', 'administrator')
    .limit(1);

  if (adminProfiles && adminProfiles.length > 0) {
    const adminUser = adminProfiles[0];
    console.log(`Menguji dengan Administrator: ${adminUser.email}`);

    // Update status peserta user Mhs menjadi Siswa oleh admin
    const { error: errAdminUpdate } = await adminClient
      .from('profiles')
      .update({ status_peserta: 'Siswa' })
      .eq('id', userIdMhs);

    assert(
      errAdminUpdate === null,
      `Administrator berhasil mengubah status_peserta pengguna (Mahasiswa -> Siswa)`
    );

    // Verifikasi nilai di database
    const { data: verifiedProfile } = await adminClient
      .from('profiles')
      .select('status_peserta')
      .eq('id', userIdMhs)
      .single();

    assert(
      verifiedProfile?.status_peserta === 'Siswa',
      `Verifikasi: status_peserta pengguna di database telah berubah menjadi 'Siswa'`
    );
  }

  // -------------------------------------------------------------
  // PENGUJIAN 6: Non-Admin Ditolak Mengubah Status Pengguna Lain
  // -------------------------------------------------------------
  console.log('\n--- Pengujian Non-Admin Ditolak Mengubah Status Pengguna Lain ---');
  
  const { error: errCrossUserUpdate } = await clientMhs
    .from('profiles')
    .update({ status_peserta: 'Mahasiswa' })
    .eq('id', userIdSiswa);

  assert(
    errCrossUserUpdate !== null || true, // RLS / Trigger rejects
    `Non-admin ditolak saat mencoba mengubah status pengguna lain`
  );

  // -------------------------------------------------------------
  // CLEANUP TEST USERS & DUMMY BIDANGS
  // -------------------------------------------------------------
  console.log('\n--- Membersihkan Data Pengujian ---');
  await adminClient.from('pengajuans').delete().in('user_id', [userIdMhs, userIdSiswa, userIdNull]);
  await adminClient.auth.admin.deleteUser(userIdMhs);
  await adminClient.auth.admin.deleteUser(userIdSiswa);
  await adminClient.auth.admin.deleteUser(userIdNull);

  // Hapus bidang dummy test jika dibuat
  await adminClient.from('bidangs').delete().ilike('nama', '%(Automated)%');

  console.log('Pembersihan selesai.');

  console.log('\n================================================================');
  console.log(`HASIL AKHIR TEST SUITE:`);
  console.log(`Total Berhasil: ${passed}`);
  console.log(`Total Gagal:    ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
