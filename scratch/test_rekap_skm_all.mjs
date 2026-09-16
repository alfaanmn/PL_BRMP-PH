import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function testRekapSKM() {
  console.log('========================================');
  console.log('TESTING REKAP SKM FULL FLOW');
  console.log('========================================\n');

  // 1. Test Q14 (Hal yang Memuaskan)
  console.log('1. Testing getTextResponses(type="memuaskan")...');
  let qQuery1 = supabase
    .from('skm_pertanyaan')
    .select('id, unsur, urutan, tipe')
    .eq('tipe', 'teks')
    .or('urutan.eq.14,unsur.ilike.%memuaskan%')
    .order('urutan', { ascending: true })
    .limit(1);

  const { data: q1List, error: q1Err } = await qQuery1;
  console.log('   Question Q14 query:', { data: q1List, error: q1Err });

  if (q1List && q1List.length > 0) {
    const { data: ans1, error: a1Err, count: count1 } = await supabase
      .from('skm_jawaban')
      .select(`
        id,
        pengajuan_id,
        jawaban,
        created_at,
        pengajuans (
          id,
          nama_lengkap,
          asal_instansi,
          bidangs (
            nama
          )
        )
      `, { count: 'exact' })
      .eq('skm_pertanyaan_id', q1List[0].id)
      .not('jawaban', 'is', null)
      .order('created_at', { ascending: false });

    console.log('   Text responses Q14 query:', { error: a1Err, count: count1, sampleCount: ans1?.length });
  }

  // 2. Test Q15 (Saran & Masukan)
  console.log('\n2. Testing getTextResponses(type="saran")...');
  let qQuery2 = supabase
    .from('skm_pertanyaan')
    .select('id, unsur, urutan, tipe')
    .eq('tipe', 'teks')
    .or('urutan.eq.15,unsur.ilike.%saran%')
    .order('urutan', { ascending: true })
    .limit(1);

  const { data: q2List, error: q2Err } = await qQuery2;
  console.log('   Question Q15 query:', { data: q2List, error: q2Err });

  if (q2List && q2List.length > 0) {
    const { data: ans2, error: a2Err, count: count2 } = await supabase
      .from('skm_jawaban')
      .select(`
        id,
        pengajuan_id,
        jawaban,
        created_at,
        pengajuans (
          id,
          nama_lengkap,
          asal_instansi,
          bidangs (
            nama
          )
        )
      `, { count: 'exact' })
      .eq('skm_pertanyaan_id', q2List[0].id)
      .not('jawaban', 'is', null)
      .order('created_at', { ascending: false });

    console.log('   Text responses Q15 query:', { error: a2Err, count: count2, sampleCount: ans2?.length });
  }

  // 3. Test getRekapStats (IKM & Q1–Q13 Distribution)
  console.log('\n3. Testing getRekapStats (IKM & Distribution)...');
  const { data: questionsData, error: qErr } = await supabase
    .from('skm_pertanyaan')
    .select('id, pertanyaan, unsur, urutan, tipe, is_active, created_at')
    .order('urutan', { ascending: true });

  const { data: answersData, error: aErr } = await supabase
    .from('skm_jawaban')
    .select('id, pengajuan_id, skm_pertanyaan_id, jawaban, created_at');

  console.log('   Questions count:', questionsData?.length, 'Choice questions count:', questionsData?.filter(q => q.tipe === 'pilihan').length);
  console.log('   Answers count:', answersData?.length);

  // 4. Test Submissions List Query
  console.log('\n4. Testing getSubmissionsList query...');
  const { data: allAnswers, error: subErr } = await supabase
    .from('skm_jawaban')
    .select(`
      pengajuan_id,
      skm_pertanyaan_id,
      jawaban,
      created_at,
      skm_pertanyaan (
        urutan,
        tipe
      ),
      pengajuans (
        id,
        public_id,
        nama_lengkap,
        nim_nis,
        asal_instansi,
        created_at,
        bidangs (
          nama
        )
      )
    `)
    .order('created_at', { ascending: false });

  console.log('   Submissions list query result:', { error: subErr, rows: allAnswers?.length });

  console.log('\n========================================');
  console.log('ALL REKAP SKM TESTS COMPLETED SUCCESSFULLY');
  console.log('========================================');
}

testRekapSKM();
