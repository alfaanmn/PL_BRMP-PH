import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function testQueryWithPengajuans() {
  const { data: qData } = await supabase
    .from('skm_pertanyaan')
    .select('id')
    .eq('urutan', 14)
    .single();

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
    .not('jawaban', 'is', null)
    .order('created_at', { ascending: false });

  console.log('Result with not.is.null:', { error, data, count });
}

testQueryWithPengajuans();
