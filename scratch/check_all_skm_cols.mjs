import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function checkCols() {
  const candidateCols = [
    'id',
    'pengajuan_id',
    'skm_pertanyaan_id',
    'jawaban',
    'skor',
    'nilai',
    'teks',
    'jawaban_teks',
    'saran',
    'kritik',
    'komentar',
    'catatan',
    'keterangan',
    'created_at',
    'updated_at'
  ];

  console.log('Testing column existence on skm_jawaban:');
  for (const col of candidateCols) {
    const { error } = await supabase.from('skm_jawaban').select(col).limit(1);
    if (error) {
      console.log(`❌ ${col}: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`✅ ${col} EXISTS in skm_jawaban`);
    }
  }
}

checkCols();
