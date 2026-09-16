import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function testColumn() {
  console.log('Testing skm_jawaban columns...');
  
  // Test query without .neq('jawaban', '')
  const { data, error } = await supabase
    .from('skm_jawaban')
    .select(`
      id,
      pengajuan_id,
      jawaban,
      created_at
    `)
    .limit(1);

  console.log('Query without neq:', { data, error });

  // Test query with neq null or not.is
  const { data: d2, error: e2 } = await supabase
    .from('skm_jawaban')
    .select(`
      id,
      pengajuan_id,
      jawaban,
      created_at
    `)
    .not('jawaban', 'is', null)
    .limit(1);

  console.log('Query with not null:', { d2, error: e2 });
}

testColumn();
