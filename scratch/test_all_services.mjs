import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function runTests() {
  console.log('========================================');
  console.log('RUNNING FULL AUTOMATED SYSTEM AUDIT TEST');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, errorMsg = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${name}: ${errorMsg}`);
      failed++;
    }
  }

  // 1. SKM PERTANYAAN AUDIT
  console.log('\n--- 1. SKM PERTANYAAN AUDIT ---');
  const { data: questions, error: qErr } = await supabase
    .from('skm_pertanyaan')
    .select('*')
    .order('urutan', { ascending: true });

  assert('Fetch skm_pertanyaan from Supabase', !qErr && questions && questions.length > 0, qErr?.message);

  if (questions) {
    const choiceQ = questions.filter(q => q.tipe === 'pilihan');
    const textQ = questions.filter(q => q.tipe === 'teks');
    
    assert('Choice questions count >= 1', choiceQ.length >= 13, `Found ${choiceQ.length}`);
    assert('Text questions count >= 1', textQ.length >= 2, `Found ${textQ.length}`);

    let allChoiceHave4Options = true;
    for (const q of choiceQ) {
      if (!Array.isArray(q.opsi) || q.opsi.length !== 4) {
        allChoiceHave4Options = false;
        console.log(`   Warning: Q${q.urutan} opsi is not 4 items:`, q.opsi);
      }
    }
    assert('All choice questions have exactly 4 valid JSONB options', allChoiceHave4Options);

    let allTextHaveNullOpsi = true;
    for (const q of textQ) {
      if (q.opsi !== null) {
        allTextHaveNullOpsi = false;
        console.log(`   Warning: Q${q.urutan} text question has non-null opsi:`, q.opsi);
      }
    }
    assert('All text questions have null opsi', allTextHaveNullOpsi);
  }

  // 2. MASTER BIDANG & PEMBIMBING AUDIT
  console.log('\n--- 2. MASTER BIDANG & PEMBIMBING AUDIT ---');
  const { data: bidangs, error: bErr } = await supabase.from('bidangs').select('*');
  assert('Fetch bidangs table', !bErr && bidangs && bidangs.length > 0, bErr?.message);

  const { data: pembimbings, error: pErr } = await supabase.from('pembimbings').select('*');
  assert('Fetch pembimbings table', !pErr && pembimbings && pembimbings.length > 0, pErr?.message);

  const { data: bpRel, error: bpErr } = await supabase.from('bidang_pembimbing').select('*');
  assert('Fetch bidang_pembimbing table', !bpErr && bpRel && bpRel.length > 0, bpErr?.message);

  // 3. SCHEMA INTEGRITY TEST (Querying relations as services do)
  console.log('\n--- 3. SERVICE QUERIES INTEGRITY ---');
  
  // admin-bidang query test
  const { data: adminBidangQuery, error: abqErr } = await supabase
    .from('bidang_pembimbing')
    .select(`
      id,
      bidang_id,
      pembimbing_id,
      is_active,
      pembimbings (
        id,
        nama,
        nip,
        jabatan,
        email,
        no_hp,
        is_active
      )
    `);
  assert('Admin bidang_pembimbing relation query', !abqErr && adminBidangQuery !== null, abqErr?.message);

  // admin-pembimbing query test
  const { data: adminPembimbingQuery, error: apqErr } = await supabase
    .from('bidang_pembimbing')
    .select(`
      id,
      bidang_id,
      pembimbing_id,
      is_active,
      bidangs (
        id,
        nama,
        kuota,
        is_active
      )
    `);
  assert('Admin pembimbing relation query with bidangs', !apqErr && adminPembimbingQuery !== null, apqErr?.message);

  // 4. RLS ANONYMOUS ACCESS TEST (Ensuring sensitive data is private)
  console.log('\n--- 4. RLS & PRIVACY INTEGRITY ---');
  const { data: anonProfiles } = await supabase.from('profiles').select('*');
  assert('RLS: Anonymous cannot read user profiles', !anonProfiles || anonProfiles.length === 0);

  const { data: anonPengajuans } = await supabase.from('pengajuans').select('*');
  assert('RLS: Anonymous cannot read pengajuans', !anonPengajuans || anonPengajuans.length === 0);

  const { data: anonNotif } = await supabase.from('notifikasi').select('*');
  assert('RLS: Anonymous cannot read notifications', !anonNotif || anonNotif.length === 0);

  const { data: anonJawaban } = await supabase.from('skm_jawaban').select('*');
  assert('RLS: Anonymous cannot read skm_jawaban', !anonJawaban || anonJawaban.length === 0);

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================');
}

runTests();
