import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function testTextResponses() {
  console.log('Testing getTextResponses query...');

  const { data: qData, error: qErr } = await supabase
    .from('skm_pertanyaan')
    .select('id')
    .eq('urutan', 14)
    .single();

  console.log('Q14 data:', qData, 'error:', qErr);

  const { data, error, count } = await supabase
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
    .eq('skm_pertanyaan_id', qData?.id || 16)
    .neq('jawaban', '')
    .order('created_at', { ascending: false });

  console.log('Select with nested pengajuans->bidangs:', { error, data, count });
}

testTextResponses();
