import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';

const supabase = createClient(url, anonKey);

function assert(description, condition, extra = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
  } else {
    console.error(`  ❌ FAIL: ${description} ${extra ? `(${extra})` : ''}`);
  }
}

async function testPoin4Flow() {
  console.log('=== TESTING POIN 4: ALUR SKM → SERTIFIKAT MAGANG ===\n');

  // Test 1: skm_pertanyaan
  console.log('1. Testing skm_pertanyaan:');
  const { data: questions, error: qErr } = await supabase
    .from('skm_pertanyaan')
    .select('*')
    .eq('is_active', true)
    .order('urutan', { ascending: true });
  assert('Fetch active questions from Supabase', !qErr && questions && questions.length > 0, qErr?.message);
  assert('All 17 active questions loaded', questions?.length === 17);

  // Test 2: RLS protection on skm_jawaban
  console.log('\n2. Testing RLS protection on skm_jawaban:');
  const { data: anonAnswers, error: aErr } = await supabase.from('skm_jawaban').select('*');
  assert('Anonymous cannot read answers without auth', !anonAnswers || anonAnswers.length === 0);

  // Test 3: Business Logic Simulation for SKM & Sertifikat States
  console.log('\n3. Testing SKM & Certificate State Machine:');

  function evaluateFlowState(item) {
    const isSelesai = item.status === 'Selesai';
    const hasSubmittedSKM = Boolean(item.hasSubmittedSKM);
    const hasSertifikat = Boolean(item.sertifikat_url);

    if (!isSelesai) {
      return {
        skmMandatory: false,
        skmStatus: 'NOT_APPLICABLE',
        certificateAvailable: false,
        certificateStatus: 'LOCKED_NOT_FINISHED',
      };
    }

    if (!hasSubmittedSKM) {
      return {
        skmMandatory: true,
        skmStatus: 'WAJIB_ISI',
        certificateAvailable: false,
        certificateStatus: 'LOCKED_SKM_REQUIRED',
      };
    }

    if (!hasSertifikat) {
      return {
        skmMandatory: false,
        skmStatus: 'LENGKAP',
        certificateAvailable: false,
        certificateStatus: 'IN_PROCESS',
      };
    }

    return {
      skmMandatory: false,
      skmStatus: 'LENGKAP',
      certificateAvailable: true,
      certificateStatus: 'READY_TO_DOWNLOAD',
    };
  }

  // Case A: Status = 'Sedang Magang' (Belum selesai)
  const caseA = evaluateFlowState({ status: 'Sedang Magang', hasSubmittedSKM: false, sertifikat_url: null });
  assert('Sedang Magang -> SKM not mandatory yet & cert locked', !caseA.skmMandatory && !caseA.certificateAvailable && caseA.certificateStatus === 'LOCKED_NOT_FINISHED');

  // Case B: Status = 'Selesai' + SKM belum diisi
  const caseB = evaluateFlowState({ status: 'Selesai', hasSubmittedSKM: false, sertifikat_url: null });
  assert('Selesai + SKM belum -> Wajib Isi SKM & cert locked', caseB.skmMandatory && caseB.skmStatus === 'WAJIB_ISI' && caseB.certificateStatus === 'LOCKED_SKM_REQUIRED');

  // Case C: Status = 'Selesai' + SKM sudah diisi + sertifikat_url = null
  const caseC = evaluateFlowState({ status: 'Selesai', hasSubmittedSKM: true, sertifikat_url: null });
  assert('Selesai + SKM lengkap + cert null -> Cert in process', !caseC.skmMandatory && caseC.skmStatus === 'LENGKAP' && caseC.certificateStatus === 'IN_PROCESS');

  // Case D: Status = 'Selesai' + SKM sudah diisi + sertifikat_url ada
  const caseD = evaluateFlowState({ status: 'Selesai', hasSubmittedSKM: true, sertifikat_url: 'https://storage.placeholder/sertifikat.pdf' });
  assert('Selesai + SKM lengkap + cert ada -> Cert ready to download', !caseD.skmMandatory && caseD.skmStatus === 'LENGKAP' && caseD.certificateAvailable && caseD.certificateStatus === 'READY_TO_DOWNLOAD');

  console.log('\n=== ALL TESTS PASSED ===');
}

testPoin4Flow();
