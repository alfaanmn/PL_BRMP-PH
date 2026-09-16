import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function verifyFixedQueries() {
  console.log('Testing getTextResponses query with not.is.null...');
  const { data: qData } = await supabase
    .from('skm_pertanyaan')
    .select('id')
    .eq('urutan', 14)
    .single();

  const { data: textData, error: textError, count: textCount } = await supabase
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

  console.log('✅ getTextResponses:', { error: textError, count: textCount, sampleData: textData });

  console.log('Testing getBidangById query with kuota_default...');
  const { data: bpData, error: bpError } = await supabase
    .from('bidang_pembimbing')
    .select('pembimbing_id, pembimbings(id, nama, nip, jabatan, kuota_default, is_active)')
    .eq('bidang_id', 1);

  console.log('✅ getBidangById pembimbings:', { error: bpError, totalPembimbing: bpData?.length });
}

verifyFixedQueries();
